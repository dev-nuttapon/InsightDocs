using InsightDocs.Domain.Documents;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InsightDocs.Infrastructure.Persistence.Configurations;

public sealed class DocumentApprovalConfiguration : IEntityTypeConfiguration<DocumentApproval>
{
    public void Configure(EntityTypeBuilder<DocumentApproval> builder)
    {
        builder.ToTable("document_approvals");

        builder.HasKey(approval => approval.Id);

        builder.Property(approval => approval.Action)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(approval => approval.FromStatus)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(approval => approval.ToStatus)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(approval => approval.PerformedBy)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(approval => approval.PerformedAt)
            .IsRequired();

        builder.HasMany(approval => approval.Comments)
            .WithOne(comment => comment.DocumentApproval)
            .HasForeignKey(comment => comment.DocumentApprovalId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(approval => new { approval.DocumentId, approval.PerformedAt });
    }
}
