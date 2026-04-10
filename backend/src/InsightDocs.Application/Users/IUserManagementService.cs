namespace InsightDocs.Application.Users;

public interface IUserManagementService
{
    Task<IReadOnlyCollection<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken);
    Task<IReadOnlyCollection<UserSummaryDto>> GetSignersAsync(CancellationToken cancellationToken);
    Task<UserDetailDto> GetUserAsync(Guid id, CancellationToken cancellationToken);
    Task<UserDetailDto> CreateUserAsync(CreateUserCommand command, CancellationToken cancellationToken);
    Task<UserDetailDto> ApproveUserAsync(Guid id, string approvedBy, CancellationToken cancellationToken);
    Task<UserDetailDto> DisableUserAsync(Guid id, CancellationToken cancellationToken);
    Task<UserDetailDto> EnableUserAsync(Guid id, CancellationToken cancellationToken);
}
