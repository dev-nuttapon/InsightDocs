using InsightDocs.Domain.Documents;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InsightDocs.Infrastructure.Persistence.Configurations;

public sealed class DocumentSignatureActionConfiguration : IEntityTypeConfiguration<DocumentSignatureAction>
{
    public void Configure(EntityTypeBuilder<DocumentSignatureAction> builder)
    {
        builder.ToTable("document_signature_actions");

        builder.HasKey(action => action.Id);

        builder.Property(action => action.ActionType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(action => action.PerformedBy)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(action => action.Comment)
            .HasMaxLength(1000);

        builder.Property(action => action.OutputObjectKey)
            .HasMaxLength(500);

        builder.HasIndex(action => new { action.DocumentSignatureRequestId, action.PerformedAt });
    }
}
