namespace InsightDocs.Domain.Users;

public sealed class User
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string KeycloakUserId { get; private set; } = string.Empty;
    public string Username { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public UserStatus Status { get; private set; } = UserStatus.Pending;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ApprovedAt { get; private set; }
    public string? ApprovedBy { get; private set; }

    private User()
    {
    }

    public User(string keycloakUserId, string username, string email, string displayName)
    {
        KeycloakUserId = keycloakUserId.Trim();
        Username = username.Trim();
        Email = email.Trim();
        DisplayName = displayName.Trim();
    }

    public void UpdateProfile(string keycloakUserId, string username, string email, string displayName)
    {
        KeycloakUserId = keycloakUserId.Trim();
        Username = username.Trim();
        Email = email.Trim();
        DisplayName = displayName.Trim();
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
