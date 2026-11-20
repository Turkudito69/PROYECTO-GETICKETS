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
    public class EstadoRepository : IEstadoRepository
    {
        private readonly DBConexionFactory dBConexion;

        public EstadoRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }
        public async Task<IEnumerable<Estado>> ListarEstadosAsync()
        {
            var oestado = new List<Estado>();

            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ListarEstados", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                using (SqlDataReader dr = await cmd.ExecuteReaderAsync())
                {
                    while (await dr.ReadAsync())
                    {
                        oestado.Add(new Estado
                        {
                            IdEstado = Convert.ToInt32(dr["IdEstado"]),
                            NombreEstado = dr["Nombre"].ToString(),
                        });
                    }
                }
            }
            return oestado;
        }

        public async Task NuevoEstadoAsync(Estado estado)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_NuevoEstado", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("NombreEstado", estado.NombreEstado));
                await cmd.ExecuteNonQueryAsync();
            }
        }
        public async Task EditarEstadoAsync(Estado estado)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_EditarEstado", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("IdEstado", estado.IdEstado));
                cmd.Parameters.Add(new SqlParameter("Nombre", estado.NombreEstado));

                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task EliminarEstadosAsync(int id)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_EliminarEstado", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("IdEstado", id));


                await cmd.ExecuteNonQueryAsync();
            }
        }

  
    }
}
