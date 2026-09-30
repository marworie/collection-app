using CollectionApp.Models;

namespace CollectionApp.Repositories
{
    // ItemRepository'nin "sözleşmesi": hangi metotları olacağını söyler, kodu yoktur
    public interface IItemRepository
    {
        Task<IEnumerable<Item>> GetAllAsync(int userId);
        Task<Item?> GetByIdAsync(int id, int userId);
        Task<int> AddAsync(Item item, int userId);
        Task<bool> UpdateAsync(int id, Item item, int userId);
        Task<bool> DeleteAsync(int id, int userId);
        Task<bool> IncrementRewatchAsync(int id, int userId);
        Task<bool> DecrementRewatchAsync(int id, int userId);
        Task UpdateSortOrderAsync(List<(int Id, int SortOrder)> updates, int userId);
    }
}
