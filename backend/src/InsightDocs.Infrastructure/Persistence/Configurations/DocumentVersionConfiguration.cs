using InsightDocs.Domain.Documents;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InsightDocs.Infrastructure.Persistence.Configurations;

public sealed class DocumentVersionConfiguration : IEntityTypeConfiguration<DocumentVersion>
{
    public void Configure(EntityTypeBuilder<DocumentVersion> builder)
    {
        builder.ToTable("document_versions");

        builder.HasKey(version => version.Id);

        builder.Property(version => version.VersionNumber)
            .IsRequired();

        builder.Property(version => version.OriginalObjectKey)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(version => version.SignedObjectKey)
            .HasMaxLength(500);

        builder.Property(version => version.Checksum)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(version => version.ChangeSummary)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(version => version.CreatedBy)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(version => version.CreatedAt)
            .IsRequired();

        builder.HasIndex(version => new { version.DocumentId, version.VersionNumber })
            .IsUnique();

        builder.HasIndex(version => new { version.DocumentId, version.IsCurrent });
    }
}
