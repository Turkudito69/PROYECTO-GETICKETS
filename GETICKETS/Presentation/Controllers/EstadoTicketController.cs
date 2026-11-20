using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EstadoTicketController : ControllerBase
    {
        private readonly EstadoTicketServices _services;

        public EstadoTicketController(EstadoTicketServices services)
        {
            _services = services;
        }

        [HttpGet]
        public async Task<IActionResult> ListarEstadosTicket()
        {
            try
            {
                var lista = await _services.ListarEstadosTicket();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPost("Insertar estado")]
        public async Task<IActionResult> InsertarEstadoTicket([FromBody] EstadoTicketDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { msj = "El modelo no es válido" });

                await _services.NuevoEstadoTicket(dto);
                return StatusCode(201, "Estado de ticket agregado correctamente");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("Editar/{id}")]
        public async Task<IActionResult> EditarEstadoTicket(int id, [FromBody] EstadoTicketDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { msj = "El modelo no es válido" });

                if (id != dto.IdEstadoTicket)
                    return BadRequest(new { msj = "El id no coincide" });

                await _services.EditarEstadoTicket(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpDelete("Eliminar/{id}")]
        public async Task<IActionResult> EliminarEstadoTicket(int id)
        {
            try
            {
                await _services.EliminarEstadoTicket(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
