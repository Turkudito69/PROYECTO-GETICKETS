namespace Aplication.DTOs
{
    public class AsignarPuestoDTO
    {
        public int IdPuesto { get; set; }
        public int? IdUsuario { get; set; }
        public string? Motivo { get; set; }
        public int? IdUsuarioAccion { get; set; }
        public bool Swap { get; set; }
    }
}
