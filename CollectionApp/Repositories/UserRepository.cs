using Dapper;
using CollectionApp.Models;
using Microsoft.Data.SqlClient;

namespace CollectionApp.Repositories
{
    public class UserRepository
    {
        private readonly string _connectionString;

        public UserRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("CollectionDB");
        }

        public async Task<User> GetByUsernameAsync(string username)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "SELECT * FROM Users WHERE Username = @Username";
            return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Username = username });
        }

        public async Task<int> AddAsync(User user)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = @"INSERT INTO Users (Username, PasswordHash)
                           VALUES (@Username, @PasswordHash);
                           SELECT CAST(SCOPE_IDENTITY() as int);";
            return await connection.QuerySingleAsync<int>(sql, user);
        }

        public async Task<bool> UpdateUsernameAsync(int userId, string newUsername)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "UPDATE Users SET Username = @Username WHERE Id = @Id";
            int affectedRows = await connection.ExecuteAsync(sql, new { Id = userId, Username = newUsername });
            return affectedRows > 0;
        }

        public async Task<bool> UpdatePasswordAsync(int userId, string newPasswordHash)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "UPDATE Users SET PasswordHash = @PasswordHash WHERE Id = @Id";
            int affectedRows = await connection.ExecuteAsync(sql, new { Id = userId, PasswordHash = newPasswordHash });
            return affectedRows > 0;
        }

        // Avatar güncelleme — yeni metot
        public async Task<bool> UpdateAvatarAsync(int userId, string avatarKey)
        {
            using var connection = new SqlConnection(_connectionString);
            string sql = "UPDATE Users SET AvatarKey = @AvatarKey WHERE Id = @Id";
            int affectedRows = await connection.ExecuteAsync(sql, new { Id = userId, AvatarKey = avatarKey });
            return affectedRows > 0;
        }
    }
}