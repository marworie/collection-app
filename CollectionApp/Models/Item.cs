using System.Globalization;

namespace CollectionApp.Models
{
    public class Item
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Type { get; set; }
        public string Status { get; set; }
        public decimal? Rating { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? Notes { get; set; }
        public string? Description { get; set; }   // API'den gelen uzuzn özet
        public DateTime CreatedDate { get; set; }
        public bool IsFavorite { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Genre { get; set; }
        public int RewatchCount { get; set; }
        public int SortOrder { get; set; }
    }
}
