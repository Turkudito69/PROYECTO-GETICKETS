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
