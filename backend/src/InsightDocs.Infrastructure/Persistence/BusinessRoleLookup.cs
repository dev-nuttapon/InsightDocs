using InsightDocs.Application.Users;
using InsightDocs.Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace InsightDocs.Infrastructure.Persistence;

public sealed class BusinessRoleLookup(InsightDocsDbContext dbContext) : IBusinessRoleLookup
{
    public async Task<IReadOnlyCollection<string>> GetRolesForUserAsync(string? keycloakUserId, string? username, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(keycloakUserId) && string.IsNullOrWhiteSpace(username))
        {
            return [];
        }

        var normalizedUsername = username?.Trim().ToUpperInvariant();
        var normalizedKeycloakUserId = keycloakUserId?.Trim();

        var roles = await dbContext.Users
            .AsNoTracking()
            .Where(user =>
                user.Status == UserStatus.Active &&
                ((normalizedKeycloakUserId != null && user.KeycloakUserId == normalizedKeycloakUserId) ||
                 (normalizedUsername != null && user.Username.ToUpper() == normalizedUsername)))
            .SelectMany(user => user.UserRoles.Select(userRole => userRole.Role.Name))
            .Distinct()
            .ToListAsync(cancellationToken);

        return roles;
    }
}
