using System.ComponentModel.DataAnnotations;
using InsightDocs.Domain.Documents;

namespace InsightDocs.Application.Search;

public sealed record DocumentSearchQuery
{
    public string? Query { get; init; }
    public string? Category { get; init; }
    public DocumentStatus? Status { get; init; }
    public string? Owner { get; init; }
    public string? Controller { get; init; }
    public string? Signer { get; init; }
    public bool? Archived { get; init; }

    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
}

public sealed record SignatureSummaryDto(
    int TotalRequests,
    int PendingCount,
    int SignedCount,
    int RejectedCount,
    bool FullySigned);

public sealed record DocumentSearchResultDto(
    Guid Id,
    string Title,
    string? Description,
    string? Category,
    DocumentStatus Status,
    string? OwnerUsername,
    string? OwnerDisplayName,
    string? ControllerUsername,
    string? ControllerDisplayName,
    int? CurrentVersionNumber,
    SignatureSummaryDto SignatureSummary);

public sealed record PagedResultDto<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    int TotalCount);
