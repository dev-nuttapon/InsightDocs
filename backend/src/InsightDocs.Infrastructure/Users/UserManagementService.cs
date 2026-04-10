using InsightDocs.Application.Common;
using InsightDocs.Application.Identity;
using InsightDocs.Application.Users;
using InsightDocs.Application.Audit;
using InsightDocs.Domain.Users;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace InsightDocs.Infrastructure.Users;

public sealed class UserManagementService(
    InsightDocsDbContext dbContext,
    IKeycloakAdminService keycloakAdminService,
    IAuditLogService auditLogService) : IUserManagementService
{
    public async Task<IReadOnlyCollection<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken)
    {
        var users = await dbContext.Users
            .AsNoTracking()
            .OrderBy(user => user.KeycloakUserId)
            .ToListAsync(cancellationToken);

        return await MapSummariesAsync(users, cancellationToken);
    }

    public async Task<IReadOnlyCollection<UserSummaryDto>> GetSignersAsync(CancellationToken cancellationToken)
    {
        var users = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.Status == UserStatus.Active)
            .OrderBy(user => user.KeycloakUserId)
            .ToListAsync(cancellationToken);

        var identities = await LoadKeycloakIdentitiesAsync(users.Select(user => user.KeycloakUserId), cancellationToken);

        return users
            .Where(user => HasRole(identities.GetValueOrDefault(user.KeycloakUserId)?.Roles, BusinessRoles.Signer))
            .Select(user => MapSummary(user, identities.GetValueOrDefault(user.KeycloakUserId)))
            .ToArray();
    }

    public async Task<UserDetailDto> GetUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        return await MapDetailAsync(user, cancellationToken);
    }

    public async Task<UserDetailDto> CreateUserAsync(CreateUserCommand command, CancellationToken cancellationToken)
    {
        await EnsureUniqueUserAsync(command.KeycloakUserId, null, cancellationToken);

        var user = new User(command.KeycloakUserId);

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(user, cancellationToken);
    }

    public async Task<UserDetailDto> UpdateUserAsync(Guid id, UpdateUserCommand command, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        await EnsureUniqueUserAsync(command.KeycloakUserId, id, cancellationToken);

        user.UpdateKeycloakUser(command.KeycloakUserId);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(user, cancellationToken);
    }

    public async Task<UserDetailDto> ApproveUserAsync(Guid id, string approvedBy, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(approvedBy))
        {
            throw new ValidationException("Approver identity is required.");
        }

        var user = await LoadUserAsync(id, cancellationToken);
        user.Approve(approvedBy);
        await keycloakAdminService.SetUserEnabledAsync(user.KeycloakUserId, true, cancellationToken);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "registration.approved",
                "User",
                user.Id,
                ActorIdentifier: approvedBy,
                Metadata: new
                {
                    user.KeycloakUserId,
                    ApprovedBy = approvedBy,
                    Status = user.Status.ToString()
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(user, cancellationToken);
    }

    public async Task<UserDetailDto> DisableUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        user.Disable();
        await keycloakAdminService.SetUserEnabledAsync(user.KeycloakUserId, false, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(user, cancellationToken);
    }

    public async Task<UserDetailDto> EnableUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        user.Enable();
        await keycloakAdminService.SetUserEnabledAsync(user.KeycloakUserId, true, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(user, cancellationToken);
    }

    private async Task<User> LoadUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

        return user ?? throw new NotFoundException($"User '{id}' was not found.");
    }

    private async Task EnsureUniqueUserAsync(string keycloakUserId, Guid? currentUserId, CancellationToken cancellationToken)
    {
        var normalizedKeycloakUserId = keycloakUserId.Trim();

        var duplicateExists = await dbContext.Users.AnyAsync(user =>
            user.Id != currentUserId &&
            user.KeycloakUserId == normalizedKeycloakUserId, cancellationToken);

        if (duplicateExists)
        {
            throw new ConflictException("A user with the same Keycloak user id already exists.");
        }
    }

    private async Task<IReadOnlyCollection<UserSummaryDto>> MapSummariesAsync(IReadOnlyCollection<User> users, CancellationToken cancellationToken)
    {
        var identities = await LoadKeycloakIdentitiesAsync(users.Select(user => user.KeycloakUserId), cancellationToken);

        return users
            .Select(user => MapSummary(user, identities.GetValueOrDefault(user.KeycloakUserId)))
            .ToArray();
    }

    private async Task<UserDetailDto> MapDetailAsync(User user, CancellationToken cancellationToken)
    {
        var identity = await keycloakAdminService.GetUserIdentityAsync(user.KeycloakUserId, cancellationToken);
        return MapDetail(user, identity);
    }

    private async Task<Dictionary<string, KeycloakUserIdentity?>> LoadKeycloakIdentitiesAsync(IEnumerable<string> keycloakUserIds, CancellationToken cancellationToken)
    {
        var ids = keycloakUserIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        var lookups = await Task.WhenAll(ids.Select(async id => new
        {
            Id = id,
            Identity = await keycloakAdminService.GetUserIdentityAsync(id, cancellationToken)
        }));

        return lookups.ToDictionary(item => item.Id, item => item.Identity, StringComparer.Ordinal);
    }

    private static UserSummaryDto MapSummary(User user, KeycloakUserIdentity? identity) =>
        new(
            user.Id,
            user.KeycloakUserId,
            identity?.Username ?? user.KeycloakUserId,
            identity?.Email ?? string.Empty,
            ResolveDisplayName(user, identity),
            identity?.FirstName,
            identity?.LastName,
            user.Status,
            user.CreatedAt,
            user.ApprovedAt,
            user.ApprovedBy,
            (identity?.Roles ?? [])
                .OrderBy(name => name)
                .ToArray());

    private static UserDetailDto MapDetail(User user, KeycloakUserIdentity? identity) =>
        new(
            user.Id,
            user.KeycloakUserId,
            identity?.Username ?? user.KeycloakUserId,
            identity?.Email ?? string.Empty,
            ResolveDisplayName(user, identity),
            identity?.FirstName,
            identity?.LastName,
            user.Status,
            user.CreatedAt,
            user.ApprovedAt,
            user.ApprovedBy,
            (identity?.Roles ?? [])
                .OrderBy(name => name)
                .ToArray());

    private static string ResolveDisplayName(User user, KeycloakUserIdentity? identity)
    {
        var fullName = string.Join(" ", new[] { identity?.FirstName, identity?.LastName }
            .Where(value => !string.IsNullOrWhiteSpace(value)))
            .Trim();

        if (!string.IsNullOrWhiteSpace(fullName))
        {
            return fullName;
        }

        return identity?.Username ?? user.KeycloakUserId;
    }

    private static bool HasRole(IReadOnlyCollection<string>? roles, string roleName) =>
        roles?.Any(role => string.Equals(role, roleName, StringComparison.OrdinalIgnoreCase)) == true;
}
