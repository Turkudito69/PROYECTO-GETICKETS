using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class SeguimientoTicket
    {
        public int IdSeguimientoTicket { get; set; }
        public int IdTicket { get; set; }
        public int IdUsuario { get; set; }
        public string? Titulo { get; set; }
        public DateTime FechaSeguimiento { get; set; }

        //Lista
        public string? CodigoTicket { get; set; }  
        public string? Responsable { get; set; } 
        public string? Descripsion { get; set; }

    }
}
