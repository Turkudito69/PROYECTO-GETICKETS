using Aplication.Interfaces;
using Domain.Entities;
using Infraestructure.DataBase;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
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
                            Estado = dr["Nombre"].ToString(),   
                        });
                    }
                }
            }
            return oPrioridad;
        }

        public async Task NuevoRolAsync(Rol rol)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_NuevoRol", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("NombreRol", rol.NombreRol));
                await cmd.ExecuteNonQueryAsync();
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
