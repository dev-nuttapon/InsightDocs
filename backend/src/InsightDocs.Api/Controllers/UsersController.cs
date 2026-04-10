using InsightDocs.Api.Models;
using InsightDocs.Application.Identity;
using InsightDocs.Application.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightDocs.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.UserManagementAccess)]
[Route("api/users")]
public sealed class UsersController(
    IUserManagementService userManagementService,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<UserSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<UserSummaryDto>>>> GetUsers(CancellationToken cancellationToken)
    {
        var users = await userManagementService.GetUsersAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<UserSummaryDto>>.Ok(users, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> GetUser(Guid id, CancellationToken cancellationToken)
    {
        var user = await userManagementService.GetUserAsync(id, cancellationToken);
        return Ok(ApiResponse<UserDetailDto>.Ok(user, HttpContext.TraceIdentifier));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> CreateUser([FromBody] CreateUserCommand command, CancellationToken cancellationToken)
    {
        var user = await userManagementService.CreateUserAsync(command, cancellationToken);
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, ApiResponse<UserDetailDto>.Ok(user, HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> UpdateUser(Guid id, [FromBody] UpdateUserCommand command, CancellationToken cancellationToken)
    {
        var user = await userManagementService.UpdateUserAsync(id, command, cancellationToken);
        return Ok(ApiResponse<UserDetailDto>.Ok(user, HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> ApproveUser(Guid id, CancellationToken cancellationToken)
    {
        var approvedBy = currentUser.Username ?? currentUser.Subject ?? "system";
        var user = await userManagementService.ApproveUserAsync(id, approvedBy, cancellationToken);
        return Ok(ApiResponse<UserDetailDto>.Ok(user, HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/disable")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> DisableUser(Guid id, CancellationToken cancellationToken)
    {
        var user = await userManagementService.DisableUserAsync(id, cancellationToken);
        return Ok(ApiResponse<UserDetailDto>.Ok(user, HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/enable")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> EnableUser(Guid id, CancellationToken cancellationToken)
    {
        var user = await userManagementService.EnableUserAsync(id, cancellationToken);
        return Ok(ApiResponse<UserDetailDto>.Ok(user, HttpContext.TraceIdentifier));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> DeleteUser(Guid id, CancellationToken cancellationToken)
    {
        await userManagementService.DeleteUserAsync(id, cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null, HttpContext.TraceIdentifier));
    }
}
