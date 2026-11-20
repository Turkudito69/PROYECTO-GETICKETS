using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TecnicoController : ControllerBase
    {
        private readonly TecnicoServices _services;

        public TecnicoController(TecnicoServices services)
        {
            _services = services;
        }

        [HttpGet]
        public async Task<IActionResult> ListarTecnicos()
        {
            try
            {
                var lista = await _services.ListarTecnicos();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPost]
        [HttpPost("Insertar tecnico")]
        public async Task<IActionResult> InsertarTecnico([FromBody] TecnicoDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { msj = "El modelo no es válido" });

                var idTecnico = await _services.NuevoTecnico(dto);
                return StatusCode(201, new { mensaje = "Técnico agregado correctamente.", idTecnico });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("Editar/{id}")]
        public async Task<IActionResult> EditarTecnico(int id, [FromBody] TecnicoDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { msj = "El modelo no es válido" });

                if (dto.IdTecnico != 0 && id != dto.IdTecnico)
                    return BadRequest(new { msj = "El id no coincide" });
                dto.IdTecnico = id;

                await _services.EditarTecnico(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpDelete("Eliminar/{id}")]
        public async Task<IActionResult> EliminarTecnico(int id)
        {
            try
            {
                await _services.EliminarTecnico(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
