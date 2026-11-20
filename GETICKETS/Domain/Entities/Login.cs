using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Login
    {
        public int IdUsuario { get; set; }
        public int? IdTecnico { get; set; }
        public int IdRol { get; set; }
        public string? Correo { get; set; }
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public  string? Rol { get; set; }
        public string? FotoUrl { get; set; }
        public string? Contrasena { get; set; }
    }
}
