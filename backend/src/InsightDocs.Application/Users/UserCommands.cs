using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Application.Users;

public sealed record CreateUserCommand
{
    [Required]
    public Guid Id { get; init; }
}
