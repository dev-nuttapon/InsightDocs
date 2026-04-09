using System;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace InsightDocs.Infrastructure.Persistence.Migrations;

[DbContext(typeof(InsightDocsDbContext))]
[Migration("20260409223000_Phase9AuditLog")]
public partial class Phase9AuditLog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "audit_logs",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ActorUserId = table.Column<Guid>(type: "uuid", nullable: true),
                Action = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                EntityType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                EntityId = table.Column<Guid>(type: "uuid", nullable: true),
                RelatedDocumentId = table.Column<Guid>(type: "uuid", nullable: true),
                RelatedVersionId = table.Column<Guid>(type: "uuid", nullable: true),
                Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                MetadataJson = table.Column<string>(type: "jsonb", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_audit_logs", x => x.Id);
                table.ForeignKey(
                    name: "FK_audit_logs_users_ActorUserId",
                    column: x => x.ActorUserId,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_audit_logs_Action",
            table: "audit_logs",
            column: "Action");

        migrationBuilder.CreateIndex(
            name: "IX_audit_logs_ActorUserId",
            table: "audit_logs",
            column: "ActorUserId");

        migrationBuilder.CreateIndex(
            name: "IX_audit_logs_RelatedDocumentId",
            table: "audit_logs",
            column: "RelatedDocumentId");

        migrationBuilder.CreateIndex(
            name: "IX_audit_logs_Timestamp",
            table: "audit_logs",
            column: "Timestamp");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "audit_logs");
    }
}
