namespace Aplication.DTOs
{
    public class HistorialPuestoDTO
    {
        public int IdHistorial { get; set; }
        public int IdPuesto { get; set; }
        public string? CodigoPuesto { get; set; }
        public string? NombrePuesto { get; set; }
        public int IdUsuario { get; set; }
        public string? NombreUsuario { get; set; }
        public string? RolUsuario { get; set; }
        public string? FotoUrl { get; set; }
        public string? Accion { get; set; }
        public string? Motivo { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public string? RealizadoPor { get; set; }
    }
}
