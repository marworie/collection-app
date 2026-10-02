using System.ComponentModel.DataAnnotations;
using CollectionApp.Models;

namespace CollectionApp.Dtos
{
    // Kullanıcının öğe eklerken/güncellerken gönderebileceği alanlar.
    // Id, UserId, RewatchCount, SortOrder, CreatedDate burada YOK → dışarıdan değiştirilemez.
    public class ItemDto : IValidatableObject
    {
        [Required(ErrorMessage = "Başlık zorunludur.")]
        [MaxLength(200, ErrorMessage = "Başlık en fazla 200 karakter olabilir.")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tür zorunludur")]
        [RegularExpression("^(Kitap|Dizi|Film|Belgesel|Animasyon|Anime)$",
            ErrorMessage = "Geçersiz tür.")]
        public string Type { get; set; } = string.Empty;

        [Required(ErrorMessage = "Durum zorunludur.")]
        [MaxLength(50)]
        public string Status { get; set; } = string.Empty;

        [Range(0, 5, ErrorMessage = "Puan 0 ile 5 arasında olmalı.")]
        public decimal? Rating { get; set; }

        [MaxLength(1000)]
        public string? CoverImageUrl { get; set; }

        [MaxLength(1000, ErrorMessage = "Not en fazla 1000 karakter olabilir.")]
        public string? Notes { get; set; }

        [MaxLength(5000)]
        public string? Description { get; set; }

        public bool IsFavorite { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        [MaxLength(100)]
        public string? Genre { get; set; }

        // Etiketlerle yazılamayan, birden fazla alanı ilgilendiren kurallar
        public IEnumerable<ValidationResult> Validate(ValidationContext context)
        {
            // Sunucu farklı saat diliminde olabilir, 1 günlük tolerans bırakıyoruz
            var latestAllowed = DateTime.Today.AddDays(1);

            if (StartDate.HasValue && StartDate.Value.Date > latestAllowed)
            {
                yield return new ValidationResult(
                    "Başlangıç tarihi gelecekte olamaz.",
                    new[] { nameof(StartDate) });
            }

            if (EndDate.HasValue && EndDate.Value.Date > latestAllowed)
            {
                yield return new ValidationResult(
                    "Bitiş tarihi gelecekte olamaz.",
                    new[] { nameof(EndDate) });
            }

            if (StartDate.HasValue && EndDate.HasValue && EndDate < StartDate)
            {
                yield return new ValidationResult(
                    "Bitiş tarihi başlangıç tarhinden önce olamaz.",
                    new[] { nameof(EndDate) });
            }
        }

        // DTO → Item dönüşümü (repository hâlâ Item bekliyor)
        public Item ToItem() => new Item
        {
            Title = Title.Trim(),
            Type = Type,
            Status = Status,
            Rating = Rating,
            CoverImageUrl = CoverImageUrl,
            Notes = Notes,
            Description = Description,
            IsFavorite = IsFavorite,
            StartDate = StartDate,
            EndDate = EndDate,
            Genre = Genre
        };
    }
}