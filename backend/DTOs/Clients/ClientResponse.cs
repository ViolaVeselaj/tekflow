namespace TekFlow.Api.DTOs.Clients;

public class ClientResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? ContactName { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; }
}
