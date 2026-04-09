using System;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace InsightDocs.Infrastructure.Persistence.Migrations;

[DbContext(typeof(InsightDocsDbContext))]
[Migration("20260409170000_Phase6ApprovalWorkflow")]
public partial class Phase6ApprovalWorkflow : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Status",
            table: "documents",
            type: "character varying(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "Draft");

        migrationBuilder.CreateTable(
            name: "document_approvals",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                Action = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                FromStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                ToStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                PerformedBy = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                PerformedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_document_approvals", x => x.Id);
                table.ForeignKey(
                    name: "FK_document_approvals_documents_DocumentId",
                    column: x => x.DocumentId,
                    principalTable: "documents",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "approval_comments",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                DocumentApprovalId = table.Column<Guid>(type: "uuid", nullable: false),
                CommentText = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                CreatedBy = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_approval_comments", x => x.Id);
                table.ForeignKey(
                    name: "FK_approval_comments_document_approvals_DocumentApprovalId",
                    column: x => x.DocumentApprovalId,
                    principalTable: "document_approvals",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.Sql("""
            UPDATE documents
            SET "Status" = 'Draft'
            WHERE "Id" = '6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd91';
            """);

        migrationBuilder.CreateIndex(
            name: "IX_approval_comments_DocumentApprovalId_CreatedAt",
            table: "approval_comments",
            columns: new[] { "DocumentApprovalId", "CreatedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_document_approvals_DocumentId_PerformedAt",
            table: "document_approvals",
            columns: new[] { "DocumentId", "PerformedAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "approval_comments");
        migrationBuilder.DropTable(name: "document_approvals");
        migrationBuilder.DropColumn(name: "Status", table: "documents");
    }
}
