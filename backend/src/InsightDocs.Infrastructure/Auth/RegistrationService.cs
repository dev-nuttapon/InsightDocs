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
                command.Password,
                enabled: false,
                cancellationToken);

            var user = new User(keycloakUserId);

            dbContext.Users.Add(user);
            await auditLogService.WriteAsync(
                new WriteAuditLogEntry(
                    "registration.requested",
                    "User",
                    user.Id,
                    ActorUserId: null,
                Metadata: new
                {
                    user.KeycloakUserId,
                    command.Username,
                    command.Email,
                    command.DisplayName,
                    Status = user.Status.ToString()
                }),
                cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return new RegistrationResultDto(user.Id, user.KeycloakUserId, command.Username, command.Email, command.DisplayName, user.Status);
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
