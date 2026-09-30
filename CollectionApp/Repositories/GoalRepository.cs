using CollectionApp.Models;

namespace CollectionApp.Repositories
{
    public class GoalRepository : BaseRepository
    {
        public GoalRepository(IConfiguration configuration) : base(configuration) { }

        // Sadece bu kullanıcının hedeflerini getirir, hangi yıla ait olduğunu frontend gösteriyor
        public Task<IEnumerable<Goal>> GetAllAsync(int userId) =>
            QueryAsync<Goal>(
                "SELECT * FROM Goals WHERE UserId = @UserId ORDER BY Year DESC, Type",
                new { UserId = userId });

        // upsert: kayıt varsa günceller, yoksa ekler (update + insert)
        public Task UpsertAsync(int year, string type, int target, int userId)
        {
            string sql = @"IF EXISTS (SELECT 1 FROM Goals WHERE Year = @Year AND Type = @Type AND UserId = @UserId)
                               UPDATE Goals SET Target = @Target WHERE Year = @Year AND Type = @Type AND UserId = @UserId
                           ELSE
                               INSERT INTO Goals (Year, Type, Target, UserId) VALUES (@Year, @Type, @Target, @UserId)";
            return ExecuteAsync(sql, new { Year = year, Type = type, Target = target, UserId = userId });
        }

        // Bir hedefi siler, ama sadece bu kullanıcıya aitse
        public async Task<bool> DeleteAsync(int id, int userId) =>
            await ExecuteAsync(
                "DELETE FROM Goals WHERE Id = @Id AND UserId = @UserId",
                new { Id = id, UserId = userId }) > 0;
    }
}