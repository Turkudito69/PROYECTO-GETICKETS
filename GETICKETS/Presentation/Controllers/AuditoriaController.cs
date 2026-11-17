using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditoriaController : ControllerBase
    {
        private readonly AuditoriaServices _services;

        public AuditoriaController(AuditoriaServices services)
        {
            _services = services;
        }

        [HttpGet]
        public async Task<IActionResult> ListarAuditoria()
        {
            try
            {
                var lista = await _services.ListarAuditoria();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
