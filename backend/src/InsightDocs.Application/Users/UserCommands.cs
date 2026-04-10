using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Application.Users;

public sealed record CreateUserCommand : IValidatableObject
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
    [MaxLength(100)]
    public string FirstName { get; init; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; init; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(200)]
    public string Password { get; init; } = string.Empty;

    public IReadOnlyCollection<string> Roles { get; init; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(FirstName))
        {
            yield return new ValidationResult("First name is required.", [nameof(FirstName)]);
        }

        if (string.IsNullOrWhiteSpace(LastName))
        {
            yield return new ValidationResult("Last name is required.", [nameof(LastName)]);
        }

        if (Roles.Count == 0)
        {
            yield return new ValidationResult("At least one role is required.", [nameof(Roles)]);
        }
    }
}

public sealed record UpdateUserCommand : IValidatableObject
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
    [MaxLength(100)]
    public string FirstName { get; init; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; init; } = string.Empty;

    [MinLength(8)]
    [MaxLength(200)]
    public string? Password { get; init; }

    public IReadOnlyCollection<string> Roles { get; init; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(FirstName))
        {
            yield return new ValidationResult("First name is required.", [nameof(FirstName)]);
        }

        if (string.IsNullOrWhiteSpace(LastName))
        {
            yield return new ValidationResult("Last name is required.", [nameof(LastName)]);
        }

        if (Roles.Count == 0)
        {
            yield return new ValidationResult("At least one role is required.", [nameof(Roles)]);
        }

        if (Password is not null && string.IsNullOrWhiteSpace(Password))
        {
            yield return new ValidationResult("Password must be omitted or contain at least 8 characters.", [nameof(Password)]);
        }
    }
}
