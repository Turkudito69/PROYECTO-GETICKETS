using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.DTOs
{
    public class DetalleTicketDTO
    {
        public int? IdTicket { get; set; }
        public string? CodigoTicket { get; set; }
        public string? Descripcion { get; set; }
        public string? Solicitante { get; set; }
        public string? Tecnico { get; set; }
        public string? Categoria { get; set; }
        public string? Prioridad { get; set; }
        public string? EstadoTicket { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaSolucion { get; set; }
    }
}
