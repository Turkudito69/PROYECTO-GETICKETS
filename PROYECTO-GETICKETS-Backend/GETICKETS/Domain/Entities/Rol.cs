using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Rol
    {
        public int IdRol { get; set; }
        public string? NombreRol { get; set; }
        public int IdEstado { get; set; }
        //Lista
        public string? Estado { get; set; }  //Nombre del estado activo , inactivo etc


    }
}
