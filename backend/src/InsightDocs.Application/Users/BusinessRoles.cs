namespace InsightDocs.Application.Users;

public static class BusinessRoles
{
    public const string Admin = "Admin";
    public const string DocumentController = "DocumentController";
    public const string Manager = "Manager";
    public const string Signer = "Signer";
    public const string Viewer = "Viewer";

    public static readonly string[] DefaultRoles =
    [
        Admin,
        DocumentController,
        Manager,
        Signer,
        Viewer
    ];
}
