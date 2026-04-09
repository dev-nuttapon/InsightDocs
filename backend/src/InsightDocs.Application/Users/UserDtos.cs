using InsightDocs.Domain.Users;

namespace InsightDocs.Application.Users;

public sealed record UserSummaryDto(
    Guid Id,
    string KeycloakUserId,
    string Username,
    string Email,
    string DisplayName,
    UserStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ApprovedAt,
    string? ApprovedBy,
    IReadOnlyCollection<string> Roles);

public sealed record UserDetailDto(
    Guid Id,
    string KeycloakUserId,
    string Username,
    string Email,
    string DisplayName,
    UserStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ApprovedAt,
    string? ApprovedBy,
    IReadOnlyCollection<string> Roles);
