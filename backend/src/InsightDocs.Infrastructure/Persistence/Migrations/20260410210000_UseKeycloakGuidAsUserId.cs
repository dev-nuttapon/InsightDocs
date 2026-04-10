using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightDocs.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(InsightDocsDbContext))]
    [Migration("20260410210000_UseKeycloakGuidAsUserId")]
    public partial class UseKeycloakGuidAsUserId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE users
                SET "KeycloakUserId" = "Id"::text
                WHERE "KeycloakUserId" IS NULL
                   OR "KeycloakUserId" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_audit_logs_users_ActorUserId",
                table: "audit_logs");

            migrationBuilder.DropForeignKey(
                name: "FK_document_signature_requests_users_SignerUserId",
                table: "document_signature_requests");

            migrationBuilder.DropForeignKey(
                name: "FK_documents_users_ControllerUserId",
                table: "documents");

            migrationBuilder.DropForeignKey(
                name: "FK_documents_users_OwnerUserId",
                table: "documents");

            migrationBuilder.DropForeignKey(
                name: "FK_password_reset_requests_users_UserId",
                table: "password_reset_requests");

            migrationBuilder.Sql(
                """
                UPDATE audit_logs AS target
                SET "ActorUserId" = source."KeycloakUserId"::uuid
                FROM users AS source
                WHERE target."ActorUserId" = source."Id";

                UPDATE document_signature_requests AS target
                SET "SignerUserId" = source."KeycloakUserId"::uuid
                FROM users AS source
                WHERE target."SignerUserId" = source."Id";

                UPDATE documents AS target
                SET "OwnerUserId" = source."KeycloakUserId"::uuid
                FROM users AS source
                WHERE target."OwnerUserId" = source."Id";

                UPDATE documents AS target
                SET "ControllerUserId" = source."KeycloakUserId"::uuid
                FROM users AS source
                WHERE target."ControllerUserId" = source."Id";

                UPDATE password_reset_requests AS target
                SET "UserId" = source."KeycloakUserId"::uuid
                FROM users AS source
                WHERE target."UserId" = source."Id";

                UPDATE users
                SET "Id" = "KeycloakUserId"::uuid;
                """);

            migrationBuilder.DropIndex(
                name: "IX_users_KeycloakUserId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "KeycloakUserId",
                table: "users");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_logs_users_ActorUserId",
                table: "audit_logs",
                column: "ActorUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_document_signature_requests_users_SignerUserId",
                table: "document_signature_requests",
                column: "SignerUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_documents_users_ControllerUserId",
                table: "documents",
                column: "ControllerUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_documents_users_OwnerUserId",
                table: "documents",
                column: "OwnerUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_password_reset_requests_users_UserId",
                table: "password_reset_requests",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_audit_logs_users_ActorUserId",
                table: "audit_logs");

            migrationBuilder.DropForeignKey(
                name: "FK_document_signature_requests_users_SignerUserId",
                table: "document_signature_requests");

            migrationBuilder.DropForeignKey(
                name: "FK_documents_users_ControllerUserId",
                table: "documents");

            migrationBuilder.DropForeignKey(
                name: "FK_documents_users_OwnerUserId",
                table: "documents");

            migrationBuilder.DropForeignKey(
                name: "FK_password_reset_requests_users_UserId",
                table: "password_reset_requests");

            migrationBuilder.AddColumn<string>(
                name: "KeycloakUserId",
                table: "users",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(
                """
                UPDATE users
                SET "KeycloakUserId" = "Id"::text;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_users_KeycloakUserId",
                table: "users",
                column: "KeycloakUserId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_audit_logs_users_ActorUserId",
                table: "audit_logs",
                column: "ActorUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_document_signature_requests_users_SignerUserId",
                table: "document_signature_requests",
                column: "SignerUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_documents_users_ControllerUserId",
                table: "documents",
                column: "ControllerUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_documents_users_OwnerUserId",
                table: "documents",
                column: "OwnerUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_password_reset_requests_users_UserId",
                table: "password_reset_requests",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
