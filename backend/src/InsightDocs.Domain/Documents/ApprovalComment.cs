namespace InsightDocs.Domain.Documents;

public sealed class ApprovalComment
{
    private ApprovalComment()
    {
    }

    public Guid Id { get; private set; }
    public Guid DocumentApprovalId { get; private set; }
    public string CommentText { get; private set; } = string.Empty;
    public string CreatedBy { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DocumentApproval DocumentApproval { get; private set; } = null!;

    public static ApprovalComment Create(Guid documentApprovalId, string commentText, string createdBy)
    {
        return new ApprovalComment
        {
            Id = Guid.NewGuid(),
            DocumentApprovalId = documentApprovalId,
            CommentText = commentText.Trim(),
            CreatedBy = createdBy,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
