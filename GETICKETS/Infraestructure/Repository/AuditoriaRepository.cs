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
    public class AuditoriaRepository : IAuditoriaRepository
    {
        private readonly DBConexionFactory dBConexion;

        public AuditoriaRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }

        public async Task<IEnumerable<Auditoria>> ListarAuditoriasAsync()
        {
            var oAuditoria = new List<Auditoria>();

            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ListarAuditoriaTicket", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                using (SqlDataReader dr = await cmd.ExecuteReaderAsync())
                {
                    while (await dr.ReadAsync())
                    {
                        oAuditoria.Add(new Auditoria
                        {
                            IdAuditoria = Convert.ToInt32(dr["IdAuditoria"]),
                            Ticket = dr["Ticket"].ToString(),
                            Responsable = dr["Responsable"].ToString(),
                            Accion = dr["Accion"].ToString(),
                            Descripcion = dr["Descripcion"].ToString(),
                            FechaAccion = Convert.ToDateTime(dr["FechaAccion"]),
                        });
                    }
                }
            }
            return oAuditoria;
        }
    }
}
