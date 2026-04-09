namespace InsightDocs.Domain.Auth;

public enum PasswordResetRequestStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Completed = 3
}
