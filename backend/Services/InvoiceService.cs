using Microsoft.EntityFrameworkCore;
using TekFlow.Api.Data;
using TekFlow.Api.DTOs.Invoices;
using TekFlow.Api.Entities;
using TekFlow.Api.Enums;

namespace TekFlow.Api.Services;

public class InvoiceService
{
    private readonly AppDbContext _context;

    public InvoiceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<InvoiceResponse>> GetAllAsync()
    {
        return await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Client)
            .Include(i => i.CreatedByUser)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvoiceResponse
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                IssueDate = i.IssueDate,
                Amount = i.Amount,
                Status = i.Status.ToString(),
                Description = i.Description,
                ClientId = i.ClientId,
                ClientName = i.Client.Name,
                CreatedBy = i.CreatedBy,
                CreatedByName = i.CreatedByUser.FullName,
                ClientComment = i.ClientComment,
                AcceptedAt = i.AcceptedAt,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<InvoiceResponse?> GetByIdAsync(int id)
    {
        return await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Client)
            .Include(i => i.CreatedByUser)
            .Where(i => i.Id == id)
            .Select(i => new InvoiceResponse
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                IssueDate = i.IssueDate,
                Amount = i.Amount,
                Status = i.Status.ToString(),
                Description = i.Description,
                ClientId = i.ClientId,
                ClientName = i.Client.Name,
                CreatedBy = i.CreatedBy,
                CreatedByName = i.CreatedByUser.FullName,
                ClientComment = i.ClientComment,
                AcceptedAt = i.AcceptedAt,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<InvoiceResponse?> GetForClientAsync(int invoiceId, int clientUserId)
    {
        return await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Client)
            .Include(i => i.CreatedByUser)
            .Where(i => i.Id == invoiceId && i.ClientId == clientUserId)
            .Select(i => new InvoiceResponse
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                IssueDate = i.IssueDate,
                Amount = i.Amount,
                Status = i.Status.ToString(),
                Description = i.Description,
                ClientId = i.ClientId,
                ClientName = i.Client.Name,
                CreatedBy = i.CreatedBy,
                CreatedByName = i.CreatedByUser.FullName,
                ClientComment = i.ClientComment,
                AcceptedAt = i.AcceptedAt,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<List<InvoiceResponse>> GetMyInvoicesAsync(int clientUserId, InvoiceStatus? status = null)
    {
        var query = _context.Invoices
            .AsNoTracking()
            .Include(i => i.Client)
            .Include(i => i.CreatedByUser)
            .Where(i => i.ClientId == clientUserId)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(i => i.Status == status.Value);
        }

        return await query
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvoiceResponse
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                IssueDate = i.IssueDate,
                Amount = i.Amount,
                Status = i.Status.ToString(),
                Description = i.Description,
                ClientId = i.ClientId,
                ClientName = i.Client.Name,
                CreatedBy = i.CreatedBy,
                CreatedByName = i.CreatedByUser.FullName,
                ClientComment = i.ClientComment,
                AcceptedAt = i.AcceptedAt,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<Invoice> CreateAsync(CreateInvoiceRequest request, int createdByUserId)
    {
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (request.ClientId <= 0)
        {
            throw new ArgumentException("ClientId is required.");
        }

        var clientExists = await _context.Clients.AnyAsync(c => c.Id == request.ClientId);
        if (!clientExists)
        {
            throw new KeyNotFoundException("Client does not exist.");
        }

        var invoice = new Invoice
        {
            InvoiceNumber = request.InvoiceNumber,
            IssueDate = request.IssueDate,
            Amount = request.Amount,
            Status = InvoiceStatus.Created,
            Description = request.Description,
            ClientId = request.ClientId,
            CreatedBy = createdByUserId,
            ClientComment = null,
            AcceptedAt = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();
        return invoice;
    }

    public async Task<InvoiceResponse> UpdateAsync(int id, UpdateInvoiceRequest request)
    {
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var invoice = await _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.CreatedByUser)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice is null)
        {
            throw new KeyNotFoundException("Invoice does not exist.");
        }

        if (invoice.Status != InvoiceStatus.Created)
        {
            throw new InvalidOperationException("Invoice can only be edited while it is in Created status.");
        }

        invoice.InvoiceNumber = request.InvoiceNumber;
        invoice.IssueDate = request.IssueDate;
        invoice.Amount = request.Amount;
        invoice.Description = request.Description;

        if (request.ClientId <= 0)
        {
            throw new ArgumentException("ClientId is required.");
        }

        var clientExists = await _context.Clients.AnyAsync(c => c.Id == request.ClientId);
        if (!clientExists)
        {
            throw new KeyNotFoundException("Client does not exist.");
        }

        invoice.ClientId = request.ClientId;
        invoice.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new InvoiceResponse
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            IssueDate = invoice.IssueDate,
            Amount = invoice.Amount,
            Status = invoice.Status.ToString(),
            Description = invoice.Description,
            ClientId = invoice.ClientId,
            ClientName = invoice.Client.Name,
            CreatedBy = invoice.CreatedBy,
            CreatedByName = invoice.CreatedByUser.FullName,
            ClientComment = invoice.ClientComment,
            AcceptedAt = invoice.AcceptedAt,
            CreatedAt = invoice.CreatedAt,
            UpdatedAt = invoice.UpdatedAt
        };
    }

    public async Task<InvoiceResponse?> RespondAsync(int invoiceId, int clientUserId, ClientInvoiceResponseRequest request)
    {
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var invoice = await _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.CreatedByUser)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice is null)
        {
            throw new KeyNotFoundException("Invoice does not exist.");
        }

        if (invoice.ClientId != clientUserId)
        {
            throw new UnauthorizedAccessException("You do not own this invoice.");
        }

        if (invoice.Status != InvoiceStatus.Delivered)
        {
            throw new InvalidOperationException("Client response is only allowed when the invoice is in Delivered status.");
        }

        if (invoice.ClientComment is not null || invoice.AcceptedAt.HasValue)
        {
            throw new InvalidOperationException("This invoice has already been responded to by the client.");
        }

        if (request.Decision == InvoiceDecision.Accepted)
        {
            invoice.Status = InvoiceStatus.Accepted;
        }
        else if (request.Decision == InvoiceDecision.PartiallyAccepted)
        {
            invoice.Status = InvoiceStatus.PartiallyAccepted;
        }
        else if (request.Decision == InvoiceDecision.Rejected)
        {
            invoice.Status = InvoiceStatus.Rejected;
        }
        else
        {
            throw new ArgumentException("Invalid response decision.");
        }

        invoice.ClientComment = request.Comment;
        invoice.AcceptedAt = DateTime.UtcNow;
        invoice.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new InvoiceResponse
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            IssueDate = invoice.IssueDate,
            Amount = invoice.Amount,
            Status = invoice.Status.ToString(),
            Description = invoice.Description,
            ClientId = invoice.ClientId,
            ClientName = invoice.Client.Name,
            CreatedBy = invoice.CreatedBy,
            CreatedByName = invoice.CreatedByUser.FullName,
            ClientComment = invoice.ClientComment,
            AcceptedAt = invoice.AcceptedAt,
            CreatedAt = invoice.CreatedAt,
            UpdatedAt = invoice.UpdatedAt
        };
    }

    public async Task DeleteAsync(int id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Delivery)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice is null)
        {
            throw new KeyNotFoundException("Invoice does not exist.");
        }

        if (invoice.Status != InvoiceStatus.Created)
        {
            throw new InvalidOperationException("Invoice can only be deleted while it is in Created status.");
        }

        if (invoice.Delivery is not null)
        {
            throw new InvalidOperationException("Invoice cannot be deleted after the delivery workflow has started.");
        }

        _context.Invoices.Remove(invoice);
        await _context.SaveChangesAsync();
    }
}
