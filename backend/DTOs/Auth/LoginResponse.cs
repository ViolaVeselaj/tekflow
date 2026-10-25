namespace TekFlow.Api.DTOs.Auth;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public CurrentUserResponse User { get; set; } = new();
}
