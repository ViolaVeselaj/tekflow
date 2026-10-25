using Microsoft.EntityFrameworkCore;
using TekFlow.Api.Data;
using TekFlow.Api.DTOs.Deliveries;
using TekFlow.Api.Entities;
using TekFlow.Api.Enums;

namespace TekFlow.Api.Services;

public class DeliveryService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public DeliveryService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<List<DeliveryResponse>> GetAllAsync(int? currentUserId = null, bool isAdmin = false)
    {
        var query = _context.Deliveries
            .AsNoTracking()
            .Include(x => x.Invoice)
            .Include(x => x.Courier)
            .Include(x => x.Invoice.Client)
            .AsQueryable();

        if (!isAdmin && currentUserId.HasValue)
        {
            query = query.Where(x => x.CourierId == currentUserId.Value);
        }

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new DeliveryResponse
            {
                Id = x.Id,
                InvoiceId = x.InvoiceId,
                InvoiceNumber = x.Invoice.InvoiceNumber,
                ClientId = x.Invoice.ClientId,
                ClientName = x.Invoice.Client.Name,
                ClientAddress = x.Invoice.Client.Address,
                ClientCity = x.Invoice.Client.City,
                CourierId = x.CourierId,
                CourierName = x.Courier.FullName,
                PickedUpAt = x.PickedUpAt,
                DeliveredAt = x.DeliveredAt,
                InvoiceStatus = x.Invoice.Status.ToString(),
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<List<AvailableDeliveryResponse>> GetAvailableAsync()
    {
        return await _context.Invoices
            .AsNoTracking()
            .Include(x => x.Client)
            .Where(x => x.Status == InvoiceStatus.Created)
            .Where(x => x.Delivery == null)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new AvailableDeliveryResponse
            {
                InvoiceId = x.Id,
                InvoiceNumber = x.InvoiceNumber,
                ClientId = x.ClientId,
                ClientName = x.Client.Name,
                ClientAddress = x.Client.Address,
                ClientCity = x.Client.City,
                IssueDate = x.IssueDate,
                Amount = x.Amount,
                InvoiceStatus = x.Status.ToString()
            })
            .ToListAsync();
    }

    public async Task<DeliveryResponse?> GetByIdAsync(int id, int? currentUserId = null, bool isAdmin = false)
    {
        var query = _context.Deliveries
            .AsNoTracking()
            .Include(x => x.Invoice)
            .Include(x => x.Courier)
            .Include(x => x.Invoice.Client)
            .Where(x => x.Id == id)
            .AsQueryable();

        if (!isAdmin && currentUserId.HasValue)
        {
            query = query.Where(x => x.CourierId == currentUserId.Value);
        }

        return await query
            .Select(x => new DeliveryResponse
            {
                Id = x.Id,
                InvoiceId = x.InvoiceId,
                InvoiceNumber = x.Invoice.InvoiceNumber,
                ClientId = x.Invoice.ClientId,
                ClientName = x.Invoice.Client.Name,
                ClientAddress = x.Invoice.Client.Address,
                ClientCity = x.Invoice.Client.City,
                CourierId = x.CourierId,
                CourierName = x.Courier.FullName,
                PickedUpAt = x.PickedUpAt,
                DeliveredAt = x.DeliveredAt,
                InvoiceStatus = x.Invoice.Status.ToString(),
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<AdminDeliveryResponse?> GetAdminByIdAsync(int id)
    {
        return await _context.Deliveries
            .AsNoTracking()
            .Include(x => x.Invoice)
            .Include(x => x.Courier)
            .Include(x => x.Invoice.Client)
            .Where(x => x.Id == id)
            .Select(x => new AdminDeliveryResponse
            {
                Id = x.Id,
                InvoiceId = x.InvoiceId,
                InvoiceNumber = x.Invoice.InvoiceNumber,
                ClientId = x.Invoice.ClientId,
                ClientName = x.Invoice.Client.Name,
                ClientAddress = x.Invoice.Client.Address,
                ClientCity = x.Invoice.Client.City,
                CourierId = x.CourierId,
                CourierName = x.Courier.FullName,
                PickedUpAt = x.PickedUpAt,
                DeliveredAt = x.DeliveredAt,
                InvoiceStatus = x.Invoice.Status.ToString(),
                PostalCost = x.PostalCost,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<DeliveryResponse> PickupAsync(PickupDeliveryRequest request, int courierUserId)
    {
        if (request.InvoiceId <= 0)
        {
            throw new ArgumentException("InvoiceId is required.");
        }

        var courier = await _context.Users.FirstOrDefaultAsync(x => x.Id == courierUserId && x.IsActive);
        if (courier is null)
        {
            throw new UnauthorizedAccessException("Courier is not authorized.");
        }

        if (courier.Role != UserRole.Courier)
        {
            throw new UnauthorizedAccessException("Only courier users can pick up invoices.");
        }

        var invoice = await _context.Invoices
            .Include(x => x.Client)
            .FirstOrDefaultAsync(x => x.Id == request.InvoiceId);

        if (invoice is null)
        {
            throw new KeyNotFoundException("Invoice does not exist.");
        }

        if (invoice.Status != InvoiceStatus.Created)
        {
            throw new InvalidOperationException("Invoice is not available for pickup.");
        }

        var existingDelivery = await _context.Deliveries.AnyAsync(x => x.InvoiceId == request.InvoiceId);
        if (existingDelivery)
        {
            throw new InvalidOperationException("A delivery for this invoice already exists.");
        }

        var fixedPostalCost = GetPostalCost();
        var now = DateTime.UtcNow;

        var delivery = new Delivery
        {
            InvoiceId = invoice.Id,
            CourierId = courierUserId,
            PickedUpAt = now,
            DeliveredAt = null,
            PostalCost = fixedPostalCost,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Deliveries.Add(delivery);

        invoice.Status = InvoiceStatus.PickedUp;
        invoice.UpdatedAt = now;

        await _context.SaveChangesAsync();

        return new DeliveryResponse
        {
            Id = delivery.Id,
            InvoiceId = delivery.InvoiceId,
            InvoiceNumber = invoice.InvoiceNumber,
            ClientId = invoice.ClientId,
            ClientName = invoice.Client.Name,
            ClientAddress = invoice.Client.Address,
            ClientCity = invoice.Client.City,
            CourierId = delivery.CourierId,
            CourierName = courier.FullName,
            PickedUpAt = delivery.PickedUpAt,
            DeliveredAt = delivery.DeliveredAt,
            InvoiceStatus = invoice.Status.ToString(),
            CreatedAt = delivery.CreatedAt,
            UpdatedAt = delivery.UpdatedAt
        };
    }

    public async Task<DeliveryResponse?> MarkDeliveredAsync(int deliveryId, int courierUserId)
    {
        var delivery = await _context.Deliveries
            .Include(x => x.Courier)
            .Include(x => x.Invoice)
            .ThenInclude(x => x.Client)
            .FirstOrDefaultAsync(x => x.Id == deliveryId);

        if (delivery is null)
        {
            return null;
        }

        if (delivery.CourierId != courierUserId)
        {
            throw new UnauthorizedAccessException("This courier does not own this delivery.");
        }

        if (delivery.DeliveredAt.HasValue)
        {
            throw new InvalidOperationException("This delivery has already been marked as delivered.");
        }

        if (delivery.Invoice.Status != InvoiceStatus.PickedUp)
        {
            throw new InvalidOperationException("Delivery can only be completed from PickedUp status.");
        }

        var now = DateTime.UtcNow;
        delivery.DeliveredAt = now;
        delivery.UpdatedAt = now;

        delivery.Invoice.Status = InvoiceStatus.Delivered;
        delivery.Invoice.UpdatedAt = now;

        await _context.SaveChangesAsync();

        return new DeliveryResponse
        {
            Id = delivery.Id,
            InvoiceId = delivery.InvoiceId,
            InvoiceNumber = delivery.Invoice.InvoiceNumber,
            ClientId = delivery.Invoice.ClientId,
            ClientName = delivery.Invoice.Client.Name,
            ClientAddress = delivery.Invoice.Client.Address,
            ClientCity = delivery.Invoice.Client.City,
            CourierId = delivery.CourierId,
            CourierName = delivery.Courier.FullName,
            PickedUpAt = delivery.PickedUpAt,
            DeliveredAt = delivery.DeliveredAt,
            InvoiceStatus = delivery.Invoice.Status.ToString(),
            CreatedAt = delivery.CreatedAt,
            UpdatedAt = delivery.UpdatedAt
        };
    }

    public async Task<List<AdminDeliveryResponse>> GetAllAdminAsync()
    {
        return await _context.Deliveries
            .AsNoTracking()
            .Include(x => x.Invoice)
            .Include(x => x.Courier)
            .Include(x => x.Invoice.Client)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new AdminDeliveryResponse
            {
                Id = x.Id,
                InvoiceId = x.InvoiceId,
                InvoiceNumber = x.Invoice.InvoiceNumber,
                ClientId = x.Invoice.ClientId,
                ClientName = x.Invoice.Client.Name,
                ClientAddress = x.Invoice.Client.Address,
                ClientCity = x.Invoice.Client.City,
                CourierId = x.CourierId,
                CourierName = x.Courier.FullName,
                PickedUpAt = x.PickedUpAt,
                DeliveredAt = x.DeliveredAt,
                InvoiceStatus = x.Invoice.Status.ToString(),
                PostalCost = x.PostalCost,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();
    }

    private decimal GetPostalCost()
    {
        return _configuration.GetValue<decimal>("DeliverySettings:PostalCost");
    }
}
