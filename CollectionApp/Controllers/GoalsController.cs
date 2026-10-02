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
    public class GoalsController : ControllerBase
    {
        private readonly GoalRepository _repository;

        public GoalsController(GoalRepository repository)
        {
            _repository = repository;
        }

        // Token'ın içindeki kullanıcı id'sini okuyan küçük yardımcı
        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var goals = await _repository.GetAllAsync(GetUserId());
            return Ok(goals);
        }

        // PUT api/Goals: hedef koyar ya da varsa günceller
        // Yıl, tür ve hedef sayısı kontrolleri artık GoalDto'da
        [HttpPut]
        public async Task<IActionResult> SetGoal([FromBody] GoalDto dto)
        {
            await _repository.UpsertAsync(dto.Year, dto.Type, dto.Target, GetUserId());
            return NoContent();
        }

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
    }
}