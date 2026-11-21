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
