using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TekFlow.Api.DTOs.Deliveries;
using TekFlow.Api.Services;

namespace TekFlow.Api.Controllers;

[ApiController]
[Route("api/deliveries")]
[Authorize]
public class DeliveriesController : ControllerBase
{
    private readonly DeliveryService _deliveryService;

    public DeliveriesController(DeliveryService deliveryService)
    {
        _deliveryService = deliveryService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Courier")]
    public async Task<ActionResult<List<DeliveryResponse>>> GetAll()
    {
        var isAdmin = User.IsInRole("Admin");
        var currentUserId = GetCurrentUserId();

        if (!isAdmin && !currentUserId.HasValue)
        {
            return Unauthorized();
        }

        if (isAdmin)
        {
            var adminDeliveries = await _deliveryService.GetAllAdminAsync();
            return Ok(adminDeliveries);
        }

        var courierDeliveries = await _deliveryService.GetAllAsync(currentUserId, isAdmin);
        return Ok(courierDeliveries);
    }

    [HttpGet("available")]
    [Authorize(Roles = "Courier")]
    public async Task<ActionResult<List<AvailableDeliveryResponse>>> GetAvailable()
    {
        var available = await _deliveryService.GetAvailableAsync();
        return Ok(available);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Courier")]
    public async Task<ActionResult<DeliveryResponse>> GetById(int id)
    {
        var isAdmin = User.IsInRole("Admin");
        var currentUserId = GetCurrentUserId();

        if (!isAdmin && !currentUserId.HasValue)
        {
            return Unauthorized();
        }

        if (isAdmin)
        {
            var adminDelivery = await _deliveryService.GetAdminByIdAsync(id);
            if (adminDelivery is null)
            {
                return NotFound();
            }

            return Ok(adminDelivery);
        }

        var delivery = await _deliveryService.GetByIdAsync(id, currentUserId, false);
        if (delivery is null)
        {
            return NotFound();
        }

        return Ok(delivery);
    }

    [HttpPost("pickup")]
    [Authorize(Roles = "Courier")]
    public async Task<ActionResult<DeliveryResponse>> Pickup([FromBody] PickupDeliveryRequest request)
    {
        if (request is null)
        {
            return BadRequest("Pickup request is required.");
        }

        if (request.InvoiceId <= 0)
        {
            return BadRequest("InvoiceId is required.");
        }

        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var delivery = await _deliveryService.PickupAsync(request, currentUserId.Value);
            return CreatedAtAction(nameof(GetById), new { id = delivery.Id }, delivery);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not available for pickup", StringComparison.OrdinalIgnoreCase) ||
                ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(ex.Message);
            }

            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:int}/deliver")]
    [Authorize(Roles = "Courier")]
    public async Task<ActionResult<DeliveryResponse>> MarkDelivered(int id)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var delivery = await _deliveryService.MarkDeliveredAsync(id, currentUserId.Value);
            if (delivery is null)
            {
                return NotFound();
            }

            return Ok(delivery);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
