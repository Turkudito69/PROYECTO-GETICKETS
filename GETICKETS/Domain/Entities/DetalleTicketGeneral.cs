using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class DetalleTicketGeneral
    {
        public int IdDetalleTicket { get; set; }
        public int IdTicket { get; set; }
        public string? Diagnostico { get; set; }
        public string? Observaciones { get; set; }
        public string? Solucion { get; set; }
        //Lista
        public string? Ticket { get; set; }
    }
}
