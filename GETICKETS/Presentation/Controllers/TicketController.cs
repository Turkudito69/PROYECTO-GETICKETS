using Aplication.DTOs;
using Aplication.Services;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketController : ControllerBase
    {
        private readonly TicketServices _services;
        public TicketController(TicketServices services)
        {
            _services = services;
        }

        [HttpGet]
        public async Task<IActionResult> ListarTickets()
        {
            try
            {
                var lista = await _services.ListarTickets();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPost("Insertar ticket")]
        public async Task<IActionResult> InsertarTicket([FromBody] TicketDTO dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(new { msj = "El modelo no es válido" });
                await _services.NuevaTicket(dto);
                return StatusCode(201, "Ticket agregado correctamente");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("Asignar")]
        public async Task<IActionResult> AsignarTicket([FromBody] TicketDTO dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(new { msj = "El modelo no es válido" });
                await _services.AsignarTicket(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("IniciarAtencion")]
        public async Task<IActionResult> IniciarAtencion([FromBody] Ticket dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(new { msj = "El modelo no es válido" });
                await _services.IniciarAtencion(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("GuardarObservacion")]
        public async Task<IActionResult> GuardarObservacion([FromBody] Ticket dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(new { msj = "El modelo no es válido" });
                await _services.GuardarObservacion(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("Finalizar")]
        public async Task<IActionResult> FinalizarTicket([FromBody] Ticket dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(new { msj = "El modelo no es válido" });
                await _services.FinalizarTiket(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
