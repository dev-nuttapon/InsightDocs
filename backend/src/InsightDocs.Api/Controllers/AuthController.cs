using System.ComponentModel.DataAnnotations;
using InsightDocs.Api.Models;
using InsightDocs.Application.Auth;
using InsightDocs.Application.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightDocs.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    ICurrentUser currentUser,
    IKeycloakBrowserAuthService keycloakBrowserAuthService,
    IRegistrationService registrationService,
    IPasswordResetService passwordResetService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("login")]
    public IActionResult Login([FromQuery] BrowserLoginRequest request)
    {
        var authorizationUrl = keycloakBrowserAuthService.BuildAuthorizationUrl(request.RedirectUri, request.State, request.CodeChallenge);
        return Redirect(authorizationUrl);
    }

    [AllowAnonymous]
    [HttpPost("exchange")]
    [ProducesResponseType(typeof(ApiResponse<BrowserTokenExchangeResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<BrowserTokenExchangeResponse>>> Exchange([FromBody] BrowserTokenExchangeRequest request, CancellationToken cancellationToken)
    {
        var tokens = await keycloakBrowserAuthService.ExchangeAuthorizationCodeAsync(
            request.Code,
            request.CodeVerifier,
            request.RedirectUri,
            cancellationToken);

        Response.Cookies.Append("insightdocs_access_token", tokens.AccessToken, BuildCookieOptions(tokens.ExpiresIn));

        var response = new BrowserTokenExchangeResponse(
            "cookie-session",
            tokens.ExpiresIn,
            tokens.RefreshToken,
            tokens.IdToken);

        return Ok(ApiResponse<BrowserTokenExchangeResponse>.Ok(response, HttpContext.TraceIdentifier));
    }

    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<RegistrationResultDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<RegistrationResultDto>>> Register([FromBody] RegisterUserCommand command, CancellationToken cancellationToken)
    {
        var result = await registrationService.RegisterAsync(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<RegistrationResultDto>.Ok(result, HttpContext.TraceIdentifier));
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(ApiResponse<ForgotPasswordResultDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<ForgotPasswordResultDto>>> ForgotPassword([FromBody] ForgotPasswordCommand command, CancellationToken cancellationToken)
    {
        var result = await passwordResetService.CreateRequestAsync(command, cancellationToken);
        return Ok(ApiResponse<ForgotPasswordResultDto>.Ok(result, HttpContext.TraceIdentifier));
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command, CancellationToken cancellationToken)
    {
        await passwordResetService.ResetPasswordAsync(command, cancellationToken);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("logout-session")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult LogoutSession()
    {
        Response.Cookies.Delete("insightdocs_access_token", BuildCookieOptions(0));
        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("logout")]
    public IActionResult Logout([FromQuery] string? postLogoutRedirectUri = null)
    {
        Response.Cookies.Delete("insightdocs_access_token", BuildCookieOptions(0));

        var redirectUri = string.IsNullOrWhiteSpace(postLogoutRedirectUri)
            ? $"{Request.Scheme}://{Request.Host}/login"
            : postLogoutRedirectUri;

        var logoutUrl = keycloakBrowserAuthService.BuildLogoutUrl(redirectUri);
        return Redirect(logoutUrl);
    }

    [Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public ActionResult<ApiResponse<CurrentUserResponse>> Me()
    {
        var response = new CurrentUserResponse(
            currentUser.Subject,
            currentUser.Username,
            currentUser.Email,
            currentUser.Roles);

        return Ok(ApiResponse<CurrentUserResponse>.Ok(response, HttpContext.TraceIdentifier));
    }

    [Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
    [HttpGet("protected")]
    [ProducesResponseType(typeof(ApiResponse<ProtectedResourceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public ActionResult<ApiResponse<ProtectedResourceResponse>> Protected()
    {
        var response = new ProtectedResourceResponse(
            "Authenticated access granted.",
            DateTimeOffset.UtcNow,
            currentUser.Username);

        return Ok(ApiResponse<ProtectedResourceResponse>.Ok(response, HttpContext.TraceIdentifier));
    }

    [Authorize(Policy = AuthorizationPolicies.AdminAccess)]
    [HttpGet("admin-check")]
    [ProducesResponseType(typeof(ApiResponse<ProtectedResourceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public ActionResult<ApiResponse<ProtectedResourceResponse>> AdminCheck()
    {
        var response = new ProtectedResourceResponse(
            "Admin policy access granted.",
            DateTimeOffset.UtcNow,
            currentUser.Username);

        return Ok(ApiResponse<ProtectedResourceResponse>.Ok(response, HttpContext.TraceIdentifier));
    }

    private static CookieOptions BuildCookieOptions(int expiresInSeconds) => new()
    {
        HttpOnly = true,
        IsEssential = true,
        SameSite = SameSiteMode.Lax,
        Secure = false,
        Path = "/",
        Expires = expiresInSeconds > 0 ? DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds) : DateTimeOffset.UtcNow.AddDays(-1)
    };
}

public sealed record CurrentUserResponse(
    string? Subject,
    string? Username,
    string? Email,
    IReadOnlyCollection<string> Roles);

public sealed record BrowserLoginRequest(
    [property: Required] string RedirectUri,
    [property: Required] string State,
    [property: Required] string CodeChallenge);

public sealed record BrowserTokenExchangeRequest(
    [property: Required] string Code,
    [property: Required] string CodeVerifier,
    [property: Required] string RedirectUri);

public sealed record BrowserTokenExchangeResponse(
    string AccessToken,
    int ExpiresIn,
    string? RefreshToken,
    string? IdToken);

public sealed record ProtectedResourceResponse(
    string Message,
    DateTimeOffset UtcTimestamp,
    string? Username);
