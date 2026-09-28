using Microsoft.AspNetCore.Mvc;
using CollectionApp.Repositories;

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WatchlistController : ControllerBase
    {
        private readonly WatchlistRepository _watchlistRepository;

        public WatchlistController(WatchlistRepository watchlistRepository)
        {
            _watchlistRepository = watchlistRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetByCategory([FromQuery] string category)
        {
            var items = await _watchlistRepository.GetByCategoryAsync(category);
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
            var newId = await _watchlistRepository.AddAsync(request.Title, request.Category);
            return Ok(new { id = newId, title = request.Title, category = request.Category });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _watchlistRepository.DeleteAsync(id);
            return NoContent();
        }
    }
}