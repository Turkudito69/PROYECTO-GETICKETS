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
    public class SeguimientoTicketRepository : ISeguimientoTicketRepository
    {
        private readonly DBConexionFactory dBConexion;

        public SeguimientoTicketRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }
        public async Task<IEnumerable<SeguimientoTicket>> ListarSeguimientosTicketAsync(string idTicket)
        {
            var oAuditoria = new List<SeguimientoTicket>();

            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ListarSeguimiento", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("@IdTicket", idTicket));

                using (SqlDataReader dr = await cmd.ExecuteReaderAsync())
                {
                    while (await dr.ReadAsync())
                    {
                        oAuditoria.Add(new SeguimientoTicket
                        {
                            IdSeguimientoTicket = Convert.ToInt32(dr["IdSeguimiento"]),
                            CodigoTicket = dr["CodigoTiket"].ToString(),
                            Responsable = dr["Responsable"].ToString(),
                            Titulo = dr["Titulo"].ToString(),
                            Descripsion = dr["Descripcion"].ToString(),
                            FechaSeguimiento = Convert.ToDateTime(dr["FechaAccion"]),

                        });
                    }
                }
            }
            return oAuditoria;
        }
    }
}
