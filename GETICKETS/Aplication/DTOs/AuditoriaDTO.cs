using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.DTOs
{
    public class AuditoriaDTO
    {
        public int IdAuditoria { get; set; }
        public string? Accion { get; set; }
        public string? Descripcion { get; set; }
        public DateTime FechaAccion { get; set; }
       


        //Lista
        public string? Ticket { get; set; }
        public string? Responsable { get; set; }
    }
}
