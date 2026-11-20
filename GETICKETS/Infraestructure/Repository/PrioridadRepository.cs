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
    public class PrioridadRepository : IPrioridadRepository
    {
        private readonly DBConexionFactory dBConexion;

        public PrioridadRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }
        public async Task<IEnumerable<Prioridad>> ListarPrioridadesAsync()
        {
            var oPrioridad = new List<Prioridad>();

            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ListarPrioridad", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                using (SqlDataReader dr = await cmd.ExecuteReaderAsync())
                {
                    while (await dr.ReadAsync())
                    {
                        oPrioridad.Add(new Prioridad
                        {
                            IdPrioridad = Convert.ToInt32(dr["IdPrioridad"]),
                            NombrePrioridad = dr["NombrePrioridad"].ToString(),
                            IdEstado = Convert.ToInt32(dr["IdEstado"]),
                            Estado = dr["Estado"].ToString(),
                        });
                    }
                }
            }
            return oPrioridad;
        }

        public async Task<int> NuevaPrioridadAsync(Prioridad prioridad)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_NuevaPrioridad", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("NombrePrioridad", prioridad.NombrePrioridad));
                return Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }
        public async Task EditarPrioridadAsync(Prioridad prioridad)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ActualizarPrioridad", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("IdPrioridad", prioridad.IdPrioridad));
                cmd.Parameters.Add(new SqlParameter("NombrePrioridad", prioridad.NombrePrioridad));
                cmd.Parameters.Add(new SqlParameter("IdEstado", prioridad.IdEstado));

                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task EliminarPrioridadesAsync(int id)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_EliminarPrioridad", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("IdPrioridad", id));
                await cmd.ExecuteNonQueryAsync();
            }
        }
    }
}
