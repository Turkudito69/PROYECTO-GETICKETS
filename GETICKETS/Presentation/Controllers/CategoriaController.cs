using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriaController : ControllerBase
    {
        private readonly CategoriaServices _services;
        public CategoriaController(CategoriaServices services)
        {
            _services = services;
        }

        [HttpGet]
        public async Task<IActionResult> ListarCategorias()
        {
            try
            {
                var lista = await _services.ListarCategorias();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPost("Insertar categoria")]
        public async Task<IActionResult> InsertarCategoria([FromBody] CategoriaDTO dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(new { msj = "El modelo no es válido" });
                await _services.NuevaCategoria(dto);
                return StatusCode(201, "Categoría agregada correctamente");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("Editar/{id}")]
        public async Task<IActionResult> EditarCategoria(int id, [FromBody] CategoriaDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { msj = "El modelo no es válido" });

                if (id != dto.IdCategoria)
                    return BadRequest(new { msj = "El id no coincide" });
                await _services.EditarCategoria(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpDelete("Eliminar/{id}")]
        public async Task<IActionResult> EliminarCategoria(int id)
        {
            try
            {
                await _services.EliminarCategoria(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
