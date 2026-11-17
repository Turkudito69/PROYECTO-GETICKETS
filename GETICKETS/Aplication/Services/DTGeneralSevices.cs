using Aplication.DTOs;
using Aplication.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Services
{
    public class DTGeneralSevices
    {
        private readonly IDTGeneraRepository _Repository;

        public DTGeneralSevices(IDTGeneraRepository Repository)
        {
            _Repository = Repository;
        }
        public async Task<IEnumerable<DetalleTicketGeneralDTO>> ListarDetallesTicketAsync()
        {
            var listar = await _Repository.ListarDTGeneralAsync();

            return listar.Select(a => new DetalleTicketGeneralDTO
            {
                IdDetalleTicket = a.IdDetalleTicket,
                Ticket = a.Ticket,
                Diagnostico = a.Diagnostico,
                Solucion = a.Solucion
            });

        }
    }
}
