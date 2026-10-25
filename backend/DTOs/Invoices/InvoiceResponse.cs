namespace TekFlow.Api.DTOs.Invoices;

public class InvoiceResponse
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateOnly IssueDate { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public int CreatedBy { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public string? ClientComment { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
