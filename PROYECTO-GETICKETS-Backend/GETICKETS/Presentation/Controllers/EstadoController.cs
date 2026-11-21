using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EstadoController : ControllerBase
    {
        private readonly EstadoServices _services;
        public EstadoController(EstadoServices services)
        {
            _services = services;
        }

        [HttpGet]
        public async Task<IActionResult> ListarEstados()
        {
            try
            {
                var lista = await _services.ListarEstados();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPost("Insertar estado")]
        public async Task<IActionResult> InsertarEstado([FromBody] EstadoDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { msj = "El modelo no es válido" });

                await _services.NuevaEstado(dto);
                return StatusCode(201, "Estado agregado correctamente");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("Editar/{id}")]
        public async Task<IActionResult> EditarEstado(int id, [FromBody] EstadoDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { msj = "El modelo no es válido" });

                if (id != dto.IdEstado)
                    return BadRequest(new { msj = "El id no coincide" });

                await _services.EditarEstado(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpDelete("Eliminar/{id}")]
        public async Task<IActionResult> EliminarEstado(int id)
        {
            try
            {
                await _services.EliminarEstado(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
