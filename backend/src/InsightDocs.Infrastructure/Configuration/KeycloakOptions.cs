using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Infrastructure.Configuration;

public sealed class KeycloakOptions
{
    public const string SectionName = "Keycloak";

    [Required]
    [Url]
    public string BaseUrl { get; init; } = default!;

    [Required]
    public string Realm { get; init; } = default!;

    [Required]
    public string ClientId { get; init; } = default!;

    public string ClientSecret { get; init; } = string.Empty;

    public string ApiAudience { get; init; } = string.Empty;

    [Required]
    public string RoleClientId { get; init; } = default!;

    public string Authority => $"{BaseUrl.TrimEnd('/')}/realms/{Realm}";
}
