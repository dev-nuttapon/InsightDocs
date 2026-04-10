using System.Text.Json;
using InsightDocs.Application.Audit;
using InsightDocs.Application.Common;
using InsightDocs.Application.Identity;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace InsightDocs.Infrastructure.Audit;

internal sealed class AuditLogService(
    InsightDocsDbContext dbContext,
    IKeycloakAdminService keycloakAdminService) : IAuditLogService
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
            var matchingKeycloakUsers = await keycloakAdminService.SearchUsersAsync(actor, cancellationToken);
            var matchingUserIds = matchingKeycloakUsers
                .Select(user => Guid.TryParse(user.KeycloakUserId, out var id) ? id : (Guid?)null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .ToArray();

            auditLogs = auditLogs.Where(auditLog =>
                (actorGuid.HasValue && auditLog.ActorUserId == actorGuid.Value) ||
                (auditLog.ActorUserId.HasValue && matchingUserIds.Contains(auditLog.ActorUserId.Value)));
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
            .Select(auditLog => new
            {
                auditLog.Id,
                auditLog.ActorUserId,
                auditLog.Action,
                auditLog.EntityType,
                auditLog.EntityId,
                auditLog.RelatedDocumentId,
                auditLog.RelatedVersionId,
                auditLog.Timestamp
            })
            .ToArrayAsync(cancellationToken);

        var identities = await LoadIdentitiesAsync(items.Select(item => item.ActorUserId), cancellationToken);

        var mappedItems = items.Select(item =>
        {
            var identity = item.ActorUserId.HasValue
                ? identities.GetValueOrDefault(item.ActorUserId.Value)
                : null;

            return new AuditLogListItemDto(
                item.Id,
                item.ActorUserId,
                identity?.Username,
                ResolveDisplayName(identity),
                item.Action,
                item.EntityType,
                item.EntityId,
                item.RelatedDocumentId,
                item.RelatedVersionId,
                item.Timestamp);
        }).ToArray();

        return new AuditLogListResultDto(mappedItems, page, pageSize, totalCount);
    }

    public async Task<AuditLogDetailDto> GetAuditLogAsync(Guid id, CancellationToken cancellationToken)
    {
        var auditLog = await dbContext.AuditLogs
            .AsNoTracking()
            .Include(entity => entity.ActorUser)
            .Where(entity => entity.Id == id)
            .Select(entity => new
            {
                entity.Id,
                entity.ActorUserId,
                entity.Action,
                entity.EntityType,
                entity.EntityId,
                entity.RelatedDocumentId,
                entity.RelatedVersionId,
                entity.Timestamp,
                entity.MetadataJson
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (auditLog is null)
        {
            throw new NotFoundException($"Audit log '{id}' was not found.");
        }

        var identity = auditLog.ActorUserId.HasValue
            ? await keycloakAdminService.GetUserIdentityAsync(auditLog.ActorUserId.Value.ToString(), cancellationToken)
            : null;

        return new AuditLogDetailDto(
            auditLog.Id,
            auditLog.ActorUserId,
            identity?.Username,
            ResolveDisplayName(identity),
            auditLog.Action,
            auditLog.EntityType,
            auditLog.EntityId,
            auditLog.RelatedDocumentId,
            auditLog.RelatedVersionId,
            auditLog.Timestamp,
            auditLog.MetadataJson);
    }

    private async Task<Guid?> ResolveActorUserIdAsync(string? actorIdentifier, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(actorIdentifier))
        {
            return null;
        }

        var normalized = actorIdentifier.Trim();
        return Guid.TryParse(normalized, out var id) ? id : null;
    }

    private async Task<Dictionary<Guid, KeycloakUserIdentity?>> LoadIdentitiesAsync(IEnumerable<Guid?> userIds, CancellationToken cancellationToken)
    {
        var ids = userIds.Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToArray();
        var pairs = await Task.WhenAll(ids.Select(async id => new
        {
            Id = id,
            Identity = await keycloakAdminService.GetUserIdentityAsync(id.ToString(), cancellationToken)
        }));

        return pairs.ToDictionary(item => item.Id, item => item.Identity);
    }

    private static string? ResolveDisplayName(KeycloakUserIdentity? identity)
    {
        if (identity is null)
        {
            return null;
        }

        var fullName = string.Join(" ", new[] { identity.FirstName, identity.LastName }
            .Where(value => !string.IsNullOrWhiteSpace(value)))
            .Trim();

        return !string.IsNullOrWhiteSpace(fullName) ? fullName : identity.Username ?? identity.Email;
    }
}
