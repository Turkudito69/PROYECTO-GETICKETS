using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.DTOs
{
    public class CategoriaDTO
    {
        public int IdCategoria { get; set; }
        public string? NombreCategoria { get; set; }
        public int IdEstado { get; set; }
        public string? Icono { get; set; }
        public string? Descripcion { get; set; }

        //lista
        public string? Nombrecat { get; set; }
        public string? Estado { get; set; }
    }
}
