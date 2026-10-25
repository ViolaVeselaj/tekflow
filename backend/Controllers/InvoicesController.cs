using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TekFlow.Api.DTOs.Invoices;
using TekFlow.Api.Enums;
using TekFlow.Api.Services;

namespace TekFlow.Api.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly InvoiceService _invoiceService;
    private readonly ExportService _exportService;

    public InvoicesController(InvoiceService invoiceService, ExportService exportService)
    {
        _invoiceService = invoiceService;
        _exportService = exportService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<ActionResult<List<InvoiceResponse>>> GetAll()
    {
        var invoices = await _invoiceService.GetAllAsync();
        return Ok(invoices);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Client")]
    public async Task<ActionResult<List<InvoiceResponse>>> GetMyInvoices([FromQuery] string? status)
    {
        var clientIdClaim = User.FindFirst("clientId");
        if (!int.TryParse(clientIdClaim?.Value, out var clientId))
        {
            return Unauthorized();
        }

        InvoiceStatus? invoiceStatus = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<InvoiceStatus>(status, true, out var parsedStatus))
            {
                return BadRequest("Invalid invoice status.");
            }

            invoiceStatus = parsedStatus;
        }

        var invoices = await _invoiceService.GetMyInvoicesAsync(clientId, invoiceStatus);
        return Ok(invoices);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Finance,Client")]
    public async Task<ActionResult<InvoiceResponse>> GetById(int id)
    {
        var invoice = await _invoiceService.GetByIdAsync(id);

        if (invoice is null)
        {
            return NotFound();
        }

        if (User.IsInRole("Client"))
        {
            var clientIdClaim = User.FindFirst("clientId");
            if (!int.TryParse(clientIdClaim?.Value, out var clientId))
            {
                return Unauthorized();
            }

            if (invoice.ClientId != clientId)
            {
                return Forbid();
            }
        }

        return Ok(invoice);
    }

    [HttpPost("{id:int}/response")]
    [Authorize(Roles = "Client")]
    public async Task<ActionResult<InvoiceResponse>> Respond(int id, [FromBody] ClientInvoiceResponseRequest request)
    {
        if (request is null)
        {
            return BadRequest("Response payload is required.");
        }

        var clientIdClaim = User.FindFirst("clientId");
        if (!int.TryParse(clientIdClaim?.Value, out var clientId))
        {
            return Unauthorized();
        }

        try
        {
            var invoice = await _invoiceService.RespondAsync(id, clientId, request);
            if (invoice is null)
            {
                return NotFound();
            }

            return Ok(invoice);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("does not belong to this client", StringComparison.OrdinalIgnoreCase) ||
                ex.Message.Contains("not owned by the current client", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            if (ex.Message.Contains("not in Delivered status", StringComparison.OrdinalIgnoreCase) ||
                ex.Message.Contains("already responded", StringComparison.OrdinalIgnoreCase))
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

    [HttpPost]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<ActionResult<InvoiceResponse>> Create([FromBody] CreateInvoiceRequest request)
    {
        if (request is null)
        {
            return BadRequest("Invoice payload is required.");
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.InvoiceNumber))
        {
            return BadRequest("InvoiceNumber is required.");
        }

        if (request.ClientId <= 0)
        {
            return BadRequest("ClientId is required.");
        }

        if (request.Amount <= 0)
        {
            return BadRequest("Amount must be greater than 0.");
        }

        try
        {
            var invoice = await _invoiceService.CreateAsync(request, currentUserId);
            return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, invoice);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Client does not exist") || ex.Message.Contains("InvoiceNumber must be unique"))
        {
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<ActionResult<InvoiceResponse>> Update(int id, [FromBody] UpdateInvoiceRequest request)
    {
        if (request is null)
        {
            return BadRequest("Invoice payload is required.");
        }

        if (string.IsNullOrWhiteSpace(request.InvoiceNumber))
        {
            return BadRequest("InvoiceNumber is required.");
        }

        if (request.ClientId <= 0)
        {
            return BadRequest("ClientId is required.");
        }

        if (request.Amount <= 0)
        {
            return BadRequest("Amount must be greater than 0.");
        }

        try
        {
            var invoice = await _invoiceService.UpdateAsync(id, request);

            if (invoice is null)
            {
                return NotFound();
            }

            return Ok(invoice);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Invoice can only be edited while it is in Created status.", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(ex.Message);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Client does not exist") || ex.Message.Contains("InvoiceNumber must be unique"))
        {
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _invoiceService.DeleteAsync(id);
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

    [HttpGet("{id:int}/pdf")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<IActionResult> ExportPdf(int id)
    {
        var invoice = await _exportService.GetInvoiceForExportAsync(id);
        if (invoice is null)
        {
            return NotFound();
        }

        var pdfBytes = await _exportService.GeneratePdfAsync(id);
        return File(pdfBytes, "application/pdf", $"Invoice-{invoice.InvoiceNumber}.pdf");
    }

    [HttpGet("{id:int}/excel")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<IActionResult> ExportExcel(int id)
    {
        var invoice = await _exportService.GetInvoiceForExportAsync(id);
        if (invoice is null)
        {
            return NotFound();
        }

        var excelBytes = await _exportService.GenerateExcelAsync(id);
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Invoice-{invoice.InvoiceNumber}.xlsx");
    }
}
