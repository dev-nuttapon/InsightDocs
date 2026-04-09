using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Infrastructure.Configuration;

public sealed class PasswordResetOptions
{
    public const string SectionName = "PasswordReset";

    [Range(5, 1440)]
    public int TokenTtlMinutes { get; init; } = 30;
}
