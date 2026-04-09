namespace InsightDocs.Domain.Documents;

using InsightDocs.Domain.Users;

public sealed class DocumentSignatureRequest
{
    private readonly List<DocumentSignatureAction> _actions = [];

    private DocumentSignatureRequest()
    {
    }

    public Guid Id { get; private set; }
    public Guid DocumentId { get; private set; }
    public Guid DocumentVersionId { get; private set; }
    public Guid SignerUserId { get; private set; }
    public int SigningOrder { get; private set; }
    public DocumentSignatureStatus Status { get; private set; }
    public int PageNumber { get; private set; }
    public decimal PositionX { get; private set; }
    public decimal PositionY { get; private set; }
    public decimal Width { get; private set; }
    public decimal Height { get; private set; }
    public DateTimeOffset? SignedAt { get; private set; }
    public string? Comment { get; private set; }
    public string? LatestSignedObjectKey { get; private set; }
    public Document Document { get; private set; } = null!;
    public DocumentVersion DocumentVersion { get; private set; } = null!;
    public User SignerUser { get; private set; } = null!;
    public IReadOnlyCollection<DocumentSignatureAction> Actions => _actions;

    public static DocumentSignatureRequest Create(
        Guid documentId,
        Guid documentVersionId,
        Guid signerUserId,
        int signingOrder,
        int pageNumber,
        decimal positionX,
        decimal positionY,
        decimal width,
        decimal height,
        string assignedBy,
        string? comment)
    {
        var request = new DocumentSignatureRequest
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            DocumentVersionId = documentVersionId,
            SignerUserId = signerUserId,
            SigningOrder = signingOrder,
            Status = DocumentSignatureStatus.Pending,
            PageNumber = pageNumber,
            PositionX = positionX,
            PositionY = positionY,
            Width = width,
            Height = height,
            Comment = string.IsNullOrWhiteSpace(comment) ? null : comment.Trim()
        };

        request._actions.Add(DocumentSignatureAction.Create(
            request.Id,
            signerUserId,
            DocumentSignatureActionType.Assigned,
            assignedBy,
            request.Comment,
            outputObjectKey: null));

        return request;
    }

    public void MarkSigned(string performedBy, string outputObjectKey, string? comment)
    {
        EnsurePending();
        Status = DocumentSignatureStatus.Signed;
        SignedAt = DateTimeOffset.UtcNow;
        Comment = string.IsNullOrWhiteSpace(comment) ? Comment : comment.Trim();
        LatestSignedObjectKey = outputObjectKey;
        _actions.Add(DocumentSignatureAction.Create(Id, SignerUserId, DocumentSignatureActionType.Signed, performedBy, comment, outputObjectKey));
    }

    public void MarkRejected(string performedBy, string? comment)
    {
        EnsurePending();
        Status = DocumentSignatureStatus.Rejected;
        Comment = string.IsNullOrWhiteSpace(comment) ? Comment : comment.Trim();
        _actions.Add(DocumentSignatureAction.Create(Id, SignerUserId, DocumentSignatureActionType.Rejected, performedBy, comment, outputObjectKey: null));
    }

    public void Cancel(string cancelledBy, string? comment)
    {
        if (Status is DocumentSignatureStatus.Signed or DocumentSignatureStatus.Cancelled)
        {
            throw new InvalidOperationException("This signature request cannot be cancelled.");
        }

        Status = DocumentSignatureStatus.Cancelled;
        Comment = string.IsNullOrWhiteSpace(comment) ? Comment : comment.Trim();
        _actions.Add(DocumentSignatureAction.Create(Id, SignerUserId, DocumentSignatureActionType.Cancelled, cancelledBy, comment, outputObjectKey: null));
    }

    private void EnsurePending()
    {
        if (Status != DocumentSignatureStatus.Pending)
        {
            throw new InvalidOperationException("Only pending signature requests can be processed.");
        }
    }
}
