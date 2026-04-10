using InsightDocs.Application.Auth;
using InsightDocs.Application.Audit;
using InsightDocs.Application.Common;
using InsightDocs.Application.Identity;
using InsightDocs.Domain.Auth;
using InsightDocs.Domain.Users;
using InsightDocs.Infrastructure.Configuration;
using InsightDocs.Infrastructure.Persistence;
using InsightDocs.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace InsightDocs.Infrastructure.Auth;

public sealed class PasswordResetService(
    InsightDocsDbContext dbContext,
    IKeycloakAdminService keycloakAdminService,
    IAuditLogService auditLogService,
    IOptions<ApplicationOptions> applicationOptions,
    IOptions<PasswordResetOptions> passwordResetOptions) : IPasswordResetService
{
    private readonly ApplicationOptions _applicationOptions = applicationOptions.Value;
    private readonly PasswordResetOptions _passwordResetOptions = passwordResetOptions.Value;

    public async Task<ForgotPasswordResultDto> CreateRequestAsync(ForgotPasswordCommand command, CancellationToken cancellationToken)
    {
        var lookup = command.UsernameOrEmail.Trim();
        var identity = await keycloakAdminService.FindUserByUsernameOrEmailAsync(lookup, cancellationToken);
        if (identity is null)
        {
            return new ForgotPasswordResultDto(Guid.Empty, PasswordResetRequestStatus.Pending.ToString(), DateTimeOffset.UtcNow);
        }

        var user = await dbContext.Users
            .FirstOrDefaultAsync(entity => entity.Id == ParseUserId(identity.KeycloakUserId), cancellationToken);

        if (user is null)
        {
            return new ForgotPasswordResultDto(Guid.Empty, PasswordResetRequestStatus.Pending.ToString(), DateTimeOffset.UtcNow);
        }

        var request = new PasswordResetRequest(user.Id, lookup);
        dbContext.Add(request);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "password-reset.requested",
                "PasswordResetRequest",
                request.Id,
                ActorUserId: user.Id,
                Metadata: new
                {
                    request.UserId,
                    request.RequestedByIdentifier,
                    Status = request.Status.ToString()
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ForgotPasswordResultDto(request.Id, request.Status.ToString(), request.RequestedAt);
    }

    public async Task<IReadOnlyCollection<PasswordResetRequestDto>> GetRequestsAsync(CancellationToken cancellationToken)
    {
        var requests = await dbContext.Set<PasswordResetRequest>()
            .AsNoTracking()
            .Include(request => request.User)
            .OrderByDescending(request => request.RequestedAt)
            .ToListAsync(cancellationToken);
        var identities = await LoadIdentitiesAsync(requests.Select(request => request.UserId), cancellationToken);

        return requests
            .Select(request => Map(request, identities.GetValueOrDefault(request.UserId)))
            .ToArray();
    }

    public async Task<PasswordResetRequestDto> ApproveAsync(Guid id, string reviewedBy, string comment, CancellationToken cancellationToken)
    {
        var request = await LoadRequestAsync(id, cancellationToken);

        if (request.Status != PasswordResetRequestStatus.Pending)
        {
            throw new ValidationException("Only pending password reset requests can be approved.");
        }

        var token = TokenHasher.GenerateSecureToken();
        var tokenHash = TokenHasher.ComputeHash(token);
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_passwordResetOptions.TokenTtlMinutes);

        request.Approve(reviewedBy, comment, token, tokenHash, expiresAt);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "password-reset.approved",
                "PasswordResetRequest",
                request.Id,
                ActorIdentifier: reviewedBy,
                Metadata: new
                {
                    request.UserId,
                    ReviewedBy = reviewedBy,
                    request.RequestedByIdentifier,
                    request.ResetTokenExpiresAt
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        var identity = await keycloakAdminService.GetUserIdentityAsync(request.UserId.ToString(), cancellationToken);
        return Map(request, identity);
    }

    public async Task<PasswordResetRequestDto> RejectAsync(Guid id, string reviewedBy, string comment, CancellationToken cancellationToken)
    {
        var request = await LoadRequestAsync(id, cancellationToken);

        if (request.Status != PasswordResetRequestStatus.Pending)
        {
            throw new ValidationException("Only pending password reset requests can be rejected.");
        }

        request.Reject(reviewedBy, comment);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "password-reset.rejected",
                "PasswordResetRequest",
                request.Id,
                ActorIdentifier: reviewedBy,
                Metadata: new
                {
                    request.UserId,
                    ReviewedBy = reviewedBy,
                    Comment = comment
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        var identity = await keycloakAdminService.GetUserIdentityAsync(request.UserId.ToString(), cancellationToken);
        return Map(request, identity);
    }

    public async Task ResetPasswordAsync(ResetPasswordCommand command, CancellationToken cancellationToken)
    {
        var token = command.Token.Trim();
        var tokenHash = TokenHasher.ComputeHash(token);

        var request = await dbContext.Set<PasswordResetRequest>()
            .Include(entity => entity.User)
            .FirstOrDefaultAsync(entity => entity.ResetTokenHash == tokenHash, cancellationToken);

        if (request is null ||
            request.Status != PasswordResetRequestStatus.Approved ||
            request.ResetTokenExpiresAt is null ||
            request.ResetTokenExpiresAt <= DateTimeOffset.UtcNow ||
            !string.Equals(request.ResetToken, token, StringComparison.Ordinal))
        {
            throw new ValidationException("The password reset token is invalid or expired.");
        }

        await keycloakAdminService.ResetPasswordAsync(request.UserId.ToString(), command.NewPassword, cancellationToken);
        request.Complete();
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "password-reset.completed",
                "PasswordResetRequest",
                request.Id,
                ActorUserId: request.UserId,
                Metadata: new
                {
                    request.UserId,
                    request.CompletedAt
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<PasswordResetRequest> LoadRequestAsync(Guid id, CancellationToken cancellationToken)
    {
        var request = await dbContext.Set<PasswordResetRequest>()
            .Include(entity => entity.User)
            .FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

        return request ?? throw new NotFoundException($"Password reset request '{id}' was not found.");
    }

    private async Task<Dictionary<Guid, KeycloakUserIdentity?>> LoadIdentitiesAsync(IEnumerable<Guid> userIds, CancellationToken cancellationToken)
    {
        var ids = userIds.Distinct().ToArray();
        var pairs = await Task.WhenAll(ids.Select(async id => new
        {
            Id = id,
            Identity = await keycloakAdminService.GetUserIdentityAsync(id.ToString(), cancellationToken)
        }));

        return pairs.ToDictionary(item => item.Id, item => item.Identity);
    }

    private PasswordResetRequestDto Map(PasswordResetRequest request, KeycloakUserIdentity? identity)
    {
        string? resetUrl = null;

        if (request.Status == PasswordResetRequestStatus.Approved &&
            !string.IsNullOrWhiteSpace(request.ResetToken) &&
            request.ResetTokenExpiresAt > DateTimeOffset.UtcNow)
        {
            resetUrl = $"{_applicationOptions.FrontendUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(request.ResetToken)}";
        }

        return new PasswordResetRequestDto(
            request.Id,
            request.UserId,
            identity?.Username ?? request.UserId.ToString(),
            identity?.Email ?? string.Empty,
            ResolveDisplayName(identity),
            request.Status,
            request.RequestedByIdentifier,
            request.RequestedAt,
            request.ReviewedAt,
            request.ReviewedBy,
            request.ReviewComment,
            request.ResetTokenExpiresAt,
            resetUrl,
            request.CompletedAt);
    }

    private static string ResolveDisplayName(KeycloakUserIdentity? identity)
    {
        var fullName = string.Join(" ", new[] { identity?.FirstName, identity?.LastName }
            .Where(value => !string.IsNullOrWhiteSpace(value)))
            .Trim();

        return !string.IsNullOrWhiteSpace(fullName)
            ? fullName
            : identity?.Username ?? identity?.Email ?? "Unknown user";
    }

    private static Guid ParseUserId(string rawId)
    {
        if (Guid.TryParse(rawId, out var id))
        {
            return id;
        }

        throw new ValidationException("Keycloak returned a non-GUID user id.");
    }
}
