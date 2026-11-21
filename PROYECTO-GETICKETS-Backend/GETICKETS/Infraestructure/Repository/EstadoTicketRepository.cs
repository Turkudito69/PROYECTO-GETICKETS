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
    public class EstadoTicketRepository : IEstadoTicketRepository
    {
        private readonly DBConexionFactory dBConexion;

        public EstadoTicketRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }
        public async Task<IEnumerable<EstadoTicket>> ListarEstadosTicketAsync()
        {
            var oestado = new List<EstadoTicket>();

            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ListarEstadoTiketc", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                using (SqlDataReader dr = await cmd.ExecuteReaderAsync())
                {
                    while (await dr.ReadAsync())
                    {
                        oestado.Add(new EstadoTicket
                        {
                            IdEstado = Convert.ToInt32(dr["IdEstadoTicket"]),
                            NombreEstado = dr["Nombre"].ToString(),
                            Estado = dr["Estado"].ToString(),
                        });
                    }
                }
            }
            return oestado;
        }

        public async Task NuevoEstadoTicketAsync(EstadoTicket estadoTicket)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_NuevoEstadoTicket", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("@NombreEstado", estadoTicket.NombreEstado));
                await cmd.ExecuteNonQueryAsync();
            }
        }
        public async Task EditarEstadoTicketAsync(EstadoTicket estadoTicket)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ActualizarEstadoTicket", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("@IdEstadoTicket", estadoTicket.IdEstadoTicket));
                cmd.Parameters.Add(new SqlParameter("@NombreEstado", estadoTicket.NombreEstado));
                cmd.Parameters.Add(new SqlParameter("@IdEstado", estadoTicket.IdEstado));


                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task EliminarEstadosTicketAsync(int id)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_EliminarEstadoTicket", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("@IdEstadoTicket", id));


                await cmd.ExecuteNonQueryAsync();
            }
        }

      
    }
}
