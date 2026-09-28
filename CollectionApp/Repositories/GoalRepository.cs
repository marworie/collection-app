using Dapper;
using Microsoft.Data.SqlClient;
using CollectionApp.Models;

namespace CollectionApp.Repositories
{
    public class GoalRepository
    {
        private readonly string _connectionString;

        public GoalRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("CollectionDB")
                ?? throw new InvalidOperationException("Connection string bulunamadı");
        }

        // Tüm hedefleri getirir hangi yıla ait olduğunu frontend gösteriyor
        public async Task<IEnumerable<Goal>> GetAllAsync() 
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "SELECT * FROM Goals ORDER BY Year DESC, Type";
            return await connection.QueryAsync<Goal>(sql);
        }
        
        // upsert: kayıt varsa günceller, yoksa ekler update + insert
        public async Task UpsertAsync(int year, string type, int target)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = @"IF EXISTS (SELECT 1 FROM Goals WHERE Year =  @Year AND Type = @Type)
                            UPDATE Goals SET Target = @Target WHERE Year = @Year AND Type = @Type
                        ELSE
                            INSERT INTO Goals (Year, Type, Target) VALUES (@Year, @Type, @Target)";
            await connection.ExecuteAsync(sql, new { Year = year, Type = type, Target = target });
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "DELETE FROM Goals WHERE Id = @Id";
            int affectedRows = await connection.ExecuteAsync(sql, new { Id = id });
            return affectedRows > 0;
        }
    }
}