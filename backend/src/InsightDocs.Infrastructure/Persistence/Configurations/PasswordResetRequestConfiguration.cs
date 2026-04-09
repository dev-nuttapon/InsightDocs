using InsightDocs.Domain.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InsightDocs.Infrastructure.Persistence.Configurations;

internal sealed class PasswordResetRequestConfiguration : IEntityTypeConfiguration<PasswordResetRequest>
{
    public void Configure(EntityTypeBuilder<PasswordResetRequest> builder)
    {
        builder.ToTable("password_reset_requests");

        builder.HasKey(request => request.Id);

        builder.Property(request => request.RequestedByIdentifier)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(request => request.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(request => request.ReviewedBy)
            .HasMaxLength(100);

        builder.Property(request => request.ReviewComment)
            .HasMaxLength(500);

        builder.Property(request => request.ResetToken)
            .HasMaxLength(256);

        builder.Property(request => request.ResetTokenHash)
            .HasMaxLength(128);

        builder.HasIndex(request => request.ResetTokenHash)
            .IsUnique();

        builder.HasOne(request => request.User)
            .WithMany()
            .HasForeignKey(request => request.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
