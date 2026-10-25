using TekFlow.Api.Enums;

namespace TekFlow.Api.Entities;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int? ClientId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    public Client? Client { get; set; }
    public ICollection<Invoice> CreatedInvoices { get; set; } = new List<Invoice>();
    public ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();
}
