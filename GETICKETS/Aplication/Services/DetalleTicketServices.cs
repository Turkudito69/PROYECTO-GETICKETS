using Aplication.DTOs;
using Aplication.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Services
{
    public class DetalleTicketServices
    {
        private readonly IDetalleTicketRepository _Repository;

        public DetalleTicketServices(IDetalleTicketRepository Repository)
        {
            _Repository = Repository;
        }
        public async Task<IEnumerable<DetalleTicketDTO>> ListarDetallesTicketAsync(string idTicket)
        {
            var listar = await _Repository.ListarDetallesTicketAsync(idTicket);

            return listar.Select(a => new DetalleTicketDTO
            {
                IdTicket = a.IdTicket,
                CodigoTicket = a.CodigoTicket,
                Descripcion = a.Descripcion,
                Solicitante = a.Solicitante,
                Tecnico = a.Tecnico,
                Categoria = a.Categoria,
                Prioridad = a.Prioridad,
                EstadoTicket = a.EstadoTicket,
                FechaCreacion = a.FechaCreacion,
                FechaSolucion = a.FechaSolucion
            });
        }
    }
}
