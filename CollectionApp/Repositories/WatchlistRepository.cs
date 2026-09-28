using Dapper;
using Microsoft.Data.SqlClient;
using CollectionApp.Models;

namespace CollectionApp.Repositories
{
    public class WatchlistRepository
    {
        private readonly string _connectionString;

        public WatchlistRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("CollectionDB")
                ?? throw new InvalidOperationException("Connection string bulunamadı");
        }

        public async Task<IEnumerable<WatchlistItem>> GetByCategoryAsync(string category)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "SELECT * FROM WatchlistItems WHERE Category = @Category ORDER BY CreatedDate DESC";
            return await connection.QueryAsync<WatchlistItem>(sql, new { Category = category });
        }

        public async Task<int> AddAsync(string title, string category)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = @"INSERT INTO WatchlistItems (Title, Category, CreatedDate)
                           VALUES (@Title, @Category, GETDATE());
                           SELECT CAST(SCOPE_IDENTITY() as int);";
            return await connection.QuerySingleAsync<int>(sql, new { Title = title, Category = category });
        }

        public async Task<int> DeleteAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "DELETE FROM WatchlistItems WHERE Id = @Id";
            return await connection.ExecuteAsync(sql, new { Id = id });
        }
    }
}