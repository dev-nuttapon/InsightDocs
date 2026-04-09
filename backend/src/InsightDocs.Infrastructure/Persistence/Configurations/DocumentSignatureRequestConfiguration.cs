using InsightDocs.Domain.Documents;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InsightDocs.Infrastructure.Persistence.Configurations;

public sealed class DocumentSignatureRequestConfiguration : IEntityTypeConfiguration<DocumentSignatureRequest>
{
    public void Configure(EntityTypeBuilder<DocumentSignatureRequest> builder)
    {
        builder.ToTable("document_signature_requests");

        builder.HasKey(request => request.Id);

        builder.Property(request => request.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(request => request.Comment)
            .HasMaxLength(1000);

        builder.Property(request => request.LatestSignedObjectKey)
            .HasMaxLength(500);

        builder.Property(request => request.PositionX)
            .HasColumnType("numeric(10,2)");

        builder.Property(request => request.PositionY)
            .HasColumnType("numeric(10,2)");

        builder.Property(request => request.Width)
            .HasColumnType("numeric(10,2)");

        builder.Property(request => request.Height)
            .HasColumnType("numeric(10,2)");

        builder.HasIndex(request => new { request.DocumentVersionId, request.SigningOrder })
            .IsUnique();

        builder.HasIndex(request => new { request.SignerUserId, request.Status });

        builder.HasOne(request => request.Document)
            .WithMany()
            .HasForeignKey(request => request.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(request => request.DocumentVersion)
            .WithMany()
            .HasForeignKey(request => request.DocumentVersionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(request => request.SignerUser)
            .WithMany()
            .HasForeignKey(request => request.SignerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(request => request.Actions)
            .WithOne(action => action.DocumentSignatureRequest)
            .HasForeignKey(action => action.DocumentSignatureRequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
