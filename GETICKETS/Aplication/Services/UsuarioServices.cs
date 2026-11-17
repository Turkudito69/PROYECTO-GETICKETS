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
    public class UsuarioServices
    {
        private readonly IUsuarioRepository _Repository;

        public UsuarioServices(IUsuarioRepository Repository)
        {
            _Repository = Repository;
        }
        public async Task<IEnumerable<UsuarioDTO>> ListarUsuarios()
        {
            var listar = await _Repository.ListarUsuariosAsync();

            return listar.Select(a => new UsuarioDTO
            {
                IdUsuario = a.IdUsuario,
                Nombre = a.Nombre,
                Apellido = a.Apellido,
                Correo = a.Correo,
                Rol = a.Rol,
                Estado = a.Estado,
            });
        }
        public async Task NuevoUsuario(UsuarioDTO Dts)
        {
            var oUsuario = new Usuario
            {
                Nombre = Dts.Nombre,
                Apellido = Dts.Apellido,
                Correo = Dts.Correo,
                Contrasena = Dts.Contrasena,
                IdRol = Dts.IdRol,
                IdUsuario = Dts.IdUsuario,
            };
            await _Repository.NuevoUsuarioAsync(oUsuario);
        }
        public async Task EditarUsuario(UsuarioDTO Dts)
        {
            var oUsuario = new Usuario
            {
                IdUsuario = Dts.IdUsuario,
                Nombre = Dts.Nombre,
                Apellido = Dts.Apellido,
                Correo = Dts.Correo,
                Contrasena = Dts.Contrasena,
                IdRol = Dts.IdRol,
                IdEstado = Dts.IdEstado,
            };
            await _Repository.EditarUsuarioAsync(oUsuario);
        }
        public async Task EliminarUsuario(int id)
        {
            await _Repository.EliminarUsuariosAsync(id);
        }
    }
}
