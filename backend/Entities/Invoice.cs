using TekFlow.Api.Enums;

namespace TekFlow.Api.Entities;

public class Invoice
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public DateOnly IssueDate { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Created;
    public string? ClientComment { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Client Client { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public Delivery? Delivery { get; set; }
}
