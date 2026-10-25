using Microsoft.EntityFrameworkCore;
using TekFlow.Api.Entities;

namespace TekFlow.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Delivery> Deliveries => Set<Delivery>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");

            entity.HasKey(x => x.Id);
            entity.Property(x => x.FullName).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(150).IsRequired();
            entity.Property(x => x.PasswordHash).IsRequired();
            entity.Property(x => x.Role).HasConversion<int>();
            entity.Property(x => x.IsActive).HasDefaultValue(true);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(x => x.Email).IsUnique();

            entity.HasOne(x => x.Client)
                .WithOne(x => x.User)
                .HasForeignKey<User>(x => x.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(x => x.CreatedInvoices)
                .WithOne(x => x.CreatedByUser)
                .HasForeignKey(x => x.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(x => x.Deliveries)
                .WithOne(x => x.Courier)
                .HasForeignKey(x => x.CourierId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(x => x.PasswordResetTokens)
                .WithOne(x => x.User)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Client>(entity =>
        {
            entity.ToTable("Clients");

            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Address).HasMaxLength(250).IsRequired();
            entity.Property(x => x.City).HasMaxLength(100).IsRequired();
            entity.Property(x => x.ContactName).HasMaxLength(150);
            entity.Property(x => x.Phone).HasMaxLength(50);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.ToTable("Invoices");

            entity.HasKey(x => x.Id);
            entity.Property(x => x.InvoiceNumber).HasMaxLength(50).IsRequired();
            entity.Property(x => x.IssueDate).IsRequired();
            entity.Property(x => x.Amount).HasColumnType("numeric(12,2)").IsRequired();
            entity.Property(x => x.Description);
            entity.Property(x => x.Status).HasDefaultValue(Enums.InvoiceStatus.Created).HasConversion<int>();
            entity.Property(x => x.ClientComment);
            entity.Property(x => x.AcceptedAt);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(x => x.InvoiceNumber).IsUnique();

            entity.HasOne(x => x.Client)
                .WithMany(x => x.Invoices)
                .HasForeignKey(x => x.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.CreatedByUser)
                .WithMany(x => x.CreatedInvoices)
                .HasForeignKey(x => x.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Delivery>(entity =>
        {
            entity.ToTable("Deliveries");

            entity.HasKey(x => x.Id);
            entity.Property(x => x.InvoiceId).IsRequired();
            entity.Property(x => x.CourierId).IsRequired();
            entity.Property(x => x.PickedUpAt).IsRequired();
            entity.Property(x => x.DeliveredAt);
            entity.Property(x => x.PostalCost).HasColumnType("numeric(10,2)").IsRequired();
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(x => x.InvoiceId).IsUnique();

            entity.HasOne(x => x.Invoice)
                .WithOne(x => x.Delivery)
                .HasForeignKey<Delivery>(x => x.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Courier)
                .WithMany(x => x.Deliveries)
                .HasForeignKey(x => x.CourierId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.ToTable("PasswordResetTokens");

            entity.HasKey(x => x.Id);
            entity.Property(x => x.TokenHash).IsRequired();
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.ExpiresAt).IsRequired();
            entity.Property(x => x.UsedAt);

            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.HasIndex(x => x.UserId);
        });
    }
}
