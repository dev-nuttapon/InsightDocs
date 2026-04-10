using InsightDocs.Api.Models;
using InsightDocs.Application.Auth;
using InsightDocs.Application.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightDocs.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.UserManagementAccess)]
[Route("api/admin/password-reset-requests")]
public sealed class AdminPasswordResetRequestsController(
    IPasswordResetService passwordResetService,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<PasswordResetRequestDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<PasswordResetRequestDto>>>> GetRequests(CancellationToken cancellationToken)
    {
        var requests = await passwordResetService.GetRequestsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<PasswordResetRequestDto>>.Ok(requests, HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse<PasswordResetRequestDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PasswordResetRequestDto>>> Approve(
        Guid id,
        [FromBody] ReviewPasswordResetRequestCommand command,
        CancellationToken cancellationToken)
    {
        var reviewedBy = currentUser.Username ?? currentUser.Subject ?? "system";
        var result = await passwordResetService.ApproveAsync(id, reviewedBy, command.Comment, cancellationToken);
        return Ok(ApiResponse<PasswordResetRequestDto>.Ok(result, HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse<PasswordResetRequestDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PasswordResetRequestDto>>> Reject(
        Guid id,
        [FromBody] ReviewPasswordResetRequestCommand command,
        CancellationToken cancellationToken)
    {
        var reviewedBy = currentUser.Username ?? currentUser.Subject ?? "system";
        var result = await passwordResetService.RejectAsync(id, reviewedBy, command.Comment, cancellationToken);
        return Ok(ApiResponse<PasswordResetRequestDto>.Ok(result, HttpContext.TraceIdentifier));
    }
}
