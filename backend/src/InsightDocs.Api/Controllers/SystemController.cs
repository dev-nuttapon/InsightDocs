using InsightDocs.Api.Models;
using InsightDocs.Infrastructure.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace InsightDocs.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/system")]
public sealed class SystemController(
    IHostEnvironment environment,
    IOptions<ApplicationOptions> applicationOptions,
    IOptions<KeycloakOptions> keycloakOptions) : ControllerBase
{
    [HttpGet("info")]
    [ProducesResponseType(typeof(ApiResponse<SystemInfoResponse>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<SystemInfoResponse>> GetInfo()
    {
        var response = new SystemInfoResponse(
            applicationOptions.Value.Name,
            environment.EnvironmentName,
            keycloakOptions.Value.BaseUrl,
            keycloakOptions.Value.Realm,
            DateTimeOffset.UtcNow);

        return Ok(ApiResponse<SystemInfoResponse>.Ok(response, HttpContext.TraceIdentifier));
    }
}

public record SystemInfoResponse(
    string ApplicationName,
    string Environment,
    string KeycloakBaseUrl,
    string KeycloakRealm,
    DateTimeOffset UtcTimestamp);
