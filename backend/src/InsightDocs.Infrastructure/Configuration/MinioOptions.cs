using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Infrastructure.Configuration;

public sealed class MinioOptions
{
    public const string SectionName = "Minio";

    [Required]
    public string Endpoint { get; init; } = default!;

    [Required]
    public string AccessKey { get; init; } = default!;

    [Required]
    public string SecretKey { get; init; } = default!;

    [Required]
    public string BucketName { get; init; } = default!;

    public bool UseSsl { get; init; }

    [Range(1, long.MaxValue)]
    public long MaxFileSizeBytes { get; init; } = 25 * 1024 * 1024;
}
