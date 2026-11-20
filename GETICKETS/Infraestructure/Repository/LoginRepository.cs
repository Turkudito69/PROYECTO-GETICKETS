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
    public class LoginRepository : ILoginRpository
    {
        private readonly DBConexionFactory dBConexion;

        public LoginRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }
        public async Task<Login> LoginAsync(string correo, string contrasena)
        {
            Login resultado = new Login();
            await using SqlConnection conexion = dBConexion.CreateConnection();
            await using SqlCommand comando = new SqlCommand("SP_ValidarLogin", conexion);
            comando.CommandType = CommandType.StoredProcedure;

            comando.Parameters.Add(new SqlParameter("@correo", correo));
            comando.Parameters.Add(new SqlParameter("@Clave", contrasena));
          
            await conexion.OpenAsync();
            await using SqlDataReader reader = await comando.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                resultado = new Login
                {
                    IdUsuario = Convert.ToInt32(reader["IdUsuario"]),
                    Nombre = reader["Nombre"]?.ToString(),
                    Apellido = reader["Apellido"]?.ToString(),
                    Rol = reader["NombreRol"]?.ToString(),
                };
            }

            return resultado;
        }
    }
}
