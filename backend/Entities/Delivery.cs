namespace TekFlow.Api.Entities;

public class Delivery
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public int CourierId { get; set; }
    public DateTime PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public decimal PostalCost { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Invoice Invoice { get; set; } = null!;
    public User Courier { get; set; } = null!;
}
