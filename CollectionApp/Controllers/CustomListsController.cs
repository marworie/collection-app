using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CollectionApp.Repositories;
using System.Security.Claims;
using CollectionApp.Dtos;

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]  // bu controller'daki her endpoint geçerli bir token istiyor
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

        // Listelerim sayfası için: listeler + öğe sayısı + ilk 4 kapak
        [HttpGet]
        public async Task<IActionResult> GetAllLists()
        {
            var lists = await _repository.GetListSummariesAsync(GetUserId());
            return Ok(lists);
        }

        // Yeni liste oluşturur (ad boş ya da çok uzunsa DTO doğrulaması 400 döndürür)
        [HttpPost]
        public async Task<IActionResult> CreateList([FromBody] CustomListDto dto)
        {
            int newId = await _repository.CreateListAsync(dto.Name.Trim(), dto.Icon, GetUserId());
            return Ok(new { id = newId, name = dto.Name.Trim(), icon = dto.Icon });
        }

        // Listenin adını ve ikonunu günceller (sadece kendi listesiyse)
        [HttpPut("{listId}")]
        public async Task<IActionResult> UpdateList(int listId, [FromBody] CustomListDto dto)
        {
            bool updated = await _repository.UpdateListAsync(listId, dto.Name.Trim(), dto.Icon, GetUserId());
            if (!updated)
            {
                return NotFound();
            }
            return NoContent();
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