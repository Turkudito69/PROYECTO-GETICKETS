using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data;
using Microsoft.Data.SqlClient;


namespace Infraestructure.DataBase
{
    public class DBConexionFactory
    {
        private readonly string _connectionString;

        public DBConexionFactory(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new ArgumentException(
                    "La cadena de conexión no puede estar vacía.",
                    nameof(connectionString)
                );
            }

            _connectionString = connectionString;
        }

        public SqlConnection CreateConnection()
        {
            return new SqlConnection(_connectionString);
        }
    }
}
