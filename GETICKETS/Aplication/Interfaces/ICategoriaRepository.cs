using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Interfaces
{
    public interface ICategoriaRepository
    {
        Task<IEnumerable<Categoria>> ListarCategoriasAsync();
        Task EditarCategoriaAsync(Categoria categoria);
        Task NuevaCategoriaAsync(Categoria categoria);
        Task EliminarCategoriasAsync(int id);
    }
}
