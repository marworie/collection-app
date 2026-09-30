using System.Security.Claims;
using CollectionApp.Controllers;
using CollectionApp.Dtos;
using CollectionApp.Models;
using CollectionApp.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace CollectionApp.Tests
{
    public class ItemsControllerTests
    {
        private const int UserId = 42;

        // Sahte repo: veritabanına gitmez, ne döndüreceğini testte biz söyleriz
        private readonly Mock<IItemRepository> _repoMock = new();

        // Controller'ı, token'ında UserId = 42 olan giriş yapmış bir kullanıcıyla oluşturur
        private ItemsController CreateController()
        {
            var controller = new ItemsController(_repoMock.Object);

            var identity = new ClaimsIdentity(
                new[] { new Claim(ClaimTypes.NameIdentifier, UserId.ToString()) }, "Test");

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            };
            return controller;
        }

        [Fact]
        public async Task GetAll_TokendakiKullanicininOgeleriniDondurur()
        {
            var items = new List<Item> { new() { Id = 1, Title = "Dune", Type = "Kitap", Status = "Bitti" } };
            _repoMock.Setup(r => r.GetAllAsync(UserId)).ReturnsAsync(items);

            var result = await CreateController().GetAll();

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(items, ok.Value);
            // Repository'ye token'daki Id ile gidildi mi?
            _repoMock.Verify(r => r.GetAllAsync(UserId), Times.Once);
        }

        [Fact]
        public async Task GetById_OgeYoksa_NotFound()
        {
            _repoMock.Setup(r => r.GetByIdAsync(99, UserId)).ReturnsAsync((Item?)null);

            var result = await CreateController().GetById(99);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task GetById_OgeVarsa_Ok()
        {
            var item = new Item { Id = 5, Title = "Frieren", Type = "Anime", Status = "İzliyorum" };
            _repoMock.Setup(r => r.GetByIdAsync(5, UserId)).ReturnsAsync(item);

            var result = await CreateController().GetById(5);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Same(item, ok.Value);
        }

        [Fact]
        public async Task Create_OgeyiDogruKullaniciyaEkler_VeBasligiKirpar()
        {
            var dto = new ItemDto { Title = "  Dune  ", Type = "Kitap", Status = "Bitti" };
            _repoMock.Setup(r => r.AddAsync(It.IsAny<Item>(), UserId)).ReturnsAsync(7);

            var result = await CreateController().Create(dto);

            var created = Assert.IsType<CreatedAtActionResult>(result);
            var item = Assert.IsType<Item>(created.Value);
            Assert.Equal(7, item.Id);
            Assert.Equal("Dune", item.Title);   // baştaki/sondaki boşluklar silinmiş olmalı
            _repoMock.Verify(r => r.AddAsync(It.Is<Item>(i => i.Title == "Dune"), UserId), Times.Once);
        }

        [Fact]
        public async Task Delete_BaskasininOgesi_NotFound()
        {
            // Repository false döner: bu Id bu kullanıcıya ait değil
            _repoMock.Setup(r => r.DeleteAsync(5, UserId)).ReturnsAsync(false);

            var result = await CreateController().Delete(5);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Delete_KendiOgesi_NoContent()
        {
            _repoMock.Setup(r => r.DeleteAsync(5, UserId)).ReturnsAsync(true);

            var result = await CreateController().Delete(5);

            Assert.IsType<NoContentResult>(result);
        }
    }
}