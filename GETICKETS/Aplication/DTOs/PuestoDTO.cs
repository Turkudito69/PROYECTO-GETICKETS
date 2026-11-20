namespace Aplication.DTOs
{
    public class PuestoDTO
    {
        public int IdPuesto { get; set; }
        public string? CodigoPuesto { get; set; }
        public string? NombrePuesto { get; set; }
        public string? Zona { get; set; }
        public int? IdUsuarioActual { get; set; }
        public string? OcupanteNombre { get; set; }
        public string? OcupanteRol { get; set; }
        public string? OcupanteCorreo { get; set; }
        public string? OcupanteFotoUrl { get; set; }
        public DateTime? FechaAsignacion { get; set; }
        public int IdEstado { get; set; }
        public string? Estado { get; set; }
        public int? IdUsuarioAccion { get; set; }
        public string? Motivo { get; set; }
    }
}
