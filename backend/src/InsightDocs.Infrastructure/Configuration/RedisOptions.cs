using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Infrastructure.Configuration;

public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    [Required]
    public string ConnectionString { get; init; } = default!;
}
