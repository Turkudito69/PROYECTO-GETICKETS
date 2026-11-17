using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.DTOs
{
    public class EstadoTicketDTO
    {
        public int IdEstadoTicket { get; set; }
        public string? NombreEstado { get; set; }// Nombre del estado de la ticket
        public int IdEstado { get; set; }

        //Lista
        public string? Estado { get; set; }  //Nombre del estado activo , inactivo etc
    }
}
