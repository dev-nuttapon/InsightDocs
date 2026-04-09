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
    IRegistrationService registrationService,
    IPasswordResetService passwordResetService) : ControllerBase
{
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
}

public sealed record CurrentUserResponse(
    string? Subject,
    string? Username,
    string? Email,
    IReadOnlyCollection<string> Roles);

public sealed record ProtectedResourceResponse(
    string Message,
    DateTimeOffset UtcTimestamp,
    string? Username);
