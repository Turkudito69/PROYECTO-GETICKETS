using Aplication.DTOs;
using Aplication.Interfaces;
using Domain.Entities;
using System.Net;

namespace Aplication.Services
{
    public class TicketServices
    {
        private readonly ITicketRepository _Repository;

        public TicketServices(ITicketRepository repository)
        {
            _Repository = repository;
        }
        public async Task<IEnumerable<TicketDTO>> ListarTickets()
        {
            var listar = await _Repository.ListarTicketsAsync();

            return listar.Select(a => new TicketDTO
            {
                IdTicket = a.IdTicket,
                Tickets = a.Tickets,
                Descripcion = a.Descripcion,
                Tecnico = a.Tecnico,
                Categoria = a.Categoria,
                Prioridad = a.Prioridad,
                EstadoTicket = a.EstadoTicket,
                FehaCreacion = a.FehaCreacion,
            });
        }
        public async Task NuevaTicket(TicketDTO Dts)
        {
            var oTicket = new Ticket
            {
                Descripcion = Dts.Descripcion,
                IdUsuario = Dts.IdUsuario,
                IdCategoria = Dts.IdCategoria,
                IdPrioridad = Dts.IdPrioridad,
                Categoria = Dts.Categoria,
                Prioridad = Dts.Prioridad,
                EstadoTicket = Dts.EstadoTicket,
            };
            await _Repository.NuevoTicketAsync(oTicket);
        }
        public async Task AsignarTicket(TicketDTO Dts)
        {
            var oTicket = new Ticket
            {
                IdTicket = Dts.IdTicket,
                IdTecnico = Dts.IdTecnico,
                Tecnico = Dts.Tecnico,
                IdUsuario = Dts.IdUsuario,
            };
            await _Repository.AsignarTicketAsync(oTicket);
        }
        public async Task IniciarAtencion(Ticket Dts)
        {
            var oTicket = new Ticket
            {
                IdTicket = Dts.IdTicket,
                IdUsuario = Dts.IdUsuario,
            };
            await _Repository.IniciarAtencionAsync(oTicket);
        }
        public async Task GuardarObservacion(Ticket Dts)
        {
            var oTicket = new Ticket
            {
                IdTicket = Dts.IdTicket,
                IdUsuario = Dts.IdUsuario,
                Observacion = Dts.Observacion
            };
            await _Repository.GuardarObservacionAsync(oTicket);
        }
        public async Task FinalizarTiket(Ticket Dts)
        {
            var oTicket = new Ticket
            {
                IdTicket = Dts.IdTicket,
                IdUsuario = Dts.IdUsuario,
                Diagnostico = Dts.Diagnostico,
                Solucion = Dts.Solucion,
            };
            await _Repository.FinalizarTicketAsync(oTicket);
        }
    }

}

