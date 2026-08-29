using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.Common;
using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = AuthorizationPolicies.ReadPii)]
    public class MediaController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly ApplicationDbContext _db;

        public MediaController(IWebHostEnvironment env, ApplicationDbContext db)
        {
            _env = env;
            _db = db;
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

        [HttpPost("loan-application/{applicationId}/contract")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> UploadContract(Guid applicationId, IFormFile file, CancellationToken cancellationToken)
        {
            if (file is null || file.Length == 0 || file.Length > 10 * 1024 * 1024)
                return BadRequest(new { message = "Adjunta un archivo de hasta 10 MB." });
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowed = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
            if (!allowed.Contains(extension)) return BadRequest(new { message = "Solo se permiten PDF, JPG o PNG." });
            var application = await _db.LoanApplications.Include(x => x.VerificationMedia).FirstOrDefaultAsync(x => x.Id == applicationId, cancellationToken);
            if (application is null) return NotFound();
            var uploadsRoot = Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", "..", "uploads"));
            Directory.CreateDirectory(uploadsRoot);
            var fileName = $"{applicationId}_contrato_{Guid.NewGuid():N}{extension}";
            await using (var stream = System.IO.File.Create(Path.Combine(uploadsRoot, fileName))) await file.CopyToAsync(stream, cancellationToken);
            application.VerificationMedia ??= new Domain.Entities.VerificationMedia { Id = Guid.NewGuid(), LoanApplicationId = applicationId };
            application.VerificationMedia.ContratoPath = fileName;
            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { fileName });
        }
    }
}
