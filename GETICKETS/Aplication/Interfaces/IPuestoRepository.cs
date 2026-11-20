using Domain.Entities;

namespace Aplication.Interfaces
{
    public interface IPuestoRepository
    {
        Task<IEnumerable<Puesto>> ListarPuestosAsync();
        Task<IEnumerable<HistorialPuesto>> ListarHistorialAsync(int? idPuesto);
        Task<Puesto> NuevoPuestoAsync(Puesto puesto, int? idUsuarioAccion, string? motivo);
        Task AsignarPuestoAsync(AsignacionPuesto asignacion);
    }
}
