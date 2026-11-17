using Aplication.Interfaces;
using Domain.Entities;
using Infraestructure.DataBase;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infraestructure.Repository
{
    public class TicketRepository : ITicketRepository
    {
        private readonly DBConexionFactory dBConexion;

        public TicketRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }

        public async Task<IEnumerable<Ticket>> ListarTicketsAsync()
        {
            var tickets = new List<Ticket>();
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using var cmd = new SqlCommand("SP_ListarTicket", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                tickets.Add(new Ticket
                {
                    IdTicket = Convert.ToInt32(dr["IdTicket"]),
                    Descripcion = dr["Descripcion"]?.ToString(),
                    Tickets = dr["Ticket"]?.ToString(),
                    Tecnico = dr["Tecnico"]?.ToString(),
                    Categoria = dr["Categoria"]?.ToString(),
                    Prioridad = dr["Prioridad"]?.ToString(),
                    EstadoTicket = dr["EstadoTicket"]?.ToString(),
                    FehaCreacion = Convert.ToDateTime(dr["FechaCreacion"])
                });
            }
            return tickets;
        }

        public async Task NuevoTicketAsync(Ticket ticket)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using (SqlCommand cmd = new SqlCommand("SP_NuevoTicket", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("@Descripcion", ticket.Descripcion ?? (object)DBNull.Value));
                cmd.Parameters.Add(new SqlParameter("@IdUsuario", ticket.IdUsuario));
                cmd.Parameters.Add(new SqlParameter("@IdCategoria", ticket.IdCategoria));
                cmd.Parameters.Add(new SqlParameter("@IdPrioridad", ticket.IdPrioridad));
                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task AsignarTicketAsync(Ticket ticket)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using (SqlCommand cmd = new SqlCommand("SP_AsignarTicket", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("@IdTicket", ticket.IdTicket));
                cmd.Parameters.Add(new SqlParameter("@IdTecnico", ticket.IdTecnico));
                cmd.Parameters.Add(new SqlParameter("@IdUsuario", ticket.IdUsuario));
                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task IniciarAtencionAsync(Ticket ticket)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using (SqlCommand cmd = new SqlCommand("SP_IniciarAtencion", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("@IdTicket", ticket.IdTicket));
                cmd.Parameters.Add(new SqlParameter("@IdUsuario", ticket.IdUsuario));
                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task GuardarObservacionAsync(Ticket ticket)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using (SqlCommand cmd = new SqlCommand("SP_RegistrarObservacion", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("@IdTicket", ticket.IdTicket));
                cmd.Parameters.Add(new SqlParameter("@IdUsuario", ticket.IdUsuario));
                cmd.Parameters.Add(new SqlParameter("@Observacion", ticket.Observacion ?? (object)DBNull.Value));
                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task FinalizarTicketAsync(Ticket ticket)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using (SqlCommand cmd = new SqlCommand("SP_FinalizarTicket", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(new SqlParameter("@IdTicket", ticket.IdTicket));
                cmd.Parameters.Add(new SqlParameter("@IdUsuario", ticket.IdUsuario));
                cmd.Parameters.Add(new SqlParameter("@Diagnostico", ticket.Diagnostico ?? (object)DBNull.Value));
                cmd.Parameters.Add(new SqlParameter("@Solucion", ticket.Solucion ?? (object)DBNull.Value));
                await cmd.ExecuteNonQueryAsync();
            }
        }

    }
}
