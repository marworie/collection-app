using Microsoft.AspNetCore.Mvc;
using CollectionApp.Repositories;

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GoalsController : ControllerBase
    {
        // Kabul edilen türler. Bunun dışında bir şey gelirse reddediyoruz
        private static readonly string[] AllowedTypes =
            { "Hepsi", "Kitap", "Dizi", "Film", "Belgesel", "Animasyon", "Anime" };

        private readonly GoalRepository _repository;

        public GoalsController(GoalRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var goals = await _repository.GetAllAsync();
            return Ok(goals);
        }

        public class SetGoalRequest
        {
            public int Year { get; set; }
            public required string Type { get; set; }
            public int Target { get; set; }
        }

        // PUT api/Goals: hedef koyar ya da varsa günceller
        [HttpPut]
        public async Task<IActionResult> SetGoal([FromBody] SetGoalRequest request)
        {
            // Girdi doğrulama: frontend'e güvenmeyip backend'de de kontrol ediyoruz.
            // API'ye Swagger'dan ya da başka bir yerden de istek atılabilir.
            if (request.Year < 2000 || request.Year > 2100)
                return BadRequest(new { message = "Geçersiz yıl" });

            if (!AllowedTypes.Contains(request.Type))
                return BadRequest(new { message = "Geçersiz tür" });

            if (request.Target < 1 || request.Target > 1000)
                return BadRequest(new { message = "Hedef 1 ile 1000 arasında olmalı" });

            await _repository.UpsertAsync(request.Year, request.Type, request.Target);
            return NoContent();
        }

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
    }
}