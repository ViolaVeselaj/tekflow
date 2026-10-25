using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TekFlow.Api.Entities;
using TekFlow.Api.Enums;

namespace TekFlow.Api.Data;

public class DbSeeder
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher;

    public DbSeeder(AppDbContext context, PasswordHasher<User> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task SeedAsync()
    {
        var seedUsers = new[]
        {
            new { FullName = "TekFlow Admin", Email = "admin@tekflow.local", Role = UserRole.Admin },
            new { FullName = "TekFlow Courier", Email = "courier@tekflow.local", Role = UserRole.Courier },
            new { FullName = "TekFlow Finance", Email = "finance@tekflow.local", Role = UserRole.Finance }
        };

        foreach (var seedUser in seedUsers)
        {
            var normalizedEmail = seedUser.Email.Trim();
            var userExists = await _context.Users.AnyAsync(x => x.Email.ToLower() == normalizedEmail.ToLower());

            if (userExists)
            {
                continue;
            }

            var user = new User
            {
                FullName = seedUser.FullName,
                Email = normalizedEmail,
                Role = seedUser.Role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, "TekFlow123!");

            await _context.Users.AddAsync(user);
        }

        await _context.SaveChangesAsync();
    }
}
