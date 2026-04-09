using InsightDocs.Api.Models;
using InsightDocs.Application.Identity;
using InsightDocs.Application.Search;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightDocs.Api.Controllers;

[ApiController]
[Route("api/search")]
[Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
public sealed class SearchController(ISearchService searchService) : ControllerBase
{
    [HttpGet("documents")]
    [ProducesResponseType(typeof(ApiResponse<PagedResultDto<DocumentSearchResultDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResultDto<DocumentSearchResultDto>>>> SearchDocuments(
        [FromQuery] DocumentSearchQuery query,
        CancellationToken cancellationToken)
    {
        var results = await searchService.SearchDocumentsAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResultDto<DocumentSearchResultDto>>.Ok(results, HttpContext.TraceIdentifier));
    }
}
