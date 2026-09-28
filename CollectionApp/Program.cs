using CollectionApp.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddScoped<ItemRepository>();
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<WatchlistRepository>();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();
builder.Services.AddScoped<CustomListRepository>();
builder.Services.AddScoped<GoalRepository>();

// React'in çalıştığı adresten gelen isteklere izin veriyoruz
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseDefaultFiles();   // "/" adresine wwwroot/index.html'i verir
app.UseStaticFiles();    // wwwroot içindeki JS, CSS, görselleri sunar

app.UseCors("AllowReactApp");   // CORS politikasını devreye sokuyor

app.UseAuthorization();

app.MapControllers();

app.Run();