using InsightDocs.Api.Controllers;
using InsightDocs.Api.Models;
using InsightDocs.Application.Dashboard;
using InsightDocs.Application.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace InsightDocs.Backend.Tests.Api;

public sealed class DashboardControllerTests
{
    [Fact]
    public async Task GetSummary_ReturnsApiEnvelopeWithSummaryData()
    {
        var controller = new DashboardController(
            new StubDashboardService(),
            new StubCurrentUser(["Admin", "Manager"]))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var result = await controller.GetSummary(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<ApiResponse<DashboardSummaryDto>>(ok.Value);
        Assert.True(payload.Success);
        Assert.Equal(12, payload.Data.TotalDocuments);
        Assert.Equal(2, payload.Data.PendingApprovals);
    }

    [Fact]
    public async Task GetRecentActivities_ReturnsRecentActivityCollection()
    {
        var controller = new DashboardController(
            new StubDashboardService(),
            new StubCurrentUser(["Signer"]))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var result = await controller.GetRecentActivities(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<ApiResponse<IReadOnlyCollection<RecentDashboardActivityDto>>>(ok.Value);
        Assert.Single(payload.Data);
        Assert.Equal("document.signature.signed", payload.Data.First().Action);
    }

    private sealed class StubDashboardService : IDashboardService
    {
        public Task<DashboardSummaryDto> GetSummaryAsync(string? actorIdentifier, IReadOnlyCollection<string> roles, CancellationToken cancellationToken)
        {
            return Task.FromResult(new DashboardSummaryDto(12, 2, 3, 7, 1));
        }

        public Task<IReadOnlyCollection<RecentDashboardDocumentDto>> GetRecentDocumentsAsync(CancellationToken cancellationToken)
        {
            IReadOnlyCollection<RecentDashboardDocumentDto> items =
            [
                new RecentDashboardDocumentDto(Guid.NewGuid(), "Corporate Policy Handbook", "Policy", "Approved", 3, "Alice", "Bob", DateTimeOffset.UtcNow)
            ];

            return Task.FromResult(items);
        }

        public Task<IReadOnlyCollection<RecentDashboardActivityDto>> GetRecentActivitiesAsync(string? actorIdentifier, IReadOnlyCollection<string> roles, CancellationToken cancellationToken)
        {
            IReadOnlyCollection<RecentDashboardActivityDto> items =
            [
                new RecentDashboardActivityDto(Guid.NewGuid(), "document.signature.signed", "DocumentSignatureRequest", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "Corporate Policy Handbook", "Alice", "alice", DateTimeOffset.UtcNow)
            ];

            return Task.FromResult(items);
        }
    }

    private sealed class StubCurrentUser(IReadOnlyCollection<string> roles) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public string? Subject => "subject-1";
        public string? Username => "alice";
        public string? Email => "alice@example.com";
        public IReadOnlyCollection<string> Roles => roles;
    }
}
