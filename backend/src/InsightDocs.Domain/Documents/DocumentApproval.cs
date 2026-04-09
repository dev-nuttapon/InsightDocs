namespace InsightDocs.Domain.Documents;

public sealed class DocumentApproval
{
    private readonly List<ApprovalComment> _comments = [];

    private DocumentApproval()
    {
    }

    public Guid Id { get; private set; }
    public Guid DocumentId { get; private set; }
    public DocumentApprovalAction Action { get; private set; }
    public DocumentStatus FromStatus { get; private set; }
    public DocumentStatus ToStatus { get; private set; }
    public string PerformedBy { get; private set; } = string.Empty;
    public DateTimeOffset PerformedAt { get; private set; }
    public Document Document { get; private set; } = null!;
    public IReadOnlyCollection<ApprovalComment> Comments => _comments;

    public static DocumentApproval Create(
        Guid documentId,
        DocumentApprovalAction action,
        DocumentStatus fromStatus,
        DocumentStatus toStatus,
        string performedBy)
    {
        return new DocumentApproval
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            Action = action,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            PerformedBy = performedBy,
            PerformedAt = DateTimeOffset.UtcNow
        };
    }

    public void AddComment(string commentText, string createdBy)
    {
        _comments.Add(ApprovalComment.Create(Id, commentText, createdBy));
    }
}
