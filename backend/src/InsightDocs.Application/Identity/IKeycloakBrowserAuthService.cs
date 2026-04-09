namespace InsightDocs.Application.Identity;

public interface IKeycloakBrowserAuthService
{
    string BuildAuthorizationUrl(string redirectUri, string state, string codeChallenge);
    string BuildLogoutUrl(string postLogoutRedirectUri);
    Task<BrowserTokenExchangeResult> ExchangeAuthorizationCodeAsync(string code, string codeVerifier, string redirectUri, CancellationToken cancellationToken);
}

public sealed record BrowserTokenExchangeResult(
    string AccessToken,
    int ExpiresIn,
    string? RefreshToken,
    string? IdToken);
