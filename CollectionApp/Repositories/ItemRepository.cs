using Dapper;
using CollectionApp.Models;
using Microsoft.Data.SqlClient;

namespace CollectionApp.Repositories
{
    public class ItemRepository // koleksiyon ogeleri için repo sınıfı
    {
        private readonly string _connectionString; // veritabının bağlantı dizesini tutar

        public ItemRepository(IConfiguration configuration) // yapılandırma ayarlarını alır ve bağlantı dizesini ayarlar
        {
            _connectionString = configuration.GetConnectionString("CollectionDB");
        }

        // Tüm öğeleri veritabanından çeker (listeleme ekranı için)
        public async Task<IEnumerable<Item>> GetAllAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "SELECT * FROM Items";
            return await connection.QueryAsync<Item>(sql);
        }

        // Id'ye göre tek bir öğeyi getirir (detay/düzenleme ekranı için)
        public async Task<Item> GetByIdAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "SELECT * FROM Items WHERE Id = @Id";
            return await connection.QuerySingleOrDefaultAsync<Item>(sql, new { Id = id });
        }

        // Yeni bir öğe ekler (ekleme formu için), eklenen kaydın Id'sini geri döner
        public async Task<int> AddAsync(Item item)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = @"INSERT INTO Items (Title, Type, Status, Rating, CoverImageUrl, Notes, Description, IsFavorite, StartDate, EndDate, Genre, CreatedDate)
           VALUES (@Title, @Type, @Status, @Rating, @CoverImageUrl, @Notes, @Description, @IsFavorite, @StartDate, @EndDate, @Genre, GETDATE());
           SELECT CAST(SCOPE_IDENTITY() as int);";
            return await connection.QuerySingleAsync<int>(sql, item);
        }

        // Var olan bir öğeyi günceller (düzenleme formu için)
        public async Task<bool> UpdateAsync(int id, Item item)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = @"UPDATE Items
           SET Title = @Title, Type = @Type, Status = @Status,
               Rating = @Rating, CoverImageUrl = @CoverImageUrl, Notes = @Notes,
               Description = @Description,
               IsFavorite = @IsFavorite, StartDate = @StartDate, EndDate = @EndDate, 
               Genre = @Genre
           WHERE Id = @Id";
            item.Id = id;
            int affectedRows = await connection.ExecuteAsync(sql, item);
            return affectedRows > 0;
        }

        // Bir öğeyi siler
        public async Task<bool> DeleteAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "DELETE FROM Items WHERE Id = @Id";
            int affectedRows = await connection.ExecuteAsync(sql, new { Id = id });
            return affectedRows > 0;
        }

        // Tekrar izleme/okuma sayacını 1 artırır
        public async Task<bool> IncrementRewatchAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "UPDATE Items SET RewatchCount = RewatchCount + 1 WHERE Id = @Id";
            int affectedRows = await connection.ExecuteAsync(sql, new { Id = id });
            return affectedRows > 0;
        }

        // Tekrar izleme/okuma sayacını 1 azaltır
        public async Task<bool> DecrementRewatchAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "UPDATE Items SET RewatchCount = CASE WHEN RewatchCount > 0 THEN RewatchCount - 1 ELSE 0 END WHERE Id = @Id";
            int affectedRows = await connection.ExecuteAsync(sql, new { Id = id });
            return affectedRows > 0;
        }

        // Birden fazla öğenin sırasını tek seferde günceller (sürükle-bırak sonrası)
        public async Task UpdateSortOrderAsync(List<(int Id, int SortOrder)> updates)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "UPDATE Items SET SortOrder = @SortOrder WHERE Id = @Id";
            foreach (var update in updates)
            {
                await connection.ExecuteAsync(sql, new { Id = update.Id, SortOrder = update.SortOrder });
            }
        }

    }
}