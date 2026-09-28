using CollectionApp.Models;
using CollectionApp.Repositories;
using Microsoft.AspNetCore.Mvc;

// Giriş yap / kayıt ol / profil güncelle işlerini yöneten controller

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserRepository _userRepository;

        public AuthController(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            // aynı kullanıcı adı alınmış mı kontrol et
            var existing = await _userRepository.GetByUsernameAsync(user.Username);
            if (existing != null)
            {
                return BadRequest(new { message = "Bu kullanıcı adı zaten alınmış" });
            }

            // şifreyi hash'liyoruz, düz metin saklamıyoruz
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);

            int newId = await _userRepository.AddAsync(user);
            return Ok(new { message = "Kullanıcı oluşturuldu", id = newId });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] User loginRequest)
        {
            var user = await _userRepository.GetByUsernameAsync(loginRequest.Username);

            if (user == null)
            {
                return Unauthorized(new { message = "Kullanıcı adı veya şifre hatalı" });
            }

            // girilen düz şifreyi, veritabanındaki hash ile karşılaştırıyoruz
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginRequest.PasswordHash, user.PasswordHash);

            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "Kullanıcı adı veya şifre hatalı" });
            }

            // avatarKey'i de cevaba ekliyoruz ki frontend localStorage'a kaydedebilsin
            return Ok(new { message = "Giriş başarılı", username = user.Username, avatarKey = user.AvatarKey });
        }

        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var user = await _userRepository.GetByUsernameAsync(request.CurrentUsername);

            if (user == null)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı" });
            }

            // her alan (kullanıcı adı/şifre/avatar) sadece gönderilmişse güncelleniyor
            if (!string.IsNullOrWhiteSpace(request.NewUsername) && request.NewUsername != user.Username)
            {
                await _userRepository.UpdateUsernameAsync(user.Id, request.NewUsername);
            }

            if (!string.IsNullOrWhiteSpace(request.NewPassword))
            {
                string newHashedPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _userRepository.UpdatePasswordAsync(user.Id, newHashedPassword);
            }

            if (!string.IsNullOrWhiteSpace(request.NewAvatarKey))
            {
                await _userRepository.UpdateAvatarAsync(user.Id, request.NewAvatarKey);
            }

            // yeni değer gelmemişse, eski değeri koruyup öyle döndürüyoruz
            string finalUsername = !string.IsNullOrWhiteSpace(request.NewUsername) ? request.NewUsername : user.Username;
            string finalAvatarKey = !string.IsNullOrWhiteSpace(request.NewAvatarKey) ? request.NewAvatarKey : user.AvatarKey;

            return Ok(new { message = "Profil güncellendi", username = finalUsername, avatarKey = finalAvatarKey });
        }
    }
}