namespace InsightDocs.Domain.Users;

public sealed class Role
{
    private readonly List<UserRole> _userRoles = [];

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string NormalizedName { get; private set; } = string.Empty;

    public IReadOnlyCollection<UserRole> UserRoles => _userRoles;

    private Role()
    {
    }

    public Role(Guid id, string name)
    {
        Id = id;
        Name = name.Trim();
        NormalizedName = name.Trim().ToUpperInvariant();
    }
}
