using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TekFlow.Api.DTOs.Auth;
using TekFlow.Api.Services;

namespace TekFlow.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (request is null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var result = await _authService.LoginAsync(request);

        if (result is null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var currentUser = await _authService.GetCurrentUserAsync(userId);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        return Ok(currentUser);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (request is null)
        {
            return BadRequest(new { message = "Current password, new password, and confirmation are required." });
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var changed = await _authService.ChangePasswordAsync(userId, request);

            if (!changed)
            {
                return BadRequest(new { message = "Current password is incorrect." });
            }

            return Ok(new { message = "Password changed successfully." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (request is null)
        {
            return Ok(new { message = "If an account exists for this email, password reset instructions have been sent." });
        }

        await _authService.ForgotPasswordAsync(request);

        return Ok(new { message = "If an account exists for this email, password reset instructions have been sent." });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (request is null)
        {
            return BadRequest(new { message = "Password reset link is invalid or has expired." });
        }

        try
        {
            var ok = await _authService.ResetPasswordAsync(request);
            if (!ok)
            {
                return BadRequest(new { message = "Password reset link is invalid or has expired." });
            }

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException)
        {
            return BadRequest(new { message = "Password reset link is invalid or has expired." });
        }
    }
}
