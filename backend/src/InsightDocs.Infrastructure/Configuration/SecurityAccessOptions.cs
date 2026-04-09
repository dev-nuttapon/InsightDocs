using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Infrastructure.Configuration;

public sealed class SecurityAccessOptions
{
    public const string SectionName = "SecurityAccess";

    [Range(1, 1440)]
    public int SessionIdleTimeoutMinutes { get; init; } = 30;

    [Range(0, 1440)]
    public int SessionWarningMinutes { get; init; } = 5;

    [Range(1, 10080)]
    public int RedisSessionTtlMinutes { get; init; } = 60;

    [Range(1, 10080)]
    public int RedisUserCacheTtlMinutes { get; init; } = 30;

    [Range(1, 10080)]
    public int PermissionMatrixCacheTtlMinutes { get; init; } = 15;

    public bool KeycloakRoleMappingRequired { get; init; } = true;
}
