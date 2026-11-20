using Aplication.DTOs;
using Aplication.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Services
{
    public class AuditoriaServices
    {
        private readonly IAuditoriaRepository _Repository;

        public AuditoriaServices(IAuditoriaRepository Repository)
        {
            _Repository = Repository;
        }
        public async Task<IEnumerable<AuditoriaDTO>> ListarAuditoria()
        {
            var listar = await _Repository.ListarAuditoriasAsync();

            return listar.Select(a => new AuditoriaDTO  
            {
                IdAuditoria = a.IdAuditoria,
                Ticket = a.Ticket,
                Responsable = a.Responsable,
                Accion= a.Accion,    
                Descripcion = a.Descripcion,
                FechaAccion = a.FechaAccion,    
            });
        }
    }
}
