namespace CollectionApp.Dtos
{
    // Listelerim sayfasındaki kartlar için: liste bilgisi + öğe sayısı + ilk 4 kapak
    public class CustomListSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public int ItemCount { get; set; }
        public List<string> PreviewCovers { get; set; } = new();
    }
}