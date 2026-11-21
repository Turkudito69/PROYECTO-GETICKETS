using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.DTOs
{
    public class LoginResponseDTO
    {
       public int IdUsuario { get; set; }
       public string? Nombre { get; set; }
            public string? Apellido { get; set; }
            public string? Rol { get; set; }
       
    }
}
