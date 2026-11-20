using Aplication.Interfaces;
using Domain.Entities;
using Infraestructure.DataBase;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infraestructure.Repository
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly DBConexionFactory dBConexion;

        public UsuarioRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }

        public async Task<IEnumerable<Usuario>> ListarUsuariosAsync()
        {
            var usuarios = new List<Usuario>();
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using var cmd = new SqlCommand("SP_ListarUsuarios", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                usuarios.Add(new Usuario
                {
                    IdUsuario = Convert.ToInt32(dr["IdUsuario"]),
                    Nombre = dr["Nombre"]?.ToString(),
                    Apellido = dr["Apellido"]?.ToString(),
                    Correo = dr["Correo"]?.ToString(),
                    IdRol = Convert.ToInt32(dr["IdRol"]),
                    IdEstado = Convert.ToInt32(dr["IdEstado"]),
                    Rol = dr["Rol"]?.ToString(),
                    Estado = dr["Estado"]?.ToString(),
                    FotoUrl = dr["FotoUrl"] == DBNull.Value ? null : dr["FotoUrl"]?.ToString()
                });
            }
            return usuarios;
        }

        public async Task<int> NuevoUsuarioAsync(Usuario usuario)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using var cmd = new SqlCommand("SP_NuevoUsuario", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.Add(new SqlParameter("@Nombre", usuario.Nombre ?? (object)DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Apellido", usuario.Apellido ?? (object)DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Correo", usuario.Correo ?? (object)DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Contrasena", usuario.Contrasena ?? (object)DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@IdRol", usuario.IdRol));
            cmd.Parameters.Add(new SqlParameter("@FotoUrl", (object?)usuario.FotoUrl ?? DBNull.Value));
            return Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        public async Task EditarUsuarioAsync(Usuario usuario)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using var cmd = new SqlCommand("SP_ActualizarUsuario", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.Add(new SqlParameter("@IdUsuario", usuario.IdUsuario));
            cmd.Parameters.Add(new SqlParameter("@Nombre", usuario.Nombre ?? (object)DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Apellido", usuario.Apellido ?? (object)DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Correo", usuario.Correo ?? (object)DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Contrasena", usuario.Contrasena ?? (object)DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@IdRol", usuario.IdRol));
            cmd.Parameters.Add(new SqlParameter("@IdEstado", usuario.IdEstado));
            cmd.Parameters.Add(new SqlParameter("@FotoUrl", (object?)usuario.FotoUrl ?? DBNull.Value));
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task ActualizarFotoUsuarioAsync(int idUsuario, string? fotoUrl)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using var cmd = new SqlCommand("SP_ActualizarFotoUsuario", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.Add(new SqlParameter("@IdUsuario", idUsuario));
            cmd.Parameters.Add(new SqlParameter("@FotoUrl", (object?)fotoUrl ?? DBNull.Value));
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task EliminarUsuariosAsync(int id)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();
            using var cmd = new SqlCommand("SP_EliminarUsuario", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.Add(new SqlParameter("@IdUsuario", id));
            await cmd.ExecuteNonQueryAsync();
        }
    }
}
