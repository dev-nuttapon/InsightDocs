using System.Security.Claims;
using System.Text.Json;
using InsightDocs.Application.Users;
using InsightDocs.Infrastructure.Configuration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace InsightDocs.Infrastructure.Authentication;

public sealed class KeycloakClaimsTransformation(
    IOptions<KeycloakOptions> keycloakOptions,
    IBusinessRoleLookup businessRoleLookup) : IClaimsTransformation
{
    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity is not ClaimsIdentity identity || !identity.IsAuthenticated)
        {
            return principal;
        }

        AddRoleClaims(identity, ReadRolesFromRealmAccess(identity));
        AddRoleClaims(identity, ReadRolesFromResourceAccess(identity, keycloakOptions.Value.RoleClientId));
        AddRoleClaims(identity, await businessRoleLookup.GetRolesForUserAsync(
            keycloakUserId: identity.FindFirst("sub")?.Value,
            username: identity.FindFirst("preferred_username")?.Value,
            cancellationToken: CancellationToken.None));

        return principal;
    }

    private static void AddRoleClaims(ClaimsIdentity identity, IEnumerable<string> roles)
    {
        var existingRoles = identity.Claims
            .Where(claim => claim.Type == ClaimTypes.Role)
            .Select(claim => claim.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var role in roles.Where(role => !string.IsNullOrWhiteSpace(role)))
        {
            if (existingRoles.Add(role))
            {
                identity.AddClaim(new Claim(ClaimTypes.Role, role));
            }
        }
    }

    private static IEnumerable<string> ReadRolesFromRealmAccess(ClaimsIdentity identity)
    {
        var rawClaim = identity.FindFirst("realm_access")?.Value;
        return ReadRoles(rawClaim);
    }

    private static IEnumerable<string> ReadRolesFromResourceAccess(ClaimsIdentity identity, string clientId)
    {
        var rawClaim = identity.FindFirst("resource_access")?.Value;

        if (string.IsNullOrWhiteSpace(rawClaim))
        {
            return [];
        }

        try
        {
            using var document = JsonDocument.Parse(rawClaim);

            if (!document.RootElement.TryGetProperty(clientId, out var clientElement))
            {
                return [];
            }

            return ReadRoles(clientElement.GetRawText());
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static IEnumerable<string> ReadRoles(string? rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return [];
        }

        try
        {
            using var document = JsonDocument.Parse(rawJson);

            if (!document.RootElement.TryGetProperty("roles", out var rolesElement) ||
                rolesElement.ValueKind != JsonValueKind.Array)
            {
                return [];
            }

            return rolesElement.EnumerateArray()
                .Where(element => element.ValueKind == JsonValueKind.String)
                .Select(element => element.GetString()!)
                .ToArray();
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
