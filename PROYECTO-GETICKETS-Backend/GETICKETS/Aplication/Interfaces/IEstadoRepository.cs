using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Interfaces
{
    public interface IEstadoRepository
    {
        Task<IEnumerable<Estado>> ListarEstadosAsync();
        Task EditarEstadoAsync(Estado estado);
        Task NuevoEstadoAsync(Estado estado);
        Task EliminarEstadosAsync(int id);
    }
}
