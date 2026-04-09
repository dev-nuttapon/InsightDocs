using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Infrastructure.Configuration;

public sealed class ApplicationOptions
{
    public const string SectionName = "Application";

    [Required]
    public string Name { get; init; } = "InsightDocs API";

    [Required]
    public string Environment { get; init; } = "Production";

    [Required]
    public string FrontendUrl { get; init; } = "http://localhost:5173";
}
