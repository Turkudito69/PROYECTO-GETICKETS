using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Categoria
    {
        public int IdCategoria { get; set; }
        public string? NombreCategoria { get; set; }
        public int IdEstado { get; set; }

        //lista
        public string? Estado { get; set; }
        public string? Nombrecat { get; set; }


    }
}
