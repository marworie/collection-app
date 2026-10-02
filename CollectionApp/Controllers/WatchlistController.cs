using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CollectionApp.Dtos;
using CollectionApp.Repositories;
using System.Security.Claims;

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]   // bu controller'daki her endpoint geçerli bir token istiyor
    public class WatchlistController : ControllerBase
    {
        private readonly WatchlistRepository _watchlistRepository;

        public WatchlistController(WatchlistRepository watchlistRepository)
        {
            _watchlistRepository = watchlistRepository;
        }

        // Token'ın içindeki kullanıcı id'sini okuyan küçük yardımcı
        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetByCategory([FromQuery] string category)
        {
            var items = await _watchlistRepository.GetByCategoryAsync(category, GetUserId());
            return Ok(items);
        }

        // Buraya gelindiyse DTO doğrulamadan geçmiş demektir
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] WatchlistItemDto dto)
        {
            string title = dto.Title.Trim();
            var newId = await _watchlistRepository.AddAsync(title, dto.Category, GetUserId());
            return Ok(new { id = newId, title, category = dto.Category });
        }

        // Silinecek kayıt bulunamazsa (ya da başkasına aitse) 404
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            int affected = await _watchlistRepository.DeleteAsync(id, GetUserId());
            if (affected == 0)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}