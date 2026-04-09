using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Application.Audit;

public sealed record AuditLogQuery
{
    public string? Actor { get; init; }
    public string? Action { get; init; }
    public Guid? DocumentId { get; init; }
    public DateTimeOffset? From { get; init; }
    public DateTimeOffset? To { get; init; }

    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
}

public sealed record AuditLogListItemDto(
    Guid Id,
    Guid? ActorUserId,
    string? ActorUsername,
    string? ActorDisplayName,
    string Action,
    string EntityType,
    Guid? EntityId,
    Guid? RelatedDocumentId,
    Guid? RelatedVersionId,
    DateTimeOffset Timestamp);

public sealed record AuditLogDetailDto(
    Guid Id,
    Guid? ActorUserId,
    string? ActorUsername,
    string? ActorDisplayName,
    string Action,
    string EntityType,
    Guid? EntityId,
    Guid? RelatedDocumentId,
    Guid? RelatedVersionId,
    DateTimeOffset Timestamp,
    string? MetadataJson);

public sealed record AuditLogListResultDto(
    IReadOnlyCollection<AuditLogListItemDto> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record WriteAuditLogEntry(
    string Action,
    string EntityType,
    Guid? EntityId = null,
    Guid? RelatedDocumentId = null,
    Guid? RelatedVersionId = null,
    string? ActorIdentifier = null,
    Guid? ActorUserId = null,
    object? Metadata = null);
