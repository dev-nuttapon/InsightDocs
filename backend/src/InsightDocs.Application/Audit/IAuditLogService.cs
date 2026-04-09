namespace InsightDocs.Application.Audit;

public interface IAuditLogService
{
    Task WriteAsync(WriteAuditLogEntry entry, CancellationToken cancellationToken);
    Task<AuditLogListResultDto> GetAuditLogsAsync(AuditLogQuery query, CancellationToken cancellationToken);
    Task<AuditLogDetailDto> GetAuditLogAsync(Guid id, CancellationToken cancellationToken);
}
