using InsightDocs.Domain.Auth;
using InsightDocs.Domain.Users;

namespace InsightDocs.Application.Auth;

public sealed record RegistrationResultDto(
    Guid UserId,
    string Username,
    string Email,
    string DisplayName,
    UserStatus Status);

public sealed record ForgotPasswordResultDto(
    Guid PasswordResetRequestId,
    string Status,
    DateTimeOffset RequestedAt);

public sealed record PasswordResetRequestDto(
    Guid Id,
    Guid UserId,
    string Username,
    string Email,
    string DisplayName,
    PasswordResetRequestStatus Status,
    string RequestedByIdentifier,
    DateTimeOffset RequestedAt,
    DateTimeOffset? ReviewedAt,
    string? ReviewedBy,
    string? ReviewComment,
    DateTimeOffset? ResetTokenExpiresAt,
    string? ResetUrl,
    DateTimeOffset? CompletedAt);
