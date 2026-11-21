using Aplication.DTOs;
using Aplication.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Services
{
    public class SeguimientoTicketServices
    {
        private readonly ISeguimientoTicketRepository _Repository;

        public SeguimientoTicketServices(ISeguimientoTicketRepository Repository)
        {
            _Repository = Repository;
        }
        public async Task<IEnumerable<SeguimientoTicketDTO>> ListarSeguimiento(string idTicket)
        {
            var listar = await _Repository.ListarSeguimientosTicketAsync(idTicket);

            return listar.Select(a => new SeguimientoTicketDTO
            {
                IdSeguimientoTicket = a.IdSeguimientoTicket,
                CodigoTicket = a.CodigoTicket,
                Responsable = a.Responsable,
                Titulo = a.Titulo,
                Descripsion = a.Descripsion,
                FechaSeguimiento = a.FechaSeguimiento,
            
            });
        }
    }
}
