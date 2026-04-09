namespace InsightDocs.Application.Dashboard;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(string? actorIdentifier, IReadOnlyCollection<string> roles, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<RecentDashboardDocumentDto>> GetRecentDocumentsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyCollection<RecentDashboardActivityDto>> GetRecentActivitiesAsync(string? actorIdentifier, IReadOnlyCollection<string> roles, CancellationToken cancellationToken);
}
