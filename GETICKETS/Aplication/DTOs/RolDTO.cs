using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.DTOs
{
    public class RolDTO
    {
        public int IdRol { get; set; }
        public string? NombreRol { get; set; }
        public int IdEstado { get; set; }
        //Lista
        public string? Estado { get; set; }  //Nombre del estado activo , inactivo etc
    }
}
