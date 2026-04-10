using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Application.Users;

public sealed record CreateUserCommand
{
    [Required]
    public string KeycloakUserId { get; init; } = string.Empty;

    [Required]
    [MinLength(3)]
    public string Username { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(2)]
    public string DisplayName { get; init; } = string.Empty;
}

public sealed record UpdateUserCommand
{
    [Required]
    public string KeycloakUserId { get; init; } = string.Empty;

    [Required]
    [MinLength(3)]
    public string Username { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(2)]
    public string DisplayName { get; init; } = string.Empty;
}
