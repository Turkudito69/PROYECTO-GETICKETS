using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Interfaces
{
    public interface IPrioridadRepository
    {
        Task<IEnumerable<Prioridad>> ListarPrioridadesAsync();
        Task EditarPrioridadAsync(Prioridad prioridad);
        Task NuevaPrioridadAsync(Prioridad prioridad);
        Task EliminarPrioridadesAsync(int id);
    }
}
