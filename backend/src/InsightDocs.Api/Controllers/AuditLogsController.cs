using InsightDocs.Api.Models;
using InsightDocs.Application.Audit;
using InsightDocs.Application.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightDocs.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.AuditAccess)]
[Route("api/audit-logs")]
public sealed class AuditLogsController(IAuditLogService auditLogService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<AuditLogListResultDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<AuditLogListResultDto>>> GetAuditLogs(
        [FromQuery] AuditLogQuery query,
        CancellationToken cancellationToken)
    {
        var result = await auditLogService.GetAuditLogsAsync(query, cancellationToken);
        return Ok(ApiResponse<AuditLogListResultDto>.Ok(result, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AuditLogDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<AuditLogDetailDto>>> GetAuditLog(Guid id, CancellationToken cancellationToken)
    {
        var result = await auditLogService.GetAuditLogAsync(id, cancellationToken);
        return Ok(ApiResponse<AuditLogDetailDto>.Ok(result, HttpContext.TraceIdentifier));
    }
}
