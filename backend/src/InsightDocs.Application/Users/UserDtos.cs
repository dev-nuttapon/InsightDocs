using InsightDocs.Domain.Users;

namespace InsightDocs.Application.Users;

public sealed record UserSummaryDto(
    Guid Id,
    string Username,
    string Email,
    string DisplayName,
    string? FirstName,
    string? LastName,
    UserStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ApprovedAt,
    string? ApprovedBy,
    IReadOnlyCollection<string> Roles);

public sealed record UserDetailDto(
    Guid Id,
    string Username,
    string Email,
    string DisplayName,
    string? FirstName,
    string? LastName,
    UserStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ApprovedAt,
    string? ApprovedBy,
    IReadOnlyCollection<string> Roles);
