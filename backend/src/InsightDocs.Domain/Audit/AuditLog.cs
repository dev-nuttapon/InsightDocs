using InsightDocs.Domain.Users;

namespace InsightDocs.Domain.Audit;

public sealed class AuditLog
{
    private AuditLog()
    {
    }

    public Guid Id { get; private set; }
    public Guid? ActorUserId { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string EntityType { get; private set; } = string.Empty;
    public Guid? EntityId { get; private set; }
    public Guid? RelatedDocumentId { get; private set; }
    public Guid? RelatedVersionId { get; private set; }
    public DateTimeOffset Timestamp { get; private set; }
    public string? MetadataJson { get; private set; }

    public User? ActorUser { get; private set; }

    public static AuditLog Create(
        Guid? actorUserId,
        string action,
        string entityType,
        Guid? entityId,
        Guid? relatedDocumentId,
        Guid? relatedVersionId,
        string? metadataJson)
    {
        return new AuditLog
        {
            Id = Guid.NewGuid(),
            ActorUserId = actorUserId,
            Action = action.Trim(),
            EntityType = entityType.Trim(),
            EntityId = entityId,
            RelatedDocumentId = relatedDocumentId,
            RelatedVersionId = relatedVersionId,
            Timestamp = DateTimeOffset.UtcNow,
            MetadataJson = string.IsNullOrWhiteSpace(metadataJson) ? null : metadataJson
        };
    }
}
