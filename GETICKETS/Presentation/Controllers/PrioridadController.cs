using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PrioridadController : ControllerBase
    {
        private readonly PrioridadServices _services;

        public PrioridadController(PrioridadServices services)
        {
            _services = services;
        }

        [HttpGet]
        public async Task<IActionResult> ListarPrioridades()
        {
            try
            {
                var lista = await _services.ListarPrioridades();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPost]
        [HttpPost("Insertar prioridad")]
        public async Task<IActionResult> InsertarPrioridad([FromBody] PrioridadDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { msj = "El modelo no es válido" });

                var idPrioridad = await _services.NuevaPrioridad(dto);
                return StatusCode(201, new { mensaje = "Prioridad agregada correctamente.", idPrioridad });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("Editar/{id}")]
        public async Task<IActionResult> EditarPrioridad(int id, [FromBody] PrioridadDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { msj = "El modelo no es válido" });

                if (dto.IdPrioridad != 0 && id != dto.IdPrioridad)
                    return BadRequest(new { msj = "El id no coincide" });
                dto.IdPrioridad = id;

                await _services.EditarPrioridad(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpDelete("Eliminar/{id}")]
        public async Task<IActionResult> EliminarPrioridad(int id)
        {
            try
            {
                await _services.EliminarPrioridad(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
