using InsightDocs.Domain.Audit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InsightDocs.Infrastructure.Persistence.Configurations;

internal sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");

        builder.HasKey(auditLog => auditLog.Id);

        builder.Property(auditLog => auditLog.Action)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(auditLog => auditLog.EntityType)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(auditLog => auditLog.MetadataJson)
            .HasColumnType("jsonb");

        builder.Property(auditLog => auditLog.Timestamp)
            .IsRequired();

        builder.HasIndex(auditLog => auditLog.Timestamp);
        builder.HasIndex(auditLog => auditLog.ActorUserId);
        builder.HasIndex(auditLog => auditLog.Action);
        builder.HasIndex(auditLog => auditLog.RelatedDocumentId);

        builder.HasOne(auditLog => auditLog.ActorUser)
            .WithMany()
            .HasForeignKey(auditLog => auditLog.ActorUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
