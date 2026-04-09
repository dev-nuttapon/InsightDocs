namespace InsightDocs.Application.Search;

public interface ISearchService
{
    Task<PagedResultDto<DocumentSearchResultDto>> SearchDocumentsAsync(DocumentSearchQuery query, CancellationToken cancellationToken);
}
