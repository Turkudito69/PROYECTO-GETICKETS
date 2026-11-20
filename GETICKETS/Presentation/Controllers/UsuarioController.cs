using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private readonly UsuarioServices _services;
        public UsuarioController(UsuarioServices services)
        {
            _services = services;
        }

        [HttpGet]
        public async Task<IActionResult> ListarUsuarios()
        {
            try
            {
                var lista = await _services.ListarUsuarios();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPost]
        [HttpPost("Insertar usuario")]
        public async Task<IActionResult> InsertarUsuario([FromBody] UsuarioDTO dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(new { msj = "El modelo no es válido" });
                var creado = await _services.NuevoUsuario(dto);
                return StatusCode(201, new
                {
                    mensaje = "Usuario agregado correctamente.",
                    idUsuario = creado.IdUsuario,
                    idPuesto = creado.IdPuesto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("Foto/{id}")]
        public async Task<IActionResult> ActualizarFotoUsuario(int id, [FromBody] UsuarioDTO dto)
        {
            try
            {
                await _services.ActualizarFotoUsuario(id, dto.FotoUrl);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("Editar/{id}")]
        public async Task<IActionResult> EditarUsuario(int id, [FromBody] UsuarioDTO dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(new { msj = "El modelo no es válido" });
                if (dto.IdUsuario != 0 && id != dto.IdUsuario)
                    return BadRequest(new { msj = "El id no coincide" });
                dto.IdUsuario = id;
                await _services.EditarUsuario(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpDelete("Eliminar/{id}")]
        public async Task<IActionResult> EliminarUsuario(int id)
        {
            try
            {
                await _services.EliminarUsuario(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
