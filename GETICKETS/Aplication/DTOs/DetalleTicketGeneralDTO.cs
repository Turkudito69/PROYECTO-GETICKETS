using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.DTOs
{
    public class DetalleTicketGeneralDTO
    {
        public int IdDetalleTicket { get; set; }
        
        public string? Diagnostico { get; set; }
        public string? Solucion { get; set; }
        //Lista
        public string? Ticket { get; set; }
    }
}
