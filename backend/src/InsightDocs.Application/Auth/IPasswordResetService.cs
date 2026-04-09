namespace InsightDocs.Application.Auth;

public interface IPasswordResetService
{
    Task<ForgotPasswordResultDto> CreateRequestAsync(ForgotPasswordCommand command, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<PasswordResetRequestDto>> GetRequestsAsync(CancellationToken cancellationToken);
    Task<PasswordResetRequestDto> ApproveAsync(Guid id, string reviewedBy, string comment, CancellationToken cancellationToken);
    Task<PasswordResetRequestDto> RejectAsync(Guid id, string reviewedBy, string comment, CancellationToken cancellationToken);
    Task ResetPasswordAsync(ResetPasswordCommand command, CancellationToken cancellationToken);
}
