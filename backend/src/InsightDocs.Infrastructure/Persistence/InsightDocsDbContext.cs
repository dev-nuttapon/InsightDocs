using InsightDocs.Domain.Auth;
using InsightDocs.Domain.Audit;
using InsightDocs.Domain.Documents;
using InsightDocs.Domain.Users;
using InsightDocs.Infrastructure.Persistence.Configurations;
using Microsoft.EntityFrameworkCore;

namespace InsightDocs.Infrastructure.Persistence;

public sealed class InsightDocsDbContext(DbContextOptions<InsightDocsDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<PasswordResetRequest> PasswordResetRequests => Set<PasswordResetRequest>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();
    public DbSet<DocumentApproval> DocumentApprovals => Set<DocumentApproval>();
    public DbSet<ApprovalComment> ApprovalComments => Set<ApprovalComment>();
    public DbSet<DocumentSignatureRequest> DocumentSignatureRequests => Set<DocumentSignatureRequest>();
    public DbSet<DocumentSignatureAction> DocumentSignatureActions => Set<DocumentSignatureAction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new RoleConfiguration());
        modelBuilder.ApplyConfiguration(new UserRoleConfiguration());
        modelBuilder.ApplyConfiguration(new PasswordResetRequestConfiguration());
        modelBuilder.ApplyConfiguration(new AuditLogConfiguration());
        modelBuilder.ApplyConfiguration(new DocumentConfiguration());
        modelBuilder.ApplyConfiguration(new DocumentVersionConfiguration());
        modelBuilder.ApplyConfiguration(new DocumentApprovalConfiguration());
        modelBuilder.ApplyConfiguration(new ApprovalCommentConfiguration());
        modelBuilder.ApplyConfiguration(new DocumentSignatureRequestConfiguration());
        modelBuilder.ApplyConfiguration(new DocumentSignatureActionConfiguration());

        base.OnModelCreating(modelBuilder);
    }
}
