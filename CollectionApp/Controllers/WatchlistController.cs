using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CollectionApp.Repositories;
using System.Security.Claims;

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]   // bu controller'daki her endpoint artık geçerli bir token istiyor
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

        public class AddWatchlistRequest
        {
            public required string Title { get; set; }
            public required string Category { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] AddWatchlistRequest request)
        {
            var newId = await _watchlistRepository.AddAsync(request.Title, request.Category, GetUserId());
            return Ok(new { id = newId, title = request.Title, category = request.Category });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _watchlistRepository.DeleteAsync(id, GetUserId());
            return NoContent();
        }
    }
}