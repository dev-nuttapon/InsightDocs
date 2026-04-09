namespace InsightDocs.Application.Identity;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    string? Subject { get; }
    string? Username { get; }
    string? Email { get; }
    IReadOnlyCollection<string> Roles { get; }
}
