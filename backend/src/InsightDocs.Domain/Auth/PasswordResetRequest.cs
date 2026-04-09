using InsightDocs.Domain.Users;

namespace InsightDocs.Domain.Auth;

public sealed class PasswordResetRequest
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public string RequestedByIdentifier { get; private set; } = string.Empty;
    public DateTimeOffset RequestedAt { get; private set; } = DateTimeOffset.UtcNow;
    public PasswordResetRequestStatus Status { get; private set; } = PasswordResetRequestStatus.Pending;
    public DateTimeOffset? ReviewedAt { get; private set; }
    public string? ReviewedBy { get; private set; }
    public string? ReviewComment { get; private set; }
    public string? ResetToken { get; private set; }
    public string? ResetTokenHash { get; private set; }
    public DateTimeOffset? ResetTokenExpiresAt { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }

    public User User { get; private set; } = default!;

    private PasswordResetRequest()
    {
    }

    public PasswordResetRequest(Guid userId, string requestedByIdentifier)
    {
        UserId = userId;
        RequestedByIdentifier = requestedByIdentifier.Trim();
    }

    public void Approve(string reviewedBy, string reviewComment, string token, string tokenHash, DateTimeOffset expiresAt)
    {
        Status = PasswordResetRequestStatus.Approved;
        ReviewedAt = DateTimeOffset.UtcNow;
        ReviewedBy = reviewedBy.Trim();
        ReviewComment = reviewComment.Trim();
        ResetToken = token;
        ResetTokenHash = tokenHash;
        ResetTokenExpiresAt = expiresAt;
        CompletedAt = null;
    }

    public void Reject(string reviewedBy, string reviewComment)
    {
        Status = PasswordResetRequestStatus.Rejected;
        ReviewedAt = DateTimeOffset.UtcNow;
        ReviewedBy = reviewedBy.Trim();
        ReviewComment = reviewComment.Trim();
        ResetToken = null;
        ResetTokenHash = null;
        ResetTokenExpiresAt = null;
        CompletedAt = null;
    }

    public void Complete()
    {
        Status = PasswordResetRequestStatus.Completed;
        CompletedAt = DateTimeOffset.UtcNow;
        ResetToken = null;
        ResetTokenHash = null;
        ResetTokenExpiresAt = null;
    }
}
