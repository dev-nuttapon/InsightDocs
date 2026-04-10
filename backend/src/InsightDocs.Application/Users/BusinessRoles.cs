namespace InsightDocs.Application.Users;

public static class BusinessRoles
{
    public const string Admin = "insightdocs:admin";
    public const string DocumentController = "insightdocs:document_controller";
    public const string Manager = "insightdocs:manager";
    public const string Signer = "insightdocs:signer";
    public const string Viewer = "insightdocs:viewer";

    public static readonly string[] DefaultRoles =
    [
        Admin,
        DocumentController,
        Manager,
        Signer,
        Viewer
    ];
}
