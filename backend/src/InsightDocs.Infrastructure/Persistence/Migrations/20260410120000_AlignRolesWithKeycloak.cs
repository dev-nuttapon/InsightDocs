using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace InsightDocs.Infrastructure.Persistence.Migrations;

[DbContext(typeof(InsightDocsDbContext))]
[Migration("20260410120000_AlignRolesWithKeycloak")]
public partial class AlignRolesWithKeycloak : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        UpdateRole(migrationBuilder, "1f2b89c4-1b79-4b8e-8f1c-f5d579c16c01", "insightdocs:admin", "INSIGHTDOCS:ADMIN");
        UpdateRole(migrationBuilder, "4ab7e42c-4f6f-4f86-b795-0b9f2c77d202", "insightdocs:document_controller", "INSIGHTDOCS:DOCUMENT_CONTROLLER");
        UpdateRole(migrationBuilder, "6925d514-5ec0-44b3-b7fa-2d50b3419303", "insightdocs:manager", "INSIGHTDOCS:MANAGER");
        UpdateRole(migrationBuilder, "7fd5a482-bf42-4284-9e14-b395e7de7f04", "insightdocs:signer", "INSIGHTDOCS:SIGNER");
        UpdateRole(migrationBuilder, "eb88502b-bb9f-40f8-8d65-f3a02ec3c405", "insightdocs:viewer", "INSIGHTDOCS:VIEWER");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        UpdateRole(migrationBuilder, "1f2b89c4-1b79-4b8e-8f1c-f5d579c16c01", "Admin", "ADMIN");
        UpdateRole(migrationBuilder, "4ab7e42c-4f6f-4f86-b795-0b9f2c77d202", "DocumentController", "DOCUMENTCONTROLLER");
        UpdateRole(migrationBuilder, "6925d514-5ec0-44b3-b7fa-2d50b3419303", "Manager", "MANAGER");
        UpdateRole(migrationBuilder, "7fd5a482-bf42-4284-9e14-b395e7de7f04", "Signer", "SIGNER");
        UpdateRole(migrationBuilder, "eb88502b-bb9f-40f8-8d65-f3a02ec3c405", "Viewer", "VIEWER");
    }

    private static void UpdateRole(MigrationBuilder migrationBuilder, string id, string name, string normalizedName)
    {
        migrationBuilder.Sql($"""
            UPDATE roles
            SET "Name" = '{name}', "NormalizedName" = '{normalizedName}'
            WHERE "Id" = '{id}';
            """);
    }
}
