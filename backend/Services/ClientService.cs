using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TekFlow.Api.Data;
using TekFlow.Api.DTOs.Clients;
using TekFlow.Api.Entities;
using TekFlow.Api.Enums;

namespace TekFlow.Api.Services;

public class ClientService
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher;

    public ClientService(AppDbContext context, PasswordHasher<User> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<List<ClientResponse>> GetAllAsync()
    {
        return await _context.Clients
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new ClientResponse
            {
                Id = x.Id,
                Name = x.Name,
                Address = x.Address,
                City = x.City,
                ContactName = x.ContactName,
                Phone = x.Phone,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ClientResponse?> GetByIdAsync(int id)
    {
        return await _context.Clients
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new ClientResponse
            {
                Id = x.Id,
                Name = x.Name,
                Address = x.Address,
                City = x.City,
                ContactName = x.ContactName,
                Phone = x.Phone,
                CreatedAt = x.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ClientResponse> CreateAsync(CreateClientRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Address) ||
            string.IsNullOrWhiteSpace(request.City) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Name, address, city, email, and password are required.");
        }

        var trimmedEmail = request.Email.Trim();
        var normalizedEmail = trimmedEmail.ToLowerInvariant();

        if (await _context.Users.AnyAsync(x => x.Email.ToLower() == normalizedEmail))
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var client = new Client
        {
            Name = request.Name.Trim(),
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            ContactName = string.IsNullOrWhiteSpace(request.ContactName) ? null : request.ContactName.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var userFullName = !string.IsNullOrWhiteSpace(request.ContactName)
            ? request.ContactName.Trim()
            : client.Name;

        var user = new User
        {
            FullName = userFullName,
            Email = normalizedEmail,
            PasswordHash = string.Empty,
            Role = UserRole.Client,
            ClientId = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        using var transaction = await _context.Database.BeginTransactionAsync();

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        user.ClientId = client.Id;
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password.Trim());

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await transaction.CommitAsync();

        return new ClientResponse
        {
            Id = client.Id,
            Name = client.Name,
            Address = client.Address,
            City = client.City,
            ContactName = client.ContactName,
            Phone = client.Phone,
            CreatedAt = client.CreatedAt
        };
    }

    public async Task<ClientResponse?> UpdateAsync(int id, UpdateClientRequest request)
    {
        var client = await _context.Clients.FirstOrDefaultAsync(x => x.Id == id);

        if (client is null)
        {
            return null;
        }

        client.Name = request.Name.Trim();
        client.Address = request.Address.Trim();
        client.City = request.City.Trim();
        client.ContactName = string.IsNullOrWhiteSpace(request.ContactName) ? null : request.ContactName.Trim();
        client.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();

        await _context.SaveChangesAsync();

        return new ClientResponse
        {
            Id = client.Id,
            Name = client.Name,
            Address = client.Address,
            City = client.City,
            ContactName = client.ContactName,
            Phone = client.Phone,
            CreatedAt = client.CreatedAt
        };
    }

    public async Task DeleteAsync(int id)
    {
        var client = await _context.Clients
            .Include(x => x.Invoices)
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (client is null)
        {
            throw new KeyNotFoundException("Client does not exist.");
        }

        if (client.Invoices.Any())
        {
            throw new InvalidOperationException("Client cannot be deleted because invoices are linked to it.");
        }

        var linkedUser = await _context.Users.FirstOrDefaultAsync(x => x.ClientId == id);

        using var transaction = await _context.Database.BeginTransactionAsync();

        if (linkedUser is not null)
        {
            _context.Users.Remove(linkedUser);
        }

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();

        await transaction.CommitAsync();
    }
}
