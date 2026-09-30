using CollectionApp.Models;

namespace CollectionApp.Repositories
{
    public class WatchlistRepository : BaseRepository
    {
        public WatchlistRepository(IConfiguration configuration) : base(configuration) { }

        // Sadece bu kullanıcının, bu kategorideki öğelerini getirir
        public Task<IEnumerable<WatchlistItem>> GetByCategoryAsync(string category, int userId) =>
            QueryAsync<WatchlistItem>(
                "SELECT * FROM WatchlistItems WHERE Category = @Category AND UserId = @UserId ORDER BY CreatedDate DESC",
                new { Category = category, UserId = userId });

        // Yeni bir öğe ekler, oluşan Id'yi döndürür
        public Task<int> AddAsync(string title, string category, int userId) =>
            ExecuteScalarAsync<int>(
                @"INSERT INTO WatchlistItems (Title, Category, CreatedDate, UserId)
                  VALUES (@Title, @Category, GETDATE(), @UserId);
                  SELECT CAST(SCOPE_IDENTITY() AS int);",
                new { Title = title, Category = category, UserId = userId });

        // Bir öğeyi siler, ama sadece bu kullanıcıya aitse (etkilenen satır sayısını döndürür)
        public Task<int> DeleteAsync(int id, int userId) =>
            ExecuteAsync(
                "DELETE FROM WatchlistItems WHERE Id = @Id AND UserId = @UserId",
                new { Id = id, UserId = userId });
    }
}