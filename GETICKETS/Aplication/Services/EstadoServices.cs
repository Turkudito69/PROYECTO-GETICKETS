
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
    public class EstadoServices
    {
        private readonly IEstadoRepository _Repository;

        public EstadoServices(IEstadoRepository Repository)
        {
            _Repository = Repository;
        }
        public async Task<IEnumerable<EstadoDTO>> ListarEstados()
        {
            var listar = await _Repository.ListarEstadosAsync();

            return listar.Select(a => new EstadoDTO
            {
                IdEstado = a.IdEstado,
                NombreEstado = a.NombreEstado,
            });
        }
        public async Task NuevaEstado(EstadoDTO Dts)
        {
            var oEstado = new Estado
            {
                NombreEstado = Dts.NombreEstado,
            };
            await _Repository.NuevoEstadoAsync(oEstado);
        }
        public async Task EditarEstado(EstadoDTO Dts)
        {
            var oEstado = new Estado
            {
                IdEstado = Dts.IdEstado,
                NombreEstado = Dts.NombreEstado,
            };
            await _Repository.EditarEstadoAsync(oEstado);
        }
        public async Task EliminarEstado(int id)
        {
            await _Repository.EliminarEstadosAsync(id);
        }

    }
}
