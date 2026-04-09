using InsightDocs.Application.Common;
using InsightDocs.Application.Identity;
using InsightDocs.Application.Users;
using InsightDocs.Domain.Users;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace InsightDocs.Infrastructure.Users;

public sealed class UserManagementService(
    InsightDocsDbContext dbContext,
    IKeycloakAdminService keycloakAdminService) : IUserManagementService
{
    public async Task<IReadOnlyCollection<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken)
    {
        var users = await dbContext.Users
            .AsNoTracking()
            .Include(user => user.UserRoles)
            .ThenInclude(userRole => userRole.Role)
            .OrderBy(user => user.Username)
            .ToListAsync(cancellationToken);

        return users.Select(MapSummary()).ToArray();
    }

    public async Task<IReadOnlyCollection<UserSummaryDto>> GetSignersAsync(CancellationToken cancellationToken)
    {
        var users = await dbContext.Users
            .AsNoTracking()
            .Include(user => user.UserRoles)
            .ThenInclude(userRole => userRole.Role)
            .Where(user =>
                user.Status == UserStatus.Active &&
                user.UserRoles.Any(userRole => userRole.Role.NormalizedName == BusinessRoles.Signer.ToUpperInvariant()))
            .OrderBy(user => user.DisplayName)
            .ToListAsync(cancellationToken);

        return users.Select(MapSummary()).ToArray();
    }

    public async Task<UserDetailDto> GetUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        return MapDetail(user);
    }

    public async Task<UserDetailDto> CreateUserAsync(CreateUserCommand command, CancellationToken cancellationToken)
    {
        await EnsureUniqueUserAsync(command.KeycloakUserId, command.Username, command.Email, null, cancellationToken);

        var user = new User(command.KeycloakUserId, command.Username, command.Email, command.DisplayName);

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapDetail(user);
    }

    public async Task<UserDetailDto> UpdateUserAsync(Guid id, UpdateUserCommand command, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        await EnsureUniqueUserAsync(command.KeycloakUserId, command.Username, command.Email, id, cancellationToken);

        user.UpdateProfile(command.KeycloakUserId, command.Username, command.Email, command.DisplayName);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapDetail(user);
    }

    public async Task<UserDetailDto> AssignRoleAsync(Guid id, string roleName, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        var role = await FindRoleAsync(roleName, cancellationToken);

        if (user.UserRoles.All(userRole => userRole.RoleId != role.Id))
        {
            dbContext.UserRoles.Add(new UserRole(user.Id, role.Id));
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        user = await LoadUserAsync(id, cancellationToken);
        return MapDetail(user);
    }

    public async Task RemoveRoleAsync(Guid id, string roleName, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        var normalizedRoleName = NormalizeRoleName(roleName);

        var userRole = user.UserRoles.FirstOrDefault(item => item.Role.NormalizedName == normalizedRoleName);

        if (userRole is null)
        {
            throw new NotFoundException($"Role '{roleName}' is not assigned to the user.");
        }

        dbContext.UserRoles.Remove(userRole);
        await dbContext.SaveChangesAsync(cancellationToken);
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
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapDetail(user);
    }

    public async Task<UserDetailDto> DisableUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        user.Disable();
        await keycloakAdminService.SetUserEnabledAsync(user.KeycloakUserId, false, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapDetail(user);
    }

    public async Task<UserDetailDto> EnableUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await LoadUserAsync(id, cancellationToken);
        user.Enable();
        await keycloakAdminService.SetUserEnabledAsync(user.KeycloakUserId, true, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapDetail(user);
    }

    private async Task<User> LoadUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(entity => entity.UserRoles)
            .ThenInclude(entity => entity.Role)
            .FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

        return user ?? throw new NotFoundException($"User '{id}' was not found.");
    }

    private async Task<Role> FindRoleAsync(string roleName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(roleName))
        {
            throw new ValidationException("Role name is required.");
        }

        var normalizedRoleName = NormalizeRoleName(roleName);

        var role = await dbContext.Roles
            .FirstOrDefaultAsync(entity => entity.NormalizedName == normalizedRoleName, cancellationToken);

        return role ?? throw new NotFoundException($"Role '{roleName}' was not found.");
    }

    private async Task EnsureUniqueUserAsync(string keycloakUserId, string username, string email, Guid? currentUserId, CancellationToken cancellationToken)
    {
        var normalizedKeycloakUserId = keycloakUserId.Trim();
        var normalizedUsername = username.Trim().ToUpperInvariant();
        var normalizedEmail = email.Trim().ToUpperInvariant();

        var duplicateExists = await dbContext.Users.AnyAsync(user =>
            user.Id != currentUserId &&
            (user.KeycloakUserId == normalizedKeycloakUserId ||
             user.Username.ToUpper() == normalizedUsername ||
             user.Email.ToUpper() == normalizedEmail), cancellationToken);

        if (duplicateExists)
        {
            throw new ConflictException("A user with the same Keycloak user id, username, or email already exists.");
        }
    }

    private static string NormalizeRoleName(string roleName) => roleName.Trim().ToUpperInvariant();

    private static Func<User, UserSummaryDto> MapSummary() =>
        user => new UserSummaryDto(
            user.Id,
            user.KeycloakUserId,
            user.Username,
            user.Email,
            user.DisplayName,
            user.Status,
            user.CreatedAt,
            user.ApprovedAt,
            user.ApprovedBy,
            user.UserRoles
                .Select(userRole => userRole.Role.Name)
                .OrderBy(name => name)
                .ToArray());

    private static UserDetailDto MapDetail(User user) =>
        new(
            user.Id,
            user.KeycloakUserId,
            user.Username,
            user.Email,
            user.DisplayName,
            user.Status,
            user.CreatedAt,
            user.ApprovedAt,
            user.ApprovedBy,
            user.UserRoles
                .Select(userRole => userRole.Role.Name)
                .OrderBy(name => name)
                .ToArray());
}
