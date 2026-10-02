using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

// TMDB (film/dizi/anime) ve OpenLibrary (kitap) API'lerinden kapak+özet çeken controller.
// Aynı arama tekrar yapılırsa sonuç dış API yerine sunucu hafızasından (önbellek) gelir.

namespace CollectionApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]   // sadece giriş yapmış kullanıcılar arama yapabilsin (TMDB anahtarımız korunsun)
    public class SearchController : ControllerBase
    {
        // Önbellekteki sonuçlar bu süre sonunda silinir, sonraki aramada taze veri gelir
        private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(12);

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration; // appsettings.json'daki TmdbApiKey'e erişmek için
        private readonly IMemoryCache _cache;
        private readonly ILogger<SearchController> _logger;

        public SearchController(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IMemoryCache cache,
            ILogger<SearchController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _cache = cache;
            _logger = logger;
        }

        // Frontend'e dönecek sonuçların ortak şekli (hem film hem kitap için)
        public class SearchResult
        {
            public string Title { get; set; } = "";
            public string? Year { get; set; }
            public string? ImageUrl { get; set; }
            public string? Description { get; set; }
        }

        // Film/Dizi/Anime/Belgesel/Animasyon araması için TMDB kullanıyoruz
        [HttpGet("movie")]
        public async Task<IActionResult> SearchMovie([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest(new { message = "Arama metni boş olamaz." });

            // "Dune", " dune " ve "DUNE" aynı arama sayılsın diye anahtarı normalize ediyoruz
            string cacheKey = $"search:movie:{query.Trim().ToLowerInvariant()}";

            if (_cache.TryGetValue(cacheKey, out List<SearchResult>? cached))
            {
                _logger.LogInformation("Önbellekten geldi: {Key}", cacheKey);
                return Ok(cached);
            }

            var results = await FetchMoviesAsync(query);
            if (results == null)
                return StatusCode(502, new { message = "Film arama servisine şu an ulaşılamıyor." });

            _cache.Set(cacheKey, results, CacheDuration);
            _logger.LogInformation("TMDB'den geldi ve önbelleğe alındı: {Key}", cacheKey);
            return Ok(results);
        }

        // Kitap araması için OpenLibrary kullanıyoruz (anahtar gerekmiyor)
        [HttpGet("book")]
        public async Task<IActionResult> SearchBook([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest(new { message = "Arama metni boş olamaz." });

            string cacheKey = $"search:book:{query.Trim().ToLowerInvariant()}";

            if (_cache.TryGetValue(cacheKey, out List<SearchResult>? cached))
            {
                _logger.LogInformation("Önbellekten geldi: {Key}", cacheKey);
                return Ok(cached);
            }

            var results = await FetchBooksAsync(query);
            if (results == null)
                return StatusCode(502, new { message = "Kitap arama servisine şu an ulaşılamıyor." });

            _cache.Set(cacheKey, results, CacheDuration);
            _logger.LogInformation("OpenLibrary'den geldi ve önbelleğe alındı: {Key}", cacheKey);
            return Ok(results);
        }

        // TMDB'ye istek atar. Servis hata verirse null döner (hatalı cevap önbelleğe alınmasın diye)
        private async Task<List<SearchResult>?> FetchMoviesAsync(string query)
        {
            var apiKey = _configuration["TmdbApiKey"];
            var client = _httpClientFactory.CreateClient();
            var url = $"https://api.themoviedb.org/3/search/multi?api_key={apiKey}&query={Uri.EscapeDataString(query)}&language=tr-TR";

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("TMDB hata döndü: {StatusCode}", response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json); // TMDB'nin ham JSON cevabını ayrıştırıyoruz

            var results = new List<SearchResult>();
            foreach (var item in doc.RootElement.GetProperty("results").EnumerateArray())
            {
                var mediaType = item.GetProperty("media_type").GetString();
                if (mediaType != "movie" && mediaType != "tv") continue; // sadece film/dizi sonuçlarını al

                // film ve dizide başlık alanının adı farklı (title vs name)
                string title = mediaType == "movie"
                    ? item.GetProperty("title").GetString() ?? ""
                    : item.GetProperty("name").GetString() ?? "";

                string? posterPath = item.TryGetProperty("poster_path", out var pp) && pp.ValueKind != JsonValueKind.Null
                    ? pp.GetString()
                    : null;

                string? overview = item.TryGetProperty("overview", out var ov) ? ov.GetString() : null;

                // film ve dizide tarih alanının adı da farklı (release_date vs first_air_date)
                string? dateStr = mediaType == "movie"
                    ? (item.TryGetProperty("release_date", out var rd) ? rd.GetString() : null)
                    : (item.TryGetProperty("first_air_date", out var fd) ? fd.GetString() : null);

                // tarihin ilk 4 karakteri (yıl) alınıyor
                string? year = !string.IsNullOrEmpty(dateStr) && dateStr.Length >= 4 ? dateStr.Substring(0, 4) : null;

                results.Add(new SearchResult
                {
                    Title = title,
                    Year = year,
                    ImageUrl = posterPath != null ? $"https://image.tmdb.org/t/p/w342{posterPath}" : null,
                    Description = overview
                });

                if (results.Count >= 8) break; // en fazla 8 sonuç döndür
            }

            return results;
        }

        // OpenLibrary'ye istek atar. Servis hata verirse null döner
        private async Task<List<SearchResult>?> FetchBooksAsync(string query)
        {
            var client = _httpClientFactory.CreateClient();
            var url = $"https://openlibrary.org/search.json?q={Uri.EscapeDataString(query)}&limit=8";

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("OpenLibrary hata döndü: {StatusCode}", response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var results = new List<SearchResult>();
            foreach (var item in doc.RootElement.GetProperty("docs").EnumerateArray())
            {
                string title = item.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "";

                // yazar bilgisi bir liste olarak geliyor, ilkini alıyoruz
                string? author = null;
                if (item.TryGetProperty("author_name", out var authors) && authors.GetArrayLength() > 0)
                {
                    author = authors[0].GetString();
                }

                int? coverId = item.TryGetProperty("cover_i", out var ci) && ci.ValueKind == JsonValueKind.Number
                    ? ci.GetInt32()
                    : (int?)null;

                string? year = item.TryGetProperty("first_publish_year", out var fy) && fy.ValueKind == JsonValueKind.Number
                    ? fy.GetInt32().ToString()
                    : null;

                results.Add(new SearchResult
                {
                    Title = title,
                    Year = year,
                    // kapak görseli, cover Id üzerinden ayrı bir URL kalıbıyla oluşturuluyor
                    ImageUrl = coverId != null ? $"https://covers.openlibrary.org/b/id/{coverId}-M.jpg" : null,
                    // kitapta "özet" alanı olmadığı için yazar bilgisini description gibi kullanıyoruz
                    Description = author != null ? $"Yazar: {author}" : null
                });

                if (results.Count >= 8) break;
            }

            return results;
        }
    }
}