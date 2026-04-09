namespace InsightDocs.Application.Dashboard;

public sealed record DashboardSummaryDto(
    int TotalDocuments,
    int PendingApprovals,
    int PendingSignatures,
    int ApprovedDocuments,
    int ArchivedDocuments);

public sealed record RecentDashboardDocumentDto(
    Guid Id,
    string Title,
    string? Category,
    string Status,
    int? CurrentVersionNumber,
    string? OwnerDisplayName,
    string? ControllerDisplayName,
    DateTimeOffset LastActivityAt);

public sealed record RecentDashboardActivityDto(
    Guid Id,
    string Action,
    string EntityType,
    Guid? EntityId,
    Guid? RelatedDocumentId,
    Guid? RelatedVersionId,
    string? RelatedDocumentTitle,
    string? ActorDisplayName,
    string? ActorUsername,
    DateTimeOffset Timestamp);
