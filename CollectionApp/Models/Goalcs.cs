namespace CollectionApp.Models
{
    public class Goal
    {
        public int Id { get; set; }
        public int Year { get; set; }
        public required string Type { get; set; } //kitap film .. veya hepsi
        public int Target { get; set; } // hedeflenen sayi

    }
}