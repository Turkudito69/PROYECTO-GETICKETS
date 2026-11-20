using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.DTOs
{
    public class PrioridadDTO
    {
        public int IdPrioridad { get; set; }
        public string? NombrePrioridad { get; set; }
        public int IdEstado { get; set; }

        public string? Estado { get; set; }  //Nombre del estado activo , inactivo etc

    }
}
