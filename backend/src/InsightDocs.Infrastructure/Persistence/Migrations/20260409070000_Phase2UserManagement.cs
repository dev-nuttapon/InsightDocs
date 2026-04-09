using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace InsightDocs.Infrastructure.Persistence.Migrations;

[DbContext(typeof(InsightDocsDbContext))]
[Migration("20260409070000_Phase2UserManagement")]
public partial class Phase2UserManagement : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "roles",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                NormalizedName = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_roles", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "users",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                KeycloakUserId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ApprovedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                ApprovedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_users", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "user_roles",
            columns: table => new
            {
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                RoleId = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_user_roles", x => new { x.UserId, x.RoleId });
                table.ForeignKey(
                    name: "FK_user_roles_roles_RoleId",
                    column: x => x.RoleId,
                    principalTable: "roles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_user_roles_users_UserId",
                    column: x => x.UserId,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.InsertData(
            table: "roles",
            columns: ["Id", "Name", "NormalizedName"],
            columnTypes: ["uuid", "character varying(80)", "character varying(80)"],
            values: new object[,]
            {
                { Guid.Parse("1f2b89c4-1b79-4b8e-8f1c-f5d579c16c01"), "Admin", "ADMIN" },
                { Guid.Parse("4ab7e42c-4f6f-4f86-b795-0b9f2c77d202"), "DocumentController", "DOCUMENTCONTROLLER" },
                { Guid.Parse("6925d514-5ec0-44b3-b7fa-2d50b3419303"), "Manager", "MANAGER" },
                { Guid.Parse("7fd5a482-bf42-4284-9e14-b395e7de7f04"), "Signer", "SIGNER" },
                { Guid.Parse("eb88502b-bb9f-40f8-8d65-f3a02ec3c405"), "Viewer", "VIEWER" }
            });

        migrationBuilder.CreateIndex(
            name: "IX_roles_Name",
            table: "roles",
            column: "Name",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_roles_NormalizedName",
            table: "roles",
            column: "NormalizedName",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_user_roles_RoleId",
            table: "user_roles",
            column: "RoleId");

        migrationBuilder.CreateIndex(
            name: "IX_users_Email",
            table: "users",
            column: "Email",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_users_KeycloakUserId",
            table: "users",
            column: "KeycloakUserId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_users_Username",
            table: "users",
            column: "Username",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "user_roles");
        migrationBuilder.DropTable(name: "roles");
        migrationBuilder.DropTable(name: "users");
    }
}
