using InsightDocs.Domain.Documents;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InsightDocs.Infrastructure.Persistence.Configurations;

public sealed class ApprovalCommentConfiguration : IEntityTypeConfiguration<ApprovalComment>
{
    public void Configure(EntityTypeBuilder<ApprovalComment> builder)
    {
        builder.ToTable("approval_comments");

        builder.HasKey(comment => comment.Id);

        builder.Property(comment => comment.CommentText)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(comment => comment.CreatedBy)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(comment => comment.CreatedAt)
            .IsRequired();

        builder.HasIndex(comment => new { comment.DocumentApprovalId, comment.CreatedAt });
    }
}
