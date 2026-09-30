using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;

namespace CollectionApp.Repositories
{
    // Tüm repository'lerin ortak atası. abstract: doğrudan new'lenemez, sadece miras alınır.
    public abstract class BaseRepository
    {
        private readonly string _connectionString;

        protected BaseRepository(IConfiguration configuration)
        {
            // Bağlantı dizesi yoksa uygulama açılırken anlamlı bir hata ver
            _connectionString = configuration.GetConnectionString("CollectionDB")
                ?? throw new InvalidOperationException("Connection string bulunamadı.");
        }

        // Her çağrıda yeni bağlantı; .NET connection pool sayesinde maliyetli değil
        protected IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        // Çok satır döndüren sorgular (SELECT ...)
        protected async Task<IEnumerable<T>> QueryAsync<T>(string sql, object? param = null)
        {
            using var conn = CreateConnection(); // metot bitince bağlantı otomatik kapanır
            return await conn.QueryAsync<T>(sql, param);
        }

        // Tek satır; kayıt yoksa null döner
        protected async Task<T?> QuerySingleOrDefaultAsync<T>(string sql, object? param = null)
        {
            using var conn = CreateConnection();
            return await conn.QuerySingleOrDefaultAsync<T>(sql, param);
        }

        // INSERT / UPDATE / DELETE; etkilenen satır sayısını döndürür
        protected async Task<int> ExecuteAsync(string sql, object? param = null)
        {
            using var conn = CreateConnection();
            return await conn.ExecuteAsync(sql, param);
        }

        // Tek değer: COUNT(*), yeni eklenen Id gibi
        protected async Task<T?> ExecuteScalarAsync<T>(string sql, object? param = null)
        {
            using var conn = CreateConnection();
            return await conn.ExecuteScalarAsync<T>(sql, param);
        }
    }
}