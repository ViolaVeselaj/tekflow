namespace TekFlow.Api.DTOs.Clients;

public class UpdateClientRequest
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? ContactName { get; set; }
    public string? Phone { get; set; }
}
