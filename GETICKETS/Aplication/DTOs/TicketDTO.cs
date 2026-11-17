using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.DTOs
{
    public class TicketDTO
    {
        public int IdTicket { get; set; }
        public string? Descripcion { get; set; }
        public int IdUsuario { get; set; }
        public int IdTecnico { get; set; }
        public int IdCategoria { get; set; }
        public int IdPrioridad { get; set; }
        public DateTime FehaCreacion { get; set; }
        public int IdEstadoTicket { get; set; }
        public int CodigoTicket { get; set; }
        public string? Observacion { get; set; }
        public string? Diagnostico { get; set; }
        public string? Solucion { get; set; }


        //Lista
        public string? Tickets { get; set; }
        public string? Tecnico { get; set; }
        public string? Categoria { get; set; }
        public string? Prioridad { get; set; }
        public string? EstadoTicket { get; set; }
    }
}
