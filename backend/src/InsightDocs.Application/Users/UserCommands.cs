using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Application.Users;

public sealed record CreateUserCommand
{
    [Required]
    public string KeycloakUserId { get; init; } = string.Empty;
}

public sealed record UpdateUserCommand
{
    [Required]
    public string KeycloakUserId { get; init; } = string.Empty;
}
