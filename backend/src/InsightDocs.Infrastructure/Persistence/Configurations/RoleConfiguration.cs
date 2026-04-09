using InsightDocs.Application.Users;
using InsightDocs.Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InsightDocs.Infrastructure.Persistence.Configurations;

internal sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    private static readonly Role[] SeedRoles =
    [
        new(RoleIds.Admin, BusinessRoles.Admin),
        new(RoleIds.DocumentController, BusinessRoles.DocumentController),
        new(RoleIds.Manager, BusinessRoles.Manager),
        new(RoleIds.Signer, BusinessRoles.Signer),
        new(RoleIds.Viewer, BusinessRoles.Viewer)
    ];

    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("roles");

        builder.HasKey(role => role.Id);

        builder.Property(role => role.Name)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(role => role.NormalizedName)
            .HasMaxLength(80)
            .IsRequired();

        builder.HasIndex(role => role.Name)
            .IsUnique();

        builder.HasIndex(role => role.NormalizedName)
            .IsUnique();

        builder.HasData(SeedRoles);
    }
}

internal static class RoleIds
{
    public static readonly Guid Admin = Guid.Parse("1f2b89c4-1b79-4b8e-8f1c-f5d579c16c01");
    public static readonly Guid DocumentController = Guid.Parse("4ab7e42c-4f6f-4f86-b795-0b9f2c77d202");
    public static readonly Guid Manager = Guid.Parse("6925d514-5ec0-44b3-b7fa-2d50b3419303");
    public static readonly Guid Signer = Guid.Parse("7fd5a482-bf42-4284-9e14-b395e7de7f04");
    public static readonly Guid Viewer = Guid.Parse("eb88502b-bb9f-40f8-8d65-f3a02ec3c405");
}
