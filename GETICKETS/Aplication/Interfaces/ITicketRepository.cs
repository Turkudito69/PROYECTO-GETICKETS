using Aplication.DTOs;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Interfaces
{
    public interface ITicketRepository
    {
        Task<IEnumerable<Ticket>> ListarTicketsAsync();
        Task<Ticket> NuevoTicketAsync(Ticket ticket);
        Task AsignarTicketAsync(Ticket ticket);
        Task IniciarAtencionAsync(Ticket ticket);
        Task GuardarObservacionAsync(Ticket ticket);
        Task FinalizarTicketAsync(Ticket ticket);
        Task ConfirmarCompletadoAsync(Ticket ticket);
        Task ReabrirTicketAsync(Ticket ticket);
    }
}
