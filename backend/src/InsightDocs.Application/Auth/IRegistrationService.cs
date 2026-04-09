namespace InsightDocs.Application.Auth;

public interface IRegistrationService
{
    Task<RegistrationResultDto> RegisterAsync(RegisterUserCommand command, CancellationToken cancellationToken);
}
