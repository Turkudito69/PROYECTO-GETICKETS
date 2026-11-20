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
