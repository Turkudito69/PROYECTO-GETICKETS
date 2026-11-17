using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Interfaces
{
    public interface IRolesRepository
    {
        Task<IEnumerable<Rol>> ListarRolesAsync();
        Task EditarRolAsync(Rol rol);
        Task NuevoRolAsync(Rol rol);
        Task EliminarRolesAsync(int id);
    }
}
