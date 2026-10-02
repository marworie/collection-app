using CollectionApp.Models;
using CollectionApp.Dtos;

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

        // Kapak önizlemesi için yardımcı satır tipi
        private class PreviewRow
        {
            public int ListId { get; set; }
            public string CoverImageUrl { get; set; } = string.Empty;
        }

        // Tüm listeler + öğe sayıları + her listenin son eklenen 4 kapağı (2 sorgu, N+1 yok)
        public async Task<IEnumerable<CustomListSummaryDto>> GetListSummariesAsync(int userId)
        {
            var lists = (await QueryAsync<CustomListSummaryDto>(
                @"SELECT cl.Id, cl.Name, cl.Icon,
                         (SELECT COUNT(*) FROM CustomListItems cli WHERE cli.ListId = cl.Id) AS ItemCount
                  FROM CustomLists cl
                  WHERE cl.UserId = @UserId
                  ORDER BY cl.CreatedDate DESC",
                new { UserId = userId })).ToList();

            // ROW_NUMBER: her liste (PARTITION BY) kendi içinde 1, 2, 3... diye numaralanır,
            // sonra sadece ilk 4'ü alınır
            var previews = await QueryAsync<PreviewRow>(
                @"WITH Ranked AS (
                      SELECT cli.ListId, i.CoverImageUrl,
                             ROW_NUMBER() OVER (PARTITION BY cli.ListId ORDER BY i.Id DESC) AS rn
                      FROM CustomListItems cli
                      INNER JOIN CustomLists cl ON cl.Id = cli.ListId
                      INNER JOIN Items i ON i.Id = cli.ItemId
                      WHERE cl.UserId = @UserId
                        AND i.CoverImageUrl IS NOT NULL AND i.CoverImageUrl <> ''
                  )
                  SELECT ListId, CoverImageUrl FROM Ranked WHERE rn <= 4",
                new { UserId = userId });

            // Kapakları ilgili listelere dağıt
            var coversByList = previews
                .GroupBy(p => p.ListId)
                .ToDictionary(g => g.Key, g => g.Select(p => p.CoverImageUrl).ToList());

            foreach (var list in lists)
            {
                if (coversByList.TryGetValue(list.Id, out var covers))
                    list.PreviewCovers = covers;
            }

            return lists;
        }
        // Listenin adını ve ikonunu günceller, ama sadece bu kullanıcıya aitse
        public async Task<bool> UpdateListAsync(int listId, string name, string icon, int userId) =>
            await ExecuteAsync(
                "UPDATE CustomLists SET Name = @Name, Icon = @Icon WHERE Id = @Id AND UserId = @UserId",
                new { Id = listId, Name = name, Icon = icon, UserId = userId }) > 0;
    }
}