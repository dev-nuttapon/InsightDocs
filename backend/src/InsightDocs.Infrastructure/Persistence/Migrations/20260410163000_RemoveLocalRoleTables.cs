using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightDocs.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(InsightDocsDbContext))]
    [Migration("20260410163000_RemoveLocalRoleTables")]
    public partial class RemoveLocalRoleTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_roles");

            migrationBuilder.DropTable(
                name: "roles");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "Id", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { new Guid("1f2b89c4-1b79-4b8e-8f1c-f5d579c16c01"), "insightdocs:admin", "INSIGHTDOCS:ADMIN" },
                    { new Guid("4ab7e42c-4f6f-4f86-b795-0b9f2c77d202"), "insightdocs:document_controller", "INSIGHTDOCS:DOCUMENT_CONTROLLER" },
                    { new Guid("6925d514-5ec0-44b3-b7fa-2d50b3419303"), "insightdocs:manager", "INSIGHTDOCS:MANAGER" },
                    { new Guid("7fd5a482-bf42-4284-9e14-b395e7de7f04"), "insightdocs:signer", "INSIGHTDOCS:SIGNER" },
                    { new Guid("eb88502b-bb9f-40f8-8d65-f3a02ec3c405"), "insightdocs:viewer", "INSIGHTDOCS:VIEWER" }
                });
        }
    }
}
