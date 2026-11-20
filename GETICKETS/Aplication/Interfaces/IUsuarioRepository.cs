using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Interfaces
{
    public interface IUsuarioRepository
    {
        Task<IEnumerable<Usuario>> ListarUsuariosAsync();
        Task EditarUsuarioAsync(Usuario usuario);
        Task<int> NuevoUsuarioAsync(Usuario usuario);
        Task ActualizarFotoUsuarioAsync(int idUsuario, string? fotoUrl);
        Task EliminarUsuariosAsync(int id);
    }
}
