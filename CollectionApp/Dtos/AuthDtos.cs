using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace CollectionApp.Dtos
{
    // Kullanıcı adı kuralları tek yerde: değişirse sadece burayı düzenleriz
    public static class UsernameRules
    {
        public const string Pattern = @"^[a-zA-Z0-9_.çğıöşüÇĞİÖŞÜ]+$";
        public const string PatternMessage = "Kullanıcı adında sadece harf, rakam, nokta ve _ olabilir.";
    }

    public class RegisterDto
    {
        [Required(ErrorMessage = "Kullanıcı adı zorunludur.")]
        [StringLength(30, MinimumLength = 3, ErrorMessage = "Kullanıcı adı 3-30 karakter olmalı.")]
        [RegularExpression(UsernameRules.Pattern, ErrorMessage = UsernameRules.PatternMessage)]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre zorunludur.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifre en az 6 karakter olmalı.")]
        public string Password { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        [Required(ErrorMessage = "Kullanıcı adı zorunludur.")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre zorunludur.")]
        public string Password { get; set; } = string.Empty;
    }

    // Alanların hepsi isteğe bağlı: sadece gönderilen güncellenir
    public class UpdateProfileDto : IValidatableObject
    {
        public string? NewUsername { get; set; }
        public string? NewPassword { get; set; }

        [MaxLength(50)]
        public string? NewAvatarKey { get; set; }

        // Boş gönderilen alanlar "değiştirme" demek, sadece doluysa kontrol ediyoruz
        public IEnumerable<ValidationResult> Validate(ValidationContext context)
        {
            if (!string.IsNullOrWhiteSpace(NewUsername))
            {
                if (NewUsername.Length < 3 || NewUsername.Length > 30)
                {
                    yield return new ValidationResult(
                        "Kullanıcı adı 3-30 karakter olmalı.", new[] { nameof(NewUsername) });
                }

                if (!Regex.IsMatch(NewUsername, UsernameRules.Pattern))
                {
                    yield return new ValidationResult(
                        UsernameRules.PatternMessage, new[] { nameof(NewUsername) });
                }
            }

            if (!string.IsNullOrWhiteSpace(NewPassword) && NewPassword.Length < 6)
            {
                yield return new ValidationResult(
                    "Şifre en az 6 karakter olmalı.", new[] { nameof(NewPassword) });
            }
        }
    }
}