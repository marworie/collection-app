using System.ComponentModel.DataAnnotations;

namespace CollectionApp.Dtos
{
    // İzleme/Okuma listesine eklenen öğe
    public class WatchlistItemDto
    {
        [Required(ErrorMessage = "Başlık zorunludur.")]
        [StringLength(200, MinimumLength = 1, ErrorMessage = "Başlık en fazla 200 karakter olabilir.")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Kategori zorunludur.")]
        [RegularExpression("^(İzleme|Okuma)$", ErrorMessage = "Geçersiz kategori.")]
        public string Category { get; set; } = string.Empty;
    }
}