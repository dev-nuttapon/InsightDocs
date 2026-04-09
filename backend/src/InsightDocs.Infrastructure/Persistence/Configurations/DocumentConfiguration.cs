using InsightDocs.Domain.Documents;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InsightDocs.Infrastructure.Persistence.Configurations;

public sealed class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("documents");

        builder.HasKey(document => document.Id);

        builder.Property(document => document.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(document => document.Description)
            .HasMaxLength(2000);

        builder.Property(document => document.Category)
            .HasMaxLength(100);

        builder.Property(document => document.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(document => document.CreatedBy)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(document => document.UpdatedBy)
            .HasMaxLength(150);

        builder.Property(document => document.CreatedAt)
            .IsRequired();

        builder.HasIndex(document => document.Category);
        builder.HasIndex(document => document.OwnerUserId);
        builder.HasIndex(document => document.ControllerUserId);
        builder.HasIndex(document => document.Status);

        builder.HasMany(document => document.Versions)
            .WithOne(version => version.Document)
            .HasForeignKey(version => version.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(document => document.OwnerUser)
            .WithMany()
            .HasForeignKey(document => document.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(document => document.ControllerUser)
            .WithMany()
            .HasForeignKey(document => document.ControllerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(document => document.Approvals)
            .WithOne(approval => approval.Document)
            .HasForeignKey(approval => approval.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasData(new DocumentSeed
        {
            Id = DocumentSeedIds.SampleDocument,
            Title = "Corporate Policy Handbook",
            Description = "Seeded sample document for local version control development.",
            Category = "Policy",
            Status = DocumentStatus.Draft,
            CreatedBy = "seed",
            CreatedAt = new DateTimeOffset(2026, 4, 9, 0, 0, 0, TimeSpan.Zero)
        });
    }

    private sealed class DocumentSeed
    {
        public Guid Id { get; init; }
        public string Title { get; init; } = string.Empty;
        public string? Description { get; init; }
        public string? Category { get; init; }
        public Guid? OwnerUserId { get; init; }
        public Guid? ControllerUserId { get; init; }
        public DocumentStatus Status { get; init; }
        public string CreatedBy { get; init; } = string.Empty;
        public DateTimeOffset CreatedAt { get; init; }
        public string? UpdatedBy { get; init; }
        public DateTimeOffset? UpdatedAt { get; init; }
    }
}

public static class DocumentSeedIds
{
    public static readonly Guid SampleDocument = Guid.Parse("6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd91");
}
