using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Application.Auth;

public sealed record RegisterUserCommand
{
    [Required]
    [MinLength(3)]
    public string Username { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(2)]
    public string DisplayName { get; init; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; init; } = string.Empty;
}

public sealed record ForgotPasswordCommand
{
    [Required]
    public string UsernameOrEmail { get; init; } = string.Empty;
}

public sealed record ResetPasswordCommand
{
    [Required]
    public string Token { get; init; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string NewPassword { get; init; } = string.Empty;
}

public sealed record ReviewPasswordResetRequestCommand
{
    public string Comment { get; init; } = string.Empty;
}
