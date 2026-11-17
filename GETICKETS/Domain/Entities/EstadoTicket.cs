using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class EstadoTicket
    {
        public int IdEstadoTicket { get; set; }
        public string? NombreEstado { get; set; }// Nombre del estado de la ticket
        public int IdEstado { get; set; }

        //Lista
        public string? Estado { get; set; }  //Nombre del estado activo , inactivo etc

    }
}
