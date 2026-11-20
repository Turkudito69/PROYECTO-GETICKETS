using Aplication.DTOs;
using Aplication.Interfaces;
using Domain.Entities;

namespace Aplication.Services
{
    public class PuestoServices
    {
        private readonly IPuestoRepository _repository;

        public PuestoServices(IPuestoRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<PuestoDTO>> ListarPuestos()
        {
            var puestos = await _repository.ListarPuestosAsync();
            return puestos.Select(p => new PuestoDTO
            {
                IdPuesto = p.IdPuesto,
                CodigoPuesto = p.CodigoPuesto,
                NombrePuesto = p.NombrePuesto,
                Zona = p.Zona,
                IdUsuarioActual = p.IdUsuarioActual,
                OcupanteNombre = p.OcupanteNombre,
                OcupanteRol = p.OcupanteRol,
                OcupanteCorreo = p.OcupanteCorreo,
                OcupanteFotoUrl = p.OcupanteFotoUrl,
                FechaAsignacion = p.FechaAsignacion,
                IdEstado = p.IdEstado,
                Estado = p.Estado
            });
        }

        public async Task<IEnumerable<HistorialPuestoDTO>> ListarHistorial(int? idPuesto)
        {
            var historial = await _repository.ListarHistorialAsync(idPuesto);
            return historial.Select(h => new HistorialPuestoDTO
            {
                IdHistorial = h.IdHistorial,
                IdPuesto = h.IdPuesto,
                CodigoPuesto = h.CodigoPuesto,
                NombrePuesto = h.NombrePuesto,
                IdUsuario = h.IdUsuario,
                NombreUsuario = h.NombreUsuario,
                RolUsuario = h.RolUsuario,
                FotoUrl = h.FotoUrl,
                Accion = h.Accion,
                Motivo = h.Motivo,
                FechaInicio = h.FechaInicio,
                FechaFin = h.FechaFin,
                RealizadoPor = h.RealizadoPor
            });
        }

        public Task<PuestoDTO> NuevoPuesto(PuestoDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NombrePuesto))
                throw new ArgumentException("El nombre del puesto es obligatorio.");

            return CreatePuesto(dto);
        }

        private async Task<PuestoDTO> CreatePuesto(PuestoDTO dto)
        {
            var puesto = await _repository.NuevoPuestoAsync(new Puesto
            {
                CodigoPuesto = dto.CodigoPuesto,
                NombrePuesto = dto.NombrePuesto!.Trim(),
                Zona = dto.Zona,
                IdUsuarioActual = dto.IdUsuarioActual
            }, dto.IdUsuarioAccion, dto.Motivo);

            return new PuestoDTO
            {
                IdPuesto = puesto.IdPuesto,
                CodigoPuesto = puesto.CodigoPuesto
            };
        }

        public Task AsignarPuesto(AsignarPuestoDTO dto)
        {
            return _repository.AsignarPuestoAsync(new AsignacionPuesto
            {
                IdPuesto = dto.IdPuesto,
                IdUsuario = dto.IdUsuario,
                Motivo = dto.Motivo,
                IdUsuarioAccion = dto.IdUsuarioAccion,
                Swap = dto.Swap
            });
        }
    }
}
