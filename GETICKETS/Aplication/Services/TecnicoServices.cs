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
    public class TecnicoServices
    {
        private readonly ITecnicoRepository _Repository;

        public TecnicoServices(ITecnicoRepository Repository)
        {
            _Repository = Repository;
        }
        public async Task<IEnumerable<TecnicoDTO>> ListarTecnicos()
        {
            var listar = await _Repository.ListarTecnicosAsync();

            return listar.Select(a => new TecnicoDTO
            {
                IdTecnico = a.IdTecnico,
                Nombre = a.Nombre,
                Apellido = a.Apellido,
                Correo = a.Correo,
                Especialidad = a.Especialidad,
                Estado = a.Estado,
            });
        }
        public async Task NuevoTecnico(TecnicoDTO Dts)
        {
            var oTecnico = new Tecnico
            {
                Especialidad = Dts.Especialidad,
                Correo = Dts.Correo,
                IdUsuario = Dts.IdUsuario,
            };
            await _Repository.NuevoTecnicoAsync(oTecnico);
        }
        public async Task EditarTecnico(TecnicoDTO Dts)
        {
            var oTecnico = new Tecnico
            {
                IdTecnico = Dts.IdTecnico,
                Especialidad = Dts.Especialidad,
                IdEstado = Dts.IdEstado,
                Correo = Dts.Correo,
                IdUsuario = Dts.IdUsuario,
            };
            await _Repository.EditarTecnicoAsync(oTecnico);
        }
        public async Task EliminarTecnico(int id)
        {
            await _Repository.EliminarTecnicosAsync(id);
        }
    }
}
