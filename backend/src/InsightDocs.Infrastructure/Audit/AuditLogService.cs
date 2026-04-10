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
            var matchingKeycloakUserIds = matchingKeycloakUsers.Select(user => user.KeycloakUserId).ToArray();

            auditLogs = auditLogs.Where(auditLog =>
                (actorGuid.HasValue && auditLog.ActorUserId == actorGuid.Value) ||
                (auditLog.ActorUser != null && matchingKeycloakUserIds.Contains(auditLog.ActorUser.KeycloakUserId)));
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
                ActorKeycloakUserId = auditLog.ActorUser != null ? auditLog.ActorUser.KeycloakUserId : null,
                auditLog.Action,
                auditLog.EntityType,
                auditLog.EntityId,
                auditLog.RelatedDocumentId,
                auditLog.RelatedVersionId,
                auditLog.Timestamp
            })
            .ToArrayAsync(cancellationToken);

        var identities = await LoadIdentitiesAsync(items.Select(item => item.ActorKeycloakUserId), cancellationToken);

        var mappedItems = items.Select(item =>
        {
            var identity = item.ActorKeycloakUserId is not null
                ? identities.GetValueOrDefault(item.ActorKeycloakUserId)
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
                ActorKeycloakUserId = entity.ActorUser != null ? entity.ActorUser.KeycloakUserId : null,
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

        var identity = auditLog.ActorKeycloakUserId is not null
            ? await keycloakAdminService.GetUserIdentityAsync(auditLog.ActorKeycloakUserId, cancellationToken)
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

        return await dbContext.Users
            .Where(user => user.KeycloakUserId == normalized)
            .Select(user => (Guid?)user.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<Dictionary<string, KeycloakUserIdentity?>> LoadIdentitiesAsync(IEnumerable<string?> keycloakUserIds, CancellationToken cancellationToken)
    {
        var ids = keycloakUserIds.Where(id => !string.IsNullOrWhiteSpace(id)).Cast<string>().Distinct(StringComparer.Ordinal).ToArray();
        var pairs = await Task.WhenAll(ids.Select(async id => new
        {
            Id = id,
            Identity = await keycloakAdminService.GetUserIdentityAsync(id, cancellationToken)
        }));

        return pairs.ToDictionary(item => item.Id, item => item.Identity, StringComparer.Ordinal);
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
