using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using InsightDocs.Api.Models;
using InsightDocs.Application.Auth;
using InsightDocs.Application.Identity;
using InsightDocs.Infrastructure.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace InsightDocs.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    ICurrentUser currentUser,
    IKeycloakBrowserAuthService keycloakBrowserAuthService,
    IRegistrationService registrationService,
    IPasswordResetService passwordResetService,
    IOptions<ApplicationOptions> applicationOptions) : ControllerBase
{
    private const string AccessTokenCookieName = "insightdocs_access_token";
    private const string LoginFlowCookieName = "insightdocs_login_flow";

    [AllowAnonymous]
    [HttpGet("login")]
    public IActionResult Login([FromQuery] BrowserLoginRequest request)
    {
        var loginFlow = CreateLoginFlow(request.ReturnTo, applicationOptions.Value.FrontendUrl, $"{Request.Scheme}://{Request.Host}");
        Response.Cookies.Append(LoginFlowCookieName, SerializeLoginFlow(loginFlow), BuildLoginFlowCookieOptions());

        var authorizationUrl = keycloakBrowserAuthService.BuildAuthorizationUrl(loginFlow.RedirectUri, loginFlow.State, loginFlow.CodeChallenge);
        return Redirect(authorizationUrl);
    }

    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string state, CancellationToken cancellationToken)
    {
        var loginFlow = ReadLoginFlow();

        if (string.IsNullOrWhiteSpace(code) || loginFlow is null || !string.Equals(loginFlow.State, state, StringComparison.Ordinal))
        {
            Response.Cookies.Delete(LoginFlowCookieName, BuildLoginFlowCookieOptions());
            return Redirect(BuildFrontendRedirect("/login", "Authentication callback is invalid or has expired."));
        }

        try
        {
            var tokens = await keycloakBrowserAuthService.ExchangeAuthorizationCodeAsync(
                code,
                loginFlow.CodeVerifier,
                loginFlow.RedirectUri,
                cancellationToken);

            Response.Cookies.Append(AccessTokenCookieName, tokens.AccessToken, BuildCookieOptions(tokens.ExpiresIn));
            Response.Cookies.Delete(LoginFlowCookieName, BuildLoginFlowCookieOptions());

            return Redirect(BuildFrontendRedirect(loginFlow.ReturnTo));
        }
        catch
        {
            Response.Cookies.Delete(LoginFlowCookieName, BuildLoginFlowCookieOptions());
            Response.Cookies.Delete(AccessTokenCookieName, BuildCookieOptions(0));
            return Redirect(BuildFrontendRedirect("/login", "Unable to complete sign-in. Please try again."));
        }
    }

    [AllowAnonymous]
    [HttpPost("exchange")]
    [ProducesResponseType(typeof(ApiResponse<BrowserTokenExchangeResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<BrowserTokenExchangeResponse>>> Exchange([FromBody] BrowserTokenExchangeRequest request, CancellationToken cancellationToken)
    {
        var loginFlow = ReadLoginFlow();

        if (loginFlow is null || !string.Equals(loginFlow.State, request.State, StringComparison.Ordinal))
        {
            Response.Cookies.Delete(LoginFlowCookieName, BuildLoginFlowCookieOptions());
            return Unauthorized(ErrorResponse.Validation("Login state is missing or invalid.", []));
        }

        var tokens = await keycloakBrowserAuthService.ExchangeAuthorizationCodeAsync(
            request.Code,
            loginFlow.CodeVerifier,
            loginFlow.RedirectUri,
            cancellationToken);

        Response.Cookies.Append(AccessTokenCookieName, tokens.AccessToken, BuildCookieOptions(tokens.ExpiresIn));
        Response.Cookies.Delete(LoginFlowCookieName, BuildLoginFlowCookieOptions());

        var response = new BrowserTokenExchangeResponse(
            "cookie-session",
            tokens.ExpiresIn,
            tokens.RefreshToken,
            tokens.IdToken,
            loginFlow.ReturnTo);

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
        Response.Cookies.Delete(AccessTokenCookieName, BuildCookieOptions(0));
        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("logout")]
    public IActionResult Logout([FromQuery] string? postLogoutRedirectUri = null)
    {
        Response.Cookies.Delete(AccessTokenCookieName, BuildCookieOptions(0));
        Response.Cookies.Delete(LoginFlowCookieName, BuildLoginFlowCookieOptions());

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

    private static CookieOptions BuildLoginFlowCookieOptions() => new()
    {
        HttpOnly = true,
        IsEssential = true,
        SameSite = SameSiteMode.Lax,
        Secure = false,
        Path = "/",
        Expires = DateTimeOffset.UtcNow.AddMinutes(10)
    };

    private BrowserLoginFlow? ReadLoginFlow()
    {
        if (!Request.Cookies.TryGetValue(LoginFlowCookieName, out var payload) || string.IsNullOrWhiteSpace(payload))
        {
            return null;
        }

        try
        {
            var json = Encoding.UTF8.GetString(Convert.FromBase64String(payload));
            return JsonSerializer.Deserialize<BrowserLoginFlow>(json);
        }
        catch
        {
            return null;
        }
    }

    private static string SerializeLoginFlow(BrowserLoginFlow loginFlow)
    {
        var json = JsonSerializer.Serialize(loginFlow);
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
    }

    private static BrowserLoginFlow CreateLoginFlow(string? returnTo, string frontendUrl, string apiBaseUrl)
    {
        var codeVerifier = CreateCodeVerifier();
        return new BrowserLoginFlow(
            Guid.NewGuid().ToString(),
            codeVerifier,
            CreateCodeChallenge(codeVerifier),
            $"{apiBaseUrl.TrimEnd('/')}/api/auth/callback",
            NormalizeReturnTo(returnTo));
    }

    private static string NormalizeReturnTo(string? returnTo)
    {
        if (string.IsNullOrWhiteSpace(returnTo))
        {
            return "/dashboard";
        }

        if (!Uri.TryCreate(returnTo, UriKind.Relative, out var relativeUri))
        {
            return "/dashboard";
        }

        var normalized = relativeUri.ToString();
        return normalized.StartsWith('/') ? normalized : $"/{normalized}";
    }

    private static string CreateCodeVerifier()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return ToBase64Url(bytes);
    }

    private static string CreateCodeChallenge(string codeVerifier)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(codeVerifier));
        return ToBase64Url(hash);
    }

    private static string ToBase64Url(ReadOnlySpan<byte> bytes) =>
        Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

    private string BuildFrontendRedirect(string path, string? errorMessage = null)
    {
        var target = new Uri(new Uri(applicationOptions.Value.FrontendUrl.TrimEnd('/') + "/"), path.TrimStart('/'));

        if (string.IsNullOrWhiteSpace(errorMessage))
        {
            return target.ToString();
        }

        return $"{target}?error={Uri.EscapeDataString(errorMessage)}";
    }
}

public sealed record CurrentUserResponse(
    string? Subject,
    string? Username,
    string? Email,
    IReadOnlyCollection<string> Roles);

public sealed record BrowserLoginRequest(
    string? ReturnTo);

public sealed record BrowserTokenExchangeRequest(
    [property: Required] string Code,
    [property: Required] string State);

public sealed record BrowserTokenExchangeResponse(
    string AccessToken,
    int ExpiresIn,
    string? RefreshToken,
    string? IdToken,
    string ReturnTo);

public sealed record BrowserLoginFlow(
    string State,
    string CodeVerifier,
    string CodeChallenge,
    string RedirectUri,
    string ReturnTo);

public sealed record ProtectedResourceResponse(
    string Message,
    DateTimeOffset UtcTimestamp,
    string? Username);
