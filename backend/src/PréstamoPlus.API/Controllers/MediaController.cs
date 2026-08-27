using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = AuthorizationPolicies.ReadPii)]
    public class MediaController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public MediaController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpGet("{fileName}")]
        public IActionResult GetFile(string fileName)
        {
            var uploadsRoot = Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", "..", "uploads"));
            var safeName = Path.GetFileName(fileName);
            if (string.IsNullOrWhiteSpace(fileName) || !string.Equals(fileName, safeName, StringComparison.Ordinal))
                return BadRequest(new { message = "Nombre de archivo inválido." });

            var filePath = Path.Combine(uploadsRoot, safeName);
            if (!System.IO.File.Exists(filePath))
                return NotFound();

            var extension = Path.GetExtension(fileName).ToLower();
            var contentType = extension switch
            {
                ".webm" => "video/webm",
                ".mp4" => "video/mp4",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".pdf" => "application/pdf",
                _ => null
            };

            if (contentType is null)
                return BadRequest(new { message = "Tipo de archivo no permitido." });

            return PhysicalFile(filePath, contentType);
        }
    }
}
