using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeguimientoTicketController : ControllerBase
    {
        private readonly SeguimientoTicketServices _services;

        public SeguimientoTicketController(SeguimientoTicketServices services)
        {
            _services = services;
        }

        [HttpGet("{idTicket}")]
        public async Task<IActionResult> ListarSeguimientos(string idTicket)
        {
            try
            {
                var lista = await _services.ListarSeguimiento(idTicket);
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}

