using Dapper;
using Microsoft.Data.SqlClient;
using CollectionApp.Models;

namespace CollectionApp.Repositories
{
    public class CustomListRepository
    {
        private readonly string _connectionString;

        public CustomListRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("CollectionDB")
                ?? throw new InvalidOperationException("Connection string bulunamadı");
        }

        // Tüm listeleri getirir
        public async Task<IEnumerable<CustomList>> GetAllListsAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "SELECT * FROM CustomLists ORDER BY CreatedDate DESC";
            return await connection.QueryAsync<CustomList>(sql);
        }

        // Yeni bir liste oluşturur
        public async Task<int> CreateListAsync(string name, string icon)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = @"INSERT INTO CustomLists (Name, Icon, CreatedDate)
                           VALUES (@Name, @Icon, GETDATE());
                           SELECT CAST(SCOPE_IDENTITY() as int);";
            return await connection.QuerySingleAsync<int>(sql, new { Name = name, Icon = icon });
        }

        // Bir listeyi (ve içindeki tüm ilişkileri, CASCADE sayesinde) siler
        public async Task<bool> DeleteListAsync(int listId)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "DELETE FROM CustomLists WHERE Id = @Id";
            int affectedRows = await connection.ExecuteAsync(sql, new { Id = listId });
            return affectedRows > 0;
        }

        // Bir listedeki tüm öğeleri getirir (Items ile CustomListItems'ı birleştiriyoruz)
        public async Task<IEnumerable<Item>> GetItemsInListAsync(int listId)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = @"SELECT i.* FROM Items i
                           INNER JOIN CustomListItems cli ON i.Id = cli.ItemId
                           WHERE cli.ListId = @ListId";
            return await connection.QueryAsync<Item>(sql, new { ListId = listId });
        }

        // Bir öğeyi bir listeye ekler (zaten ekliyse tekrar eklemez)
        public async Task AddItemToListAsync(int listId, int itemId)
        {
            using var connection = new SqlConnection(_connectionString);
            string checkSql = "SELECT COUNT(*) FROM CustomListItems WHERE ListId = @ListId AND ItemId = @ItemId";
            int existing = await connection.QuerySingleAsync<int>(checkSql, new { ListId = listId, ItemId = itemId });

            if (existing == 0)
            {
                string insertSql = "INSERT INTO CustomListItems (ListId, ItemId) VALUES (@ListId, @ItemId)";
                await connection.ExecuteAsync(insertSql, new { ListId = listId, ItemId = itemId });
            }
        }

        // Bir öğeyi bir listeden çıkarır
        public async Task RemoveItemFromListAsync(int listId, int itemId)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "DELETE FROM CustomListItems WHERE ListId = @ListId AND ItemId = @ItemId";
            await connection.ExecuteAsync(sql, new { ListId = listId, ItemId = itemId });
        }

        // Bir öğenin hangi listelerde olduğunu getirir (kart üzerindeki "+ Listeye Ekle" menüsü için)
        public async Task<IEnumerable<int>> GetListIdsForItemAsync(int itemId)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "SELECT ListId FROM CustomListItems WHERE ItemId = @ItemId";
            return await connection.QueryAsync<int>(sql, new { ItemId = itemId });
        }
    }
}