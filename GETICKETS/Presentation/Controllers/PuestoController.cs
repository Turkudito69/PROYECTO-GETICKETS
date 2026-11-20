using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PuestoController : ControllerBase
    {
        private readonly PuestoServices _services;

        public PuestoController(PuestoServices services)
        {
            _services = services;
        }

        [HttpGet]
        public async Task<IActionResult> ListarPuestos()
        {
            try
            {
                return Ok(await _services.ListarPuestos());
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpGet("Historial")]
        [HttpGet("Historial/{idPuesto:int}")]
        public async Task<IActionResult> ListarHistorial(int? idPuesto)
        {
            try
            {
                return Ok(await _services.ListarHistorial(idPuesto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> NuevoPuesto([FromBody] PuestoDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { msj = "El modelo no es válido." });

                var puesto = await _services.NuevoPuesto(dto);
                return StatusCode(201, new
                {
                    mensaje = "Puesto creado correctamente.",
                    idPuesto = puesto.IdPuesto,
                    codigoPuesto = puesto.CodigoPuesto
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { msj = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("Asignar")]
        public async Task<IActionResult> AsignarPuesto([FromBody] AsignarPuestoDTO dto)
        {
            try
            {
                await _services.AsignarPuesto(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
