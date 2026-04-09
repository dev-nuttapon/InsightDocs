using System;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace InsightDocs.Infrastructure.Persistence.Migrations;

[DbContext(typeof(InsightDocsDbContext))]
[Migration("20260409210000_Phase8SearchAndRetrieval")]
public partial class Phase8SearchAndRetrieval : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Category",
            table: "documents",
            type: "character varying(100)",
            maxLength: 100,
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "ControllerUserId",
            table: "documents",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "OwnerUserId",
            table: "documents",
            type: "uuid",
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE documents
            SET "Category" = 'Policy'
            WHERE "Id" = '6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd91';
            """);

        migrationBuilder.CreateIndex(
            name: "IX_documents_Category",
            table: "documents",
            column: "Category");

        migrationBuilder.CreateIndex(
            name: "IX_documents_ControllerUserId",
            table: "documents",
            column: "ControllerUserId");

        migrationBuilder.CreateIndex(
            name: "IX_documents_OwnerUserId",
            table: "documents",
            column: "OwnerUserId");

        migrationBuilder.CreateIndex(
            name: "IX_documents_Status",
            table: "documents",
            column: "Status");

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

        migrationBuilder.Sql("""
            CREATE INDEX IF NOT EXISTS "IX_documents_search_vector"
            ON documents
            USING GIN (to_tsvector('english', coalesce("Title", '') || ' ' || coalesce("Description", '') || ' ' || coalesce("Category", '')));
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_documents_search_vector";""");

        migrationBuilder.DropForeignKey(
            name: "FK_documents_users_ControllerUserId",
            table: "documents");

        migrationBuilder.DropForeignKey(
            name: "FK_documents_users_OwnerUserId",
            table: "documents");

        migrationBuilder.DropIndex(
            name: "IX_documents_Category",
            table: "documents");

        migrationBuilder.DropIndex(
            name: "IX_documents_ControllerUserId",
            table: "documents");

        migrationBuilder.DropIndex(
            name: "IX_documents_OwnerUserId",
            table: "documents");

        migrationBuilder.DropIndex(
            name: "IX_documents_Status",
            table: "documents");

        migrationBuilder.DropColumn(
            name: "Category",
            table: "documents");

        migrationBuilder.DropColumn(
            name: "ControllerUserId",
            table: "documents");

        migrationBuilder.DropColumn(
            name: "OwnerUserId",
            table: "documents");
    }
}
