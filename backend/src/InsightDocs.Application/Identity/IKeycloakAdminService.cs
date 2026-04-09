namespace InsightDocs.Application.Identity;

public interface IKeycloakAdminService
{
    Task<string> CreateUserAsync(string username, string email, string displayName, string password, bool enabled, CancellationToken cancellationToken);
    Task DeleteUserAsync(string keycloakUserId, CancellationToken cancellationToken);
    Task SetUserEnabledAsync(string keycloakUserId, bool enabled, CancellationToken cancellationToken);
    Task ResetPasswordAsync(string keycloakUserId, string password, CancellationToken cancellationToken);
}
