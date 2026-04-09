using InsightDocs.Api.Models;
using InsightDocs.Application.Dashboard;
using InsightDocs.Application.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightDocs.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
public sealed class DashboardController(
    IDashboardService dashboardService,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<DashboardSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetSummary(CancellationToken cancellationToken)
    {
        var actorIdentifier = currentUser.Subject ?? currentUser.Username;
        var result = await dashboardService.GetSummaryAsync(actorIdentifier, currentUser.Roles, cancellationToken);
        return Ok(ApiResponse<DashboardSummaryDto>.Ok(result, HttpContext.TraceIdentifier));
    }

    [HttpGet("recent-documents")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<RecentDashboardDocumentDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<RecentDashboardDocumentDto>>>> GetRecentDocuments(CancellationToken cancellationToken)
    {
        var result = await dashboardService.GetRecentDocumentsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<RecentDashboardDocumentDto>>.Ok(result, HttpContext.TraceIdentifier));
    }

    [HttpGet("recent-activities")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<RecentDashboardActivityDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<RecentDashboardActivityDto>>>> GetRecentActivities(CancellationToken cancellationToken)
    {
        var actorIdentifier = currentUser.Subject ?? currentUser.Username;
        var result = await dashboardService.GetRecentActivitiesAsync(actorIdentifier, currentUser.Roles, cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<RecentDashboardActivityDto>>.Ok(result, HttpContext.TraceIdentifier));
    }
}
