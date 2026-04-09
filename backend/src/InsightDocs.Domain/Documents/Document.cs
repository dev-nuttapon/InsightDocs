using InsightDocs.Domain.Users;

namespace InsightDocs.Domain.Documents;

public sealed class Document
{
    private readonly List<DocumentVersion> _versions = [];
    private readonly List<DocumentApproval> _approvals = [];

    private Document()
    {
    }

    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? Category { get; private set; }
    public Guid? OwnerUserId { get; private set; }
    public Guid? ControllerUserId { get; private set; }
    public DocumentStatus Status { get; private set; }
    public string CreatedBy { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public string? UpdatedBy { get; private set; }
    public DateTimeOffset? UpdatedAt { get; private set; }
    public User? OwnerUser { get; private set; }
    public User? ControllerUser { get; private set; }
    public IReadOnlyCollection<DocumentVersion> Versions => _versions;
    public IReadOnlyCollection<DocumentApproval> Approvals => _approvals;

    public static Document Create(string title, string? description, string? category, Guid? ownerUserId, Guid? controllerUserId, string createdBy)
    {
        return new Document
        {
            Id = Guid.NewGuid(),
            Title = title.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            Category = string.IsNullOrWhiteSpace(category) ? null : category.Trim(),
            OwnerUserId = ownerUserId,
            ControllerUserId = controllerUserId,
            Status = DocumentStatus.Draft,
            CreatedBy = createdBy,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void UpdateDetails(string title, string? description, string? category, Guid? ownerUserId, Guid? controllerUserId, string updatedBy)
    {
        Title = title.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        Category = string.IsNullOrWhiteSpace(category) ? null : category.Trim();
        OwnerUserId = ownerUserId;
        ControllerUserId = controllerUserId;
        EnsureNotArchived();
        UpdatedBy = updatedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
        Status = DocumentStatus.Draft;
    }

    public DocumentApproval SubmitForReview(string submittedBy, string? comment)
    {
        EnsureStatus([DocumentStatus.Draft, DocumentStatus.Rejected], "Only draft or rejected documents can be submitted for review.");

        var approval = Transition(DocumentApprovalAction.Submitted, DocumentStatus.InReview, submittedBy, comment);
        return approval;
    }

    public DocumentApproval Approve(string approvedBy, string? comment)
    {
        EnsureStatus([DocumentStatus.InReview], "Only documents in review can be approved.");
        return Transition(DocumentApprovalAction.Approved, DocumentStatus.Approved, approvedBy, comment);
    }

    public DocumentApproval Reject(string rejectedBy, string? comment)
    {
        EnsureStatus([DocumentStatus.InReview], "Only documents in review can be rejected.");
        return Transition(DocumentApprovalAction.Rejected, DocumentStatus.Rejected, rejectedBy, comment);
    }

    public void MarkContentUpdated(string updatedBy)
    {
        EnsureNotArchived();
        UpdatedBy = updatedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
        Status = DocumentStatus.Draft;
    }

    public void Archive(string archivedBy)
    {
        EnsureStatus(
            [DocumentStatus.Draft, DocumentStatus.Approved, DocumentStatus.Rejected],
            "Only draft, approved, or rejected documents can be archived.");

        UpdatedBy = archivedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
        Status = DocumentStatus.Archived;
    }

    private DocumentApproval Transition(DocumentApprovalAction action, DocumentStatus toStatus, string performedBy, string? comment)
    {
        var fromStatus = Status;
        Status = toStatus;
        UpdatedBy = performedBy;
        UpdatedAt = DateTimeOffset.UtcNow;

        var approval = DocumentApproval.Create(Id, action, fromStatus, toStatus, performedBy);

        if (!string.IsNullOrWhiteSpace(comment))
        {
            approval.AddComment(comment, performedBy);
        }

        _approvals.Add(approval);
        return approval;
    }

    private void EnsureStatus(DocumentStatus[] allowedStatuses, string message)
    {
        if (!allowedStatuses.Contains(Status))
        {
            throw new InvalidOperationException(message);
        }
    }

    private void EnsureNotArchived()
    {
        if (Status == DocumentStatus.Archived)
        {
            throw new InvalidOperationException("Archived documents cannot be modified.");
        }
    }
}
