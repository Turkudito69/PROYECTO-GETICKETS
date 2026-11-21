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
                    IdUsuario = Convert.ToInt32(dr["IdUsuario"]),
                    IdTecnico = dr["IdTecnico"] == DBNull.Value
                        ? null
                        : Convert.ToInt32(dr["IdTecnico"]),
                    IdCategoria = Convert.ToInt32(dr["IdCategoria"]),
                    IdPrioridad = dr["IdPrioridad"] == DBNull.Value ? 0 : Convert.ToInt32(dr["IdPrioridad"]),
                    IdEstadoTicket = Convert.ToInt32(dr["IdEstadoTicket"]),
                    Descripcion = dr["Descripcion"]?.ToString(),
                    Tickets = dr["Ticket"]?.ToString(),
                    Solicitante = dr["Solicitante"]?.ToString(),
                    Tecnico = dr["Tecnico"]?.ToString(),
                    Categoria = dr["Categoria"]?.ToString(),
                    Prioridad = dr["Prioridad"]?.ToString(),
                    EstadoTicket = dr["EstadoTicket"]?.ToString(),
                    FechaCreacion = Convert.ToDateTime(dr["FechaCreacion"]),
                    FechaSolucion = dr["FechaSolucion"] == DBNull.Value ? null : Convert.ToDateTime(dr["FechaSolucion"]),
                    CodigoTicket = dr["CodigoTicket"]?.ToString()
                });
            }
            return tickets;
        }

        public async Task<Ticket> NuevoTicketAsync(Ticket ticket)
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
                using var dr = await cmd.ExecuteReaderAsync();
                if (!await dr.ReadAsync())
                    throw new InvalidOperationException("No se recibió el ticket creado desde la base de datos.");
                return new Ticket
                {
                    IdTicket = Convert.ToInt32(dr["IdTicket"]),
                    CodigoTicket = dr["CodigoTiket"]?.ToString()
                };
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
                cmd.Parameters.Add(new SqlParameter("@IdTecnico", (object?)ticket.IdTecnico ?? DBNull.Value));
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

        public async Task ConfirmarCompletadoAsync(Ticket ticket)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using var cmd = new SqlCommand("SP_ConfirmarCompletado", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.Add(new SqlParameter("@IdTicket", ticket.IdTicket));
            cmd.Parameters.Add(new SqlParameter("@IdUsuario", ticket.IdUsuario));
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task ReabrirTicketAsync(Ticket ticket)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using var cmd = new SqlCommand("SP_ReabrirTicket", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.Add(new SqlParameter("@IdTicket", ticket.IdTicket));
            cmd.Parameters.Add(new SqlParameter("@IdUsuario", ticket.IdUsuario));
            cmd.Parameters.Add(new SqlParameter("@Motivo", ticket.Motivo ?? string.Empty));
            await cmd.ExecuteNonQueryAsync();
        }

    }
}
