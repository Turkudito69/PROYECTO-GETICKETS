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
    public class CategoriaRepository : ICategoriaRepository
    {
        private readonly DBConexionFactory dBConexion;

        public CategoriaRepository(DBConexionFactory baseRepository)
        {
            dBConexion = baseRepository;
        }
        public async Task<IEnumerable<Categoria>> ListarCategoriasAsync()
        {
            var ocategoria = new List<Categoria>();

            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ListarCategorias", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                using (SqlDataReader dr = await cmd.ExecuteReaderAsync())
                {
                    while (await dr.ReadAsync())
                    {
                        ocategoria.Add(new Categoria
                        {
                            IdCategoria = Convert.ToInt32(dr["IdCategoria"]),
                            Nombrecat = dr["Nombre"].ToString(),
                            NombreCategoria = dr["NombreCategoria"].ToString(),
                            IdEstado = Convert.ToInt32(dr["IdEstado"]),
                            Icono = dr["Icono"] == DBNull.Value ? null : dr["Icono"].ToString(),
                            Descripcion = dr["Descripcion"] == DBNull.Value ? null : dr["Descripcion"].ToString(),
                            Estado = dr["Estado"].ToString(),

                        });
                    }
                }
            }
            return ocategoria;
        }

        public async Task<int> NuevaCategoriaAsync(Categoria categoria)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_NuevaCategoria", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("@NombreCategoria", categoria.NombreCategoria ?? string.Empty));
                cmd.Parameters.Add(new SqlParameter("@IdEstado", categoria.IdEstado > 0 ? categoria.IdEstado : 1));
                cmd.Parameters.Add(new SqlParameter("@Icono", (object?)categoria.Icono ?? DBNull.Value));
                cmd.Parameters.Add(new SqlParameter("@Descripcion", (object?)categoria.Descripcion ?? DBNull.Value));
                return Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }
        public async Task EditarCategoriaAsync(Categoria categoria)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_ActualizarCategoria", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("IdCategoria", categoria.IdCategoria));
                cmd.Parameters.Add(new SqlParameter("NombreCategoria", categoria.NombreCategoria));
                cmd.Parameters.Add(new SqlParameter("IdEstado", categoria.IdEstado));
                cmd.Parameters.Add(new SqlParameter("Icono", (object?)categoria.Icono ?? DBNull.Value));
                cmd.Parameters.Add(new SqlParameter("Descripcion", (object?)categoria.Descripcion ?? DBNull.Value));

                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task EliminarCategoriasAsync(int id)
        {
            using var con = dBConexion.CreateConnection();
            await con.OpenAsync();

            using (SqlCommand cmd = new SqlCommand("SP_EliminarCategoria", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new SqlParameter("IdCategoria", id));


                await cmd.ExecuteNonQueryAsync();
            }
        }
    }
}
