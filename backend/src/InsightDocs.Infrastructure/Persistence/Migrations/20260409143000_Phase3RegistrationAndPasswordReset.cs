using System;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace InsightDocs.Infrastructure.Persistence.Migrations;

[DbContext(typeof(InsightDocsDbContext))]
[Migration("20260409143000_Phase3RegistrationAndPasswordReset")]
public partial class Phase3RegistrationAndPasswordReset : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "password_reset_requests",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                RequestedByIdentifier = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                RequestedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                ReviewedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                ReviewComment = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                ResetToken = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                ResetTokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                ResetTokenExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_password_reset_requests", x => x.Id);
                table.ForeignKey(
                    name: "FK_password_reset_requests_users_UserId",
                    column: x => x.UserId,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_password_reset_requests_ResetTokenHash",
            table: "password_reset_requests",
            column: "ResetTokenHash",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_password_reset_requests_UserId",
            table: "password_reset_requests",
            column: "UserId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "password_reset_requests");
    }
}
