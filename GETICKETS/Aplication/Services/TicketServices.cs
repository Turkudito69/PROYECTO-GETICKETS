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
                IdUsuario = a.IdUsuario,
                IdTecnico = a.IdTecnico,
                IdCategoria = a.IdCategoria,
                IdPrioridad = a.IdPrioridad,
                IdEstadoTicket = a.IdEstadoTicket,
                Tickets = a.Tickets,
                CodigoTicket = a.CodigoTicket,
                Descripcion = a.Descripcion,
                Solicitante = a.Solicitante,
                Tecnico = a.Tecnico,
                Categoria = a.Categoria,
                Prioridad = a.Prioridad,
                EstadoTicket = a.EstadoTicket,
                FechaCreacion = a.FechaCreacion,
                FechaSolucion = a.FechaSolucion,
            });
        }
        public async Task<Ticket> NuevaTicket(TicketDTO Dts)
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
            return await _Repository.NuevoTicketAsync(oTicket);
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

        public Task ConfirmarCompletado(Ticket Dts)
        {
            return _Repository.ConfirmarCompletadoAsync(new Ticket
            {
                IdTicket = Dts.IdTicket,
                IdUsuario = Dts.IdUsuario
            });
        }

        public Task ReabrirTicket(Ticket Dts)
        {
            return _Repository.ReabrirTicketAsync(new Ticket
            {
                IdTicket = Dts.IdTicket,
                IdUsuario = Dts.IdUsuario,
                Motivo = Dts.Motivo
            });
        }
    }

}

