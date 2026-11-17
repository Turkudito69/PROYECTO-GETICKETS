using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.DTOs
{
    public class SeguimientoTicketDTO
    {
        public int IdSeguimientoTicket { get; set; }
        public string? Titulo { get; set; }
        public DateTime FechaSeguimiento { get; set; }

        //Lista
        public string? CodigoTicket { get; set; }
        public string? Responsable { get; set; }
        public string? Descripsion { get; set; }
    }
}
