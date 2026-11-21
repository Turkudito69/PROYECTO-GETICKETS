using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DetalleTicketGeneralController : ControllerBase
    {
        private readonly DTGeneralSevices _services;

        public DetalleTicketGeneralController(DTGeneralSevices services)
        {
            _services = services;
        }

        [HttpGet]
        public async Task<IActionResult> ListarDetalleTicketGeneral()
        {
            try
            {
                var lista = await _services.ListarDetallesTicketAsync();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
