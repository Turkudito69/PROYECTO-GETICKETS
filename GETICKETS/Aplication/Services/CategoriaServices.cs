using Aplication.DTOs;
using Aplication.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Services
{
    public class CategoriaServices
    {
        private readonly ICategoriaRepository _Repository;

        public CategoriaServices(ICategoriaRepository Repository)
        {
            _Repository = Repository;
        }
        public async Task<IEnumerable<CategoriaDTO>> ListarCategorias()
        {
            var listar = await _Repository.ListarCategoriasAsync();

            return listar.Select(a => new CategoriaDTO
            {
                IdCategoria = a.IdCategoria,
                Nombrecat = a.Nombrecat,
                NombreCategoria = a.NombreCategoria,
                IdEstado = a.IdEstado,
                Icono = a.Icono,
                Descripcion = a.Descripcion,
                Estado = a.Estado,
            });
        }
        public async Task<int> NuevaCategoria(CategoriaDTO Dts)
        {
            var oCategoria = new Categoria
            {
                NombreCategoria = Dts.NombreCategoria,
                IdEstado = Dts.IdEstado > 0 ? Dts.IdEstado : 1,
                Icono = Dts.Icono,
                Descripcion = Dts.Descripcion,
            };
            return await _Repository.NuevaCategoriaAsync(oCategoria);
        }
        public async Task EditarCategoria(CategoriaDTO Dts)
        {
            var oCategoria = new Categoria
            {
                IdCategoria = Dts.IdCategoria,
                NombreCategoria = Dts.NombreCategoria,
                IdEstado = Dts.IdEstado,
                Icono = Dts.Icono,
                Descripcion = Dts.Descripcion,
            };
            await _Repository.EditarCategoriaAsync(oCategoria);
        }
        public async Task EliminarCategoria(int id)
        {   
            await _Repository.EliminarCategoriasAsync(id);
        }

    }
}
