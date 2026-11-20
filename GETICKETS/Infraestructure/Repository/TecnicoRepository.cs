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
    public class TecnicoRepository : ITecnicoRepository
    {
        private readonly DBConexionFactory dBConexion;

        public TecnicoRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }
        public async Task<IEnumerable<Tecnico>> ListarTecnicosAsync()
        {
            var oAuditoria = new List<Tecnico>();

            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ListarTecnicos", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                using (SqlDataReader dr = await cmd.ExecuteReaderAsync())
                {
                    while (await dr.ReadAsync())
                    {
                        oAuditoria.Add(new Tecnico
                        {
                            IdTecnico = Convert.ToInt32(dr["IdTecnico"]),
                            Nombre = dr["Nombre"].ToString(),
                            Apellido = dr["Apellido"].ToString(),
                            Correo = dr["correo"].ToString(),
                            Especialidad = dr["Especialidad"].ToString(),
                            IdUsuario = Convert.ToInt32(dr["IdUsuario"]),
                            IdEstado = Convert.ToInt32(dr["IdEstado"]),
                            Usuario = dr["Usuario"].ToString(),
                            FotoUrl = dr["FotoUrl"] == DBNull.Value ? null : dr["FotoUrl"].ToString(),
                            Estado = dr["Estado"].ToString(),
                        });
                    }
                }
            }
            return oAuditoria;
        }

        public async Task<int> NuevoTecnicoAsync(Tecnico tecnico)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_NuevoTecnico", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("@Especialidad", (object?)tecnico.Especialidad ?? DBNull.Value));
                cmd.Parameters.Add(new SqlParameter("@Correo", (object?)tecnico.Correo ?? DBNull.Value));
                cmd.Parameters.Add(new SqlParameter("@IdUsuario", tecnico.IdUsuario ?? (object)DBNull.Value));
                return Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }

        public async Task EditarTecnicoAsync(Tecnico tecnico)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ActualizarTecnico", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("@IdTecnico", tecnico.IdTecnico));
                cmd.Parameters.Add(new SqlParameter("@Especialidad", (object?)tecnico.Especialidad ?? DBNull.Value));
                cmd.Parameters.Add(new SqlParameter("@Correo", (object?)tecnico.Correo ?? DBNull.Value));
                cmd.Parameters.Add(new SqlParameter("@IdUsuario", tecnico.IdUsuario ?? (object)DBNull.Value));
                cmd.Parameters.Add(new SqlParameter("@IdEstado", tecnico.IdEstado ?? (object)DBNull.Value));
                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task EliminarTecnicosAsync(int id)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_EliminarTecnico", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("@IdTecnico", id));
                await cmd.ExecuteNonQueryAsync();
            }
        }

   
    }
}
