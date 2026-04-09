using System.Security.Claims;
using InsightDocs.Application.Identity;

namespace InsightDocs.Api.Services;

public sealed class HttpContextCurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    public string? Subject => GetClaim("sub") ?? GetClaim(ClaimTypes.NameIdentifier);

    public string? Username => GetClaim("preferred_username") ?? GetClaim(ClaimTypes.Name);

    public string? Email => GetClaim(ClaimTypes.Email) ?? GetClaim("email");

    public IReadOnlyCollection<string> Roles =>
        Principal?
            .Claims
            .Where(claim => claim.Type is ClaimTypes.Role or "role" or "roles")
            .Select(claim => claim.Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray()
        ?? [];

    private string? GetClaim(string claimType) => Principal?.FindFirstValue(claimType);
}
