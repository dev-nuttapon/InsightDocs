using InsightDocs.Application.Search;
using InsightDocs.Domain.Documents;
using InsightDocs.Domain.Users;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace InsightDocs.Infrastructure.Search;

internal sealed class SearchService(InsightDocsDbContext dbContext) : ISearchService
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
            documents = documents.Where(document =>
                (ownerGuid.HasValue && document.OwnerUserId == ownerGuid.Value) ||
                (document.OwnerUser != null && (
                    EF.Functions.ILike(document.OwnerUser.Username, $"%{owner}%") ||
                    EF.Functions.ILike(document.OwnerUser.DisplayName, $"%{owner}%") ||
                    EF.Functions.ILike(document.OwnerUser.Email, $"%{owner}%"))));
        }

        if (!string.IsNullOrWhiteSpace(query.Controller))
        {
            var controller = query.Controller.Trim();
            var controllerGuid = Guid.TryParse(controller, out var parsedControllerId) ? parsedControllerId : (Guid?)null;
            documents = documents.Where(document =>
                (controllerGuid.HasValue && document.ControllerUserId == controllerGuid.Value) ||
                (document.ControllerUser != null && (
                    EF.Functions.ILike(document.ControllerUser.Username, $"%{controller}%") ||
                    EF.Functions.ILike(document.ControllerUser.DisplayName, $"%{controller}%") ||
                    EF.Functions.ILike(document.ControllerUser.Email, $"%{controller}%"))));
        }

        if (!string.IsNullOrWhiteSpace(query.Signer))
        {
            var signer = query.Signer.Trim();
            var signerGuid = Guid.TryParse(signer, out var parsedSignerId) ? parsedSignerId : (Guid?)null;

            documents = documents.Where(document =>
                document.Versions.Any(version =>
                    version.IsCurrent &&
                    dbContext.DocumentSignatureRequests.Any(request =>
                        request.DocumentVersionId == version.Id &&
                        ((signerGuid.HasValue && request.SignerUserId == signerGuid.Value) ||
                         EF.Functions.ILike(request.SignerUser.Username, $"%{signer}%") ||
                         EF.Functions.ILike(request.SignerUser.DisplayName, $"%{signer}%") ||
                         EF.Functions.ILike(request.SignerUser.Email, $"%{signer}%")))));
        }

        var totalCount = await documents.CountAsync(cancellationToken);

        var items = await documents
            .OrderByDescending(document => document.UpdatedAt ?? document.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(document => new DocumentSearchResultDto(
                document.Id,
                document.Title,
                document.Description,
                document.Category,
                document.Status,
                document.OwnerUser != null ? document.OwnerUser.Username : null,
                document.OwnerUser != null ? document.OwnerUser.DisplayName : null,
                document.ControllerUser != null ? document.ControllerUser.Username : null,
                document.ControllerUser != null ? document.ControllerUser.DisplayName : null,
                document.Versions.Where(version => version.IsCurrent).Select(version => (int?)version.VersionNumber).FirstOrDefault(),
                new SignatureSummaryDto(
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
                        .Any(request => request.Status != DocumentSignatureStatus.Signed))))
            .ToArrayAsync(cancellationToken);

        return new PagedResultDto<DocumentSearchResultDto>(items, page, pageSize, totalCount);
    }
}
