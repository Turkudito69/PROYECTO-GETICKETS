using Aplication.DTOs;
using Aplication.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aplication.Services
{
    public class LoginServices
    {
        private readonly ILoginRpository _Repository;

        public LoginServices(ILoginRpository Repository)
        {
            _Repository = Repository;
        }

        public async Task<Login?> LoginAsync(LoginDTO log)
        {
            if (log == null) return null;
            if (string.IsNullOrWhiteSpace(log.Correo)) return null;
            if (string.IsNullOrWhiteSpace(log.Contrasena)) return null;

            return await _Repository.LoginAsync(log.Correo, log.Contrasena);
        }
    }
}
