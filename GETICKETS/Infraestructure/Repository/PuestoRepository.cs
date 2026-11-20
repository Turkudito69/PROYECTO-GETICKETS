using Aplication.Interfaces;
using Domain.Entities;
using Infraestructure.DataBase;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infraestructure.Repository
{
    public class PuestoRepository : IPuestoRepository
    {
        private readonly DBConexionFactory _dbConexion;

        public PuestoRepository(DBConexionFactory dbConexion)
        {
            _dbConexion = dbConexion;
        }

        public async Task<IEnumerable<Puesto>> ListarPuestosAsync()
        {
            var puestos = new List<Puesto>();
            using var con = _dbConexion.CreateConnection();
            await con.OpenAsync();
            using var cmd = new SqlCommand("SP_ListarPuestos", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                puestos.Add(new Puesto
                {
                    IdPuesto = Convert.ToInt32(dr["IdPuesto"]),
                    CodigoPuesto = dr["CodigoPuesto"]?.ToString(),
                    NombrePuesto = dr["NombrePuesto"]?.ToString(),
                    Zona = dr["Zona"]?.ToString(),
                    IdUsuarioActual = dr["IdUsuarioActual"] == DBNull.Value ? null : Convert.ToInt32(dr["IdUsuarioActual"]),
                    OcupanteNombre = dr["OcupanteNombre"] == DBNull.Value ? null : dr["OcupanteNombre"]?.ToString(),
                    OcupanteRol = dr["OcupanteRol"] == DBNull.Value ? null : dr["OcupanteRol"]?.ToString(),
                    OcupanteCorreo = dr["OcupanteCorreo"] == DBNull.Value ? null : dr["OcupanteCorreo"]?.ToString(),
                    OcupanteFotoUrl = dr["OcupanteFotoUrl"] == DBNull.Value ? null : dr["OcupanteFotoUrl"]?.ToString(),
                    FechaAsignacion = dr["FechaAsignacion"] == DBNull.Value ? null : Convert.ToDateTime(dr["FechaAsignacion"]),
                    IdEstado = Convert.ToInt32(dr["IdEstado"]),
                    Estado = dr["Estado"]?.ToString()
                });
            }
            return puestos;
        }

        public async Task<IEnumerable<HistorialPuesto>> ListarHistorialAsync(int? idPuesto)
        {
            var historial = new List<HistorialPuesto>();
            using var con = _dbConexion.CreateConnection();
            await con.OpenAsync();
            using var cmd = new SqlCommand("SP_ListarHistorialPuestos", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.Add(new SqlParameter("@IdPuesto", (object?)idPuesto ?? DBNull.Value));
            using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                historial.Add(new HistorialPuesto
                {
                    IdHistorial = Convert.ToInt32(dr["IdHistorial"]),
                    IdPuesto = Convert.ToInt32(dr["IdPuesto"]),
                    CodigoPuesto = dr["CodigoPuesto"]?.ToString(),
                    NombrePuesto = dr["NombrePuesto"]?.ToString(),
                    IdUsuario = Convert.ToInt32(dr["IdUsuario"]),
                    NombreUsuario = dr["NombreUsuario"]?.ToString(),
                    RolUsuario = dr["RolUsuario"]?.ToString(),
                    FotoUrl = dr["FotoUrl"] == DBNull.Value ? null : dr["FotoUrl"]?.ToString(),
                    Accion = dr["Accion"]?.ToString(),
                    Motivo = dr["Motivo"]?.ToString(),
                    FechaInicio = Convert.ToDateTime(dr["FechaInicio"]),
                    FechaFin = dr["FechaFin"] == DBNull.Value ? null : Convert.ToDateTime(dr["FechaFin"]),
                    RealizadoPor = dr["RealizadoPor"]?.ToString()
                });
            }
            return historial;
        }

        public async Task<Puesto> NuevoPuestoAsync(Puesto puesto, int? idUsuarioAccion, string? motivo)
        {
            using var con = _dbConexion.CreateConnection();
            await con.OpenAsync();
            using var cmd = new SqlCommand("SP_NuevoPuesto", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.Add(new SqlParameter("@CodigoPuesto", (object?)puesto.CodigoPuesto ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@NombrePuesto", puesto.NombrePuesto ?? string.Empty));
            cmd.Parameters.Add(new SqlParameter("@Zona", puesto.Zona ?? string.Empty));
            cmd.Parameters.Add(new SqlParameter("@IdUsuarioActual", (object?)puesto.IdUsuarioActual ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@IdUsuarioAccion", (object?)idUsuarioAccion ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Motivo", (object?)motivo ?? DBNull.Value));

            using var dr = await cmd.ExecuteReaderAsync();
            if (!await dr.ReadAsync())
                throw new InvalidOperationException("No se recibió el puesto creado desde la base de datos.");

            return new Puesto
            {
                IdPuesto = Convert.ToInt32(dr["IdPuesto"]),
                CodigoPuesto = dr["CodigoPuesto"]?.ToString()
            };
        }

        public async Task AsignarPuestoAsync(AsignacionPuesto asignacion)
        {
            using var con = _dbConexion.CreateConnection();
            await con.OpenAsync();
            using var cmd = new SqlCommand("SP_AsignarPuesto", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.Add(new SqlParameter("@IdPuesto", asignacion.IdPuesto));
            cmd.Parameters.Add(new SqlParameter("@IdUsuario", (object?)asignacion.IdUsuario ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Motivo", (object?)asignacion.Motivo ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@IdUsuarioAccion", (object?)asignacion.IdUsuarioAccion ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Swap", asignacion.Swap));
            await cmd.ExecuteNonQueryAsync();
        }
    }
}
