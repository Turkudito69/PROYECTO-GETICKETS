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
    public class DTGeneralRepository : IDTGeneraRepository
    {
        private readonly DBConexionFactory dBConexion;

        public DTGeneralRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }
        public async Task<IEnumerable<DetalleTicketGeneral>> ListarDTGeneralAsync()
        {
            var oAuditoria = new List<DetalleTicketGeneral>();

            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ListarDetalleTicketGeneral", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                using (SqlDataReader dr = await cmd.ExecuteReaderAsync())
                {
                    while (await dr.ReadAsync())
                    {
                        oAuditoria.Add(new DetalleTicketGeneral
                        {
                            IdDetalleTicket = Convert.ToInt32(dr["IdDetalleTicket"]),
                            Ticket = dr["Ticket"].ToString(),
                            Diagnostico = dr["Diagnostico"].ToString(),
                            Solucion = dr["Solucion"].ToString(),
                        });
                    }
                }
            }
            return oAuditoria;
        }
    }
}
