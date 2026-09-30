using CollectionApp.Models;

namespace CollectionApp.Repositories
{
    public class CustomListRepository : BaseRepository
    {
        public CustomListRepository(IConfiguration configuration) : base(configuration) { }

        // Sadece bu kullanıcının listelerini getirir
        public Task<IEnumerable<CustomList>> GetAllListsAsync(int userId) =>
            QueryAsync<CustomList>(
                "SELECT * FROM CustomLists WHERE UserId = @UserId ORDER BY CreatedDate DESC",
                new { UserId = userId });

        // Yeni bir liste oluşturur, oluşan Id'yi döndürür
        public Task<int> CreateListAsync(string name, string icon, int userId) =>
            ExecuteScalarAsync<int>(
                @"INSERT INTO CustomLists (Name, Icon, CreatedDate, UserId)
                  VALUES (@Name, @Icon, GETDATE(), @UserId);
                  SELECT CAST(SCOPE_IDENTITY() AS int);",
                new { Name = name, Icon = icon, UserId = userId });

        // Bir listeyi siler, ama sadece bu kullanıcıya aitse
        public async Task<bool> DeleteListAsync(int listId, int userId) =>
            await ExecuteAsync(
                "DELETE FROM CustomLists WHERE Id = @Id AND UserId = @UserId",
                new { Id = listId, UserId = userId }) > 0;

        // Bir listedeki tüm öğeleri getirir, ama sadece liste bu kullanıcıya aitse
        public Task<IEnumerable<Item>> GetItemsInListAsync(int listId, int userId) =>
            QueryAsync<Item>(
                @"SELECT i.* FROM Items i
                  INNER JOIN CustomListItems cli ON i.Id = cli.ItemId
                  INNER JOIN CustomLists cl ON cli.ListId = cl.Id
                  WHERE cli.ListId = @ListId AND cl.UserId = @UserId",
                new { ListId = listId, UserId = userId });

        // Öğeyi listeye ekler. Tek sorguda üç kontrol:
        // liste bu kullanıcının mı, öğe bu kullanıcının mı, öğe zaten listede mi
        public Task AddItemToListAsync(int listId, int itemId, int userId) =>
            ExecuteAsync(
                @"INSERT INTO CustomListItems (ListId, ItemId)
                  SELECT @ListId, @ItemId
                  WHERE EXISTS (SELECT 1 FROM CustomLists WHERE Id = @ListId AND UserId = @UserId)
                    AND EXISTS (SELECT 1 FROM Items WHERE Id = @ItemId AND UserId = @UserId)
                    AND NOT EXISTS (SELECT 1 FROM CustomListItems WHERE ListId = @ListId AND ItemId = @ItemId)",
                new { ListId = listId, ItemId = itemId, UserId = userId });

        // Bir öğeyi bir listeden çıkarır, ama sadece liste bu kullanıcıya aitse
        public Task RemoveItemFromListAsync(int listId, int itemId, int userId) =>
            ExecuteAsync(
                @"DELETE cli FROM CustomListItems cli
                  INNER JOIN CustomLists cl ON cli.ListId = cl.Id
                  WHERE cli.ListId = @ListId AND cli.ItemId = @ItemId AND cl.UserId = @UserId",
                new { ListId = listId, ItemId = itemId, UserId = userId });

        // Bir öğenin, bu kullanıcıya ait hangi listelerde olduğunu getirir
        public Task<IEnumerable<int>> GetListIdsForItemAsync(int itemId, int userId) =>
            QueryAsync<int>(
                @"SELECT cli.ListId FROM CustomListItems cli
                  INNER JOIN CustomLists cl ON cli.ListId = cl.Id
                  WHERE cli.ItemId = @ItemId AND cl.UserId = @UserId",
                new { ItemId = itemId, UserId = userId });
    }
}