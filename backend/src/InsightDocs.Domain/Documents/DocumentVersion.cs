namespace InsightDocs.Domain.Documents;

public sealed class DocumentVersion
{
    private DocumentVersion()
    {
    }

    public Guid Id { get; private set; }
    public Guid DocumentId { get; private set; }
    public int VersionNumber { get; private set; }
    public string OriginalObjectKey { get; private set; } = string.Empty;
    public string? SignedObjectKey { get; private set; }
    public string Checksum { get; private set; } = string.Empty;
    public string ChangeSummary { get; private set; } = string.Empty;
    public string CreatedBy { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public bool IsCurrent { get; private set; }
    public Document Document { get; private set; } = null!;

    public static DocumentVersion Create(
        Guid documentId,
        int versionNumber,
        string originalObjectKey,
        string? signedObjectKey,
        string checksum,
        string changeSummary,
        string createdBy,
        bool isCurrent)
    {
        return new DocumentVersion
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            VersionNumber = versionNumber,
            OriginalObjectKey = originalObjectKey,
            SignedObjectKey = signedObjectKey,
            Checksum = checksum,
            ChangeSummary = changeSummary.Trim(),
            CreatedBy = createdBy,
            CreatedAt = DateTimeOffset.UtcNow,
            IsCurrent = isCurrent
        };
    }

    public void MarkAsCurrent()
    {
        IsCurrent = true;
    }

    public void MarkAsHistorical()
    {
        IsCurrent = false;
    }

    public void SetSignedObjectKey(string objectKey)
    {
        SignedObjectKey = objectKey;
    }
}
