namespace InsightDocs.Application.Identity;

public static class AuthorizationPolicies
{
    public const string AuthenticatedUser = "AuthenticatedUser";
    public const string AdminAccess = "AdminAccess";
    public const string DocumentManagement = "DocumentManagement";
    public const string DocumentReviewSubmission = "DocumentReviewSubmission";
    public const string DocumentReviewDecision = "DocumentReviewDecision";
    public const string DocumentSignatureManagement = "DocumentSignatureManagement";
    public const string DocumentSignatureExecution = "DocumentSignatureExecution";
}
