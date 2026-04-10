namespace InsightDocs.Domain.Users;

public sealed class User
{
    public Guid Id { get; private set; }
    public UserStatus Status { get; private set; } = UserStatus.Pending;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ApprovedAt { get; private set; }
    public string? ApprovedBy { get; private set; }

    private User()
    {
    }

    public User(Guid id)
    {
        Id = id;
    }

    public void Approve(string approvedBy)
    {
        Status = UserStatus.Active;
        ApprovedAt = DateTimeOffset.UtcNow;
        ApprovedBy = approvedBy.Trim();
    }

    public void Disable()
    {
        Status = UserStatus.Disabled;
    }

    public void Enable()
    {
        Status = UserStatus.Active;
    }
}
