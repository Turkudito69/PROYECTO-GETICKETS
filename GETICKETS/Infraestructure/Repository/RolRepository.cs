using Aplication.Interfaces;
using Domain.Entities;
using Infraestructure.DataBase;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Infraestructure.Repository
{
    public class RolRepository : IRolesRepository
    {
        private readonly DBConexionFactory dBConexion;
        public RolRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }
        public async Task<IEnumerable<Rol>> ListarRolesAsync()
        {
            var oPrioridad = new List<Rol>();

            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ListarRoles", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                using (SqlDataReader dr = await cmd.ExecuteReaderAsync())
                {
                    while (await dr.ReadAsync())
                    {
                        oPrioridad.Add(new Rol
                        {
                            IdRol = Convert.ToInt32(dr["IdRol"]),
                            NombreRol = dr["NombreRol"].ToString(),
                            IdEstado = Convert.ToInt32(dr["IdEstado"]),
                            Descripcion = dr["Descripcion"] == DBNull.Value ? null : dr["Descripcion"].ToString(),
                            Permisos = dr["Permisos"] == DBNull.Value
                                ? new List<string>()
                                : JsonSerializer.Deserialize<List<string>>(dr["Permisos"].ToString() ?? "[]") ?? new List<string>(),
                            Estado = dr["Estado"].ToString(),
                        });
                    }
                }
            }
            return oPrioridad;
        }

        public async Task<int> NuevoRolAsync(Rol rol)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_NuevoRol", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("@NombreRol", rol.NombreRol ?? string.Empty));
                cmd.Parameters.Add(new SqlParameter("@Descripcion", (object?)rol.Descripcion ?? DBNull.Value));
                cmd.Parameters.Add(new SqlParameter("@Permisos", (object?) (rol.Permisos is null ? null : JsonSerializer.Serialize(rol.Permisos)) ?? DBNull.Value));
                return Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }
        public async Task EditarRolAsync(Rol rol)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ActualizarRol", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("IdRol", rol.IdRol));
                cmd.Parameters.Add(new SqlParameter("NombreRol", rol.NombreRol));
                cmd.Parameters.Add(new SqlParameter("IdEstado", rol.IdEstado));
                cmd.Parameters.Add(new SqlParameter("Descripcion", (object?)rol.Descripcion ?? DBNull.Value));
                cmd.Parameters.Add(new SqlParameter("Permisos", (object?) (rol.Permisos is null ? null : JsonSerializer.Serialize(rol.Permisos)) ?? DBNull.Value));
                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task EliminarRolesAsync(int id)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_EliminarRol", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("IdRol", id));
                await cmd.ExecuteNonQueryAsync();
            }
        }

      
    }
}
