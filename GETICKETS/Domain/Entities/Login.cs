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
        public string? Correo { get; set; }
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public  string? Rol { get; set; }
        public string? Contrasena { get; set; }
    }
}
