namespace CollectionApp.Middleware
{
    // Uygulamadaki tüm yakalanmamış hataları tek yerde yakalar, loglar ve düzgün JSON döndürür
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;   // zincirdeki bir sonraki adım
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddleware> logger,
            IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // İsteği normal şekilde devam ettir (controller, repository...)
                await _next(context);
            }
            catch (Exception ex)
            {
                // Hatayı hangi istekte olduğuyla birlikte logla
                _logger.LogError(ex, "Hata oluştu: {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;

                // Hata detayını sadece geliştirme ortamında göster,
                // canlıda kullanıcıya iç bilgileri sızdırmamak için gizle
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
                    detail = _env.IsDevelopment() ? ex.Message : null
                });
            }
        }
    }
}