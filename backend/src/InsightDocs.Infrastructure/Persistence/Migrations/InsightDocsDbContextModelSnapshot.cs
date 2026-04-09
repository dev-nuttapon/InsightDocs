using System;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace InsightDocs.Infrastructure.Persistence.Migrations;

[DbContext(typeof(InsightDocsDbContext))]
partial class InsightDocsDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder.HasAnnotation("ProductVersion", "8.0.8");

        modelBuilder.Entity("InsightDocs.Domain.Documents.DocumentSignatureAction", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<string>("ActionType")
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnType("character varying(20)");

            b.Property<string>("Comment")
                .HasMaxLength(1000)
                .HasColumnType("character varying(1000)");

            b.Property<Guid>("DocumentSignatureRequestId")
                .HasColumnType("uuid");

            b.Property<string>("OutputObjectKey")
                .HasMaxLength(500)
                .HasColumnType("character varying(500)");

            b.Property<DateTimeOffset>("PerformedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("PerformedBy")
                .IsRequired()
                .HasMaxLength(150)
                .HasColumnType("character varying(150)");

            b.Property<Guid>("SignerUserId")
                .HasColumnType("uuid");

            b.HasKey("Id");

            b.HasIndex("DocumentSignatureRequestId", "PerformedAt");

            b.ToTable("document_signature_actions", (string)null!);
        });

        modelBuilder.Entity("InsightDocs.Domain.Documents.DocumentSignatureRequest", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<string>("Comment")
                .HasMaxLength(1000)
                .HasColumnType("character varying(1000)");

            b.Property<Guid>("DocumentId")
                .HasColumnType("uuid");

            b.Property<Guid>("DocumentVersionId")
                .HasColumnType("uuid");

            b.Property<decimal>("Height")
                .HasColumnType("numeric(10,2)");

            b.Property<string>("LatestSignedObjectKey")
                .HasMaxLength(500)
                .HasColumnType("character varying(500)");

            b.Property<int>("PageNumber")
                .HasColumnType("integer");

            b.Property<decimal>("PositionX")
                .HasColumnType("numeric(10,2)");

            b.Property<decimal>("PositionY")
                .HasColumnType("numeric(10,2)");

            b.Property<DateTimeOffset?>("SignedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<Guid>("SignerUserId")
                .HasColumnType("uuid");

            b.Property<int>("SigningOrder")
                .HasColumnType("integer");

            b.Property<string>("Status")
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnType("character varying(20)");

            b.Property<decimal>("Width")
                .HasColumnType("numeric(10,2)");

            b.HasKey("Id");

            b.HasIndex("DocumentId");

            b.HasIndex("DocumentVersionId", "SigningOrder")
                .IsUnique();

            b.HasIndex("SignerUserId", "Status");

            b.ToTable("document_signature_requests", (string)null!);
        });

        modelBuilder.Entity("InsightDocs.Domain.Documents.ApprovalComment", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<string>("CommentText")
                .IsRequired()
                .HasMaxLength(1000)
                .HasColumnType("character varying(1000)");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("CreatedBy")
                .IsRequired()
                .HasMaxLength(150)
                .HasColumnType("character varying(150)");

            b.Property<Guid>("DocumentApprovalId")
                .HasColumnType("uuid");

            b.HasKey("Id");

            b.HasIndex("DocumentApprovalId", "CreatedAt");

            b.ToTable("approval_comments", (string)null!);
        });

        modelBuilder.Entity("InsightDocs.Domain.Documents.DocumentApproval", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<string>("Action")
                .IsRequired()
                .HasMaxLength(30)
                .HasColumnType("character varying(30)");

            b.Property<Guid>("DocumentId")
                .HasColumnType("uuid");

            b.Property<string>("FromStatus")
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnType("character varying(20)");

            b.Property<DateTimeOffset>("PerformedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("PerformedBy")
                .IsRequired()
                .HasMaxLength(150)
                .HasColumnType("character varying(150)");

            b.Property<string>("ToStatus")
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnType("character varying(20)");

            b.HasKey("Id");

            b.HasIndex("DocumentId", "PerformedAt");

            b.ToTable("document_approvals", (string)null!);
        });

        modelBuilder.Entity("InsightDocs.Domain.Documents.Document", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<string>("Category")
                .HasMaxLength(100)
                .HasColumnType("character varying(100)");

            b.Property<Guid?>("ControllerUserId")
                .HasColumnType("uuid");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("CreatedBy")
                .IsRequired()
                .HasMaxLength(150)
                .HasColumnType("character varying(150)");

            b.Property<string>("Description")
                .HasMaxLength(2000)
                .HasColumnType("character varying(2000)");

            b.Property<Guid?>("OwnerUserId")
                .HasColumnType("uuid");

            b.Property<string>("Status")
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnType("character varying(20)");

            b.Property<string>("Title")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("character varying(200)");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("UpdatedBy")
                .HasMaxLength(150)
                .HasColumnType("character varying(150)");

            b.HasKey("Id");

            b.HasIndex("Category");

            b.HasIndex("ControllerUserId");

            b.HasIndex("OwnerUserId");

            b.HasIndex("Status");

            b.ToTable("documents", (string)null!);

            b.HasData(
                new
                {
                    Id = Guid.Parse("6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd91"),
                    Category = "Policy",
                    CreatedAt = new DateTimeOffset(2026, 4, 9, 0, 0, 0, TimeSpan.Zero),
                    CreatedBy = "seed",
                    ControllerUserId = (Guid?)null,
                    Description = "Seeded sample document for local version control development.",
                    OwnerUserId = (Guid?)null,
                    Status = "Draft",
                    Title = "Corporate Policy Handbook"
                });
        });

        modelBuilder.Entity("InsightDocs.Domain.Documents.DocumentVersion", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<string>("ChangeSummary")
                .IsRequired()
                .HasMaxLength(1000)
                .HasColumnType("character varying(1000)");

            b.Property<string>("Checksum")
                .IsRequired()
                .HasMaxLength(128)
                .HasColumnType("character varying(128)");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("CreatedBy")
                .IsRequired()
                .HasMaxLength(150)
                .HasColumnType("character varying(150)");

            b.Property<Guid>("DocumentId")
                .HasColumnType("uuid");

            b.Property<bool>("IsCurrent")
                .HasColumnType("boolean");

            b.Property<string>("OriginalObjectKey")
                .IsRequired()
                .HasMaxLength(500)
                .HasColumnType("character varying(500)");

            b.Property<string>("SignedObjectKey")
                .HasMaxLength(500)
                .HasColumnType("character varying(500)");

            b.Property<int>("VersionNumber")
                .HasColumnType("integer");

            b.HasKey("Id");

            b.HasIndex("DocumentId", "IsCurrent");

            b.HasIndex("DocumentId", "VersionNumber")
                .IsUnique();

            b.ToTable("document_versions", (string)null!);
        });

        modelBuilder.Entity("InsightDocs.Domain.Auth.PasswordResetRequest", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<DateTimeOffset?>("CompletedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("RequestedByIdentifier")
                .IsRequired()
                .HasMaxLength(256)
                .HasColumnType("character varying(256)");

            b.Property<DateTimeOffset>("RequestedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("ResetToken")
                .HasMaxLength(256)
                .HasColumnType("character varying(256)");

            b.Property<DateTimeOffset?>("ResetTokenExpiresAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("ResetTokenHash")
                .HasMaxLength(128)
                .HasColumnType("character varying(128)");

            b.Property<string>("ReviewComment")
                .HasMaxLength(500)
                .HasColumnType("character varying(500)");

            b.Property<DateTimeOffset?>("ReviewedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("ReviewedBy")
                .HasMaxLength(100)
                .HasColumnType("character varying(100)");

            b.Property<string>("Status")
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnType("character varying(20)");

            b.Property<Guid>("UserId")
                .HasColumnType("uuid");

            b.HasKey("Id");

            b.HasIndex("ResetTokenHash")
                .IsUnique();

            b.HasIndex("UserId");

            b.ToTable("password_reset_requests", (string)null!);
        });

        modelBuilder.Entity("InsightDocs.Domain.Users.Role", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<string>("Name")
                .IsRequired()
                .HasMaxLength(80)
                .HasColumnType("character varying(80)");

            b.Property<string>("NormalizedName")
                .IsRequired()
                .HasMaxLength(80)
                .HasColumnType("character varying(80)");

            b.HasKey("Id");

            b.HasIndex("Name")
                .IsUnique();

            b.HasIndex("NormalizedName")
                .IsUnique();

            b.ToTable("roles", (string)null!);

            b.HasData(
                new
                {
                    Id = Guid.Parse("1f2b89c4-1b79-4b8e-8f1c-f5d579c16c01"),
                    Name = "Admin",
                    NormalizedName = "ADMIN"
                },
                new
                {
                    Id = Guid.Parse("4ab7e42c-4f6f-4f86-b795-0b9f2c77d202"),
                    Name = "DocumentController",
                    NormalizedName = "DOCUMENTCONTROLLER"
                },
                new
                {
                    Id = Guid.Parse("6925d514-5ec0-44b3-b7fa-2d50b3419303"),
                    Name = "Manager",
                    NormalizedName = "MANAGER"
                },
                new
                {
                    Id = Guid.Parse("7fd5a482-bf42-4284-9e14-b395e7de7f04"),
                    Name = "Signer",
                    NormalizedName = "SIGNER"
                },
                new
                {
                    Id = Guid.Parse("eb88502b-bb9f-40f8-8d65-f3a02ec3c405"),
                    Name = "Viewer",
                    NormalizedName = "VIEWER"
                });
        });

        modelBuilder.Entity("InsightDocs.Domain.Users.User", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<DateTimeOffset?>("ApprovedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("ApprovedBy")
                .HasMaxLength(100)
                .HasColumnType("character varying(100)");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("DisplayName")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("character varying(200)");

            b.Property<string>("Email")
                .IsRequired()
                .HasMaxLength(256)
                .HasColumnType("character varying(256)");

            b.Property<string>("KeycloakUserId")
                .IsRequired()
                .HasMaxLength(128)
                .HasColumnType("character varying(128)");

            b.Property<string>("Status")
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnType("character varying(20)");

            b.Property<string>("Username")
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnType("character varying(100)");

            b.HasKey("Id");

            b.HasIndex("Email")
                .IsUnique();

            b.HasIndex("KeycloakUserId")
                .IsUnique();

            b.HasIndex("Username")
                .IsUnique();

            b.ToTable("users", (string)null!);
        });

        modelBuilder.Entity("InsightDocs.Domain.Users.UserRole", b =>
        {
            b.Property<Guid>("UserId")
                .HasColumnType("uuid");

            b.Property<Guid>("RoleId")
                .HasColumnType("uuid");

            b.HasKey("UserId", "RoleId");

            b.HasIndex("RoleId");

            b.ToTable("user_roles", (string)null!);
        });

        modelBuilder.Entity("InsightDocs.Domain.Users.UserRole", b =>
        {
            b.HasOne("InsightDocs.Domain.Users.Role", "Role")
                .WithMany("UserRoles")
                .HasForeignKey("RoleId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.HasOne("InsightDocs.Domain.Users.User", "User")
                .WithMany("UserRoles")
                .HasForeignKey("UserId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity("InsightDocs.Domain.Auth.PasswordResetRequest", b =>
        {
            b.HasOne("InsightDocs.Domain.Users.User", "User")
                .WithMany()
                .HasForeignKey("UserId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity("InsightDocs.Domain.Documents.ApprovalComment", b =>
        {
            b.HasOne("InsightDocs.Domain.Documents.DocumentApproval", "DocumentApproval")
                .WithMany("Comments")
                .HasForeignKey("DocumentApprovalId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity("InsightDocs.Domain.Documents.DocumentSignatureAction", b =>
        {
            b.HasOne("InsightDocs.Domain.Documents.DocumentSignatureRequest", "DocumentSignatureRequest")
                .WithMany("Actions")
                .HasForeignKey("DocumentSignatureRequestId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity("InsightDocs.Domain.Documents.DocumentSignatureRequest", b =>
        {
            b.HasOne("InsightDocs.Domain.Documents.Document", "Document")
                .WithMany()
                .HasForeignKey("DocumentId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.HasOne("InsightDocs.Domain.Documents.DocumentVersion", "DocumentVersion")
                .WithMany()
                .HasForeignKey("DocumentVersionId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.HasOne("InsightDocs.Domain.Users.User", "SignerUser")
                .WithMany()
                .HasForeignKey("SignerUserId")
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
        });

        modelBuilder.Entity("InsightDocs.Domain.Documents.DocumentApproval", b =>
        {
            b.HasOne("InsightDocs.Domain.Documents.Document", "Document")
                .WithMany("Approvals")
                .HasForeignKey("DocumentId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity("InsightDocs.Domain.Documents.DocumentVersion", b =>
        {
            b.HasOne("InsightDocs.Domain.Documents.Document", "Document")
                .WithMany("Versions")
                .HasForeignKey("DocumentId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity("InsightDocs.Domain.Documents.Document", b =>
        {
            b.HasOne("InsightDocs.Domain.Users.User", "ControllerUser")
                .WithMany()
                .HasForeignKey("ControllerUserId")
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne("InsightDocs.Domain.Users.User", "OwnerUser")
                .WithMany()
                .HasForeignKey("OwnerUserId")
                .OnDelete(DeleteBehavior.Restrict);
        });
#pragma warning restore 612, 618
    }
}
