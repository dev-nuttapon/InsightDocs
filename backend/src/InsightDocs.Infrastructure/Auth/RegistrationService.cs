using InsightDocs.Application.Auth;
using InsightDocs.Application.Audit;
using InsightDocs.Application.Common;
using InsightDocs.Application.Identity;
using InsightDocs.Domain.Users;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace InsightDocs.Infrastructure.Auth;

public sealed class RegistrationService(
    InsightDocsDbContext dbContext,
    IKeycloakAdminService keycloakAdminService,
    IAuditLogService auditLogService) : IRegistrationService
{
    public async Task<RegistrationResultDto> RegisterAsync(RegisterUserCommand command, CancellationToken cancellationToken)
    {
        string? keycloakUserId = null;

        try
        {
            keycloakUserId = await keycloakAdminService.CreateUserAsync(
                command.Username.Trim(),
                command.Email.Trim(),
                command.DisplayName.Trim(),
                string.Empty,
                command.Password,
                enabled: false,
                cancellationToken);

            if (!Guid.TryParse(keycloakUserId, out var userId))
            {
                throw new ValidationException("Keycloak returned a non-GUID user id.");
            }

            var user = new User(userId);

            dbContext.Users.Add(user);
            await auditLogService.WriteAsync(
                new WriteAuditLogEntry(
                    "registration.requested",
                    "User",
                    user.Id,
                    ActorUserId: null,
                Metadata: new
                {
                    UserId = user.Id,
                    command.Username,
                    command.Email,
                    command.DisplayName,
                    Status = user.Status.ToString()
                }),
                cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return new RegistrationResultDto(user.Id, command.Username, command.Email, command.DisplayName, user.Status);
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
}
