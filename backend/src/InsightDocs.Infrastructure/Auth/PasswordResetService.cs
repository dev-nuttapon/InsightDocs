using InsightDocs.Application.Auth;
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
    IOptions<ApplicationOptions> applicationOptions,
    IOptions<PasswordResetOptions> passwordResetOptions) : IPasswordResetService
{
    private readonly ApplicationOptions _applicationOptions = applicationOptions.Value;
    private readonly PasswordResetOptions _passwordResetOptions = passwordResetOptions.Value;

    public async Task<ForgotPasswordResultDto> CreateRequestAsync(ForgotPasswordCommand command, CancellationToken cancellationToken)
    {
        var lookup = command.UsernameOrEmail.Trim();
        var normalizedLookup = lookup.ToUpperInvariant();

        var user = await dbContext.Users
            .FirstOrDefaultAsync(entity =>
                entity.Username.ToUpper() == normalizedLookup ||
                entity.Email.ToUpper() == normalizedLookup, cancellationToken);

        if (user is null)
        {
            return new ForgotPasswordResultDto(Guid.Empty, PasswordResetRequestStatus.Pending.ToString(), DateTimeOffset.UtcNow);
        }

        var request = new PasswordResetRequest(user.Id, lookup);
        dbContext.Add(request);
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

        return requests.Select(Map).ToArray();
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
        await dbContext.SaveChangesAsync(cancellationToken);

        return Map(request);
    }

    public async Task<PasswordResetRequestDto> RejectAsync(Guid id, string reviewedBy, string comment, CancellationToken cancellationToken)
    {
        var request = await LoadRequestAsync(id, cancellationToken);

        if (request.Status != PasswordResetRequestStatus.Pending)
        {
            throw new ValidationException("Only pending password reset requests can be rejected.");
        }

        request.Reject(reviewedBy, comment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Map(request);
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

        await keycloakAdminService.ResetPasswordAsync(request.User.KeycloakUserId, command.NewPassword, cancellationToken);
        request.Complete();
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<PasswordResetRequest> LoadRequestAsync(Guid id, CancellationToken cancellationToken)
    {
        var request = await dbContext.Set<PasswordResetRequest>()
            .Include(entity => entity.User)
            .FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

        return request ?? throw new NotFoundException($"Password reset request '{id}' was not found.");
    }

    private PasswordResetRequestDto Map(PasswordResetRequest request)
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
            request.User.Username,
            request.User.Email,
            request.User.DisplayName,
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
}
