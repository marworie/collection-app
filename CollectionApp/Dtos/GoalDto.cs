using System.ComponentModel.DataAnnotations;

namespace CollectionApp.Dtos
{
    // Yıllık hedef koyma/güncelleme isteği
    public class GoalDto
    {
        [Range(2000, 2100, ErrorMessage = "Geçersiz yıl.")]
        public int Year { get; set; }

        [Required(ErrorMessage = "Tür zorunludur.")]
        [RegularExpression("^(Hepsi|Kitap|Dizi|Film|Belgesel|Animasyon|Anime)$",
            ErrorMessage = "Geçersiz tür.")]
        public string Type { get; set; } = string.Empty;

        [Range(1, 1000, ErrorMessage = "Hedef 1 ile 1000 arasında olmalı.")]
        public int Target { get; set; }
    }
}