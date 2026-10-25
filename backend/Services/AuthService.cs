using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TekFlow.Api.Data;
using TekFlow.Api.DTOs.Auth;
using TekFlow.Api.Entities;

namespace TekFlow.Api.Services;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext context,
        PasswordHasher<User> passwordHasher,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<AuthService> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        var email = request.Email.Trim();
        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Email.ToLower() == email.ToLower());

        if (user is null || !user.IsActive)
        {
            return null;
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return null;
        }

        var token = GenerateJwtToken(user);

        return new LoginResponse
        {
            Token = token,
            User = new CurrentUserResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                ClientId = user.ClientId
            }
        };
    }

    public async Task<CurrentUserResponse?> GetCurrentUserAsync(int userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == userId && x.IsActive);

        if (user is null)
        {
            return null;
        }

        return new CurrentUserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            ClientId = user.ClientId
        };
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        if (request is null)
        {
            return false;
        }

        var currentPassword = request.CurrentPassword?.Trim();
        var newPassword = request.NewPassword?.Trim();
        var confirmNewPassword = request.ConfirmNewPassword?.Trim();

        if (string.IsNullOrWhiteSpace(currentPassword))
        {
            throw new ArgumentException("Current password is required.");
        }

        if (string.IsNullOrWhiteSpace(newPassword))
        {
            throw new ArgumentException("New password is required.");
        }

        if (string.IsNullOrWhiteSpace(confirmNewPassword))
        {
            throw new ArgumentException("New password confirmation is required.");
        }

        if (!string.Equals(newPassword, confirmNewPassword, StringComparison.Ordinal))
        {
            throw new ArgumentException("New password and confirmation do not match.");
        }

        if (string.Equals(currentPassword, newPassword, StringComparison.Ordinal))
        {
            throw new ArgumentException("New password must be different from the current password.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Id == userId && x.IsActive);

        if (user is null)
        {
            return false;
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, currentPassword);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedAccessException("Current password is incorrect.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Email))
        {
            return;
        }

        var email = request.Email.Trim();
        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Email.ToLower() == email.ToLower() && x.IsActive);

        if (user is null)
        {
            return;
        }

        var existingTokens = await _context.PasswordResetTokens
            .Where(x => x.UserId == user.Id && x.UsedAt == null && x.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        foreach (var token in existingTokens)
        {
            token.UsedAt = DateTime.UtcNow;
        }

        var rawToken = GenerateSecureToken();
        var tokenHash = HashToken(rawToken);
        var now = DateTime.UtcNow;

        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(30),
            UsedAt = null
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync();

        var resetUrl = $"{_configuration["Frontend:BaseUrl"] ?? "http://localhost:5173"}/reset-password?token={Uri.EscapeDataString(rawToken)}";

        if (_environment.IsDevelopment())
        {
            _logger.LogInformation("DEV PASSWORD RESET LINK: {ResetUrl}", resetUrl);
        }
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        if (request is null)
        {
            return false;
        }

        var token = request.Token?.Trim();
        var newPassword = request.NewPassword?.Trim();
        var confirmNewPassword = request.ConfirmNewPassword?.Trim();

        if (string.IsNullOrWhiteSpace(token))
        {
            throw new ArgumentException("Password reset link is invalid or has expired.");
        }

        if (string.IsNullOrWhiteSpace(newPassword))
        {
            throw new ArgumentException("New password is required.");
        }

        if (string.IsNullOrWhiteSpace(confirmNewPassword))
        {
            throw new ArgumentException("New password is required.");
        }

        if (!string.Equals(newPassword, confirmNewPassword, StringComparison.Ordinal))
        {
            throw new ArgumentException("New password and confirmation do not match.");
        }

        var tokenHash = HashToken(token);
        var resetToken = await _context.PasswordResetTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash && x.UsedAt == null && x.ExpiresAt > DateTime.UtcNow);

        if (resetToken is null)
        {
            throw new InvalidOperationException("Password reset link is invalid or has expired.");
        }

        var user = resetToken.User;
        if (user is null || !user.IsActive)
        {
            throw new InvalidOperationException("Password reset link is invalid or has expired.");
        }

        if (string.Equals(user.PasswordHash, _passwordHasher.HashPassword(user, newPassword), StringComparison.Ordinal))
        {
            throw new ArgumentException("New password must be different from the current password.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
        resetToken.UsedAt = DateTime.UtcNow;

        var otherActiveTokens = await _context.PasswordResetTokens
            .Where(x => x.UserId == user.Id && x.Id != resetToken.Id && x.UsedAt == null && x.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        foreach (var otherToken in otherActiveTokens)
        {
            otherToken.UsedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public static string HashToken(string rawToken)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(rawToken);
        var hashBytes = sha256.ComputeHash(bytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    public static string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "change-me-please-tekflow-dev-key";
        var issuer = _configuration["Jwt:Issuer"] ?? "tekflow";
        var audience = _configuration["Jwt:Audience"] ?? "tekflow-clients";

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        if (user.ClientId.HasValue)
        {
            claims.Add(new Claim("clientId", user.ClientId.Value.ToString()));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
