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
        THROW 51000, N'No se encontro el esquema base de GETICKETS. Ejecuta primero el script original.', 1;
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



