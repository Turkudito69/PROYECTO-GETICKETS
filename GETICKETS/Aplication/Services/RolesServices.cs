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
    public class RolesServices
    {
        private readonly IRolesRepository _Repository;

        public RolesServices(IRolesRepository Repository)
        {
            _Repository = Repository;
        }
        public async Task<IEnumerable<RolDTO>> ListarRoles()
        {
            var listar = await _Repository.ListarRolesAsync();

            return listar.Select(a => new RolDTO
            {
                IdRol = a.IdRol,
                NombreRol = a.NombreRol,
                IdEstado = a.IdEstado,
                Descripcion = a.Descripcion,
                Permisos = a.Permisos,
                Estado = a.Estado,
            });
        }
        public async Task<int> NuevaRol(RolDTO Dts)
        {
            var oRol = new Rol
            {
                NombreRol = Dts.NombreRol,
                IdEstado = Dts.IdEstado > 0 ? Dts.IdEstado : 1,
                Descripcion = Dts.Descripcion,
                Permisos = Dts.Permisos,
            };
            return await _Repository.NuevoRolAsync(oRol);
        }
        public async Task EditarRol(RolDTO Dts)
        {
            var oRol = new Rol
            {
                IdRol = Dts.IdRol,
                NombreRol = Dts.NombreRol,
                IdEstado = Dts.IdEstado,
                Descripcion = Dts.Descripcion,
                Permisos = Dts.Permisos,
            };
            await _Repository.EditarRolAsync(oRol);
        }
        public async Task EliminarRol(int id)
        {
            await _Repository.EliminarRolesAsync(id);
        }
    }
}
