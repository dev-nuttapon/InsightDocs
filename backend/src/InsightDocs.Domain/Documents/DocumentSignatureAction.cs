namespace InsightDocs.Domain.Documents;

public sealed class DocumentSignatureAction
{
    private DocumentSignatureAction()
    {
    }

    public Guid Id { get; private set; }
    public Guid DocumentSignatureRequestId { get; private set; }
    public Guid SignerUserId { get; private set; }
    public DocumentSignatureActionType ActionType { get; private set; }
    public string PerformedBy { get; private set; } = string.Empty;
    public DateTimeOffset PerformedAt { get; private set; }
    public string? Comment { get; private set; }
    public string? OutputObjectKey { get; private set; }
    public DocumentSignatureRequest DocumentSignatureRequest { get; private set; } = null!;

    public static DocumentSignatureAction Create(
        Guid documentSignatureRequestId,
        Guid signerUserId,
        DocumentSignatureActionType actionType,
        string performedBy,
        string? comment,
        string? outputObjectKey)
    {
        return new DocumentSignatureAction
        {
            Id = Guid.NewGuid(),
            DocumentSignatureRequestId = documentSignatureRequestId,
            SignerUserId = signerUserId,
            ActionType = actionType,
            PerformedBy = performedBy,
            PerformedAt = DateTimeOffset.UtcNow,
            Comment = string.IsNullOrWhiteSpace(comment) ? null : comment.Trim(),
            OutputObjectKey = outputObjectKey
        };
    }
}
