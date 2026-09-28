using CollectionApp.Models;
using CollectionApp.Repositories;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

// Koleksiyon öğeleri (kitap/dizi/film vs.) için CRUD işlemlerini yöneten controller

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemsController : ControllerBase // koleksiyon öğeleri için API uç noktalarını temsil eder
    {
        private readonly ItemRepository _repository;

        public ItemsController(ItemRepository repository)
        {
            _repository = repository;
        }

        // GET: api/Items — tüm öğeleri listeler
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _repository.GetAllAsync();
            return Ok(items);
        }

        // GET: api/Items/5 — tek bir öğeyi getirir
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _repository.GetByIdAsync(id);
            if (item == null)
            {
                // öğe yoksa 404 dön
                return NotFound();
            }
            return Ok(item);
        }

        // POST: api/Items — yeni bir öğe ekler
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Item item)
        {
            int newId = await _repository.AddAsync(item);
            item.Id = newId; // veritabanının verdiği Id'yi nesneye geri yazıyoruz

            // 201 Created dönüyor, ayrıca yeni kaydın nerede bulunacağını (GetById) da bildiriyor
            return CreatedAtAction(nameof(GetById), new { id = newId }, item);
        }

        // PUT: api/Items/5 — var olan bir öğeyi günceller
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Item item)
        {
            bool updated = await _repository.UpdateAsync(id, item);
            if (!updated)
            {
                // güncellenecek bir kayıt bulunamadıysa 404 dön
                return NotFound();
            }
            // başarılı ama geri dönecek içerik yok
            return NoContent();
        }

        // DELETE: api/Items/5 — bir öğeyi siler
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool deleted = await _repository.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound();
            }
            return NoContent();
        }

        // PATCH: api/Item/5/rewatch - tekrar izleme sayacına bir ekle
        [HttpPatch("{id}/rewatch")]

        public async Task<IActionResult> IncrementRewatch(int id)
        {
            bool updated = await _repository.IncrementRewatchAsync(id);
            if(!updated)
            {
                return NotFound();
            }
            return NoContent();
        }

        // PATCH: api/Items/5/unrewatch - tekrar izleme sayacından bir azalt
        [HttpPatch("{id}/unrewatch")]
        public async Task<IActionResult> DecrementRewatch(int id)
        {
            bool updated = await _repository.DecrementRewatchAsync(id);
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

        // PUT: api/Items/reorder - sürüle-bırak sonrası yeni sırayı kaydeder
        [HttpPut("reorder")]
        public async Task<IActionResult> Reorder([FromBody] List<ReorderRequest> items)
        {
            var updates = items.Select(i => (i.Id, i.SortOrder)).ToList();
            await _repository.UpdateSortOrderAsync(updates);
            return NoContent();
        }
    }
}