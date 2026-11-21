using Aplication.DTOs;
using Aplication.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Services
{
    public class PrioridadServices
    {
        private readonly IPrioridadRepository _Repository;

        public PrioridadServices(IPrioridadRepository Repository)
        {
            _Repository = Repository;
        }
        public async Task<IEnumerable<PrioridadDTO>> ListarPrioridades()
        {
            var listar = await _Repository.ListarPrioridadesAsync();

            return listar.Select(a => new PrioridadDTO
            {
                IdPrioridad = a.IdPrioridad,
                NombrePrioridad = a.NombrePrioridad,
                Estado = a.Estado,
            });
        }
        public async Task NuevaPrioridad(PrioridadDTO Dts)
        {
            var oPrioridad = new Prioridad
            {
                NombrePrioridad = Dts.NombrePrioridad,
                IdEstado = Dts.IdEstado,
            };
            await _Repository.NuevaPrioridadAsync(oPrioridad);
        }
        public async Task EditarPrioridad(PrioridadDTO Dts)
        {
            var oPrioridad = new Prioridad
            {
                IdPrioridad = Dts.IdPrioridad,
                NombrePrioridad = Dts.NombrePrioridad,
                IdEstado = Dts.IdEstado,
            };
            await _Repository.EditarPrioridadAsync(oPrioridad);
        }
        public async Task EliminarPrioridad(int id)
        {
            await _Repository.EliminarPrioridadesAsync(id);
        }
    }
}
