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
            .OrderBy(user => user.Id)
            .ToListAsync(cancellationToken);

        return await MapSummariesAsync(users, cancellationToken);
    }

    public async Task<IReadOnlyCollection<UserSummaryDto>> GetSignersAsync(CancellationToken cancellationToken)
    {
        var users = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.Status == UserStatus.Active)
            .OrderBy(user => user.Id)
            .ToListAsync(cancellationToken);

        var identities = await LoadKeycloakIdentitiesAsync(users.Select(user => user.Id), cancellationToken);

        return users
            .Where(user => HasRole(identities.GetValueOrDefault(user.Id)?.Roles, BusinessRoles.Signer))
            .Select(user => MapSummary(user, identities.GetValueOrDefault(user.Id)))
            .ToArray();
    }

    public async Task<UserDetailDto> GetUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        return await MapDetailAsync(user, cancellationToken);
    }

    public async Task<UserDetailDto> CreateUserAsync(CreateUserCommand command, CancellationToken cancellationToken)
    {
        string? keycloakUserId = null;

        try
        {
            keycloakUserId = await keycloakAdminService.CreateUserAsync(
                command.Username.Trim(),
                command.Email.Trim(),
                command.DisplayName.Trim(),
                command.Password,
                enabled: false,
                cancellationToken);

            if (!Guid.TryParse(keycloakUserId, out var userId))
            {
                throw new ValidationException("Keycloak returned a non-GUID user id.");
            }

            await EnsureUniqueUserAsync(userId, null, cancellationToken);

            var user = new User(userId);

            dbContext.Users.Add(user);
            await auditLogService.WriteAsync(
                new WriteAuditLogEntry(
                    "user.created",
                    "User",
                    user.Id,
                    Metadata: new
                    {
                        UserId = user.Id,
                        command.Username,
                        command.Email,
                        command.DisplayName,
                        Status = user.Status.ToString(),
                        ProvisionedInKeycloak = true
                    }),
                cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return await MapDetailAsync(user, cancellationToken);
        }
        catch
        {
            if (!string.IsNullOrWhiteSpace(keycloakUserId))
            {
                await keycloakAdminService.DeleteUserAsync(keycloakUserId, cancellationToken);
            }

            throw;
        }
    }

    public async Task<UserDetailDto> ApproveUserAsync(Guid id, string approvedBy, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(approvedBy))
        {
            throw new ValidationException("Approver identity is required.");
        }

        var user = await LoadUserAsync(id, cancellationToken);
        user.Approve(approvedBy);
        await keycloakAdminService.SetUserEnabledAsync(user.Id.ToString(), true, cancellationToken);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "registration.approved",
                "User",
                user.Id,
                ActorIdentifier: approvedBy,
                Metadata: new
                {
                    UserId = user.Id,
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
        await keycloakAdminService.SetUserEnabledAsync(user.Id.ToString(), false, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(user, cancellationToken);
    }

    public async Task<UserDetailDto> EnableUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        user.Enable();
        await keycloakAdminService.SetUserEnabledAsync(user.Id.ToString(), true, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(user, cancellationToken);
    }

    private async Task<User> LoadUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

        return user ?? throw new NotFoundException($"User '{id}' was not found.");
    }

    private async Task EnsureUniqueUserAsync(Guid id, Guid? currentUserId, CancellationToken cancellationToken)
    {
        var duplicateExists = await dbContext.Users.AnyAsync(user =>
            user.Id != currentUserId &&
            user.Id == id, cancellationToken);

        if (duplicateExists)
        {
            throw new ConflictException("A user with the same Keycloak id already exists.");
        }
    }

    private async Task<IReadOnlyCollection<UserSummaryDto>> MapSummariesAsync(IReadOnlyCollection<User> users, CancellationToken cancellationToken)
    {
        var identities = await LoadKeycloakIdentitiesAsync(users.Select(user => user.Id), cancellationToken);

        return users
            .Select(user => MapSummary(user, identities.GetValueOrDefault(user.Id)))
            .ToArray();
    }

    private async Task<UserDetailDto> MapDetailAsync(User user, CancellationToken cancellationToken)
    {
        var identity = await keycloakAdminService.GetUserIdentityAsync(user.Id.ToString(), cancellationToken);
        return MapDetail(user, identity);
    }

    private async Task<Dictionary<Guid, KeycloakUserIdentity?>> LoadKeycloakIdentitiesAsync(IEnumerable<Guid> userIds, CancellationToken cancellationToken)
    {
        var ids = userIds
            .Distinct()
            .ToArray();

        var lookups = await Task.WhenAll(ids.Select(async id => new
        {
            Id = id,
            Identity = await keycloakAdminService.GetUserIdentityAsync(id.ToString(), cancellationToken)
        }));

        return lookups.ToDictionary(item => item.Id, item => item.Identity);
    }

    private static UserSummaryDto MapSummary(User user, KeycloakUserIdentity? identity) =>
        new(
            user.Id,
            identity?.Username ?? user.Id.ToString(),
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
            identity?.Username ?? user.Id.ToString(),
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

        return identity?.Username ?? user.Id.ToString();
    }

    private static bool HasRole(IReadOnlyCollection<string>? roles, string roleName) =>
        roles?.Any(role => string.Equals(role, roleName, StringComparison.OrdinalIgnoreCase)) == true;
}
