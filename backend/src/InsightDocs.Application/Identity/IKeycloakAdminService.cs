namespace InsightDocs.Application.Identity;

public interface IKeycloakAdminService
{
    Task<string> CreateUserAsync(string username, string email, string displayName, string password, bool enabled, CancellationToken cancellationToken);
    Task<KeycloakUserProfile?> GetUserProfileAsync(string keycloakUserId, CancellationToken cancellationToken);
    Task DeleteUserAsync(string keycloakUserId, CancellationToken cancellationToken);
    Task SetUserEnabledAsync(string keycloakUserId, bool enabled, CancellationToken cancellationToken);
    Task ResetPasswordAsync(string keycloakUserId, string password, CancellationToken cancellationToken);
}

public sealed record KeycloakUserProfile(
    string? FirstName,
    string? LastName);
