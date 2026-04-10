using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using InsightDocs.Application.Common;
using InsightDocs.Application.Identity;
using InsightDocs.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace InsightDocs.Infrastructure.Identity;

public sealed class KeycloakAdminService(
    HttpClient httpClient,
    IOptions<KeycloakOptions> keycloakOptions) : IKeycloakAdminService
{
    private readonly KeycloakOptions _options = keycloakOptions.Value;

    public async Task<string> CreateUserAsync(string username, string email, string displayName, string password, bool enabled, CancellationToken cancellationToken)
    {
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        using var request = new HttpRequestMessage(HttpMethod.Post, BuildAdminUsersUrl())
        {
            Content = JsonContent.Create(new
            {
                username,
                email,
                enabled,
                emailVerified = true,
                firstName = displayName,
                credentials = new[]
                {
                    new
                    {
                        type = "password",
                        temporary = false,
                        value = password
                    }
                }
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);

        if (response.StatusCode == HttpStatusCode.Conflict)
        {
            throw new ConflictException("A matching Keycloak user already exists.");
        }

        if (response.StatusCode != HttpStatusCode.Created)
        {
            throw new ValidationException($"Keycloak user creation failed with status {(int)response.StatusCode}.");
        }

        var location = response.Headers.Location?.ToString();
        var keycloakUserId = location?.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault();

        if (string.IsNullOrWhiteSpace(keycloakUserId))
        {
            throw new ValidationException("Keycloak did not return a created user id.");
        }

        return keycloakUserId;
    }

    public async Task<KeycloakUserIdentity?> GetUserIdentityAsync(string keycloakUserId, CancellationToken cancellationToken)
    {
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        using var request = new HttpRequestMessage(HttpMethod.Get, BuildAdminUserUrl(keycloakUserId));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new ValidationException($"Keycloak user lookup failed with status {(int)response.StatusCode}.");
        }

        var payload = await response.Content.ReadFromJsonAsync<KeycloakAdminUserResponse>(cancellationToken);
        if (payload is null)
        {
            return null;
        }

        var roles = await GetUserRolesAsync(keycloakUserId, accessToken, cancellationToken);
        return MapIdentity(payload, roles);
    }

    public async Task<KeycloakUserIdentity?> FindUserByUsernameOrEmailAsync(string lookup, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(lookup))
        {
            return null;
        }

        var results = await SearchUsersAsync(lookup.Trim(), cancellationToken);
        return results.FirstOrDefault(identity =>
            string.Equals(identity.Username, lookup, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(identity.Email, lookup, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<IReadOnlyCollection<KeycloakUserIdentity>> SearchUsersAsync(string searchTerm, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return [];
        }

        var accessToken = await GetAccessTokenAsync(cancellationToken);
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{BuildAdminUsersUrl()}?search={Uri.EscapeDataString(searchTerm.Trim())}&max=50");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new ValidationException($"Keycloak user search failed with status {(int)response.StatusCode}.");
        }

        var payload = await response.Content.ReadFromJsonAsync<List<KeycloakAdminUserResponse>>(cancellationToken) ?? [];
        var identities = await Task.WhenAll(payload
            .Where(user => !string.IsNullOrWhiteSpace(user.Id))
            .Select(async user =>
            {
                var roles = await GetUserRolesAsync(user.Id!, accessToken, cancellationToken);
                return MapIdentity(user, roles)!;
            }));

        return identities;
    }

    public async Task DeleteUserAsync(string keycloakUserId, CancellationToken cancellationToken)
    {
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        using var request = new HttpRequestMessage(HttpMethod.Delete, BuildAdminUserUrl(keycloakUserId));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);

        if (response.StatusCode is HttpStatusCode.NoContent or HttpStatusCode.NotFound)
        {
            return;
        }

        throw new ValidationException($"Keycloak user deletion failed with status {(int)response.StatusCode}.");
    }

    public async Task SetUserEnabledAsync(string keycloakUserId, bool enabled, CancellationToken cancellationToken)
    {
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        using var request = new HttpRequestMessage(HttpMethod.Put, BuildAdminUserUrl(keycloakUserId))
        {
            Content = JsonContent.Create(new { enabled })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);

        if (response.StatusCode != HttpStatusCode.NoContent)
        {
            throw new ValidationException($"Keycloak user update failed with status {(int)response.StatusCode}.");
        }
    }

    public async Task ResetPasswordAsync(string keycloakUserId, string password, CancellationToken cancellationToken)
    {
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        using var request = new HttpRequestMessage(HttpMethod.Put, $"{BuildAdminUserUrl(keycloakUserId)}/reset-password")
        {
            Content = JsonContent.Create(new
            {
                type = "password",
                temporary = false,
                value = password
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);

        if (response.StatusCode != HttpStatusCode.NoContent)
        {
            throw new ValidationException($"Keycloak password reset failed with status {(int)response.StatusCode}.");
        }
    }

    private async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
    {
        var tokenEndpoint = $"{_options.Authority}/protocol/openid-connect/token";
        using var request = new HttpRequestMessage(HttpMethod.Post, tokenEndpoint)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret
            }!)
        };

        using var response = await httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new ValidationException($"Keycloak token request failed with status {(int)response.StatusCode}.");
        }

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var accessToken = document.RootElement.GetProperty("access_token").GetString();

        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new ValidationException("Keycloak access token response was empty.");
        }

        return accessToken;
    }

    private string BuildAdminUsersUrl() => $"{_options.BaseUrl.TrimEnd('/')}/admin/realms/{_options.Realm}/users";

    private string BuildAdminUserUrl(string keycloakUserId) => $"{BuildAdminUsersUrl()}/{keycloakUserId}";

    private async Task<IReadOnlyCollection<string>> GetUserRolesAsync(string keycloakUserId, string accessToken, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{BuildAdminUserUrl(keycloakUserId)}/role-mappings");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return [];
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new ValidationException($"Keycloak role lookup failed with status {(int)response.StatusCode}.");
        }

        var payload = await response.Content.ReadFromJsonAsync<KeycloakRoleMappingsResponse>(cancellationToken);
        if (payload is null)
        {
            return [];
        }

        var roles = payload.RealmMappings?
            .Select(mapping => mapping.Name)
            .Concat(payload.ClientMappings?.Values
                .SelectMany(clientMapping => clientMapping.Mappings ?? [])
                .Select(mapping => mapping.Name) ?? [])
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return roles ?? [];
    }

    private static KeycloakUserIdentity? MapIdentity(KeycloakAdminUserResponse? payload, IReadOnlyCollection<string> roles)
    {
        if (payload is null || string.IsNullOrWhiteSpace(payload.Id))
        {
            return null;
        }

        return new KeycloakUserIdentity(
            payload.Id,
            payload.Username,
            payload.Email,
            payload.FirstName,
            payload.LastName,
            payload.Enabled,
            roles);
    }

    private sealed record KeycloakAdminUserResponse(
        string? Id,
        string? Username,
        string? Email,
        string? FirstName,
        string? LastName,
        bool? Enabled);

    private sealed record KeycloakRoleMappingsResponse(
        List<KeycloakRoleMapping>? RealmMappings,
        Dictionary<string, KeycloakClientRoleMappings>? ClientMappings);

    private sealed record KeycloakClientRoleMappings(
        List<KeycloakRoleMapping>? Mappings);

    private sealed record KeycloakRoleMapping(
        string? Name);
}
