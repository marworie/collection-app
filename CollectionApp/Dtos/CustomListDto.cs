using System.ComponentModel.DataAnnotations;

namespace CollectionApp.Dtos
{
    // Liste oluştururken ve düzenlerken gönderilen veri
    public class CustomListDto
    {
        [Required(ErrorMessage = "Liste adı zorunludur.")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "Liste adı en fazla 50 karakter olabilir.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(10)]
        public string Icon { get; set; } = "🏷️";
    }
}
