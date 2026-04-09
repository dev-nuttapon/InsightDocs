using InsightDocs.Domain.Documents;

namespace InsightDocs.Application.Documents;

public sealed record DocumentSummaryDto(
    Guid Id,
    string Title,
    string? Description,
    string? Category,
    Guid? OwnerUserId,
    string? OwnerDisplayName,
    Guid? ControllerUserId,
    string? ControllerDisplayName,
    DocumentStatus Status,
    int VersionCount,
    int? CurrentVersionNumber,
    DateTimeOffset CreatedAt,
    string CreatedBy);

public sealed record DocumentDetailDto(
    Guid Id,
    string Title,
    string? Description,
    string? Category,
    Guid? OwnerUserId,
    string? OwnerDisplayName,
    Guid? ControllerUserId,
    string? ControllerDisplayName,
    DocumentStatus Status,
    int VersionCount,
    int? CurrentVersionNumber,
    DateTimeOffset CreatedAt,
    string CreatedBy,
    DateTimeOffset? UpdatedAt,
    string? UpdatedBy);

public sealed record DocumentVersionDto(
    Guid Id,
    Guid DocumentId,
    int VersionNumber,
    bool IsCurrent,
    bool HasOriginalPdf,
    bool HasSignedPdf,
    string Checksum,
    string ChangeSummary,
    string CreatedBy,
    DateTimeOffset CreatedAt);

public sealed record ApprovalCommentDto(
    Guid Id,
    string CommentText,
    string CreatedBy,
    DateTimeOffset CreatedAt);

public sealed record DocumentApprovalHistoryDto(
    Guid Id,
    Guid DocumentId,
    DocumentApprovalAction Action,
    DocumentStatus FromStatus,
    DocumentStatus ToStatus,
    string PerformedBy,
    DateTimeOffset PerformedAt,
    IReadOnlyCollection<ApprovalCommentDto> Comments);

public sealed record PendingApprovalDto(
    Guid DocumentId,
    string DocumentTitle,
    DocumentStatus Status,
    int? CurrentVersionNumber,
    string SubmittedBy,
    DateTimeOffset SubmittedAt,
    string? LatestComment);

public sealed record DocumentSignatureActionDto(
    Guid Id,
    DocumentSignatureActionType ActionType,
    string PerformedBy,
    DateTimeOffset PerformedAt,
    string? Comment,
    string? OutputObjectKey);

public sealed record DocumentSignatureRequestDto(
    Guid Id,
    Guid DocumentId,
    Guid DocumentVersionId,
    Guid SignerUserId,
    string SignerUsername,
    string SignerDisplayName,
    int SigningOrder,
    DocumentSignatureStatus Status,
    int PageNumber,
    decimal PositionX,
    decimal PositionY,
    decimal Width,
    decimal Height,
    DateTimeOffset? SignedAt,
    string? Comment,
    bool IsForCurrentVersion,
    IReadOnlyCollection<DocumentSignatureActionDto> Actions);

public sealed record PendingSignatureDto(
    Guid SignatureRequestId,
    Guid DocumentId,
    string DocumentTitle,
    Guid DocumentVersionId,
    int VersionNumber,
    int SigningOrder,
    int PageNumber,
    decimal PositionX,
    decimal PositionY,
    decimal Width,
    decimal Height,
    string? Comment);
