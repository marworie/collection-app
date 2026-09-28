namespace CollectionApp.Models
{
    public class CustomList
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public string Icon { get; set; } = "🏷️";
        public DateTime CreatedDate { get; set; }
    }
}
