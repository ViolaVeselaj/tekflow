namespace TekFlow.Api.DTOs.Invoices;

public class ClientInvoiceResponseRequest
{
    public InvoiceDecision Decision { get; set; }
    public string? Comment { get; set; }
}
