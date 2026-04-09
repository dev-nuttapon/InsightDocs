using System.Net;
using System.Text.Json;
using InsightDocs.Application.Common;
using InsightDocs.Application.Identity;
using InsightDocs.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace InsightDocs.Infrastructure.Identity;

public sealed class KeycloakBrowserAuthService(
    HttpClient httpClient,
    IOptions<KeycloakOptions> keycloakOptions) : IKeycloakBrowserAuthService
{
    private readonly KeycloakOptions _options = keycloakOptions.Value;

    public string BuildAuthorizationUrl(string redirectUri, string state, string codeChallenge)
    {
        var url = $"{_options.Authority}/protocol/openid-connect/auth";
        var query = new Dictionary<string, string?>
        {
            ["client_id"] = _options.RoleClientId,
            ["redirect_uri"] = redirectUri,
            ["response_type"] = "code",
            ["scope"] = "openid profile email",
            ["code_challenge"] = codeChallenge,
            ["code_challenge_method"] = "S256",
            ["state"] = state
        };

        return QueryString(query, url);
    }

    public async Task<BrowserTokenExchangeResult> ExchangeAuthorizationCodeAsync(string code, string codeVerifier, string redirectUri, CancellationToken cancellationToken)
    {
        var tokenEndpoint = $"{_options.Authority}/protocol/openid-connect/token";
        using var request = new HttpRequestMessage(HttpMethod.Post, tokenEndpoint)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["client_id"] = _options.RoleClientId,
                ["code"] = code,
                ["code_verifier"] = codeVerifier,
                ["redirect_uri"] = redirectUri
            }!)
        };

        using var response = await httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            if (response.StatusCode == HttpStatusCode.BadRequest)
            {
                throw new ValidationException("Keycloak rejected the authorization code exchange.");
            }

            throw new ValidationException($"Keycloak browser token request failed with status {(int)response.StatusCode}.");
        }

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var root = document.RootElement;

        var accessToken = root.GetProperty("access_token").GetString();
        var expiresIn = root.GetProperty("expires_in").GetInt32();

        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new ValidationException("Keycloak browser access token response was empty.");
        }

        return new BrowserTokenExchangeResult(
            accessToken,
            expiresIn,
            root.TryGetProperty("refresh_token", out var refreshToken) ? refreshToken.GetString() : null,
            root.TryGetProperty("id_token", out var idToken) ? idToken.GetString() : null);
    }

    private static string QueryString(IReadOnlyDictionary<string, string?> values, string baseUrl)
    {
        var query = string.Join("&", values
            .Where(entry => !string.IsNullOrWhiteSpace(entry.Value))
            .Select(entry => $"{Uri.EscapeDataString(entry.Key)}={Uri.EscapeDataString(entry.Value!)}"));

        return string.IsNullOrWhiteSpace(query) ? baseUrl : $"{baseUrl}?{query}";
    }
}
