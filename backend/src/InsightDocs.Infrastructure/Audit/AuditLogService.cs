using System.Text.Json;
using InsightDocs.Application.Audit;
using InsightDocs.Application.Common;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace InsightDocs.Infrastructure.Audit;

internal sealed class AuditLogService(InsightDocsDbContext dbContext) : IAuditLogService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    public async Task WriteAsync(WriteAuditLogEntry entry, CancellationToken cancellationToken)
    {
        var actorUserId = entry.ActorUserId ?? await ResolveActorUserIdAsync(entry.ActorIdentifier, cancellationToken);
        var metadataJson = entry.Metadata is null ? null : JsonSerializer.Serialize(entry.Metadata, JsonOptions);

        var auditLog = Domain.Audit.AuditLog.Create(
            actorUserId,
            entry.Action,
            entry.EntityType,
            entry.EntityId,
            entry.RelatedDocumentId,
            entry.RelatedVersionId,
            metadataJson);

        dbContext.Add(auditLog);
    }

    public async Task<AuditLogListResultDto> GetAuditLogsAsync(AuditLogQuery query, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var auditLogs = dbContext.AuditLogs
            .AsNoTracking()
            .Include(auditLog => auditLog.ActorUser)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Actor))
        {
            var actor = query.Actor.Trim();
            var actorGuid = Guid.TryParse(actor, out var parsedActorId) ? parsedActorId : (Guid?)null;

            auditLogs = auditLogs.Where(auditLog =>
                (actorGuid.HasValue && auditLog.ActorUserId == actorGuid.Value) ||
                (auditLog.ActorUser != null && (
                    EF.Functions.ILike(auditLog.ActorUser.Username, $"%{actor}%") ||
                    EF.Functions.ILike(auditLog.ActorUser.DisplayName, $"%{actor}%") ||
                    EF.Functions.ILike(auditLog.ActorUser.Email, $"%{actor}%"))));
        }

        if (!string.IsNullOrWhiteSpace(query.Action))
        {
            var action = query.Action.Trim();
            auditLogs = auditLogs.Where(auditLog => EF.Functions.ILike(auditLog.Action, $"%{action}%"));
        }

        if (query.DocumentId.HasValue)
        {
            auditLogs = auditLogs.Where(auditLog => auditLog.RelatedDocumentId == query.DocumentId.Value);
        }

        if (query.From.HasValue)
        {
            auditLogs = auditLogs.Where(auditLog => auditLog.Timestamp >= query.From.Value);
        }

        if (query.To.HasValue)
        {
            auditLogs = auditLogs.Where(auditLog => auditLog.Timestamp <= query.To.Value);
        }

        var totalCount = await auditLogs.CountAsync(cancellationToken);

        var items = await auditLogs
            .OrderByDescending(auditLog => auditLog.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(auditLog => new AuditLogListItemDto(
                auditLog.Id,
                auditLog.ActorUserId,
                auditLog.ActorUser != null ? auditLog.ActorUser.Username : null,
                auditLog.ActorUser != null ? auditLog.ActorUser.DisplayName : null,
                auditLog.Action,
                auditLog.EntityType,
                auditLog.EntityId,
                auditLog.RelatedDocumentId,
                auditLog.RelatedVersionId,
                auditLog.Timestamp))
            .ToArrayAsync(cancellationToken);

        return new AuditLogListResultDto(items, page, pageSize, totalCount);
    }

    public async Task<AuditLogDetailDto> GetAuditLogAsync(Guid id, CancellationToken cancellationToken)
    {
        var auditLog = await dbContext.AuditLogs
            .AsNoTracking()
            .Include(entity => entity.ActorUser)
            .Where(entity => entity.Id == id)
            .Select(entity => new AuditLogDetailDto(
                entity.Id,
                entity.ActorUserId,
                entity.ActorUser != null ? entity.ActorUser.Username : null,
                entity.ActorUser != null ? entity.ActorUser.DisplayName : null,
                entity.Action,
                entity.EntityType,
                entity.EntityId,
                entity.RelatedDocumentId,
                entity.RelatedVersionId,
                entity.Timestamp,
                entity.MetadataJson))
            .FirstOrDefaultAsync(cancellationToken);

        return auditLog ?? throw new NotFoundException($"Audit log '{id}' was not found.");
    }

    private async Task<Guid?> ResolveActorUserIdAsync(string? actorIdentifier, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(actorIdentifier))
        {
            return null;
        }

        var normalized = actorIdentifier.Trim();

        return await dbContext.Users
            .Where(user => user.KeycloakUserId == normalized || user.Username == normalized)
            .Select(user => (Guid?)user.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
