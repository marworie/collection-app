using CollectionApp.Models;

namespace CollectionApp.Repositories
{
    public class UserRepository : BaseRepository
    {
        public UserRepository(IConfiguration configuration) : base(configuration) { }

        // Kullanıcı adına göre kullanıcıyı getirir, yoksa null (login için)
        public Task<User> GetByUsernameAsync(string username) =>
            QuerySingleOrDefaultAsync<User>(
                "SELECT * FROM Users WHERE Username = @Username",
                new { Username = username })!;

        // Yeni kullanıcı ekler, oluşan Id'yi döndürür
        // user nesnesini direkt veriyoruz: Dapper @Username ve @PasswordHash'i özelliklerinden okur
        public Task<int> AddAsync(User user) =>
            ExecuteScalarAsync<int>(
                @"INSERT INTO Users (Username, PasswordHash)
                  VALUES (@Username, @PasswordHash);
                  SELECT CAST(SCOPE_IDENTITY() AS int);",
                user);

        public async Task<bool> UpdateUsernameAsync(int userId, string newUsername) =>
            await ExecuteAsync(
                "UPDATE Users SET Username = @Username WHERE Id = @Id",
                new { Id = userId, Username = newUsername }) > 0;

        public async Task<bool> UpdatePasswordAsync(int userId, string newPasswordHash) =>
            await ExecuteAsync(
                "UPDATE Users SET PasswordHash = @PasswordHash WHERE Id = @Id",
                new { Id = userId, PasswordHash = newPasswordHash }) > 0;

        public async Task<bool> UpdateAvatarAsync(int userId, string avatarKey) =>
            await ExecuteAsync(
                "UPDATE Users SET AvatarKey = @AvatarKey WHERE Id = @Id",
                new { Id = userId, AvatarKey = avatarKey }) > 0;

        // Id'ye göre kullanıcıyı getirir (token'dan gelen Id ile)
        public Task<User> GetByIdAsync(int id) =>
            QuerySingleOrDefaultAsync<User>(
                "SELECT * FROM Users WHERE Id = @Id",
                new { Id = id })!;
    }
}