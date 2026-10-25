using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TekFlow.Api.DTOs.Clients;
using TekFlow.Api.Services;

namespace TekFlow.Api.Controllers;

[ApiController]
[Route("api/clients")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly ClientService _clientService;

    public ClientsController(ClientService clientService)
    {
        _clientService = clientService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<ActionResult<List<ClientResponse>>> GetAll()
    {
        var clients = await _clientService.GetAllAsync();
        return Ok(clients);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<ActionResult<ClientResponse>> GetById(int id)
    {
        var client = await _clientService.GetByIdAsync(id);

        if (client is null)
        {
            return NotFound();
        }

        return Ok(client);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<ActionResult<ClientResponse>> Create([FromBody] CreateClientRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Address) ||
            string.IsNullOrWhiteSpace(request.City) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Name, address, city, email, and password are required.");
        }

        try
        {
            var client = await _clientService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<ActionResult<ClientResponse>> Update(int id, [FromBody] UpdateClientRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Address) ||
            string.IsNullOrWhiteSpace(request.City))
        {
            return BadRequest("Name, address, and city are required.");
        }

        var client = await _clientService.UpdateAsync(id, request);

        if (client is null)
        {
            return NotFound();
        }

        return Ok(client);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _clientService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }
}
