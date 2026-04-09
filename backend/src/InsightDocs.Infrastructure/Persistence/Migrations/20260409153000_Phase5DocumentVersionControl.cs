using System;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace InsightDocs.Infrastructure.Persistence.Migrations;

[DbContext(typeof(InsightDocsDbContext))]
[Migration("20260409153000_Phase5DocumentVersionControl")]
public partial class Phase5DocumentVersionControl : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "documents",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                CreatedBy = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedBy = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_documents", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "document_versions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                VersionNumber = table.Column<int>(type: "integer", nullable: false),
                OriginalObjectKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                SignedObjectKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                Checksum = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                ChangeSummary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                CreatedBy = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                IsCurrent = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_document_versions", x => x.Id);
                table.ForeignKey(
                    name: "FK_document_versions_documents_DocumentId",
                    column: x => x.DocumentId,
                    principalTable: "documents",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.Sql("""
            INSERT INTO documents ("Id", "Title", "Description", "CreatedBy", "CreatedAt")
            VALUES ('6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd91', 'Corporate Policy Handbook', 'Seeded sample document for local version control development.', 'seed', TIMESTAMPTZ '2026-04-09 00:00:00+00')
            ON CONFLICT ("Id") DO NOTHING;
            """);

        migrationBuilder.CreateIndex(
            name: "IX_document_versions_DocumentId_IsCurrent",
            table: "document_versions",
            columns: ["DocumentId", "IsCurrent"]);

        migrationBuilder.CreateIndex(
            name: "IX_document_versions_DocumentId_VersionNumber",
            table: "document_versions",
            columns: ["DocumentId", "VersionNumber"],
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "document_versions");
        migrationBuilder.DropTable(name: "documents");
    }
}
