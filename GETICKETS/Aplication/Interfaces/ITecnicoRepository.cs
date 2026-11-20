using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Interfaces
{
    public interface ITecnicoRepository
    {
        Task<IEnumerable<Tecnico>> ListarTecnicosAsync();
        Task EditarTecnicoAsync(Tecnico tecnico);
        Task<int> NuevoTecnicoAsync(Tecnico tecnico);
        Task EliminarTecnicosAsync(int id);
    }
}
