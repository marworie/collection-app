namespace CollectionApp.Models
{
    public class WatchlistItem
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public required string Category { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
