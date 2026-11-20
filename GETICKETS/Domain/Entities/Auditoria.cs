using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Auditoria
    {
        public int IdAuditoria { get; set; }
        public int IdTicket { get; set; }
        public int IdUsuario { get; set; }
        public string? Accion { get; set; }
        public string? Descripcion { get; set; }
        public DateTime FechaAccion { get; set; }


        //Lista
        public string? Ticket { get; set; }
        public string? Responsable { get; set; }


    }
}
