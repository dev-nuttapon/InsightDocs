namespace InsightDocs.Application.Documents;

public interface IDocumentService
{
    Task<IReadOnlyCollection<DocumentSummaryDto>> GetDocumentsAsync(CancellationToken cancellationToken);
    Task<DocumentDetailDto> GetDocumentAsync(Guid documentId, CancellationToken cancellationToken);
    Task<DocumentDetailDto> CreateDocumentAsync(CreateDocumentCommand command, string createdBy, CancellationToken cancellationToken);
    Task<DocumentDetailDto> UpdateDocumentAsync(Guid documentId, UpdateDocumentCommand command, string updatedBy, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<DocumentVersionDto>> GetVersionsAsync(Guid documentId, CancellationToken cancellationToken);
    Task<DocumentVersionDto> GetVersionAsync(Guid documentId, Guid versionId, CancellationToken cancellationToken);
    Task<DocumentVersionDto> CreateVersionAsync(Guid documentId, CreateDocumentVersionCommand command, string createdBy, CancellationToken cancellationToken);
    Task<DocumentVersionDto> RestoreVersionAsync(Guid documentId, Guid versionId, string restoredBy, CancellationToken cancellationToken);
    Task<DocumentDetailDto> SubmitForReviewAsync(Guid documentId, string submittedBy, string? comment, CancellationToken cancellationToken);
    Task<DocumentDetailDto> ApproveAsync(Guid documentId, string approvedBy, string? comment, CancellationToken cancellationToken);
    Task<DocumentDetailDto> RejectAsync(Guid documentId, string rejectedBy, string? comment, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<PendingApprovalDto>> GetPendingApprovalsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyCollection<DocumentApprovalHistoryDto>> GetApprovalHistoryAsync(Guid documentId, CancellationToken cancellationToken);
    Task<DocumentSignatureRequestDto> AssignSignatureAsync(Guid documentId, AssignDocumentSignatureCommand command, string assignedBy, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<DocumentSignatureRequestDto>> GetSignaturesAsync(Guid documentId, CancellationToken cancellationToken);
    Task<DocumentSignatureRequestDto> SignAsync(Guid documentId, Guid signatureRequestId, string actorIdentifier, CompleteDocumentSignatureCommand command, CancellationToken cancellationToken);
    Task<DocumentSignatureRequestDto> RejectSignatureAsync(Guid documentId, Guid signatureRequestId, string actorIdentifier, CompleteDocumentSignatureCommand command, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<PendingSignatureDto>> GetPendingSignaturesAsync(string actorIdentifier, CancellationToken cancellationToken);
}
