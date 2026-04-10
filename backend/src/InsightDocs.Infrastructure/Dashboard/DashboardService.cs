using InsightDocs.Application.Dashboard;
using InsightDocs.Application.Identity;
using InsightDocs.Application.Users;
using InsightDocs.Domain.Documents;
using InsightDocs.Domain.Users;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace InsightDocs.Infrastructure.Dashboard;

internal sealed class DashboardService(
    InsightDocsDbContext dbContext,
    IKeycloakAdminService keycloakAdminService) : IDashboardService
{
    private static readonly string[] AdminRoles = [BusinessRoles.Admin, "admin", "realm-admin", "insightdocs-admin"];

    public async Task<DashboardSummaryDto> GetSummaryAsync(string? actorIdentifier, IReadOnlyCollection<string> roles, CancellationToken cancellationToken)
    {
        var isAdmin = roles.Any(role => AdminRoles.Contains(role, StringComparer.OrdinalIgnoreCase));
        var isManager = roles.Any(role => string.Equals(role, BusinessRoles.Manager, StringComparison.OrdinalIgnoreCase));
        var isSigner = roles.Any(role => string.Equals(role, BusinessRoles.Signer, StringComparison.OrdinalIgnoreCase));

        var totalDocumentsTask = dbContext.Documents.CountAsync(cancellationToken);
        var approvedDocumentsTask = dbContext.Documents.CountAsync(document => document.Status == DocumentStatus.Approved, cancellationToken);
        var archivedDocumentsTask = dbContext.Documents.CountAsync(document => document.Status == DocumentStatus.Archived, cancellationToken);

        Task<int> pendingApprovalsTask = (isAdmin || isManager)
            ? dbContext.Documents.CountAsync(document => document.Status == DocumentStatus.InReview, cancellationToken)
            : Task.FromResult(0);

        Task<int> pendingSignaturesTask;
        if (isAdmin)
        {
            pendingSignaturesTask = dbContext.DocumentSignatureRequests.CountAsync(request => request.Status == DocumentSignatureStatus.Pending, cancellationToken);
        }
        else if (isSigner)
        {
            pendingSignaturesTask = ResolveActorUserId(actorIdentifier, cancellationToken) is { } actorTask
                ? CountPendingSignaturesForActorAsync(actorTask, cancellationToken)
                : Task.FromResult(0);
        }
        else
        {
            pendingSignaturesTask = Task.FromResult(0);
        }

        await Task.WhenAll(totalDocumentsTask, pendingApprovalsTask, pendingSignaturesTask, approvedDocumentsTask, archivedDocumentsTask);

        return new DashboardSummaryDto(
            totalDocumentsTask.Result,
            pendingApprovalsTask.Result,
            pendingSignaturesTask.Result,
            approvedDocumentsTask.Result,
            archivedDocumentsTask.Result);
    }

    public async Task<IReadOnlyCollection<RecentDashboardDocumentDto>> GetRecentDocumentsAsync(CancellationToken cancellationToken)
    {
        var documents = await dbContext.Documents
            .AsNoTracking()
            .OrderByDescending(document => document.UpdatedAt ?? document.CreatedAt)
            .Take(8)
            .Select(document => new
            {
                document.Id,
                document.Title,
                document.Category,
                Status = document.Status.ToString(),
                CurrentVersionNumber = document.Versions.Where(version => version.IsCurrent).Select(version => (int?)version.VersionNumber).FirstOrDefault(),
                document.OwnerUserId,
                document.ControllerUserId,
                LastActivityAt = document.UpdatedAt ?? document.CreatedAt
            })
            .ToArrayAsync(cancellationToken);

        var identities = await LoadIdentitiesAsync(
            documents.SelectMany(document => new Guid?[] { document.OwnerUserId, document.ControllerUserId }),
            cancellationToken);

        return documents
            .Select(document => new RecentDashboardDocumentDto(
                document.Id,
                document.Title,
                document.Category,
                document.Status,
                document.CurrentVersionNumber,
                document.OwnerUserId.HasValue ? ResolveDisplayName(identities.GetValueOrDefault(document.OwnerUserId.Value)) : null,
                document.ControllerUserId.HasValue ? ResolveDisplayName(identities.GetValueOrDefault(document.ControllerUserId.Value)) : null,
                document.LastActivityAt))
            .ToArray();
    }

    public async Task<IReadOnlyCollection<RecentDashboardActivityDto>> GetRecentActivitiesAsync(string? actorIdentifier, IReadOnlyCollection<string> roles, CancellationToken cancellationToken)
    {
        var isAdmin = roles.Any(role => AdminRoles.Contains(role, StringComparer.OrdinalIgnoreCase));
        var isManager = roles.Any(role => string.Equals(role, BusinessRoles.Manager, StringComparison.OrdinalIgnoreCase));
        var isSigner = roles.Any(role => string.Equals(role, BusinessRoles.Signer, StringComparison.OrdinalIgnoreCase));
        var isDocumentController = roles.Any(role => string.Equals(role, BusinessRoles.DocumentController, StringComparison.OrdinalIgnoreCase));

        var auditLogs = dbContext.AuditLogs
            .AsNoTracking()
            .Include(log => log.ActorUser)
            .AsQueryable();

        if (!isAdmin)
        {
            var allowedActions = new List<string>();

            if (isManager)
            {
                allowedActions.Add("document.approval.submitted");
                allowedActions.Add("document.approval.approved");
                allowedActions.Add("document.approval.rejected");
            }

            if (isSigner)
            {
                allowedActions.Add("document.signer.assigned");
                allowedActions.Add("document.signature.signed");
                allowedActions.Add("document.signature.rejected");
            }

            if (isDocumentController)
            {
                allowedActions.Add("document.created");
                allowedActions.Add("document.metadata.updated");
                allowedActions.Add("document.uploaded");
                allowedActions.Add("document.version.created");
                allowedActions.Add("document.version.restored");
            }

            if (allowedActions.Count == 0)
            {
                allowedActions.Add("document.created");
                allowedActions.Add("document.uploaded");
                allowedActions.Add("document.approval.submitted");
            }

            auditLogs = auditLogs.Where(log => allowedActions.Contains(log.Action));
        }

        var items = await auditLogs
            .OrderByDescending(log => log.Timestamp)
            .Take(12)
            .Select(log => new
            {
                log.Id,
                log.Action,
                log.EntityType,
                log.EntityId,
                log.RelatedDocumentId,
                log.RelatedVersionId,
                RelatedDocumentTitle = log.RelatedDocumentId.HasValue
                    ? dbContext.Documents.Where(document => document.Id == log.RelatedDocumentId.Value).Select(document => document.Title).FirstOrDefault()
                    : null,
                log.ActorUserId,
                log.Timestamp
            })
            .ToArrayAsync(cancellationToken);

        var identities = await LoadIdentitiesAsync(items.Select(item => item.ActorUserId), cancellationToken);

        return items
            .Select(item =>
            {
                var identity = item.ActorUserId.HasValue
                    ? identities.GetValueOrDefault(item.ActorUserId.Value)
                    : null;

                return new RecentDashboardActivityDto(
                    item.Id,
                    item.Action,
                    item.EntityType,
                    item.EntityId,
                    item.RelatedDocumentId,
                    item.RelatedVersionId,
                    item.RelatedDocumentTitle,
                    ResolveDisplayName(identity),
                    identity?.Username,
                    item.Timestamp);
            })
            .ToArray();
    }

    private async Task<int> CountPendingSignaturesForActorAsync(Task<Guid?> actorIdTask, CancellationToken cancellationToken)
    {
        var actorId = await actorIdTask;
        if (!actorId.HasValue)
        {
            return 0;
        }

        return await dbContext.DocumentSignatureRequests.CountAsync(
            request => request.SignerUserId == actorId.Value && request.Status == DocumentSignatureStatus.Pending,
            cancellationToken);
    }

    private Task<Guid?> ResolveActorUserId(string? actorIdentifier, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(actorIdentifier))
        {
            return Task.FromResult<Guid?>(null);
        }

        var normalized = actorIdentifier.Trim();
        return Task.FromResult(Guid.TryParse(normalized, out var id) ? (Guid?)id : null);
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
