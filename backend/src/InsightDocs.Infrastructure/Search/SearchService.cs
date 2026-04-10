using InsightDocs.Application.Identity;
using InsightDocs.Application.Search;
using InsightDocs.Domain.Documents;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace InsightDocs.Infrastructure.Search;

internal sealed class SearchService(
    InsightDocsDbContext dbContext,
    IKeycloakAdminService keycloakAdminService) : ISearchService
{
    public async Task<PagedResultDto<DocumentSearchResultDto>> SearchDocumentsAsync(DocumentSearchQuery query, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var documents = dbContext.Documents
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Query))
        {
            var normalized = query.Query.Trim();
            documents = documents.Where(document =>
                EF.Functions.ILike(document.Title, $"%{normalized}%") ||
                EF.Functions.ILike(document.Description ?? string.Empty, $"%{normalized}%") ||
                EF.Functions.ILike(document.Category ?? string.Empty, $"%{normalized}%") ||
                EF.Functions.ToTsVector("english",
                        (document.Title ?? string.Empty) + " " +
                        (document.Description ?? string.Empty) + " " +
                        (document.Category ?? string.Empty))
                    .Matches(EF.Functions.PlainToTsQuery("english", normalized)));
        }

        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            var category = query.Category.Trim();
            documents = documents.Where(document => EF.Functions.ILike(document.Category ?? string.Empty, $"%{category}%"));
        }

        if (query.Status.HasValue)
        {
            documents = documents.Where(document => document.Status == query.Status.Value);
        }

        if (query.Archived.HasValue)
        {
            documents = query.Archived.Value
                ? documents.Where(document => document.Status == DocumentStatus.Archived)
                : documents.Where(document => document.Status != DocumentStatus.Archived);
        }

        if (!string.IsNullOrWhiteSpace(query.Owner))
        {
            var owner = query.Owner.Trim();
            var ownerGuid = Guid.TryParse(owner, out var parsedOwnerId) ? parsedOwnerId : (Guid?)null;
            var ownerMatches = await ResolveMatchingUserIdsAsync(owner, cancellationToken);

            documents = documents.Where(document =>
                (ownerGuid.HasValue && document.OwnerUserId == ownerGuid.Value) ||
                (document.OwnerUserId.HasValue && ownerMatches.Contains(document.OwnerUserId.Value)));
        }

        if (!string.IsNullOrWhiteSpace(query.Controller))
        {
            var controller = query.Controller.Trim();
            var controllerGuid = Guid.TryParse(controller, out var parsedControllerId) ? parsedControllerId : (Guid?)null;
            var controllerMatches = await ResolveMatchingUserIdsAsync(controller, cancellationToken);

            documents = documents.Where(document =>
                (controllerGuid.HasValue && document.ControllerUserId == controllerGuid.Value) ||
                (document.ControllerUserId.HasValue && controllerMatches.Contains(document.ControllerUserId.Value)));
        }

        if (!string.IsNullOrWhiteSpace(query.Signer))
        {
            var signer = query.Signer.Trim();
            var signerGuid = Guid.TryParse(signer, out var parsedSignerId) ? parsedSignerId : (Guid?)null;
            var signerMatches = await ResolveMatchingUserIdsAsync(signer, cancellationToken);

            documents = documents.Where(document =>
                document.Versions.Any(version =>
                    version.IsCurrent &&
                    dbContext.DocumentSignatureRequests.Any(request =>
                        request.DocumentVersionId == version.Id &&
                        ((signerGuid.HasValue && request.SignerUserId == signerGuid.Value) ||
                         signerMatches.Contains(request.SignerUserId)))));
        }

        var totalCount = await documents.CountAsync(cancellationToken);

        var items = await documents
            .OrderByDescending(document => document.UpdatedAt ?? document.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(document => new
            {
                document.Id,
                document.Title,
                document.Description,
                document.Category,
                document.Status,
                document.OwnerUserId,
                document.ControllerUserId,
                CurrentVersionNumber = document.Versions.Where(version => version.IsCurrent).Select(version => (int?)version.VersionNumber).FirstOrDefault(),
                SignatureSummary = new SignatureSummaryDto(
                    document.Versions
                        .Where(version => version.IsCurrent)
                        .SelectMany(version => dbContext.DocumentSignatureRequests.Where(request => request.DocumentVersionId == version.Id))
                        .Count(),
                    document.Versions
                        .Where(version => version.IsCurrent)
                        .SelectMany(version => dbContext.DocumentSignatureRequests.Where(request => request.DocumentVersionId == version.Id && request.Status == DocumentSignatureStatus.Pending))
                        .Count(),
                    document.Versions
                        .Where(version => version.IsCurrent)
                        .SelectMany(version => dbContext.DocumentSignatureRequests.Where(request => request.DocumentVersionId == version.Id && request.Status == DocumentSignatureStatus.Signed))
                        .Count(),
                    document.Versions
                        .Where(version => version.IsCurrent)
                        .SelectMany(version => dbContext.DocumentSignatureRequests.Where(request => request.DocumentVersionId == version.Id && request.Status == DocumentSignatureStatus.Rejected))
                        .Count(),
                    !document.Versions
                        .Where(version => version.IsCurrent)
                        .SelectMany(version => dbContext.DocumentSignatureRequests.Where(request => request.DocumentVersionId == version.Id))
                        .Any(request => request.Status != DocumentSignatureStatus.Signed))
            })
            .ToArrayAsync(cancellationToken);

        var identities = await LoadIdentitiesAsync(
            items.SelectMany(item => new Guid?[] { item.OwnerUserId, item.ControllerUserId }),
            cancellationToken);

        var mappedItems = items.Select(item =>
        {
            var ownerIdentity = item.OwnerUserId.HasValue ? identities.GetValueOrDefault(item.OwnerUserId.Value) : null;
            var controllerIdentity = item.ControllerUserId.HasValue ? identities.GetValueOrDefault(item.ControllerUserId.Value) : null;

            return new DocumentSearchResultDto(
                item.Id,
                item.Title,
                item.Description,
                item.Category,
                item.Status,
                ownerIdentity?.Username,
                ResolveDisplayName(ownerIdentity),
                controllerIdentity?.Username,
                ResolveDisplayName(controllerIdentity),
                item.CurrentVersionNumber,
                item.SignatureSummary);
        }).ToArray();

        return new PagedResultDto<DocumentSearchResultDto>(mappedItems, page, pageSize, totalCount);
    }

    private async Task<Guid[]> ResolveMatchingUserIdsAsync(string searchTerm, CancellationToken cancellationToken)
    {
        var matches = await keycloakAdminService.SearchUsersAsync(searchTerm, cancellationToken);
        var keycloakIds = matches
            .Select(match => Guid.TryParse(match.KeycloakUserId, out var id) ? id : (Guid?)null)
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .ToArray();

        if (keycloakIds.Length == 0)
        {
            return [];
        }

        return await dbContext.Users
            .Where(user => keycloakIds.Contains(user.Id))
            .Select(user => user.Id)
            .ToArrayAsync(cancellationToken);
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
