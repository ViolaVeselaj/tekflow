namespace TekFlow.Api.DTOs.Invoices;

public class UpdateInvoiceRequest
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateOnly IssueDate { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public int ClientId { get; set; }
}
