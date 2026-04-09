using InsightDocs.Api.Models;
using InsightDocs.Application.Identity;
using InsightDocs.Application.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightDocs.Api.Controllers;

[ApiController]
[Route("api/user-directory")]
public sealed class UserDirectoryController(IUserManagementService userManagementService) : ControllerBase
{
    [HttpGet("signers")]
    [Authorize(Policy = AuthorizationPolicies.DocumentSignatureManagement)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<UserSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<UserSummaryDto>>>> GetSigners(CancellationToken cancellationToken)
    {
        var users = await userManagementService.GetSignersAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<UserSummaryDto>>.Ok(users, HttpContext.TraceIdentifier));
    }
}
