using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Interfaces
{
    public interface IEstadoTicketRepository
    {
        Task<IEnumerable<EstadoTicket>> ListarEstadosTicketAsync();
        Task EditarEstadoTicketAsync(EstadoTicket estadoTicket);
        Task NuevoEstadoTicketAsync(EstadoTicket estadoTicket);
        Task EliminarEstadosTicketAsync(int id);
    }
}
