using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Application.Users;

public sealed record CreateUserCommand
{
    [Required]
    [MinLength(3)]
    [MaxLength(100)]
    public string Username { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(2)]
    [MaxLength(200)]
    public string DisplayName { get; init; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(200)]
    public string Password { get; init; } = string.Empty;
}

public sealed record UpdateUserCommand
{
    [Required]
    [MinLength(3)]
    [MaxLength(100)]
    public string Username { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(2)]
    [MaxLength(200)]
    public string DisplayName { get; init; } = string.Empty;
}
