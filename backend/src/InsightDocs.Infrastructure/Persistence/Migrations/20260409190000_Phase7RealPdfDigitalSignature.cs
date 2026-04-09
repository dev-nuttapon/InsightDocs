using System;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace InsightDocs.Infrastructure.Persistence.Migrations;

[DbContext(typeof(InsightDocsDbContext))]
[Migration("20260409190000_Phase7RealPdfDigitalSignature")]
public partial class Phase7RealPdfDigitalSignature : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "document_signature_requests",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                DocumentVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                SignerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                SigningOrder = table.Column<int>(type: "integer", nullable: false),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                PageNumber = table.Column<int>(type: "integer", nullable: false),
                PositionX = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                PositionY = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                Width = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                Height = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                SignedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                Comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                LatestSignedObjectKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_document_signature_requests", x => x.Id);
                table.ForeignKey(
                    name: "FK_document_signature_requests_documents_DocumentId",
                    column: x => x.DocumentId,
                    principalTable: "documents",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_document_signature_requests_document_versions_DocumentVersionId",
                    column: x => x.DocumentVersionId,
                    principalTable: "document_versions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_document_signature_requests_users_SignerUserId",
                    column: x => x.SignerUserId,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "document_signature_actions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                DocumentSignatureRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                SignerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                ActionType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                PerformedBy = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                PerformedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                Comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                OutputObjectKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_document_signature_actions", x => x.Id);
                table.ForeignKey(
                    name: "FK_document_signature_actions_document_signature_requests_DocumentSignatureRequestId",
                    column: x => x.DocumentSignatureRequestId,
                    principalTable: "document_signature_requests",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_document_signature_actions_DocumentSignatureRequestId_PerformedAt",
            table: "document_signature_actions",
            columns: new[] { "DocumentSignatureRequestId", "PerformedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_document_signature_requests_DocumentVersionId_SigningOrder",
            table: "document_signature_requests",
            columns: new[] { "DocumentVersionId", "SigningOrder" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_document_signature_requests_SignerUserId_Status",
            table: "document_signature_requests",
            columns: new[] { "SignerUserId", "Status" });

        migrationBuilder.CreateIndex(
            name: "IX_document_signature_requests_DocumentId",
            table: "document_signature_requests",
            column: "DocumentId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "document_signature_actions");
        migrationBuilder.DropTable(name: "document_signature_requests");
    }
}
