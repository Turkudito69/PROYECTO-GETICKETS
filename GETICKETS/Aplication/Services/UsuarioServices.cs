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
        private readonly IPuestoRepository _puestoRepository;
        private readonly IRolesRepository _rolesRepository;

        public UsuarioServices(IUsuarioRepository Repository, IPuestoRepository puestoRepository, IRolesRepository rolesRepository)
        {
            _Repository = Repository;
            _puestoRepository = puestoRepository;
            _rolesRepository = rolesRepository;
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
                IdRol = a.IdRol,
                IdEstado = a.IdEstado,
                Rol = a.Rol,
                Estado = a.Estado,
                FotoUrl = a.FotoUrl,
            });
        }
        public async Task<(int IdUsuario, int? IdPuesto)> NuevoUsuario(UsuarioDTO Dts)
        {
            var oUsuario = new Usuario
            {
                Nombre = Dts.Nombre,
                Apellido = Dts.Apellido,
                Correo = Dts.Correo,
                Contrasena = Dts.Contrasena,
                IdRol = Dts.IdRol,
                IdUsuario = Dts.IdUsuario,
                FotoUrl = Dts.FotoUrl,
            };
            var idUsuario = await _Repository.NuevoUsuarioAsync(oUsuario);
            int? idPuesto = null;
            var idUsuarioAccion = Dts.IdUsuarioAccion ?? idUsuario;

            if (Dts.IdPuesto.HasValue)
            {
                await _puestoRepository.AsignarPuestoAsync(new AsignacionPuesto
                {
                    IdPuesto = Dts.IdPuesto.Value,
                    IdUsuario = idUsuario,
                    IdUsuarioAccion = idUsuarioAccion,
                    Motivo = "Asignación al crear usuario nuevo"
                });
                idPuesto = Dts.IdPuesto.Value;
            }
            else if (Dts.AsignarPuesto != false)
            {
                var rol = (await _rolesRepository.ListarRolesAsync()).FirstOrDefault(r => r.IdRol == Dts.IdRol);
                var zona = rol?.NombreRol switch
                {
                    "Tecnico" => "Soporte TI",
                    "Administrador" => "Administración",
                    _ => "Operaciones"
                };
                var puestos = await _puestoRepository.ListarPuestosAsync();
                var puestoLibre = puestos.FirstOrDefault(p => p.IdEstado == 1 && p.IdUsuarioActual is null && p.Zona == zona)
                    ?? puestos.FirstOrDefault(p => p.IdEstado == 1 && p.IdUsuarioActual is null);

                if (puestoLibre is not null)
                {
                    await _puestoRepository.AsignarPuestoAsync(new AsignacionPuesto
                    {
                        IdPuesto = puestoLibre.IdPuesto,
                        IdUsuario = idUsuario,
                        IdUsuarioAccion = idUsuarioAccion,
                        Motivo = "Asignación automática de puesto disponible"
                    });
                    idPuesto = puestoLibre.IdPuesto;
                }
                else
                {
                    var nombrePuesto = zona == "Soporte TI"
                        ? $"Estación Soporte {Dts.Nombre?.Trim()}"
                        : zona == "Administración"
                            ? $"Estación Admin {Dts.Nombre?.Trim()}"
                            : $"Módulo {Dts.Nombre?.Trim()}";
                    var puesto = await _puestoRepository.NuevoPuestoAsync(new Puesto
                    {
                        NombrePuesto = nombrePuesto,
                        Zona = zona,
                        IdUsuarioActual = idUsuario
                    }, idUsuarioAccion, "Puesto creado automáticamente para nuevo colaborador");
                    idPuesto = puesto.IdPuesto;
                }
            }

            return (idUsuario, idPuesto);
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
                FotoUrl = Dts.FotoUrl,
            };
            await _Repository.EditarUsuarioAsync(oUsuario);
        }
        public async Task EliminarUsuario(int id)
        {
            await _Repository.EliminarUsuariosAsync(id);
        }

        public Task ActualizarFotoUsuario(int idUsuario, string? fotoUrl)
        {
            return _Repository.ActualizarFotoUsuarioAsync(idUsuario, fotoUrl);
        }
    }
}
