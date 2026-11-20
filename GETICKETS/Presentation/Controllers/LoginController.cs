using Aplication.DTOs;
using Aplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LoginController : ControllerBase
    {
        private readonly LoginServices _services;

        public LoginController(LoginServices services)
        {
            _services = services;
        }

        [HttpPost]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { msj = "El modelo no es válido" });

                var usuario = await _services.LoginAsync(dto);
                if (usuario is null)
                    return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });

                return Ok(new
                {
                    mensaje = "Inicio de sesión correcto.",
                    usuario
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }
}
