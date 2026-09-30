using CollectionApp.Dtos;
using CollectionApp.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

// Koleksiyon öğeleri (kitap/dizi/film vs.) için CRUD işlemlerini yöneten controller

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]   // DTO'daki kurallara uymayan istekleri otomatik 400 ile reddeder
    [Authorize]       // bu controller'daki her endpoint geçerli bir token istiyor
    public class ItemsController : ControllerBase
    {
        private readonly ItemRepository _repository;

        public ItemsController(ItemRepository repository)
        {
            _repository = repository;
        }

        // Token'ın içindeki kullanıcı id'sini okuyan küçük yardımcı
        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        // GET: api/Items — sadece giriş yapan kullanıcının öğelerini listeler
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _repository.GetAllAsync(GetUserId());
            return Ok(items);
        }

        // GET: api/Items/5 — tek bir öğeyi getirir (sadece kendi öğesiyse)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _repository.GetByIdAsync(id, GetUserId());
            if (item == null)
            {
                return NotFound();
            }
            return Ok(item);
        }

        // POST: api/Items — yeni bir öğe ekler
        // Buraya gelindiyse DTO doğrulamadan geçmiş demektir
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ItemDto dto)
        {
            var item = dto.ToItem();
            item.Id = await _repository.AddAsync(item, GetUserId());

            return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        }

        // PUT: api/Items/5 — var olan bir öğeyi günceller (sadece kendi öğesiyse)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ItemDto dto)
        {
            bool updated = await _repository.UpdateAsync(id, dto.ToItem(), GetUserId());
            if (!updated)
            {
                return NotFound();
            }
            return NoContent();
        }

        // DELETE: api/Items/5 — bir öğeyi siler (sadece kendi öğesiyse)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool deleted = await _repository.DeleteAsync(id, GetUserId());
            if (!deleted)
            {
                return NotFound();
            }
            return NoContent();
        }

        // PATCH: api/Items/5/rewatch - tekrar izleme sayacına bir ekle
        [HttpPatch("{id}/rewatch")]
        public async Task<IActionResult> IncrementRewatch(int id)
        {
            bool updated = await _repository.IncrementRewatchAsync(id, GetUserId());
            if (!updated)
            {
                return NotFound();
            }
            return NoContent();
        }

        // PATCH: api/Items/5/unrewatch - tekrar izleme sayacından bir azalt
        [HttpPatch("{id}/unrewatch")]
        public async Task<IActionResult> DecrementRewatch(int id)
        {
            bool updated = await _repository.DecrementRewatchAsync(id, GetUserId());
            if (!updated)
            {
                return NotFound();
            }
            return NoContent();
        }

        public class ReorderRequest
        {
            public int Id { get; set; }
            public int SortOrder { get; set; }
        }

        // PUT: api/Items/reorder - sürükle-bırak sonrası yeni sırayı kaydeder
        [HttpPut("reorder")]
        public async Task<IActionResult> Reorder([FromBody] List<ReorderRequest> items)
        {
            var updates = items.Select(i => (i.Id, i.SortOrder)).ToList();
            await _repository.UpdateSortOrderAsync(updates, GetUserId());
            return NoContent();
        }
    }
}