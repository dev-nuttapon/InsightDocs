namespace InsightDocs.Application.Users;

public interface IBusinessRoleLookup
{
    Task<IReadOnlyCollection<string>> GetRolesForUserAsync(string? keycloakUserId, string? username, CancellationToken cancellationToken);
}
