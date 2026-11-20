using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.DTOs
{
    public class TecnicoDTO
    {
        public int IdTecnico { get; set; }
        public string? Especialidad { get; set; }
        public string? Correo { get; set; }
        public int IdUsuario { get; set; }
        public int IdEstado { get; set; }
        //Lista
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? Estado { get; set; }  //Nombre del estado activo , inactivo etc
        public string? Usuario { get; set; } //Nombre completo del tecnico
        public string? FotoUrl { get; set; }
    }
}
