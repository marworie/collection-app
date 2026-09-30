using CollectionApp.Models;

namespace CollectionApp.Repositories
{
    // Koleksiyon öğeleri için repo; bağlantı işini BaseRepository halleder
    public class ItemRepository : BaseRepository
    {
        public ItemRepository(IConfiguration configuration) : base(configuration) { }

        // Sadece bu kullanıcıya ait öğeler
        public Task<IEnumerable<Item>> GetAllAsync(int userId) =>
            QueryAsync<Item>(
                "SELECT * FROM Items WHERE UserId = @UserId",
                new { UserId = userId });

        // Tek öğe; başkasına aitse ya da yoksa null
        public Task<Item> GetByIdAsync(int id, int userId) =>
            QuerySingleOrDefaultAsync<Item>(
                "SELECT * FROM Items WHERE Id = @Id AND UserId = @UserId",
                new { Id = id, UserId = userId })!;

        // Yeni öğe ekler, oluşan Id'yi döndürür
        public Task<int> AddAsync(Item item, int userId)
        {
            string sql = @"INSERT INTO Items (Title, Type, Status, Rating, CoverImageUrl, Notes, Description, IsFavorite, StartDate, EndDate, Genre, CreatedDate, UserId)
                           VALUES (@Title, @Type, @Status, @Rating, @CoverImageUrl, @Notes, @Description, @IsFavorite, @StartDate, @EndDate, @Genre, GETDATE(), @UserId);
                           SELECT CAST(SCOPE_IDENTITY() AS int);";

            return ExecuteScalarAsync<int>(sql, new
            {
                item.Title,
                item.Type,
                item.Status,
                item.Rating,
                item.CoverImageUrl,
                item.Notes,
                item.Description,
                item.IsFavorite,
                item.StartDate,
                item.EndDate,
                item.Genre,
                UserId = userId
            });
        }

        // Günceller; en az bir satır değiştiyse true
        public async Task<bool> UpdateAsync(int id, Item item, int userId)
        {
            string sql = @"UPDATE Items
                           SET Title = @Title, Type = @Type, Status = @Status,
                               Rating = @Rating, CoverImageUrl = @CoverImageUrl, Notes = @Notes,
                               Description = @Description, IsFavorite = @IsFavorite,
                               StartDate = @StartDate, EndDate = @EndDate, Genre = @Genre
                           WHERE Id = @Id AND UserId = @UserId";

            int affected = await ExecuteAsync(sql, new
            {
                item.Title,
                item.Type,
                item.Status,
                item.Rating,
                item.CoverImageUrl,
                item.Notes,
                item.Description,
                item.IsFavorite,
                item.StartDate,
                item.EndDate,
                item.Genre,
                Id = id,
                UserId = userId
            });
            return affected > 0;
        }

        // UserId şartı: başkasının öğesini silmeyi engeller
        public async Task<bool> DeleteAsync(int id, int userId) =>
            await ExecuteAsync(
                "DELETE FROM Items WHERE Id = @Id AND UserId = @UserId",
                new { Id = id, UserId = userId }) > 0;

        // Tekrar sayacını 1 artırır
        public async Task<bool> IncrementRewatchAsync(int id, int userId) =>
            await ExecuteAsync(
                "UPDATE Items SET RewatchCount = RewatchCount + 1 WHERE Id = @Id AND UserId = @UserId",
                new { Id = id, UserId = userId }) > 0;

        // Tekrar sayacını 1 azaltır, 0'ın altına düşmez
        public async Task<bool> DecrementRewatchAsync(int id, int userId) =>
            await ExecuteAsync(
                @"UPDATE Items
                  SET RewatchCount = CASE WHEN RewatchCount > 0 THEN RewatchCount - 1 ELSE 0 END
                  WHERE Id = @Id AND UserId = @UserId",
                new { Id = id, UserId = userId }) > 0;

        // Sıralamayı toplu günceller.
        // Dapper'a liste verince sorguyu her eleman için tek bağlantıda çalıştırır.
        public Task UpdateSortOrderAsync(List<(int Id, int SortOrder)> updates, int userId) =>
            ExecuteAsync(
                "UPDATE Items SET SortOrder = @SortOrder WHERE Id = @Id AND UserId = @UserId",
                updates.Select(u => new { u.Id, u.SortOrder, UserId = userId }));
    }
}