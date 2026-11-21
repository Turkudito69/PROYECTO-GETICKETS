using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DetalleTicketController : ControllerBase
    {
        private readonly DetalleTicketServices _services;

        public DetalleTicketController(DetalleTicketServices services)
        {
            _services = services;
        }

        [HttpGet("{idTicket}")]
        public async Task<IActionResult> ListarDetallesTicket(string idTicket)
        {
            try
            {
                var lista = await _services.ListarDetallesTicketAsync(idTicket);
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
