using System.ComponentModel.DataAnnotations;
using CollectionApp.Dtos;

namespace CollectionApp.Tests
{
    public class DtoValidationTests
    {
        // ASP.NET Core'un yaptığı doğrulamayı elle çalıştırıp hataları döndürür
        private static List<ValidationResult> Validate(object model)
        {
            var results = new List<ValidationResult>();
            Validator.TryValidateObject(model, new ValidationContext(model), results, validateAllProperties: true);
            return results;
        }

        // Her testte değiştirebileceğimiz geçerli bir başlangıç nesnesi
        private static ItemDto ValidItem() => new()
        {
            Title = "Dune",
            Type = "Kitap",
            Status = "Bitti",
            Rating = 4
        };

        // ============ ItemDto ============

        [Fact]
        public void ItemDto_GecerliVeri_HataYok()
        {
            Assert.Empty(Validate(ValidItem()));
        }

        [Fact]
        public void ItemDto_BosBaslik_Gecersiz()
        {
            var dto = ValidItem();
            dto.Title = "";

            Assert.Contains(Validate(dto), r => r.ErrorMessage == "Başlık zorunludur.");
        }

        [Fact]
        public void ItemDto_BilinmeyenTur_Gecersiz()
        {
            var dto = ValidItem();
            dto.Type = "Oyun";

            Assert.Contains(Validate(dto), r => r.ErrorMessage == "Geçersiz tür.");
        }

        // Theory: aynı testi farklı verilerle birden çok kez çalıştırır
        [Theory]
        [InlineData(-1)]
        [InlineData(5.5)]
        [InlineData(10)]
        public void ItemDto_AralikDisiPuan_Gecersiz(double rating)
        {
            var dto = ValidItem();
            dto.Rating = (decimal)rating;

            Assert.NotEmpty(Validate(dto));
        }

        [Fact]
        public void ItemDto_BitisBaslangictanOnce_Gecersiz()
        {
            var dto = ValidItem();
            dto.StartDate = new DateTime(2026, 5, 10);
            dto.EndDate = new DateTime(2026, 5, 1);

            Assert.Contains(Validate(dto), r => r.MemberNames.Contains(nameof(ItemDto.EndDate)));
        }

        [Fact]
        public void ItemDto_GelecekTarih_Gecersiz()
        {
            var dto = ValidItem();
            dto.EndDate = DateTime.Today.AddMonths(3);

            Assert.Contains(Validate(dto), r => r.ErrorMessage == "Bitiş tarihi gelecekte olamaz.");
        }

        [Fact]
        public void ItemDto_BugununTarihi_Gecerli()
        {
            var dto = ValidItem();
            dto.EndDate = DateTime.Today;

            Assert.Empty(Validate(dto));
        }

        // ============ RegisterDto ============

        [Theory]
        [InlineData("el")]         // çok kısa
        [InlineData("elif!")]      // yasak karakter
        [InlineData("elif ozen")]  // boşluk
        public void RegisterDto_GecersizKullaniciAdi_Hatali(string username)
        {
            var dto = new RegisterDto { Username = username, Password = "123456" };

            Assert.NotEmpty(Validate(dto));
        }

        [Theory]
        [InlineData("elif")]
        [InlineData("elif_02")]
        [InlineData("şükrü.can")]
        public void RegisterDto_GecerliKullaniciAdi_HataYok(string username)
        {
            var dto = new RegisterDto { Username = username, Password = "123456" };

            Assert.Empty(Validate(dto));
        }

        [Fact]
        public void RegisterDto_KisaSifre_Gecersiz()
        {
            var dto = new RegisterDto { Username = "elif", Password = "123" };

            Assert.Contains(Validate(dto), r => r.ErrorMessage == "Şifre en az 6 karakter olmalı.");
        }
    }
}