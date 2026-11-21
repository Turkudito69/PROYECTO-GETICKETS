-- GETICKETS: instalador SQL de un solo archivo.
-- Orden: esquema base, procedimientos, paridad y correccion del flujo.
-- Conserva los registros existentes; los catalogos deben usar los IDs esperados.
-- Ejecutar con sqlcmd -b para detenerse al primer error.

-- ===== INICIO: GETICKETS-base-schema.sql =====
/*
  Esquema limpio para una instalacion nueva de GETICKETS.
  No elimina datos y se puede volver a ejecutar.
  El orden respeta las relaciones de claves foraneas.
*/
IF DB_ID(N'GETICKETS') IS NULL
    EXEC(N'CREATE DATABASE [GETICKETS]');
GO

USE [GETICKETS];
GO

IF OBJECT_ID(N'dbo.Tbl_Estado', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_Estado
    (
        IdEstado INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_Estado PRIMARY KEY,
        NombreEstado VARCHAR(50) NOT NULL
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Estado WHERE IdEstado = 1)
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.Tbl_Estado WHERE NombreEstado = 'Activo')
        THROW 51021, N'El estado Activo debe usar IdEstado=1.', 1;
    SET IDENTITY_INSERT dbo.Tbl_Estado ON;
    INSERT INTO dbo.Tbl_Estado (IdEstado, NombreEstado) VALUES (1, 'Activo');
    SET IDENTITY_INSERT dbo.Tbl_Estado OFF;
END;
ELSE IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Estado WHERE IdEstado = 1 AND NombreEstado = 'Activo')
    THROW 51020, N'GETICKETS requiere que IdEstado=1 corresponda a Activo.', 1;
GO

IF OBJECT_ID(N'dbo.Tbl_Rol', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_Rol
    (
        IdRol INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_Rol PRIMARY KEY,
        NombreRol VARCHAR(50) NOT NULL,
        IdEstado INT NOT NULL CONSTRAINT DF_Tbl_Rol_IdEstado DEFAULT (1),
        Descripcion NVARCHAR(300) NULL,
        Permisos NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Tbl_Rol_Permisos DEFAULT (N'[]'),
        CONSTRAINT FK_Tbl_Rol_Estado FOREIGN KEY (IdEstado) REFERENCES dbo.Tbl_Estado(IdEstado)
    );
END;
GO

IF OBJECT_ID(N'dbo.Tbl_Usuario', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_Usuario
    (
        IdUsuario INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_Usuario PRIMARY KEY,
        Nombre VARCHAR(100) NOT NULL,
        Apellido VARCHAR(100) NOT NULL,
        Correo VARCHAR(150) NOT NULL CONSTRAINT UQ_Tbl_Usuario_Correo UNIQUE,
        Contrasena VARCHAR(64) NOT NULL,
        IdRol INT NOT NULL,
        IdEstado INT NOT NULL CONSTRAINT DF_Tbl_Usuario_IdEstado DEFAULT (1),
        FotoUrl NVARCHAR(MAX) NULL,
        CONSTRAINT FK_Tbl_Usuario_Rol FOREIGN KEY (IdRol) REFERENCES dbo.Tbl_Rol(IdRol),
        CONSTRAINT FK_Tbl_Usuario_Estado FOREIGN KEY (IdEstado) REFERENCES dbo.Tbl_Estado(IdEstado)
    );
END;
GO

IF OBJECT_ID(N'dbo.Tbl_Categoria', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_Categoria
    (
        IdCategoria INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_Categoria PRIMARY KEY,
        NombreCategoria VARCHAR(100) NOT NULL,
        IdEstado INT NOT NULL CONSTRAINT DF_Tbl_Categoria_IdEstado DEFAULT (1),
        Icono NVARCHAR(50) NULL,
        Descripcion NVARCHAR(300) NULL,
        CONSTRAINT FK_Tbl_Categoria_Estado FOREIGN KEY (IdEstado) REFERENCES dbo.Tbl_Estado(IdEstado)
    );
END;
GO

IF OBJECT_ID(N'dbo.Tbl_Prioridad', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_Prioridad
    (
        IdPrioridad INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_Prioridad PRIMARY KEY,
        NombrePrioridad VARCHAR(50) NOT NULL,
        IdEstado INT NOT NULL CONSTRAINT DF_Tbl_Prioridad_IdEstado DEFAULT (1),
        CONSTRAINT FK_Tbl_Prioridad_Estado FOREIGN KEY (IdEstado) REFERENCES dbo.Tbl_Estado(IdEstado)
    );
END;
GO

IF OBJECT_ID(N'dbo.Tbl_EstadoTicket', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_EstadoTicket
    (
        IdEstadoTicket INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_EstadoTicket PRIMARY KEY,
        NombreEstado VARCHAR(50) NOT NULL,
        IdEstado INT NOT NULL CONSTRAINT DF_Tbl_EstadoTicket_IdEstado DEFAULT (1),
        CONSTRAINT FK_Tbl_EstadoTicket_Estado FOREIGN KEY (IdEstado) REFERENCES dbo.Tbl_Estado(IdEstado)
    );
END;
GO

-- Compatibilidad con bases creadas por la versión anterior del script.
IF COL_LENGTH(N'dbo.Tbl_Usuario', N'FotoUrl') IS NULL
    ALTER TABLE dbo.Tbl_Usuario ADD FotoUrl NVARCHAR(MAX) NULL;
IF COL_LENGTH(N'dbo.Tbl_Rol', N'Descripcion') IS NULL
    ALTER TABLE dbo.Tbl_Rol ADD Descripcion NVARCHAR(300) NULL;
IF COL_LENGTH(N'dbo.Tbl_Rol', N'Permisos') IS NULL
    ALTER TABLE dbo.Tbl_Rol ADD Permisos NVARCHAR(MAX) NULL;
IF COL_LENGTH(N'dbo.Tbl_Categoria', N'Icono') IS NULL
    ALTER TABLE dbo.Tbl_Categoria ADD Icono NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.Tbl_Categoria', N'Descripcion') IS NULL
    ALTER TABLE dbo.Tbl_Categoria ADD Descripcion NVARCHAR(300) NULL;
GO

IF OBJECT_ID(N'dbo.Tbl_Tecnico', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_Tecnico
    (
        IdTecnico INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_Tecnico PRIMARY KEY,
        Especialidad VARCHAR(100) NULL,
        Correo VARCHAR(150) NOT NULL CONSTRAINT UQ_Tbl_Tecnico_Correo UNIQUE,
        IdUsuario INT NOT NULL,
        IdEstado INT NOT NULL CONSTRAINT DF_Tbl_Tecnico_IdEstado DEFAULT (1),
        CONSTRAINT FK_Tbl_Tecnico_Usuario FOREIGN KEY (IdUsuario) REFERENCES dbo.Tbl_Usuario(IdUsuario),
        CONSTRAINT FK_Tbl_Tecnico_Estado FOREIGN KEY (IdEstado) REFERENCES dbo.Tbl_Estado(IdEstado)
    );
END;
GO

IF OBJECT_ID(N'dbo.Tbl_Ticket', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_Ticket
    (
        IdTicket INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_Ticket PRIMARY KEY,
        CodigoTiket VARCHAR(50) NOT NULL,
        Descripcion VARCHAR(MAX) NOT NULL,
        IdUsuario INT NOT NULL,
        IdTecnico INT NULL,
        IdCategoria INT NOT NULL,
        IdPrioridad INT NULL,
        IdEstadoTicket INT NOT NULL CONSTRAINT DF_Tbl_Ticket_Estado DEFAULT (1),
        FechaCreacion DATETIME NOT NULL CONSTRAINT DF_Tbl_Ticket_Fecha DEFAULT (GETDATE()),
        Fechaesolucion DATETIME NULL,
        CONSTRAINT FK_Tbl_Ticket_Usuario FOREIGN KEY (IdUsuario) REFERENCES dbo.Tbl_Usuario(IdUsuario),
        CONSTRAINT FK_Tbl_Ticket_Tecnico FOREIGN KEY (IdTecnico) REFERENCES dbo.Tbl_Tecnico(IdTecnico),
        CONSTRAINT FK_Tbl_Ticket_Categoria FOREIGN KEY (IdCategoria) REFERENCES dbo.Tbl_Categoria(IdCategoria),
        CONSTRAINT FK_Tbl_Ticket_Prioridad FOREIGN KEY (IdPrioridad) REFERENCES dbo.Tbl_Prioridad(IdPrioridad),
        CONSTRAINT FK_Tbl_Ticket_Estado FOREIGN KEY (IdEstadoTicket) REFERENCES dbo.Tbl_EstadoTicket(IdEstadoTicket)
    );
END;
GO

IF EXISTS
(
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Tbl_Ticket')
      AND name = N'IdTecnico'
      AND is_nullable = 0
)
    ALTER TABLE dbo.Tbl_Ticket ALTER COLUMN IdTecnico INT NULL;
GO

IF OBJECT_ID(N'dbo.Tbl_SeguimientoTicket', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_SeguimientoTicket
    (
        IdSeguimiento INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_SeguimientoTicket PRIMARY KEY,
        IdTicket INT NOT NULL,
        IdUsuario INT NOT NULL,
        Titulo VARCHAR(200) NOT NULL,
        Descripcion VARCHAR(MAX) NOT NULL,
        FechaAccion DATETIME NOT NULL CONSTRAINT DF_Tbl_SeguimientoTicket_Fecha DEFAULT (GETDATE()),
        CONSTRAINT FK_Tbl_SeguimientoTicket_Ticket FOREIGN KEY (IdTicket) REFERENCES dbo.Tbl_Ticket(IdTicket),
        CONSTRAINT FK_Tbl_SeguimientoTicket_Usuario FOREIGN KEY (IdUsuario) REFERENCES dbo.Tbl_Usuario(IdUsuario)
    );
END;
GO

IF OBJECT_ID(N'dbo.Tbl_AuditoriaTicket', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_AuditoriaTicket
    (
        IdAuditoria INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_AuditoriaTicket PRIMARY KEY,
        IdTicket INT NOT NULL,
        IdUsuario INT NULL,
        Accion VARCHAR(150) NOT NULL,
        Descripcion VARCHAR(MAX) NULL,
        FechaAccion DATETIME NOT NULL CONSTRAINT DF_Tbl_AuditoriaTicket_Fecha DEFAULT (GETDATE()),
        CONSTRAINT FK_Tbl_AuditoriaTicket_Ticket FOREIGN KEY (IdTicket) REFERENCES dbo.Tbl_Ticket(IdTicket),
        CONSTRAINT FK_Tbl_AuditoriaTicket_Usuario FOREIGN KEY (IdUsuario) REFERENCES dbo.Tbl_Usuario(IdUsuario)
    );
END;
GO

IF OBJECT_ID(N'dbo.Tbl_DetalleTicket', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_DetalleTicket
    (
        IdDetalleTicket INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_DetalleTicket PRIMARY KEY,
        IdTicket INT NOT NULL,
        Diagnostico VARCHAR(MAX) NULL,
        Observaciones VARCHAR(MAX) NULL,
        Solucion VARCHAR(MAX) NULL,
        CONSTRAINT FK_Tbl_DetalleTicket_Ticket FOREIGN KEY (IdTicket) REFERENCES dbo.Tbl_Ticket(IdTicket)
    );
END;
GO

IF OBJECT_ID(N'dbo.Tbl_Puesto', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_Puesto
    (
        IdPuesto INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_Puesto PRIMARY KEY,
        CodigoPuesto VARCHAR(20) NOT NULL CONSTRAINT UQ_Tbl_Puesto_Codigo UNIQUE,
        NombrePuesto NVARCHAR(150) NOT NULL,
        Zona NVARCHAR(50) NOT NULL,
        IdUsuarioActual INT NULL,
        FechaAsignacion DATETIME2(0) NULL,
        IdEstado INT NOT NULL CONSTRAINT DF_Tbl_Puesto_IdEstado DEFAULT (1),
        CONSTRAINT FK_Tbl_Puesto_Usuario FOREIGN KEY (IdUsuarioActual) REFERENCES dbo.Tbl_Usuario(IdUsuario),
        CONSTRAINT FK_Tbl_Puesto_Estado FOREIGN KEY (IdEstado) REFERENCES dbo.Tbl_Estado(IdEstado),
        CONSTRAINT CK_Tbl_Puesto_Zona CHECK (Zona IN (N'Soporte TI', N'Administración', N'Operaciones'))
    );
END;
GO

IF OBJECT_ID(N'dbo.Tbl_HistorialPuesto', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_HistorialPuesto
    (
        IdHistorial INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_HistorialPuesto PRIMARY KEY,
        IdPuesto INT NOT NULL,
        IdUsuario INT NOT NULL,
        IdUsuarioAccion INT NOT NULL,
        Accion NVARCHAR(100) NOT NULL,
        Motivo NVARCHAR(300) NOT NULL,
        FechaInicio DATETIME2(0) NOT NULL CONSTRAINT DF_Tbl_HistorialPuesto_FechaInicio DEFAULT (SYSDATETIME()),
        FechaFin DATETIME2(0) NULL,
        CONSTRAINT FK_Tbl_HistorialPuesto_Puesto FOREIGN KEY (IdPuesto) REFERENCES dbo.Tbl_Puesto(IdPuesto),
        CONSTRAINT FK_Tbl_HistorialPuesto_Usuario FOREIGN KEY (IdUsuario) REFERENCES dbo.Tbl_Usuario(IdUsuario),
        CONSTRAINT FK_Tbl_HistorialPuesto_UsuarioAccion FOREIGN KEY (IdUsuarioAccion) REFERENCES dbo.Tbl_Usuario(IdUsuario)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Tbl_Ticket') AND name = N'IX_Tbl_Ticket_Usuario_Fecha')
    CREATE INDEX IX_Tbl_Ticket_Usuario_Fecha ON dbo.Tbl_Ticket (IdUsuario, FechaCreacion DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Tbl_Ticket') AND name = N'IX_Tbl_Ticket_Tecnico_Estado')
    CREATE INDEX IX_Tbl_Ticket_Tecnico_Estado ON dbo.Tbl_Ticket (IdTecnico, IdEstadoTicket);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Tbl_HistorialPuesto') AND name = N'IX_Tbl_HistorialPuesto_Puesto_Fecha')
    CREATE INDEX IX_Tbl_HistorialPuesto_Puesto_Fecha ON dbo.Tbl_HistorialPuesto (IdPuesto, FechaInicio DESC);
GO

IF OBJECT_ID(N'dbo.Tbl_Migracion', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tbl_Migracion
    (
        Version VARCHAR(40) NOT NULL CONSTRAINT PK_Tbl_Migracion PRIMARY KEY,
        Nombre NVARCHAR(150) NOT NULL,
        FechaAplicacion DATETIME2(0) NOT NULL CONSTRAINT DF_Tbl_Migracion_Fecha DEFAULT (SYSDATETIME())
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Migracion WHERE Version = '000_base_schema')
    INSERT INTO dbo.Tbl_Migracion (Version, Nombre) VALUES ('000_base_schema', N'Esquema base');
GO

PRINT N'Esquema base de GETICKETS listo.';
GO

-- ===== FIN: GETICKETS-base-schema.sql =====
GO

-- ===== INICIO: GETICKETS-backend.sql =====
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
        tk.IdCategoria,
        ISNULL(tk.IdPrioridad, 0) AS IdPrioridad,
        tk.IdEstadoTicket,
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

CREATE OR ALTER PROCEDURE dbo.SP_ListarPrioridad
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.IdPrioridad, p.NombrePrioridad, p.IdEstado, e.NombreEstado AS Estado
    FROM dbo.Tbl_Prioridad AS p
    INNER JOIN dbo.Tbl_Estado AS e ON e.IdEstado = p.IdEstado
    ORDER BY p.IdPrioridad;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ListarEstadoTiketc
AS
BEGIN
    SET NOCOUNT ON;
    SELECT et.IdEstadoTicket, et.NombreEstado AS Nombre, et.IdEstado, e.NombreEstado AS Estado
    FROM dbo.Tbl_EstadoTicket AS et
    INNER JOIN dbo.Tbl_Estado AS e ON e.IdEstado = et.IdEstado
    ORDER BY et.IdEstadoTicket;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ListarUsuarios
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.IdUsuario, u.Nombre, u.Apellido, u.Correo, u.IdRol, u.IdEstado,
           u.FotoUrl, r.NombreRol AS Rol, e.NombreEstado AS Estado
    FROM dbo.Tbl_Usuario AS u
    INNER JOIN dbo.Tbl_Rol AS r ON r.IdRol = u.IdRol
    INNER JOIN dbo.Tbl_Estado AS e ON e.IdEstado = u.IdEstado
    ORDER BY u.IdUsuario;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_NuevoUsuario
    @Nombre VARCHAR(100),
    @Apellido VARCHAR(100),
    @Correo VARCHAR(150),
    @Contrasena VARCHAR(MAX),
    @IdRol INT,
    @FotoUrl NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NULLIF(LTRIM(RTRIM(@Nombre)), '') IS NULL
           OR NULLIF(LTRIM(RTRIM(@Apellido)), '') IS NULL
           OR NULLIF(LTRIM(RTRIM(@Correo)), '') IS NULL
           OR NULLIF(@Contrasena, '') IS NULL
            THROW 51100, N'Debe completar los campos obligatorios del usuario.', 1;
        IF EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE Correo = @Correo)
            THROW 51101, N'El correo ya está registrado.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Rol WHERE IdRol = @IdRol AND IdEstado = 1)
            THROW 51102, N'El rol seleccionado no existe o está inactivo.', 1;

        INSERT INTO dbo.Tbl_Usuario (Nombre, Apellido, Correo, Contrasena, IdRol, FotoUrl)
        VALUES (LTRIM(RTRIM(@Nombre)), LTRIM(RTRIM(@Apellido)), LTRIM(RTRIM(@Correo)),
                CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', @Contrasena), 2), @IdRol, @FotoUrl);
        DECLARE @IdUsuario INT = CONVERT(INT, SCOPE_IDENTITY());
        COMMIT TRANSACTION;
        SELECT @IdUsuario AS IdUsuario;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO


CREATE OR ALTER PROCEDURE dbo.SP_ActualizarUsuario
    @IdUsuario INT,
    @Nombre VARCHAR(100),
    @Apellido VARCHAR(100),
    @Correo VARCHAR(150),
    @IdRol INT,
    @IdEstado INT,
    @Contrasena VARCHAR(100) = NULL,
    @FotoUrl NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE IdUsuario = @IdUsuario)
        THROW 51103, N'El usuario no existe.', 1;
    IF NULLIF(LTRIM(RTRIM(@Nombre)), '') IS NULL
       OR NULLIF(LTRIM(RTRIM(@Apellido)), '') IS NULL
       OR NULLIF(LTRIM(RTRIM(@Correo)), '') IS NULL
        THROW 51104, N'Nombre, apellido y correo son obligatorios.', 1;
    IF EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE Correo = @Correo AND IdUsuario <> @IdUsuario)
        THROW 51105, N'El correo ya está registrado.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Rol WHERE IdRol = @IdRol AND IdEstado = 1)
        THROW 51106, N'El rol seleccionado no existe o está inactivo.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Estado WHERE IdEstado = @IdEstado)
        THROW 51107, N'El estado seleccionado no existe.', 1;

    UPDATE dbo.Tbl_Usuario
    SET Nombre = LTRIM(RTRIM(@Nombre)),
        Apellido = LTRIM(RTRIM(@Apellido)),
        Correo = LTRIM(RTRIM(@Correo)),
        IdRol = @IdRol,
        IdEstado = @IdEstado,
        Contrasena = CASE WHEN NULLIF(@Contrasena, '') IS NULL THEN Contrasena
                          ELSE CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', @Contrasena), 2) END,
        FotoUrl = COALESCE(@FotoUrl, FotoUrl)
    WHERE IdUsuario = @IdUsuario;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ActualizarFotoUsuario
    @IdUsuario INT,
    @FotoUrl NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE IdUsuario = @IdUsuario)
        THROW 51108, N'El usuario no existe.', 1;
    UPDATE dbo.Tbl_Usuario SET FotoUrl = @FotoUrl WHERE IdUsuario = @IdUsuario;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ListarRoles
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.IdRol, r.NombreRol, r.IdEstado, r.Descripcion,
           COALESCE(r.Permisos, N'[]') AS Permisos, e.NombreEstado AS Estado
    FROM dbo.Tbl_Rol AS r
    INNER JOIN dbo.Tbl_Estado AS e ON e.IdEstado = r.IdEstado
    ORDER BY r.IdRol;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_NuevoRol
    @NombreRol VARCHAR(50),
    @Descripcion NVARCHAR(300) = NULL,
    @Permisos NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NULLIF(LTRIM(RTRIM(@NombreRol)), '') IS NULL
        THROW 51109, N'El nombre del rol es obligatorio.', 1;
    IF EXISTS (SELECT 1 FROM dbo.Tbl_Rol WHERE NombreRol = @NombreRol)
        THROW 51110, N'El rol ya existe.', 1;
    IF @Permisos IS NOT NULL AND ISJSON(@Permisos) <> 1
        THROW 51111, N'Los permisos deben enviarse como una lista JSON.', 1;
    INSERT INTO dbo.Tbl_Rol (NombreRol, IdEstado, Descripcion, Permisos)
    VALUES (LTRIM(RTRIM(@NombreRol)), 1, @Descripcion, COALESCE(@Permisos, N'[]'));
    SELECT CONVERT(INT, SCOPE_IDENTITY()) AS IdRol;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ActualizarRol
    @IdRol INT,
    @NombreRol VARCHAR(50),
    @IdEstado INT,
    @Descripcion NVARCHAR(300) = NULL,
    @Permisos NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Rol WHERE IdRol = @IdRol)
        THROW 51112, N'El rol no existe.', 1;
    IF NULLIF(LTRIM(RTRIM(@NombreRol)), '') IS NULL
        THROW 51113, N'El nombre del rol es obligatorio.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Estado WHERE IdEstado = @IdEstado)
        THROW 51114, N'El estado seleccionado no existe.', 1;
    IF @Permisos IS NOT NULL AND ISJSON(@Permisos) <> 1
        THROW 51115, N'Los permisos deben enviarse como una lista JSON.', 1;
    UPDATE dbo.Tbl_Rol
    SET NombreRol = LTRIM(RTRIM(@NombreRol)), IdEstado = @IdEstado,
        Descripcion = @Descripcion, Permisos = COALESCE(@Permisos, N'[]')
    WHERE IdRol = @IdRol;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ListarCategorias
AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.IdCategoria, c.NombreCategoria, c.NombreCategoria AS Nombre,
           c.IdEstado, c.Icono, c.Descripcion, e.NombreEstado AS Estado
    FROM dbo.Tbl_Categoria AS c
    INNER JOIN dbo.Tbl_Estado AS e ON e.IdEstado = c.IdEstado
    ORDER BY c.IdCategoria;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_NuevaCategoria
    @NombreCategoria VARCHAR(100),
    @IdEstado INT = 1,
    @Icono NVARCHAR(50) = NULL,
    @Descripcion NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NULLIF(LTRIM(RTRIM(@NombreCategoria)), '') IS NULL
        THROW 51116, N'El nombre de la categoría es obligatorio.', 1;
    IF EXISTS (SELECT 1 FROM dbo.Tbl_Categoria WHERE NombreCategoria = @NombreCategoria)
        THROW 51117, N'La categoría ya existe.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Estado WHERE IdEstado = @IdEstado)
        THROW 51118, N'El estado seleccionado no existe.', 1;
    INSERT INTO dbo.Tbl_Categoria (NombreCategoria, IdEstado, Icono, Descripcion)
    VALUES (LTRIM(RTRIM(@NombreCategoria)), @IdEstado, @Icono, @Descripcion);
    SELECT CONVERT(INT, SCOPE_IDENTITY()) AS IdCategoria;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ActualizarCategoria
    @IdCategoria INT,
    @NombreCategoria VARCHAR(100),
    @IdEstado INT,
    @Icono NVARCHAR(50) = NULL,
    @Descripcion NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Categoria WHERE IdCategoria = @IdCategoria)
        THROW 51119, N'La categoría no existe.', 1;
    IF NULLIF(LTRIM(RTRIM(@NombreCategoria)), '') IS NULL
        THROW 51120, N'El nombre de la categoría es obligatorio.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Estado WHERE IdEstado = @IdEstado)
        THROW 51121, N'El estado seleccionado no existe.', 1;
    UPDATE dbo.Tbl_Categoria
    SET NombreCategoria = LTRIM(RTRIM(@NombreCategoria)), IdEstado = @IdEstado,
        Icono = @Icono, Descripcion = @Descripcion
    WHERE IdCategoria = @IdCategoria;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ListarTecnicos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.IdTecnico, t.IdUsuario, t.IdEstado, t.Correo, t.Especialidad,
           u.Nombre, u.Apellido, u.Nombre + ' ' + u.Apellido AS Usuario,
           u.FotoUrl, e.NombreEstado AS Estado
    FROM dbo.Tbl_Tecnico AS t
    INNER JOIN dbo.Tbl_Usuario AS u ON u.IdUsuario = t.IdUsuario
    INNER JOIN dbo.Tbl_Estado AS e ON e.IdEstado = t.IdEstado
    ORDER BY t.IdTecnico;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_NuevoTecnico
    @Especialidad VARCHAR(100),
    @Correo VARCHAR(50),
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NULLIF(LTRIM(RTRIM(@Correo)), '') IS NULL
        THROW 51122, N'El correo del técnico es obligatorio.', 1;
    IF EXISTS (SELECT 1 FROM dbo.Tbl_Tecnico WHERE Correo = @Correo)
        THROW 51123, N'El correo del técnico ya existe.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE IdUsuario = @IdUsuario AND IdEstado = 1)
        THROW 51124, N'El usuario seleccionado no existe o está inactivo.', 1;
    IF EXISTS (SELECT 1 FROM dbo.Tbl_Tecnico WHERE IdUsuario = @IdUsuario)
        THROW 51125, N'Este usuario ya está registrado como técnico.', 1;
    INSERT INTO dbo.Tbl_Tecnico (Especialidad, Correo, IdUsuario, IdEstado)
    VALUES (@Especialidad, @Correo, @IdUsuario, 1);
    SELECT CONVERT(INT, SCOPE_IDENTITY()) AS IdTecnico;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_NuevaPrioridad
    @NombrePrioridad VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NULLIF(LTRIM(RTRIM(@NombrePrioridad)), '') IS NULL
        THROW 51142, N'El nombre de la prioridad es obligatorio.', 1;
    IF EXISTS (SELECT 1 FROM dbo.Tbl_Prioridad WHERE NombrePrioridad = @NombrePrioridad)
        THROW 51143, N'La prioridad ya existe.', 1;
    INSERT INTO dbo.Tbl_Prioridad (NombrePrioridad, IdEstado)
    VALUES (LTRIM(RTRIM(@NombrePrioridad)), 1);
    SELECT CONVERT(INT, SCOPE_IDENTITY()) AS IdPrioridad;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_NuevoEstadoTicket
    @NombreEstado VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NULLIF(LTRIM(RTRIM(@NombreEstado)), '') IS NULL
        THROW 51144, N'El nombre del estado es obligatorio.', 1;
    IF EXISTS (SELECT 1 FROM dbo.Tbl_EstadoTicket WHERE NombreEstado = @NombreEstado)
        THROW 51145, N'El estado del ticket ya existe.', 1;
    INSERT INTO dbo.Tbl_EstadoTicket (NombreEstado, IdEstado)
    VALUES (LTRIM(RTRIM(@NombreEstado)), 1);
    SELECT CONVERT(INT, SCOPE_IDENTITY()) AS IdEstadoTicket;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ListarPuestos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.IdPuesto, p.CodigoPuesto, p.NombrePuesto, p.Zona,
           p.IdUsuarioActual,
           CASE WHEN u.IdUsuario IS NULL THEN NULL ELSE u.Nombre + ' ' + u.Apellido END AS OcupanteNombre,
           r.NombreRol AS OcupanteRol, u.Correo AS OcupanteCorreo,
           u.FotoUrl AS OcupanteFotoUrl, p.FechaAsignacion, p.IdEstado,
           e.NombreEstado AS Estado
    FROM dbo.Tbl_Puesto AS p
    LEFT JOIN dbo.Tbl_Usuario AS u ON u.IdUsuario = p.IdUsuarioActual
    LEFT JOIN dbo.Tbl_Rol AS r ON r.IdRol = u.IdRol
    INNER JOIN dbo.Tbl_Estado AS e ON e.IdEstado = p.IdEstado
    ORDER BY p.CodigoPuesto;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ListarHistorialPuestos
    @IdPuesto INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT h.IdHistorial, h.IdPuesto, p.CodigoPuesto, p.NombrePuesto,
           h.IdUsuario, u.Nombre + ' ' + u.Apellido AS NombreUsuario,
           r.NombreRol AS RolUsuario, u.FotoUrl, h.Accion, h.Motivo,
           h.FechaInicio, h.FechaFin,
           actor.Nombre + ' ' + actor.Apellido AS RealizadoPor
    FROM dbo.Tbl_HistorialPuesto AS h
    INNER JOIN dbo.Tbl_Puesto AS p ON p.IdPuesto = h.IdPuesto
    INNER JOIN dbo.Tbl_Usuario AS u ON u.IdUsuario = h.IdUsuario
    INNER JOIN dbo.Tbl_Rol AS r ON r.IdRol = u.IdRol
    INNER JOIN dbo.Tbl_Usuario AS actor ON actor.IdUsuario = h.IdUsuarioAccion
    WHERE @IdPuesto IS NULL OR h.IdPuesto = @IdPuesto
    ORDER BY h.FechaInicio DESC, h.IdHistorial DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_AsignarPuesto
    @IdPuesto INT,
    @IdUsuario INT = NULL,
    @Motivo NVARCHAR(300) = NULL,
    @IdUsuarioAccion INT = NULL,
    @Swap BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @OcupanteActual INT, @PuestoAnterior INT, @Fecha DATETIME2(0) = SYSDATETIME();
        DECLARE @Actor INT, @MotivoFinal NVARCHAR(300);

        SELECT @OcupanteActual = IdUsuarioActual
        FROM dbo.Tbl_Puesto WITH (UPDLOCK, HOLDLOCK)
        WHERE IdPuesto = @IdPuesto AND IdEstado = 1;
        IF @@ROWCOUNT = 0
            THROW 51126, N'El puesto no existe o está inactivo.', 1;

        IF @IdUsuario IS NOT NULL AND NOT EXISTS
            (SELECT 1 FROM dbo.Tbl_Usuario WHERE IdUsuario = @IdUsuario AND IdEstado = 1)
            THROW 51127, N'El usuario seleccionado no existe o está inactivo.', 1;

        IF @OcupanteActual = @IdUsuario
        BEGIN
            COMMIT TRANSACTION;
            RETURN;
        END;

        SET @Actor = COALESCE(@IdUsuarioAccion, @IdUsuario, @OcupanteActual, 1);
        SET @MotivoFinal = COALESCE(NULLIF(LTRIM(RTRIM(@Motivo)), N''),
            CASE WHEN @IdUsuario IS NULL THEN N'Puesto liberado' ELSE N'Cambio de puesto de trabajo' END);

        IF @OcupanteActual IS NOT NULL
            UPDATE dbo.Tbl_HistorialPuesto
            SET FechaFin = @Fecha
            WHERE IdPuesto = @IdPuesto AND IdUsuario = @OcupanteActual AND FechaFin IS NULL;

        IF @IdUsuario IS NULL
        BEGIN
            UPDATE dbo.Tbl_Puesto SET IdUsuarioActual = NULL, FechaAsignacion = NULL WHERE IdPuesto = @IdPuesto;
            COMMIT TRANSACTION;
            RETURN;
        END;

        SELECT TOP (1) @PuestoAnterior = IdPuesto
        FROM dbo.Tbl_Puesto WITH (UPDLOCK, HOLDLOCK)
        WHERE IdUsuarioActual = @IdUsuario AND IdPuesto <> @IdPuesto AND IdEstado = 1;

        IF @PuestoAnterior IS NOT NULL
        BEGIN
            UPDATE dbo.Tbl_HistorialPuesto
            SET FechaFin = @Fecha
            WHERE IdPuesto = @PuestoAnterior AND IdUsuario = @IdUsuario AND FechaFin IS NULL;

            IF @Swap = 1 AND @OcupanteActual IS NOT NULL
            BEGIN
                UPDATE dbo.Tbl_Puesto
                SET IdUsuarioActual = @OcupanteActual, FechaAsignacion = @Fecha
                WHERE IdPuesto = @PuestoAnterior;
                INSERT INTO dbo.Tbl_HistorialPuesto
                    (IdPuesto, IdUsuario, IdUsuarioAccion, Accion, Motivo, FechaInicio)
                VALUES
                    (@PuestoAnterior, @OcupanteActual, @Actor, N'Intercambio de puesto',
                     @MotivoFinal + N' (intercambio con el puesto ' + CAST(@IdPuesto AS NVARCHAR(20)) + N')', @Fecha);
            END
            ELSE
            BEGIN
                UPDATE dbo.Tbl_Puesto
                SET IdUsuarioActual = NULL, FechaAsignacion = NULL
                WHERE IdPuesto = @PuestoAnterior;
            END;
        END;

        UPDATE dbo.Tbl_Puesto
        SET IdUsuarioActual = @IdUsuario, FechaAsignacion = @Fecha
        WHERE IdPuesto = @IdPuesto;

        INSERT INTO dbo.Tbl_HistorialPuesto
            (IdPuesto, IdUsuario, IdUsuarioAccion, Accion, Motivo, FechaInicio)
        VALUES
            (@IdPuesto, @IdUsuario, @Actor,
             CASE WHEN @PuestoAnterior IS NULL THEN N'Asignación de puesto' ELSE N'Cambio de puesto' END,
             @MotivoFinal, @Fecha);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_NuevoPuesto
    @CodigoPuesto VARCHAR(20) = NULL,
    @NombrePuesto NVARCHAR(150),
    @Zona NVARCHAR(50),
    @IdUsuarioActual INT = NULL,
    @IdUsuarioAccion INT = NULL,
    @Motivo NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NULLIF(LTRIM(RTRIM(@NombrePuesto)), N'') IS NULL
            THROW 51128, N'El nombre del puesto es obligatorio.', 1;
        IF @Zona NOT IN (N'Soporte TI', N'Administración', N'Operaciones')
            THROW 51129, N'La zona del puesto no es válida.', 1;

        IF NULLIF(LTRIM(RTRIM(@CodigoPuesto)), '') IS NULL
        BEGIN
            DECLARE @Prefijo VARCHAR(3), @Numero INT;
            SET @Prefijo = CASE @Zona WHEN N'Soporte TI' THEN 'TI' WHEN N'Administración' THEN 'ADM' ELSE 'COL' END;
            SELECT @Numero = ISNULL(MAX(TRY_CONVERT(INT, RIGHT(CodigoPuesto, 2))), 0) + 1
            FROM dbo.Tbl_Puesto WHERE CodigoPuesto LIKE @Prefijo + '-%';
            SET @CodigoPuesto = @Prefijo + '-' + RIGHT('00' + CONVERT(VARCHAR(10), @Numero), 2);
            WHILE EXISTS (SELECT 1 FROM dbo.Tbl_Puesto WHERE CodigoPuesto = @CodigoPuesto)
            BEGIN
                SET @Numero += 1;
                SET @CodigoPuesto = @Prefijo + '-' + RIGHT('00' + CONVERT(VARCHAR(10), @Numero), 2);
            END;
        END;
        IF EXISTS (SELECT 1 FROM dbo.Tbl_Puesto WHERE CodigoPuesto = @CodigoPuesto)
            THROW 51130, N'Ya existe un puesto con ese código.', 1;

        INSERT INTO dbo.Tbl_Puesto (CodigoPuesto, NombrePuesto, Zona, IdEstado)
        VALUES (@CodigoPuesto, LTRIM(RTRIM(@NombrePuesto)), @Zona, 1);
        DECLARE @IdPuesto INT = CONVERT(INT, SCOPE_IDENTITY());

        IF @IdUsuarioActual IS NOT NULL
            EXEC dbo.SP_AsignarPuesto @IdPuesto = @IdPuesto, @IdUsuario = @IdUsuarioActual,
                 @Motivo = @Motivo, @IdUsuarioAccion = @IdUsuarioAccion, @Swap = 0;

        COMMIT TRANSACTION;
        SELECT @IdPuesto AS IdPuesto, @CodigoPuesto AS CodigoPuesto;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ConfirmarCompletado
    @IdTicket INT,
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @IdEstadoActual INT, @IdEstadoCompletado INT, @IdEstadoResuelto INT, @EsAdmin BIT = 0;
        IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Ticket WHERE IdTicket = @IdTicket)
            THROW 51131, N'El ticket no existe.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE IdUsuario = @IdUsuario AND IdEstado = 1)
            THROW 51132, N'El usuario no existe o está inactivo.', 1;
        SELECT @EsAdmin = CASE WHEN r.NombreRol = 'Administrador' THEN 1 ELSE 0 END
        FROM dbo.Tbl_Usuario u INNER JOIN dbo.Tbl_Rol r ON r.IdRol = u.IdRol
        WHERE u.IdUsuario = @IdUsuario;
        IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Ticket WHERE IdTicket = @IdTicket AND IdUsuario = @IdUsuario) AND ISNULL(@EsAdmin, 0) = 0
            THROW 51133, N'Solo el solicitante o un administrador puede confirmar el cierre.', 1;
        SELECT @IdEstadoActual = IdEstadoTicket FROM dbo.Tbl_Ticket WHERE IdTicket = @IdTicket;
        SELECT @IdEstadoResuelto = IdEstadoTicket FROM dbo.Tbl_EstadoTicket WHERE NombreEstado = 'Resuelto';
        SELECT @IdEstadoCompletado = IdEstadoTicket FROM dbo.Tbl_EstadoTicket WHERE NombreEstado = 'Completado';
        IF @IdEstadoCompletado IS NULL OR @IdEstadoResuelto IS NULL
            THROW 51134, N'Faltan estados de ticket requeridos.', 1;
        IF @IdEstadoActual <> @IdEstadoResuelto
            THROW 51135, N'El ticket debe estar Resuelto para confirmar el cierre.', 1;

        UPDATE dbo.Tbl_Ticket SET IdEstadoTicket = @IdEstadoCompletado,
            Fechaesolucion = COALESCE(Fechaesolucion, GETDATE()) WHERE IdTicket = @IdTicket;
        INSERT INTO dbo.Tbl_SeguimientoTicket (IdTicket, IdUsuario, Titulo, Descripcion)
        VALUES (@IdTicket, @IdUsuario, 'Completado por usuario', 'El usuario confirmó que la solución funcionó.');
        INSERT INTO dbo.Tbl_AuditoriaTicket (IdTicket, IdUsuario, Accion, Descripcion)
        VALUES (@IdTicket, @IdUsuario, 'Cierre confirmado', 'El usuario confirmó que la solicitud quedó completada.');
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_FinalizarTicket
    @IdTicket INT,
    @IdUsuario INT,
    @Diagnostico VARCHAR(MAX),
    @Solucion VARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdEstadoActual INT,
                @IdEstadoEnProceso INT,
                @IdEstadoResuelto INT,
                @IdDetalleTicket INT;

        SELECT @IdEstadoActual = IdEstadoTicket
        FROM dbo.Tbl_Ticket WITH (UPDLOCK, HOLDLOCK)
        WHERE IdTicket = @IdTicket;

        IF @IdEstadoActual IS NULL
            THROW 51144, N'El ticket no existe.', 1;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.Tbl_Ticket AS tk
            INNER JOIN dbo.Tbl_Tecnico AS te ON te.IdTecnico = tk.IdTecnico
            INNER JOIN dbo.Tbl_Usuario AS u ON u.IdUsuario = te.IdUsuario
            WHERE tk.IdTicket = @IdTicket
              AND te.IdUsuario = @IdUsuario
              AND te.IdEstado = 1
              AND u.IdEstado = 1
        )
            THROW 51145, N'El usuario no es el técnico asignado al ticket.', 1;

        SELECT @IdEstadoEnProceso = IdEstadoTicket
        FROM dbo.Tbl_EstadoTicket
        WHERE NombreEstado = 'En Proceso';
        SELECT @IdEstadoResuelto = IdEstadoTicket
        FROM dbo.Tbl_EstadoTicket
        WHERE NombreEstado = 'Resuelto';

        IF @IdEstadoEnProceso IS NULL OR @IdEstadoResuelto IS NULL
            THROW 51146, N'Faltan los estados En Proceso o Resuelto.', 1;
        IF @IdEstadoActual <> @IdEstadoEnProceso
            THROW 51147, N'El ticket debe estar En Proceso para registrar la solución.', 1;
        IF NULLIF(LTRIM(RTRIM(@Diagnostico)), '') IS NULL
            THROW 51148, N'El diagnóstico es obligatorio.', 1;
        IF NULLIF(LTRIM(RTRIM(@Solucion)), '') IS NULL
            THROW 51149, N'La solución es obligatoria.', 1;

        SELECT @IdDetalleTicket = MAX(IdDetalleTicket)
        FROM dbo.Tbl_DetalleTicket WITH (UPDLOCK, HOLDLOCK)
        WHERE IdTicket = @IdTicket;

        IF @IdDetalleTicket IS NULL
        BEGIN
            INSERT INTO dbo.Tbl_DetalleTicket (IdTicket, Diagnostico, Solucion)
            VALUES (@IdTicket, LTRIM(RTRIM(@Diagnostico)), LTRIM(RTRIM(@Solucion)));
        END
        ELSE
        BEGIN
            UPDATE dbo.Tbl_DetalleTicket
            SET Diagnostico = LTRIM(RTRIM(@Diagnostico)),
                Solucion = LTRIM(RTRIM(@Solucion))
            WHERE IdDetalleTicket = @IdDetalleTicket;
        END;

        UPDATE dbo.Tbl_Ticket
        SET IdEstadoTicket = @IdEstadoResuelto,
            Fechaesolucion = GETDATE()
        WHERE IdTicket = @IdTicket
          AND IdEstadoTicket = @IdEstadoActual;

        IF @@ROWCOUNT = 0
            THROW 51150, N'No se pudo actualizar el estado del ticket.', 1;

        INSERT INTO dbo.Tbl_SeguimientoTicket (IdTicket, IdUsuario, Titulo, Descripcion)
        VALUES (@IdTicket, @IdUsuario, 'Ticket resuelto', 'El técnico registró la solución y resolvió el ticket.');

        INSERT INTO dbo.Tbl_AuditoriaTicket (IdTicket, IdUsuario, Accion, Descripcion)
        VALUES (@IdTicket, @IdUsuario, 'Resolución de ticket', 'El técnico registró o actualizó el diagnóstico y la solución.');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ReabrirTicket
    @IdTicket INT,
    @IdUsuario INT,
    @Motivo VARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @IdEstadoActual INT, @IdEstadoResuelto INT, @IdEstadoEnProceso INT, @EsAdmin BIT = 0;
        SET @Motivo = LTRIM(RTRIM(@Motivo));
        IF NULLIF(@Motivo, '') IS NULL
            THROW 51136, N'Indica el motivo para reabrir el ticket.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Ticket WHERE IdTicket = @IdTicket)
            THROW 51137, N'El ticket no existe.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE IdUsuario = @IdUsuario AND IdEstado = 1)
            THROW 51138, N'El usuario no existe o está inactivo.', 1;
        SELECT @EsAdmin = CASE WHEN r.NombreRol = 'Administrador' THEN 1 ELSE 0 END
        FROM dbo.Tbl_Usuario u INNER JOIN dbo.Tbl_Rol r ON r.IdRol = u.IdRol
        WHERE u.IdUsuario = @IdUsuario;
        IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Ticket WHERE IdTicket = @IdTicket AND IdUsuario = @IdUsuario) AND ISNULL(@EsAdmin, 0) = 0
            THROW 51139, N'Solo el solicitante o un administrador puede reabrir el ticket.', 1;
        SELECT @IdEstadoActual = IdEstadoTicket FROM dbo.Tbl_Ticket WHERE IdTicket = @IdTicket;
        SELECT @IdEstadoResuelto = IdEstadoTicket FROM dbo.Tbl_EstadoTicket WHERE NombreEstado = 'Resuelto';
        SELECT @IdEstadoEnProceso = IdEstadoTicket FROM dbo.Tbl_EstadoTicket WHERE NombreEstado = 'En Proceso';
        IF @IdEstadoResuelto IS NULL OR @IdEstadoEnProceso IS NULL
            THROW 51140, N'Faltan estados de ticket requeridos.', 1;
        IF @IdEstadoActual <> @IdEstadoResuelto
            THROW 51141, N'Solo se pueden reabrir tickets Resueltos.', 1;

        UPDATE dbo.Tbl_Ticket SET IdEstadoTicket = @IdEstadoEnProceso, Fechaesolucion = NULL WHERE IdTicket = @IdTicket;
        IF EXISTS (SELECT 1 FROM dbo.Tbl_DetalleTicket WHERE IdTicket = @IdTicket)
            UPDATE dbo.Tbl_DetalleTicket
            SET Observaciones = CONCAT(COALESCE(Observaciones + CHAR(13) + CHAR(10), ''), 'Reabierto por usuario: ', @Motivo)
            WHERE IdDetalleTicket = (SELECT MAX(IdDetalleTicket) FROM dbo.Tbl_DetalleTicket WHERE IdTicket = @IdTicket);
        ELSE
            INSERT INTO dbo.Tbl_DetalleTicket (IdTicket, Observaciones)
            VALUES (@IdTicket, 'Reabierto por usuario: ' + @Motivo);

        INSERT INTO dbo.Tbl_SeguimientoTicket (IdTicket, IdUsuario, Titulo, Descripcion)
        VALUES (@IdTicket, @IdUsuario, 'Ticket reabierto', LEFT('El ticket se reabrió: ' + @Motivo, 200));
        INSERT INTO dbo.Tbl_AuditoriaTicket (IdTicket, IdUsuario, Accion, Descripcion)
        VALUES (@IdTicket, @IdUsuario, 'Ticket reabierto', 'Motivo: ' + @Motivo);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Migracion WHERE Version = '001_backend_procedures')
    INSERT INTO dbo.Tbl_Migracion (Version, Nombre)
    VALUES ('001_backend_procedures', N'Procedimientos almacenados de la API');
GO

-- ===== FIN: GETICKETS-backend.sql =====
GO

-- ===== INICIO: GETICKETS-paridad.sql =====
/*
  GETICKETS: migracion inicial de paridad con el prototipo.
  Conserva las tablas y datos existentes. Se puede ejecutar mas de una vez.
  Los permisos de rol se guardan como JSON para que la API los exponga como arreglo.
*/
USE [GETICKETS];
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Tbl_Usuario', N'U') IS NULL
       OR OBJECT_ID(N'dbo.Tbl_Rol', N'U') IS NULL
       OR OBJECT_ID(N'dbo.Tbl_Categoria', N'U') IS NULL
       OR OBJECT_ID(N'dbo.Tbl_Estado', N'U') IS NULL
    BEGIN
        THROW 51000, N'No se encontro el esquema base de GETICKETS. Ejecuta primero GETICKETS-base-schema.sql.', 1;
    END;

    IF COL_LENGTH(N'dbo.Tbl_Usuario', N'FotoUrl') IS NULL
        ALTER TABLE dbo.Tbl_Usuario ADD FotoUrl NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.Tbl_Rol', N'Descripcion') IS NULL
        ALTER TABLE dbo.Tbl_Rol ADD Descripcion NVARCHAR(300) NULL;
    IF COL_LENGTH(N'dbo.Tbl_Rol', N'Permisos') IS NULL
        ALTER TABLE dbo.Tbl_Rol ADD Permisos NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.Tbl_Categoria', N'Icono') IS NULL
        ALTER TABLE dbo.Tbl_Categoria ADD Icono NVARCHAR(50) NULL;
    IF COL_LENGTH(N'dbo.Tbl_Categoria', N'Descripcion') IS NULL
        ALTER TABLE dbo.Tbl_Categoria ADD Descripcion NVARCHAR(300) NULL;

    IF OBJECT_ID(N'dbo.Tbl_Puesto', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Tbl_Puesto
        (
            IdPuesto INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_Puesto PRIMARY KEY,
            CodigoPuesto VARCHAR(20) NOT NULL CONSTRAINT UQ_Tbl_Puesto_Codigo UNIQUE,
            NombrePuesto NVARCHAR(150) NOT NULL,
            Zona NVARCHAR(50) NOT NULL,
            IdUsuarioActual INT NULL,
            FechaAsignacion DATETIME2(0) NULL,
            IdEstado INT NOT NULL CONSTRAINT DF_Tbl_Puesto_IdEstado DEFAULT (1),
            CONSTRAINT FK_Tbl_Puesto_Usuario FOREIGN KEY (IdUsuarioActual) REFERENCES dbo.Tbl_Usuario(IdUsuario),
            CONSTRAINT FK_Tbl_Puesto_Estado FOREIGN KEY (IdEstado) REFERENCES dbo.Tbl_Estado(IdEstado),
            CONSTRAINT CK_Tbl_Puesto_Zona CHECK (Zona IN (N'Soporte TI', N'Administración', N'Operaciones'))
        );
    END;

    IF OBJECT_ID(N'dbo.Tbl_Puesto', N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.CK_Tbl_Puesto_Zona', N'C') IS NOT NULL
        ALTER TABLE dbo.Tbl_Puesto DROP CONSTRAINT CK_Tbl_Puesto_Zona;
    IF OBJECT_ID(N'dbo.Tbl_HistorialPuesto', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Tbl_HistorialPuesto
        (
            IdHistorial INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tbl_HistorialPuesto PRIMARY KEY,
            IdPuesto INT NOT NULL,
            IdUsuario INT NOT NULL,
            IdUsuarioAccion INT NOT NULL,
            Accion NVARCHAR(100) NOT NULL,
            Motivo NVARCHAR(300) NOT NULL,
            FechaInicio DATETIME2(0) NOT NULL CONSTRAINT DF_Tbl_HistorialPuesto_FechaInicio DEFAULT (SYSDATETIME()),
            FechaFin DATETIME2(0) NULL,
            CONSTRAINT FK_Tbl_HistorialPuesto_Puesto FOREIGN KEY (IdPuesto) REFERENCES dbo.Tbl_Puesto(IdPuesto),
            CONSTRAINT FK_Tbl_HistorialPuesto_Usuario FOREIGN KEY (IdUsuario) REFERENCES dbo.Tbl_Usuario(IdUsuario),
            CONSTRAINT FK_Tbl_HistorialPuesto_UsuarioAccion FOREIGN KEY (IdUsuarioAccion) REFERENCES dbo.Tbl_Usuario(IdUsuario)
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Tbl_HistorialPuesto') AND name = N'IX_Tbl_HistorialPuesto_Puesto_Fecha')
        CREATE INDEX IX_Tbl_HistorialPuesto_Puesto_Fecha ON dbo.Tbl_HistorialPuesto (IdPuesto, FechaInicio DESC);

    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Estado WHERE IdEstado = 1 AND NombreEstado = 'Activo')
        THROW 51001, N'El estado IdEstado=1 debe ser Activo para conservar las reglas del sistema.', 1;
    IF EXISTS (SELECT 1 FROM dbo.Tbl_Estado WHERE IdEstado = 2 AND NombreEstado <> 'Inactivo')
       OR EXISTS (SELECT 1 FROM dbo.Tbl_Estado WHERE NombreEstado = 'Inactivo' AND IdEstado <> 2)
        THROW 51002, N'El estado Inactivo debe usar IdEstado=2.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Estado WHERE IdEstado = 2)
    BEGIN
        SET IDENTITY_INSERT dbo.Tbl_Estado ON;
        INSERT INTO dbo.Tbl_Estado (IdEstado, NombreEstado) VALUES (2, 'Inactivo');
        SET IDENTITY_INSERT dbo.Tbl_Estado OFF;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Rol WHERE NombreRol = 'Administrador')
        INSERT INTO dbo.Tbl_Rol (NombreRol, IdEstado) VALUES ('Administrador', 1);
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Rol WHERE NombreRol = 'Tecnico')
        INSERT INTO dbo.Tbl_Rol (NombreRol, IdEstado) VALUES ('Tecnico', 1);
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Rol WHERE NombreRol = 'Usuario')
        INSERT INTO dbo.Tbl_Rol (NombreRol, IdEstado) VALUES ('Usuario', 1);

    EXEC sys.sp_executesql N'
        UPDATE dbo.Tbl_Rol
        SET Descripcion = N''Control de tickets, usuarios, técnicos, catálogos y auditoría.'',
            Permisos = N''["Ver todos los tickets de la organización","Asignar técnicos","Confirmar o reabrir solicitudes","Consultar auditoría","Administrar usuarios, técnicos, categorías y roles","Consultar puestos de trabajo"]''
        WHERE NombreRol = ''Administrador'';

        UPDATE dbo.Tbl_Rol
        SET Descripcion = N''Atiende tickets asignados, registra avances y documenta soluciones.'',
            Permisos = N''["Consultar tickets asignados","Iniciar atención","Agregar avances y observaciones","Registrar diagnóstico y solución","Consultar puestos de trabajo"]''
        WHERE NombreRol = ''Tecnico'';

        UPDATE dbo.Tbl_Rol
        SET Descripcion = N''Reporta incidencias y consulta el seguimiento de sus tickets.'',
            Permisos = N''["Crear tickets","Consultar y seguir sus tickets","Confirmar una solución","Consultar puestos de trabajo"]''
        WHERE NombreRol = ''Usuario'';
    ';

    DECLARE @Categorias TABLE
    (
        IdCategoria INT PRIMARY KEY,
        NombreCategoria VARCHAR(100) NOT NULL,
        Icono NVARCHAR(50) NOT NULL,
        Descripcion NVARCHAR(300) NOT NULL
    );
    INSERT INTO @Categorias (IdCategoria, NombreCategoria, Icono, Descripcion) VALUES
        (1, 'Hardware', N'cpu', N'Equipos físicos, PCs y estaciones'),
        (2, 'Software', N'app', N'Aplicaciones y sistemas de oficina'),
        (3, 'Redes y Conectividad', N'wifi', N'Wi-Fi, VPN y cableado de red'),
        (4, 'Accesos y Cuentas', N'key', N'Credenciales, MFA y permisos'),
        (5, 'Impresoras y Periféricos', N'printer', N'Impresión, escáner y periféricos'),
        (6, 'Funciones Futuras / Cloud', N'sparkles', N'Nuevas integraciones, nube e iniciativas futuras');

    UPDATE dbo.Tbl_Categoria
    SET NombreCategoria = 'Impresoras y Perif' + CHAR(233) + 'ricos'
    WHERE IdCategoria = 5
      AND NombreCategoria = 'Impresoras y Perif' + CHAR(195) + CHAR(169) + 'ricos';
    IF EXISTS
    (
        SELECT 1 FROM @Categorias s JOIN dbo.Tbl_Categoria t ON t.IdCategoria = s.IdCategoria
        WHERE t.NombreCategoria <> s.NombreCategoria
    ) OR EXISTS
    (
        SELECT 1 FROM @Categorias s JOIN dbo.Tbl_Categoria t ON t.NombreCategoria = s.NombreCategoria
        WHERE t.IdCategoria <> s.IdCategoria
    )
        THROW 51003, N'Hay categorías existentes con IDs distintos a los del catálogo del prototipo.', 1;

    SET IDENTITY_INSERT dbo.Tbl_Categoria ON;
    INSERT INTO dbo.Tbl_Categoria (IdCategoria, NombreCategoria, IdEstado)
    SELECT s.IdCategoria, s.NombreCategoria, 1
    FROM @Categorias s
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Tbl_Categoria t WHERE t.IdCategoria = s.IdCategoria);
    SET IDENTITY_INSERT dbo.Tbl_Categoria OFF;

    EXEC sys.sp_executesql N'
        UPDATE t
        SET t.NombreCategoria = v.NombreCategoria, t.Icono = v.Icono,
            t.Descripcion = v.Descripcion, t.IdEstado = 1
        FROM dbo.Tbl_Categoria AS t
        JOIN (VALUES
            (1, N''Hardware'', N''cpu'', N''Equipos físicos, PCs y estaciones''),
            (2, N''Software'', N''app'', N''Aplicaciones y sistemas de oficina''),
            (3, N''Redes y Conectividad'', N''wifi'', N''Wi-Fi, VPN y cableado de red''),
            (4, N''Accesos y Cuentas'', N''key'', N''Credenciales, MFA y permisos''),
            (5, N''Impresoras y Periféricos'', N''printer'', N''Impresión, escáner y periféricos''),
            (6, N''Funciones Futuras / Cloud'', N''sparkles'', N''Nuevas integraciones, nube e iniciativas futuras'')
        ) AS v(IdCategoria, NombreCategoria, Icono, Descripcion)
            ON v.IdCategoria = t.IdCategoria;
    ';

    DECLARE @Prioridades TABLE (IdPrioridad INT PRIMARY KEY, NombrePrioridad VARCHAR(50) NOT NULL);
    INSERT INTO @Prioridades (IdPrioridad, NombrePrioridad) VALUES
        (1, 'Alta'), (2, 'Media'), (3, 'Baja');

    IF EXISTS
    (
        SELECT 1 FROM @Prioridades s JOIN dbo.Tbl_Prioridad t ON t.IdPrioridad = s.IdPrioridad
        WHERE t.NombrePrioridad <> s.NombrePrioridad
    ) OR EXISTS
    (
        SELECT 1 FROM @Prioridades s JOIN dbo.Tbl_Prioridad t ON t.NombrePrioridad = s.NombrePrioridad
        WHERE t.IdPrioridad <> s.IdPrioridad
    )
        THROW 51004, N'Hay prioridades existentes con IDs distintos a los del catálogo del prototipo.', 1;

    SET IDENTITY_INSERT dbo.Tbl_Prioridad ON;
    INSERT INTO dbo.Tbl_Prioridad (IdPrioridad, NombrePrioridad, IdEstado)
    SELECT s.IdPrioridad, s.NombrePrioridad, 1
    FROM @Prioridades s
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Tbl_Prioridad t WHERE t.IdPrioridad = s.IdPrioridad);
    SET IDENTITY_INSERT dbo.Tbl_Prioridad OFF;

    DECLARE @EstadosTicket TABLE (IdEstadoTicket INT PRIMARY KEY, NombreEstado VARCHAR(50) NOT NULL);
    INSERT INTO @EstadosTicket (IdEstadoTicket, NombreEstado) VALUES
        (1, 'Abierto'), (2, 'Asignado'), (3, 'En Proceso'),
        (4, 'Resuelto'), (5, 'Cancelado'), (6, 'Completado');

    IF EXISTS
    (
        SELECT 1 FROM @EstadosTicket s JOIN dbo.Tbl_EstadoTicket t ON t.IdEstadoTicket = s.IdEstadoTicket
        WHERE t.NombreEstado <> s.NombreEstado
    ) OR EXISTS
    (
        SELECT 1 FROM @EstadosTicket s JOIN dbo.Tbl_EstadoTicket t ON t.NombreEstado = s.NombreEstado
        WHERE t.IdEstadoTicket <> s.IdEstadoTicket
    )
        THROW 51005, N'Los estados de ticket deben conservar los IDs usados por los procedimientos existentes.', 1;

    SET IDENTITY_INSERT dbo.Tbl_EstadoTicket ON;
    INSERT INTO dbo.Tbl_EstadoTicket (IdEstadoTicket, NombreEstado, IdEstado)
    SELECT s.IdEstadoTicket, s.NombreEstado, 1
    FROM @EstadosTicket s
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Tbl_EstadoTicket t WHERE t.IdEstadoTicket = s.IdEstadoTicket);
    SET IDENTITY_INSERT dbo.Tbl_EstadoTicket OFF;

    DECLARE @AdminRoleId INT = (SELECT IdRol FROM dbo.Tbl_Rol WHERE NombreRol = 'Administrador');
    DECLARE @TechRoleId INT = (SELECT IdRol FROM dbo.Tbl_Rol WHERE NombreRol = 'Tecnico');
    DECLARE @UserRoleId INT = (SELECT IdRol FROM dbo.Tbl_Rol WHERE NombreRol = 'Usuario');

    IF EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE Correo = 'admin@getickets.test' AND IdRol <> @AdminRoleId)
        THROW 51006, N'El correo admin@getickets.test ya existe con otro rol.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE Correo = 'admin@getickets.test')
        EXEC dbo.SP_NuevoUsuario @Nombre = 'Admin', @Apellido = 'GETICKETS', @Correo = 'admin@getickets.test', @Contrasena = 'Admin123!', @IdRol = @AdminRoleId;

    IF EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE Correo = 'tecnico@getickets.test' AND IdRol <> @TechRoleId)
        THROW 51007, N'El correo tecnico@getickets.test ya existe con otro rol.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE Correo = 'tecnico@getickets.test')
        EXEC dbo.SP_NuevoUsuario @Nombre = 'Tecnico', @Apellido = 'GETICKETS', @Correo = 'tecnico@getickets.test', @Contrasena = 'Tecnico123!', @IdRol = @TechRoleId;

    IF EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE Correo = 'demo@getickets.test' AND IdRol <> @UserRoleId)
        THROW 51008, N'El correo demo@getickets.test ya existe con otro rol.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Usuario WHERE Correo = 'demo@getickets.test')
        EXEC dbo.SP_NuevoUsuario @Nombre = 'Usuario', @Apellido = 'Demo', @Correo = 'demo@getickets.test', @Contrasena = 'Usuario123!', @IdRol = @UserRoleId;

    DECLARE @TechUserId INT = (SELECT IdUsuario FROM dbo.Tbl_Usuario WHERE Correo = 'tecnico@getickets.test');
    IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Tecnico WHERE IdUsuario = @TechUserId)
        EXEC dbo.SP_NuevoTecnico @Especialidad = 'Soporte general', @Correo = 'tecnico@getickets.test', @IdUsuario = @TechUserId;

    DECLARE @AdminUserId INT = (SELECT IdUsuario FROM dbo.Tbl_Usuario WHERE Correo = 'admin@getickets.test');
    DECLARE @DemoUserId INT = (SELECT IdUsuario FROM dbo.Tbl_Usuario WHERE Correo = 'demo@getickets.test');

    IF OBJECT_ID(N'dbo.Tbl_Puesto', N'U') IS NOT NULL
    BEGIN
        DECLARE @Puestos TABLE
        (
            CodigoPuesto VARCHAR(20) PRIMARY KEY,
            NombrePuesto NVARCHAR(150) NOT NULL,
            Zona NVARCHAR(50) NOT NULL,
            IdUsuarioActual INT NULL
        );
        INSERT INTO @Puestos (CodigoPuesto, NombrePuesto, Zona, IdUsuarioActual) VALUES
            ('ADM-01', N'Dirección Mesa de Ayuda', N'Administración', @AdminUserId),
            ('TI-01', N'Estación Soporte Hardware', N'Soporte TI', @TechUserId),
            ('TI-02', N'Estación Redes y Software', N'Soporte TI', NULL),
            ('COL-01', N'Módulo Operaciones A', N'Operaciones', @DemoUserId),
            ('COL-02', N'Módulo Operaciones B', N'Operaciones', NULL),
            ('COL-03', N'Módulo Operaciones C', N'Operaciones', NULL);

        INSERT INTO dbo.Tbl_Puesto (CodigoPuesto, NombrePuesto, Zona, IdUsuarioActual, FechaAsignacion, IdEstado)
        SELECT s.CodigoPuesto, s.NombrePuesto, s.Zona, s.IdUsuarioActual,
               CASE WHEN s.IdUsuarioActual IS NULL THEN NULL ELSE SYSDATETIME() END, 1
        FROM @Puestos s
        WHERE NOT EXISTS (SELECT 1 FROM dbo.Tbl_Puesto p WHERE p.CodigoPuesto = s.CodigoPuesto);

        EXEC sys.sp_executesql N'
            UPDATE p
            SET p.NombrePuesto = v.NombrePuesto, p.Zona = v.Zona, p.IdEstado = 1
            FROM dbo.Tbl_Puesto AS p
            JOIN (VALUES
                (''ADM-01'', N''Dirección Mesa de Ayuda'', N''Administración''),
                (''TI-01'', N''Estación Soporte Hardware'', N''Soporte TI''),
                (''TI-02'', N''Estación Redes y Software'', N''Soporte TI''),
                (''COL-01'', N''Módulo Operaciones A'', N''Operaciones''),
                (''COL-02'', N''Módulo Operaciones B'', N''Operaciones''),
                (''COL-03'', N''Módulo Operaciones C'', N''Operaciones'')
            ) AS v(CodigoPuesto, NombrePuesto, Zona)
                ON v.CodigoPuesto = p.CodigoPuesto;
        ';
        ALTER TABLE dbo.Tbl_Puesto WITH CHECK ADD CONSTRAINT CK_Tbl_Puesto_Zona
            CHECK (Zona IN (N'Soporte TI', N'Administración', N'Operaciones'));
        ALTER TABLE dbo.Tbl_Puesto CHECK CONSTRAINT CK_Tbl_Puesto_Zona;
        INSERT INTO dbo.Tbl_HistorialPuesto
            (IdPuesto, IdUsuario, IdUsuarioAccion, Accion, Motivo, FechaInicio)
        SELECT p.IdPuesto, p.IdUsuarioActual, p.IdUsuarioActual,
               N'Asignación inicial', N'Puesto de demostración inicial', SYSDATETIME()
        FROM dbo.Tbl_Puesto p
        WHERE p.CodigoPuesto IN ('ADM-01', 'TI-01', 'COL-01')
          AND p.IdUsuarioActual IS NOT NULL
          AND NOT EXISTS
          (
              SELECT 1 FROM dbo.Tbl_HistorialPuesto h
              WHERE h.IdPuesto = p.IdPuesto AND h.IdUsuario = p.IdUsuarioActual AND h.FechaFin IS NULL
          );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Migracion WHERE Version = '002_paridad')
    INSERT INTO dbo.Tbl_Migracion (Version, Nombre)
    VALUES ('002_paridad', N'Migracion de paridad, permisos, catalogos y puestos');
GO

-- ===== FIN: GETICKETS-paridad.sql =====
GO

-- ===== INICIO: GETICKETS-ticket-flow-fix.sql =====
USE GETICKETS;
GO

-- Ejecutar una vez en la base existente para corregir filtros y permitir
-- resolver de nuevo un ticket que fue reabierto.
CREATE OR ALTER PROCEDURE dbo.SP_ListarTicket
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        tk.IdTicket,
        tk.IdUsuario,
        tk.IdTecnico,
        tk.IdCategoria,
        ISNULL(tk.IdPrioridad, 0) AS IdPrioridad,
        tk.IdEstadoTicket,
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

CREATE OR ALTER PROCEDURE dbo.SP_FinalizarTicket
    @IdTicket INT,
    @IdUsuario INT,
    @Diagnostico VARCHAR(MAX),
    @Solucion VARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdEstadoActual INT,
                @IdEstadoEnProceso INT,
                @IdEstadoResuelto INT,
                @IdDetalleTicket INT;

        SELECT @IdEstadoActual = IdEstadoTicket
        FROM dbo.Tbl_Ticket WITH (UPDLOCK, HOLDLOCK)
        WHERE IdTicket = @IdTicket;

        IF @IdEstadoActual IS NULL
            THROW 51144, N'El ticket no existe.', 1;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.Tbl_Ticket AS tk
            INNER JOIN dbo.Tbl_Tecnico AS te ON te.IdTecnico = tk.IdTecnico
            INNER JOIN dbo.Tbl_Usuario AS u ON u.IdUsuario = te.IdUsuario
            WHERE tk.IdTicket = @IdTicket
              AND te.IdUsuario = @IdUsuario
              AND te.IdEstado = 1
              AND u.IdEstado = 1
        )
            THROW 51145, N'El usuario no es el técnico asignado al ticket.', 1;

        SELECT @IdEstadoEnProceso = IdEstadoTicket
        FROM dbo.Tbl_EstadoTicket
        WHERE NombreEstado = 'En Proceso';
        SELECT @IdEstadoResuelto = IdEstadoTicket
        FROM dbo.Tbl_EstadoTicket
        WHERE NombreEstado = 'Resuelto';

        IF @IdEstadoEnProceso IS NULL OR @IdEstadoResuelto IS NULL
            THROW 51146, N'Faltan los estados En Proceso o Resuelto.', 1;
        IF @IdEstadoActual <> @IdEstadoEnProceso
            THROW 51147, N'El ticket debe estar En Proceso para registrar la solución.', 1;
        IF NULLIF(LTRIM(RTRIM(@Diagnostico)), '') IS NULL
            THROW 51148, N'El diagnóstico es obligatorio.', 1;
        IF NULLIF(LTRIM(RTRIM(@Solucion)), '') IS NULL
            THROW 51149, N'La solución es obligatoria.', 1;

        SELECT @IdDetalleTicket = MAX(IdDetalleTicket)
        FROM dbo.Tbl_DetalleTicket WITH (UPDLOCK, HOLDLOCK)
        WHERE IdTicket = @IdTicket;

        IF @IdDetalleTicket IS NULL
            INSERT INTO dbo.Tbl_DetalleTicket (IdTicket, Diagnostico, Solucion)
            VALUES (@IdTicket, LTRIM(RTRIM(@Diagnostico)), LTRIM(RTRIM(@Solucion)));
        ELSE
            UPDATE dbo.Tbl_DetalleTicket
            SET Diagnostico = LTRIM(RTRIM(@Diagnostico)),
                Solucion = LTRIM(RTRIM(@Solucion))
            WHERE IdDetalleTicket = @IdDetalleTicket;

        UPDATE dbo.Tbl_Ticket
        SET IdEstadoTicket = @IdEstadoResuelto,
            Fechaesolucion = GETDATE()
        WHERE IdTicket = @IdTicket
          AND IdEstadoTicket = @IdEstadoActual;

        IF @@ROWCOUNT = 0
            THROW 51150, N'No se pudo actualizar el estado del ticket.', 1;

        INSERT INTO dbo.Tbl_SeguimientoTicket (IdTicket, IdUsuario, Titulo, Descripcion)
        VALUES (@IdTicket, @IdUsuario, 'Ticket resuelto', 'El técnico registró la solución y resolvió el ticket.');

        INSERT INTO dbo.Tbl_AuditoriaTicket (IdTicket, IdUsuario, Accion, Descripcion)
        VALUES (@IdTicket, @IdUsuario, 'Resolución de ticket', 'El técnico registró o actualizó el diagnóstico y la solución.');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Tbl_Migracion WHERE Version = '003_ticket_flow_fix')
    INSERT INTO dbo.Tbl_Migracion (Version, Nombre)
    VALUES ('003_ticket_flow_fix', N'Correcciones al seguimiento y resolucion de tickets');
GO

-- ===== FIN: GETICKETS-ticket-flow-fix.sql =====
GO
