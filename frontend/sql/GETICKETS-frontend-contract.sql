/*
  Contracto SQL mínimo para GETICKETS Mobile.
  La migración completa de procedimientos está en:
  database/GETICKETS-backend.sql
  Requiere que la base tenga FotoUrl y el esquema base de GETICKETS.
*/
USE [GETICKETS];
GO

CREATE OR ALTER PROCEDURE dbo.SP_ValidarLogin
    @correo VARCHAR(150),
    @Clave VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.IdUsuario,
        te.IdTecnico,
        u.IdRol,
        u.Correo,
        u.Nombre,
        u.Apellido,
        r.NombreRol AS Rol,
        u.FotoUrl
    FROM dbo.Tbl_Usuario AS u
    INNER JOIN dbo.Tbl_Rol AS r ON r.IdRol = u.IdRol
    LEFT JOIN dbo.Tbl_Tecnico AS te ON te.IdUsuario = u.IdUsuario AND te.IdEstado = 1
    WHERE u.Correo = @correo
      AND u.Contrasena = CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', @Clave), 2)
      AND u.IdEstado = 1
      AND r.IdEstado = 1;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ListarTicket
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        tk.IdTicket,
        tk.IdUsuario,
        tk.IdTecnico,
        tk.CodigoTiket AS Ticket,
        tk.CodigoTiket AS CodigoTicket,
        tk.Descripcion,
        solicitante.Nombre + ' ' + solicitante.Apellido AS Solicitante,
        tecnicoUsuario.Nombre + ' ' + tecnicoUsuario.Apellido AS Tecnico,
        categoria.NombreCategoria AS Categoria,
        prioridad.NombrePrioridad AS Prioridad,
        estado.NombreEstado AS EstadoTicket,
        tk.FechaCreacion,
        tk.Fechaesolucion AS FechaSolucion
    FROM dbo.Tbl_Ticket AS tk
    INNER JOIN dbo.Tbl_Usuario AS solicitante ON solicitante.IdUsuario = tk.IdUsuario
    LEFT JOIN dbo.Tbl_Tecnico AS tecnico ON tecnico.IdTecnico = tk.IdTecnico
    LEFT JOIN dbo.Tbl_Usuario AS tecnicoUsuario ON tecnicoUsuario.IdUsuario = tecnico.IdUsuario
    INNER JOIN dbo.Tbl_Categoria AS categoria ON categoria.IdCategoria = tk.IdCategoria
    LEFT JOIN dbo.Tbl_Prioridad AS prioridad ON prioridad.IdPrioridad = tk.IdPrioridad
    INNER JOIN dbo.Tbl_EstadoTicket AS estado ON estado.IdEstadoTicket = tk.IdEstadoTicket
    ORDER BY tk.FechaCreacion DESC;
END;
GO
