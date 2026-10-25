namespace TekFlow.Api.DTOs.Deliveries;

public class AvailableDeliveryResponse
{
    public int InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientAddress { get; set; } = string.Empty;
    public string ClientCity { get; set; } = string.Empty;
    public DateOnly IssueDate { get; set; }
    public decimal Amount { get; set; }
    public string InvoiceStatus { get; set; } = string.Empty;
}
