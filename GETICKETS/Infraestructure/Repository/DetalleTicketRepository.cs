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
    public class DetalleTicketRepository : IDetalleTicketRepository
    {
        private readonly DBConexionFactory dBConexion;

        public DetalleTicketRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }
        public async Task<IEnumerable<DetalleTicket>> ListarDetallesTicketAsync(string idTicket)
        {
            var oAuditoria = new List<DetalleTicket>();

            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ListarDetalleTicket", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("@IdTicket", idTicket));

                using (SqlDataReader dr = await cmd.ExecuteReaderAsync())
                {
                    while (await dr.ReadAsync())
                    {
                        oAuditoria.Add(new DetalleTicket
                        {
                            IdTicket = Convert.ToInt32(dr["IdTicket"]),
                            CodigoTicket = dr["CodigoTiket"].ToString(),
                            Descripcion = dr["Descripcion"].ToString(),
                            Solicitante = dr["Solicitante"].ToString(),
                            Tecnico = dr["Tecnico"] == DBNull.Value ? null : dr["Tecnico"].ToString(),
                            Categoria = dr["Categoria"].ToString(),
                            Prioridad = dr["Prioridad"].ToString(),
                            EstadoTicket = dr["EstadoTicket"].ToString(),
                            FechaCreacion = Convert.ToDateTime(dr["FechaCreacion"]),
                            FechaSolucion = dr["Fechaesolucion"] == DBNull.Value
                                ? null
                                : Convert.ToDateTime(dr["Fechaesolucion"]),
                        });
                    }
                }
            }
            return oAuditoria;
        }
    }
   
}
