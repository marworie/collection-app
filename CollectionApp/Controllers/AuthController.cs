using CollectionApp.Dtos;
using CollectionApp.Models;
using CollectionApp.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

// Giriş yap / kayıt ol / profil güncelle işlerini yöneten controller

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthController(UserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            // aynı kullanıcı adı alınmış mı kontrol et
            var existing = await _userRepository.GetByUsernameAsync(dto.Username);
            if (existing != null)
            {
                return BadRequest(new { message = "Bu kullanıcı adı zaten alınmış" });
            }

            var user = new User
            {
                Username = dto.Username.Trim(),
                // şifreyi hash'liyoruz, düz metin saklamıyoruz
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            int newId = await _userRepository.AddAsync(user);
            return Ok(new { message = "Kullanıcı oluşturuldu", id = newId });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _userRepository.GetByUsernameAsync(dto.Username);

            // Kullanıcı yoksa da şifre yanlışsa da aynı mesaj:
            // saldırgan hangi kullanıcı adlarının var olduğunu öğrenemesin
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Kullanıcı adı veya şifre hatalı" });
            }

            string token = GenerateJwtToken(user);
            return Ok(new { message = "Giriş başarılı", username = user.Username, avatarKey = user.AvatarKey, token });
        }

        // Artık sadece giriş yapmış kullanıcı, sadece KENDİ profilini güncelleyebilir
        [Authorize]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            // Kim olduğunu body'den değil token'dan okuyoruz → başkası adına işlem yapılamaz
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı" });
            }

            if (!string.IsNullOrWhiteSpace(dto.NewUsername) && dto.NewUsername != user.Username)
            {
                // yeni kullanıcı adı başkasında var mı
                var taken = await _userRepository.GetByUsernameAsync(dto.NewUsername);
                if (taken != null)
                {
                    return BadRequest(new { message = "Bu kullanıcı adı zaten alınmış" });
                }
                await _userRepository.UpdateUsernameAsync(user.Id, dto.NewUsername.Trim());
            }

            if (!string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                string newHashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                await _userRepository.UpdatePasswordAsync(user.Id, newHashedPassword);
            }

            if (!string.IsNullOrWhiteSpace(dto.NewAvatarKey))
            {
                await _userRepository.UpdateAvatarAsync(user.Id, dto.NewAvatarKey);
            }

            // yeni değer gelmemişse eski değeri döndürüyoruz
            string finalUsername = !string.IsNullOrWhiteSpace(dto.NewUsername) ? dto.NewUsername : user.Username;
            string finalAvatarKey = !string.IsNullOrWhiteSpace(dto.NewAvatarKey) ? dto.NewAvatarKey : user.AvatarKey;

            return Ok(new { message = "Profil güncellendi", username = finalUsername, avatarKey = finalAvatarKey });
        }

        // Kullanıcı bilgilerinden imzalı bir JWT bileti üretir
        private string GenerateJwtToken(User user)
        {
            var jwtSecret = _configuration["JwtSecret"]
                ?? throw new InvalidOperationException("JwtSecret bulunamadı");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Claim: token'ın içine gömülen, "bu bilet kime ait" bilgisi
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username)
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),   // bilet 7 gün geçerli
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}