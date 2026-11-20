using Aplication.DTOs;
using Aplication.Interfaces;
using Domain.Entities;

namespace Aplication.Services
{
    public class EstadoTicketServices
    {
        private readonly IEstadoTicketRepository _repository;

        public EstadoTicketServices(IEstadoTicketRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<EstadoTicketDTO>> ListarEstadosTicket()
        {
            var estados = await _repository.ListarEstadosTicketAsync();
            return estados.Select(estado => new EstadoTicketDTO
            {
                IdEstadoTicket = estado.IdEstadoTicket,
                NombreEstado = estado.NombreEstado,
                IdEstado = estado.IdEstado,
                Estado = estado.Estado
            });
        }

        public Task<int> NuevoEstadoTicket(EstadoTicketDTO dto)
        {
            return _repository.NuevoEstadoTicketAsync(new EstadoTicket
            {
                NombreEstado = dto.NombreEstado,
                IdEstado = dto.IdEstado
            });
        }

        public Task EditarEstadoTicket(EstadoTicketDTO dto)
        {
            return _repository.EditarEstadoTicketAsync(new EstadoTicket
            {
                IdEstadoTicket = dto.IdEstadoTicket,
                NombreEstado = dto.NombreEstado,
                IdEstado = dto.IdEstado
            });
        }

        public Task EliminarEstadoTicket(int id)
        {
            return _repository.EliminarEstadosTicketAsync(id);
        }
    }
}
