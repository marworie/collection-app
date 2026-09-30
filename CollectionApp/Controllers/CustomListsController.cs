using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CollectionApp.Repositories;
using System.Security.Claims;

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]   // bu controller'daki her endpoint artık geçerli bir token istiyor
    public class CustomListsController : ControllerBase
    {
        private readonly CustomListRepository _repository;

        public CustomListsController(CustomListRepository repository)
        {
            _repository = repository;
        }

        // Token'ın içindeki kullanıcı id'sini okuyan küçük yardımcı
        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllLists()
        {
            var lists = await _repository.GetAllListsAsync(GetUserId());
            return Ok(lists);
        }

        public class CreateListRequest
        {
            public required string Name { get; set; }
            public string Icon { get; set; } = "🏷️";
        }

        [HttpPost]
        public async Task<IActionResult> CreateList([FromBody] CreateListRequest request)
        {
            int newId = await _repository.CreateListAsync(request.Name, request.Icon, GetUserId());
            return Ok(new { id = newId, name = request.Name, icon = request.Icon });
        }

        [HttpDelete("{listId}")]
        public async Task<IActionResult> DeleteList(int listId)
        {
            await _repository.DeleteListAsync(listId, GetUserId());
            return NoContent();
        }

        [HttpGet("{listId}/items")]
        public async Task<IActionResult> GetItemsInList(int listId)
        {
            var items = await _repository.GetItemsInListAsync(listId, GetUserId());
            return Ok(items);
        }

        [HttpPost("{listId}/items/{itemId}")]
        public async Task<IActionResult> AddItemToList(int listId, int itemId)
        {
            await _repository.AddItemToListAsync(listId, itemId, GetUserId());
            return NoContent();
        }

        [HttpDelete("{listId}/items/{itemId}")]
        public async Task<IActionResult> RemoveItemFromList(int listId, int itemId)
        {
            await _repository.RemoveItemFromListAsync(listId, itemId, GetUserId());
            return NoContent();
        }

        [HttpGet("for-item/{itemId}")]
        public async Task<IActionResult> GetListIdsForItem(int itemId)
        {
            var listIds = await _repository.GetListIdsForItemAsync(itemId, GetUserId());
            return Ok(listIds);
        }
    }
}