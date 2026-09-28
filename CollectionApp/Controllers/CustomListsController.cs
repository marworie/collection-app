using Microsoft.AspNetCore.Mvc;
using CollectionApp.Repositories;

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomListsController : ControllerBase
    {
        private readonly CustomListRepository _repository;

        public CustomListsController(CustomListRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllLists()
        {
            var lists = await _repository.GetAllListsAsync();
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
            int newId = await _repository.CreateListAsync(request.Name, request.Icon);
            return Ok(new { id = newId, name = request.Name, icon = request.Icon });
        }

        [HttpDelete("{listId}")]
        public async Task<IActionResult> DeleteList(int listId)
        {
            await _repository.DeleteListAsync(listId);
            return NoContent();
        }

        [HttpGet("{listId}/items")]
        public async Task<IActionResult> GetItemsInList(int listId)
        {
            var items = await _repository.GetItemsInListAsync(listId);
            return Ok(items);
        }

        [HttpPost("{listId}/items/{itemId}")]
        public async Task<IActionResult> AddItemToList(int listId, int itemId)
        {
            await _repository.AddItemToListAsync(listId, itemId);
            return NoContent();
        }

        [HttpDelete("{listId}/items/{itemId}")]
        public async Task<IActionResult> RemoveItemFromList(int listId, int itemId)
        {
            await _repository.RemoveItemFromListAsync(listId, itemId);
            return NoContent();
        }

        [HttpGet("for-item/{itemId}")]
        public async Task<IActionResult> GetListIdsForItem(int itemId)
        {
            var listIds = await _repository.GetListIdsForItemAsync(itemId);
            return Ok(listIds);
        }
    }
}
