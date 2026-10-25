namespace TekFlow.Api.DTOs.Deliveries;

public class DeliveryResponse
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientAddress { get; set; } = string.Empty;
    public string ClientCity { get; set; } = string.Empty;
    public int CourierId { get; set; }
    public string CourierName { get; set; } = string.Empty;
    public DateTime PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public string InvoiceStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
