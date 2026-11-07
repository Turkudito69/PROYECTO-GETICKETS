create database GETICKETS
go

use GETICKETS
go


CREATE TABLE Tbl_Rol (
    IdRol INT PRIMARY KEY IDENTITY(1,1),
    NombreRol VARCHAR(50) NOT NULL
);

CREATE TABLE Tbl_Estado (
    IdEstado INT PRIMARY KEY IDENTITY(1,1),
    NombreEstado VARCHAR(50) NOT NULL
);

CREATE TABLE Tbl_Usuario (
    IdUsuario INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Correo VARCHAR(150) NOT NULL UNIQUE,
    Contrasena varchar(MAX),
    IdRol int references Tbl_Rol(IdRol),
    IdEstado int references Tbl_Estado(IdEstado)
);

ALTER TABLE Tbl_Usuario
ADD CONSTRAINT DF_Usuario_Estado --No borrar esto☠️. con eso se insertar el estado 
DEFAULT 1 FOR IdEstado;          --a activo automaticamente al insertar un usuario


CREATE TABLE Tbl_Categoria (
    IdCategoria INT PRIMARY KEY IDENTITY(1,1),
    NombreCategoria VARCHAR(100) NOT NULL,
    IdEstado int references Tbl_Estado(IdEstado)
);

CREATE TABLE Tbl_Prioridad (
    IdPrioridad INT PRIMARY KEY IDENTITY(1,1),
    NombrePrioridad VARCHAR(50) NOT NULL
);

CREATE TABLE Tbl_EstadoTicket (
    IdEstadoTicket INT PRIMARY KEY IDENTITY(1,1),
    NombreEstado VARCHAR(50) NOT NULL
);
ALTER TABLE Tbl_Ticket
ADD CONSTRAINT DF_Ticket_Estado  --no borrar este tampoco , este es para el estado dee la tiket quede abierto al hacer una nueva tiket
DEFAULT 1 FOR IdEstadoTicket;

CREATE TABLE Tbl_Tecnico (
    IdTecnico INT PRIMARY KEY IDENTITY(1,1),
    Especialidad VARCHAR(100) NULL,
    correo varchar(50) not null unique, 
    IdUsuario int references Tbl_Usuario (IdUsuario) not null
);
CREATE TABLE Tbl_Ticket (
    IdTicket INT PRIMARY KEY IDENTITY(1,1),
    CodigoTiket varchar (50) not null,
    Descripcion VARCHAR(MAX) NOT NULL,
    IdUsuario int references Tbl_Usuario (IdUsuario) not null,
    IdTecnico int references Tbl_Tecnico (IdTecnico) not null,
    IdCategoria int references Tbl_Categoria (IdCategoria) not null,
    IdPrioridad int references Tbl_Prioridad (IdPrioridad)  null,
    IdEstadoTicket int references Tbl_EstadoTicket (IdEstadoTicket) not null,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Fechaesolucion DATETIME null
);

CREATE TABLE Tbl_SeguimientoTicket (
    IdSeguimiento INT PRIMARY KEY IDENTITY(1,1),
    IdTicket INT REFERENCES Tbl_Ticket(IdTicket) NOT NULL,
    IdUsuario INT REFERENCES Tbl_Usuario(IdUsuario) NOT NULL,
    Titulo VARCHAR(200) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    FechaAccion DATETIME DEFAULT GETDATE()
); 

CREATE TABLE Tbl_AuditoriaTicket (
    IdAuditoria INT PRIMARY KEY IDENTITY(1,1),
    IdTicket int references Tbl_Ticket (IdTicket) not null,
    IdUsuario INT REFERENCES Tbl_Usuario(IdUsuario)  NULL,
    Accion VARCHAR(150) NOT NULL,
    Descripcion VARCHAR(MAX) NULL,
    FechaAccion DATETIME DEFAULT GETDATE(),
);

CREATE TABLE Tbl_DetalleTicket (
    IdDetalleTicket INT PRIMARY KEY IDENTITY(1,1),
    IdTicket int references Tbl_Ticket (IdTicket) not null,
    Diagnostico VARCHAR(MAX) NULL,
    Observaciones VARCHAR(MAX) NULL,
    Solucion VARCHAR(MAX) NULL,
);

--//PROCEDURES DE SPLISTAS

Create or alter proc SP_ListarRoles
 as
  begin
   set nocount on;
   begin try
     select rl.IdRol,rl.NombreRol as Nombre  from Tbl_Rol as rl
      Print 'Roles listados Exitosamente'
   end try 
   begin catch
      Print 'No se pudo listar'+ @@error
   end catch
 end
go

Create or alter proc SP_ListarEstados
 as
  begin
   set nocount on;
   begin try
     select st.IdEstado,st.NombreEstado  as Nombre from Tbl_Estado as st
     Print 'Estados listados Exitosamente'
   end try 
   begin catch
   Print 'No se pudo listar'+ @@error
   end catch
 end
go

Create or alter proc SP_ListarUsuarios
 as
  begin
     set nocount on;
   begin try
     select us.IdUsuario,us.Nombre,us.Apellido,us.Correo,Contrasena , r.NombreRol as Rol , u.NombreEstado as Estado from Tbl_Usuario as us 
     inner join Tbl_Rol  r on us.IdRol=r.IdRol
     inner join Tbl_Estado u on us.IdEstado= u.IdEstado
     Print 'Usuarios listados Exitosamente'
   end try 
   begin catch
      Print 'No se pudo listar'+ @@error
   end catch
 end
go

create or alter proc SP_ListarCategorias
 as 
  begin    
  set nocount on;
   begin try 
     select cat.IdCategoria, cat.NombreCategoria as Nombre ,u.NombreEstado as Estado from Tbl_Categoria as cat 
     inner join Tbl_Estado u on cat.IdEstado= u.IdEstado
     Print 'Categorias listadas correctamente'
   end try
   begin catch
     Print 'No se pudo listar'+@@error
   end catch
  end
go

create or alter proc SP_ListarPrioridad
 as 
  begin    
  set nocount on;
   begin try 
     select pr.IdPrioridad, pr.NombrePrioridad as Nombre from Tbl_Prioridad as pr
     Print 'Prioidades listadas correctamente'
   end try
   begin catch
     Print 'No se pudo listar'+@@error
   end catch
  end
go
create or alter proc SP_ListarTecnicos
 as 
  begin    
  set nocount on;
   begin try 
     select pr.IdTecnico,u.Nombre, u.Apellido ,pr.correo, pr.Especialidad  from Tbl_Tecnico as pr
     inner join Tbl_Usuario u on pr.IdUsuario=u.IdUsuario
     Print 'Prioidades listadas correctamente'
   end try
   begin catch
     Print 'No se pudo listar'+@@error
   end catch
  end
go
create or alter proc SP_ListarEstadoTiketc
 as 
  begin    
  set nocount on;
   begin try 
     select pr.IdEstadoTicket, pr.NombreEstado as Nombre from Tbl_EstadoTicket as pr
     Print 'Estado de ticktes listadas correctamente'
   end try
   begin catch
     Print 'No se pudo listar'+@@error
   end catch
  end
go


CREATE OR ALTER PROC SP_ListarTicket
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY

        SELECT
            tk.IdTicket,
            tk.CodigoTiket AS Ticket,
            tk.Descripcion,
            u.Nombre + ' ' + u.Apellido AS Tecnico,
            cat.NombreCategoria AS Categoria,
            pr.NombrePrioridad AS Prioridad,
            et.NombreEstado AS EstadoTicket,
            tk.FechaCreacion

        FROM Tbl_Ticket AS tk
        LEFT JOIN Tbl_Tecnico AS tc
            ON tk.IdTecnico = tc.IdTecnico
        LEFT JOIN Tbl_Usuario AS u
            ON tc.IdUsuario = u.IdUsuario
        INNER JOIN Tbl_Categoria AS cat
            ON tk.IdCategoria = cat.IdCategoria
        INNER JOIN Tbl_Prioridad AS pr
            ON tk.IdPrioridad = pr.IdPrioridad
        INNER JOIN Tbl_EstadoTicket AS et
            ON tk.IdEstadoTicket = et.IdEstadoTicket;
        PRINT 'Tickets listados correctamente';
    END TRY
    BEGIN CATCH
        PRINT 'No se pudo listar los tickets';
        THROW;
    END CATCH
END;
GO



CREATE OR ALTER PROC SP_ListarDetalleTicket
(
    @IdTicket INT
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY

        SELECT
            tk.IdTicket,
            tk.CodigoTiket,
            tk.Descripcion,

            u.Nombre + ' ' + u.Apellido AS Solicitante,

            ut.Nombre + ' ' + ut.Apellido AS Tecnico,

            cat.NombreCategoria AS Categoria,
            pr.NombrePrioridad AS Prioridad,
            et.NombreEstado AS EstadoTicket,

            tk.FechaCreacion,
            tk.Fechaesolucion

        FROM Tbl_Ticket tk

        INNER JOIN Tbl_Usuario u
            ON tk.IdUsuario = u.IdUsuario
        LEFT JOIN Tbl_Tecnico te
            ON tk.IdTecnico = te.IdTecnico
        LEFT JOIN Tbl_Usuario ut
            ON te.IdUsuario = ut.IdUsuario
        INNER JOIN Tbl_Categoria cat
            ON tk.IdCategoria = cat.IdCategoria
        INNER JOIN Tbl_Prioridad pr
            ON tk.IdPrioridad = pr.IdPrioridad
        INNER JOIN Tbl_EstadoTicket et
            ON tk.IdEstadoTicket = et.IdEstadoTicket
        WHERE tk.IdTicket = @IdTicket;
        PRINT 'Detalle del ticket listado correctamente';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO
select*from Tbl_DetalleTicket
CREATE OR ALTER PROC SP_ListarAuditoriaTicket
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY

        SELECT
            a.IdAuditoria,
            t.CodigoTiket AS Ticket,
            u.Nombre + ' ' + u.Apellido AS Responsable,
            a.Accion,
            a.Descripcion,
            a.FechaAccion

        FROM Tbl_AuditoriaTicket a

        INNER JOIN Tbl_Ticket t
            ON a.IdTicket = t.IdTicket

        INNER JOIN Tbl_Usuario u
            ON a.IdUsuario = u.IdUsuario

        ORDER BY a.FechaAccion DESC;

        PRINT 'Auditoria listada correctamente';

    END TRY
    BEGIN CATCH
        PRINT 'No se pudo listar la auditoria';
        THROW;
    END CATCH
END;
GO
 exec SP_ListarAuditoriaTicket


CREATE OR ALTER PROC SP_ListarSeguimiento
(
    @IdTicket INT
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY

        SELECT
            sg.IdSeguimiento,
            t.CodigoTiket,
            u.Nombre + ' ' + u.Apellido AS Responsable,
            sg.Titulo,
            sg.Descripcion,
            sg.FechaAccion

        FROM Tbl_SeguimientoTicket AS sg

        INNER JOIN Tbl_Ticket AS t
            ON sg.IdTicket = t.IdTicket

        INNER JOIN Tbl_Usuario AS u
            ON sg.IdUsuario = u.IdUsuario

        WHERE sg.IdTicket = @IdTicket
        ORDER BY sg.FechaAccion ASC, sg.IdSeguimiento ASC;
        PRINT 'Seguimientos listados exitosamente';
    END TRY
    BEGIN CATCH
        PRINT 'No se pudo listar los seguimientos';
        THROW;
    END CATCH
END;
GO


--//PROCEDURES DE SPINSERT

CREATE OR ALTER PROC SP_NuevoRol
(
    @NombreRol VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;
        IF (@NombreRol IS NULL OR @NombreRol = '')
        BEGIN
            RAISERROR('El nombre del rol es obligatorio', 16, 1);
        END
        IF EXISTS (SELECT 1 FROM Tbl_Rol WHERE NombreRol = @NombreRol)
        BEGIN
            RAISERROR('El rol ya existe', 16, 1);
        END
        INSERT INTO Tbl_Rol (NombreRol)
        VALUES (@NombreRol);
        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF (@@TRANCOUNT > 0)
            ROLLBACK TRAN;
        THROW;
    END CATCH
END;
GO


CREATE OR ALTER PROC SP_NuevoEstado
(
    @NombreEstado VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;
        IF (@NombreEstado IS NULL OR @NombreEstado = '')
        BEGIN
            RAISERROR('El nombre del estado es obligatorio', 16, 1);
        END
        IF EXISTS (SELECT 1 FROM Tbl_Estado WHERE NombreEstado = @NombreEstado)
        BEGIN
            RAISERROR('El estado ya existe', 16, 1);
        END
        INSERT INTO Tbl_Estado(NombreEstado)
        VALUES (@NombreEstado);
        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF (@@TRANCOUNT > 0)
            ROLLBACK TRAN;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROC SP_NuevoUsuario
(
    @Nombre VARCHAR(100),
    @Apellido VARCHAR(100),
    @Correo VARCHAR(150),
    @Contrasena VARCHAR(MAX),
    @IdRol INT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        IF (@Nombre IS NULL OR @Nombre = '' OR @Apellido IS NULL OR @Apellido = '' OR @Correo IS NULL OR @Correo = '' OR @Contrasena IS NULL OR @Contrasena = '')
        BEGIN
            RAISERROR('Debe completar todos los campos', 16, 1);
        END;
        IF EXISTS (SELECT 1 FROM Tbl_Usuario WHERE Correo = @Correo)
        BEGIN
            RAISERROR('El correo ya esta registrado', 16, 1);
        END;
        IF NOT EXISTS (SELECT 1 FROM Tbl_Rol WHERE IdRol = @IdRol)
        BEGIN
            RAISERROR('El rol seleccionado no existe', 16, 1);
        END;

        INSERT INTO Tbl_Usuario
        (Nombre,Apellido,Correo,Contrasena,IdRol)VALUES(@Nombre,@Apellido,@Correo,CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', @Contrasena), 2),@IdRol);
        Print 'Usuario creado existosamente.'
        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF (@@TRANCOUNT > 0)
            ROLLBACK TRAN;
        THROW;
    END CATCH
END;
GO


CREATE OR ALTER PROC SP_NuevaCategoria
(
    @NombreCategoria VARCHAR(50),
    @IdEstado INT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;
        IF (@NombreCategoria IS NULL OR @NombreCategoria = '')
        BEGIN
            RAISERROR('El nombre de la categoria es obligatorio', 16, 1);
        END;
        IF EXISTS (SELECT 1 FROM Tbl_Categoria WHERE NombreCategoria = @NombreCategoria)
        BEGIN
            RAISERROR('La categoria ya existe', 16, 1);
        END;
        IF NOT EXISTS (SELECT 1 FROM Tbl_Estado WHERE IdEstado = @IdEstado)
        BEGIN
            RAISERROR('El estado seleccionado no existe', 16, 1);
        END;
        INSERT INTO Tbl_Categoria(NombreCategoria,IdEstado)VALUES(@NombreCategoria,@IdEstado);
        COMMIT TRAN;
        PRINT 'Se ha creado la categoria correctamente';
    END TRY
    BEGIN CATCH
        IF (@@TRANCOUNT > 0)
            ROLLBACK TRAN;

        THROW;
    END CATCH
END;
GO


CREATE OR ALTER PROC SP_NuevaPrioridad
(
    @NombrePrioridad VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;
        IF (@NombrePrioridad IS NULL OR @NombrePrioridad = '')
        BEGIN
            RAISERROR('El nombre de la prioridad es obligatorio', 16, 1);
        END;
        IF EXISTS (SELECT 1 FROM Tbl_Prioridad WHERE NombrePrioridad = @NombrePrioridad)
        BEGIN
            RAISERROR('La prioridad ya existe', 16, 1);
        END;
        INSERT INTO Tbl_Prioridad (NombrePrioridad)VALUES (@NombrePrioridad);
        COMMIT TRAN;
        PRINT 'Se ha creado la prioridad correctamente';
    END TRY
    BEGIN CATCH
        IF (@@TRANCOUNT > 0)
            ROLLBACK TRAN;

        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROC SP_NuevoEstadoTicket
(
    @NombreEstado VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;
        IF (@NombreEstado IS NULL OR @NombreEstado = '')
        BEGIN
            RAISERROR('El nombre del estado es obligatorio', 16, 1);
        END;
        IF EXISTS (SELECT 1 FROM Tbl_EstadoTicket WHERE NombreEstado = @NombreEstado)
        BEGIN
            RAISERROR('El estado ya existe', 16, 1);
        END;
        INSERT INTO Tbl_EstadoTicket (NombreEstado) VALUES (@NombreEstado);
        COMMIT TRAN;
        PRINT 'Se ha creado el estado del ticket correctamente';
    END TRY
    BEGIN CATCH
        IF (@@TRANCOUNT > 0)
            ROLLBACK TRAN;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROC SP_NuevoTecnico
(
    @Especialidad VARCHAR(100),
    @Correo VARCHAR(50),
    @IdUsuario INT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        IF (@Correo IS NULL OR @Correo = '')
        BEGIN
            RAISERROR('El correo del tecnico es obligatorio', 16, 1);
        END;
        IF EXISTS (SELECT 1 FROM Tbl_Tecnico WHERE correo = @Correo)
        BEGIN
            RAISERROR('El correo del tecnico ya existe', 16, 1);
        END;
        IF NOT EXISTS (SELECT 1 FROM Tbl_Usuario WHERE IdUsuario = @IdUsuario)
        BEGIN
            RAISERROR('El usuario seleccionado no existe', 16, 1);
        END;
        IF EXISTS (SELECT 1 FROM Tbl_Tecnico WHERE IdUsuario = @IdUsuario)
        BEGIN
            RAISERROR('Este usuario ya esta registrado como tecnico', 16, 1);
        END;
        INSERT INTO Tbl_Tecnico(Especialidad,correo,IdUsuario)
        VALUES
        (@Especialidad,@Correo,@IdUsuario);
        COMMIT TRAN;
        PRINT 'Se ha registrado el tecnico correctamente';
    END TRY
    BEGIN CATCH
        IF (@@TRANCOUNT > 0)
            ROLLBACK TRAN;

        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROC SP_NuevoTicket
(
    @Descripcion VARCHAR(MAX),
    @IdUsuario INT,
    @IdCategoria INT,
    @IdPrioridad INT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        -- Validar descripcion
        IF (@Descripcion IS NULL OR @Descripcion = '')
        BEGIN
            RAISERROR('La descripcion es obligatoria', 16, 1);
        END;

        -- Validar usuario
        IF NOT EXISTS (
            SELECT 1 FROM Tbl_Usuario
            WHERE IdUsuario = @IdUsuario
        )
        BEGIN
            RAISERROR('El usuario no existe', 16, 1);
        END;

        -- Validar categoria
        IF NOT EXISTS (
            SELECT 1 FROM Tbl_Categoria
            WHERE IdCategoria = @IdCategoria
        )
        BEGIN
            RAISERROR('La categoria no existe', 16, 1);
        END;

        -- Validar prioridad
        IF NOT EXISTS (
            SELECT 1 FROM Tbl_Prioridad
            WHERE IdPrioridad = @IdPrioridad
        )
        BEGIN
            RAISERROR('La prioridad no existe', 16, 1);
        END;

        DECLARE @IdTicketNuevo INT;
        DECLARE @CodigoTicket VARCHAR(50);

        -- 1. INSERTAR TICKET
        INSERT INTO Tbl_Ticket
        (
            CodigoTiket,
            Descripcion,
            IdUsuario,
            IdCategoria,
            IdPrioridad
        )
        VALUES
        (
            'TEMP',
            @Descripcion,
            @IdUsuario,
            @IdCategoria,
            @IdPrioridad
        );

        -- Obtener ID del ticket creado
        SET @IdTicketNuevo = SCOPE_IDENTITY();

        -- Generar codigo del ticket
        SET @CodigoTicket =
            'TCK-' + RIGHT('000000' +
            CAST(@IdTicketNuevo AS VARCHAR(20)), 6);

        -- Actualizar codigo
        UPDATE Tbl_Ticket
        SET CodigoTiket = @CodigoTicket
        WHERE IdTicket = @IdTicketNuevo;

        -- 2. INSERTAR PRIMER SEGUIMIENTO
        INSERT INTO Tbl_SeguimientoTicket
        (
            IdTicket,
            Titulo,
            Descripcion,
            IdUsuario
        )
        VALUES
        (
            @IdTicketNuevo,
            'Solicitud creada',
            'El usuario registro una nueva solicitud de soporte tecnico',
            @IdUsuario
        );

        -- 3. INSERTAR AUDITORIA
        INSERT INTO Tbl_AuditoriaTicket
        (
            IdTicket,
            IdUsuario,
            Accion,
            Descripcion
        )
        VALUES
        (
            @IdTicketNuevo,
            @IdUsuario,
            'Ticket creado',
            'Se registro una nueva solicitud de soporte tecnico'
        );

        -- Confirmar las tres operaciones
        COMMIT TRAN;

        PRINT 'Ticket, seguimiento y auditoria registrados correctamente';

        SELECT
            @IdTicketNuevo AS IdTicket,
            @CodigoTicket AS CodigoTiket;

    END TRY
    BEGIN CATCH
        IF (@@TRANCOUNT > 0)
            ROLLBACK TRAN;

        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROC SP_AsignarTicket        --SP asignar tikect al tecnico

(
    @IdTicket INT,
    @IdTecnico INT,
    @IdUsuario INT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        IF NOT EXISTS (SELECT 1 FROM Tbl_Ticket WHERE IdTicket = @IdTicket)
        BEGIN
            RAISERROR('El ticket no existe', 16, 1);
        END;
        IF NOT EXISTS (SELECT 1 FROM Tbl_Tecnico WHERE IdTecnico = @IdTecnico)
        BEGIN
            RAISERROR('El tecnico no existe', 16, 1);
        END;
        IF NOT EXISTS (SELECT 1 FROM Tbl_Usuario WHERE IdUsuario = @IdUsuario)
        BEGIN
            RAISERROR('El usuario no existe', 16, 1);
        END;

        --validacion del tiket si eta abierto y si hay6 tecnco para asignar xdxd
        IF NOT EXISTS (SELECT 1 FROM Tbl_Ticket t INNER JOIN Tbl_EstadoTicket e ON t.IdEstadoTicket = e.IdEstadoTicket WHERE t.IdTicket = @IdTicket AND e.NombreEstado = 'Abierto'AND t.IdTecnico IS NULL)
        BEGIN
            RAISERROR('El ticket no esta disponible para asignacion', 16, 1);
        END;

        DECLARE @IdEstadoAsignado INT;
        DECLARE @NombreTecnico VARCHAR(250);

        -- Obtener estado Asignado
        SELECT @IdEstadoAsignado = IdEstadoTicket
        FROM Tbl_EstadoTicket
        WHERE NombreEstado = 'Asignado';

        IF (@IdEstadoAsignado IS NULL)
        BEGIN
            RAISERROR('No existe el estado Asignado', 16, 1);
        END;

        -- Obtener nombre completo del tecnico
        SELECT @NombreTecnico = u.Nombre + ' ' + u.Apellido
        FROM Tbl_Tecnico t
        INNER JOIN Tbl_Usuario u ON t.IdUsuario = u.IdUsuario
        WHERE t.IdTecnico = @IdTecnico;

        -- aqui asignamos el tikect al tecnico
        UPDATE Tbl_Ticket
        SET
            IdTecnico = @IdTecnico,
            IdEstadoTicket = @IdEstadoAsignado
        WHERE IdTicket = @IdTicket;

        -- aqui insertarmos un seguimiento
        INSERT INTO Tbl_SeguimientoTicket (IdTicket,IdUsuario,Titulo,Descripcion)VALUES(@IdTicket,@IdUsuario,'Tecnico asignado','El administrador asigno un tecnico al ticket');

        -- insertarmos en auditoria
        INSERT INTO Tbl_AuditoriaTicket (IdTicket,IdUsuario,Accion,Descripcion)VALUES(@IdTicket,@IdUsuario,'Asignacion de tecnico','Se asigno el tecnico ' + @NombreTecnico + ' al ticket');
        COMMIT TRAN;
        PRINT 'Tecnico asignado correctamente';
    END TRY
    BEGIN CATCH
        IF (@@TRANCOUNT > 0)
            ROLLBACK TRAN;
        THROW;
    END CATCH
END;
GO



CREATE OR ALTER PROC SP_IniciarAtencion  --SP de tecnico inicar atencion 
(
    @IdTicket INT,
    @IdUsuario INT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        -- Validar que exista el ticket
        IF NOT EXISTS (SELECT 1 FROM Tbl_Ticket WHERE IdTicket = @IdTicket)
        BEGIN
            RAISERROR('El ticket no existe', 16, 1);
        END;

        -- Validar que exista el usuario
        IF NOT EXISTS (SELECT 1 FROM Tbl_Usuario WHERE IdUsuario = @IdUsuario)
        BEGIN
            RAISERROR('El usuario no existe', 16, 1);
        END;

        -- Validar que sea el tecnico asignado
        IF NOT EXISTS (SELECT 1 FROM Tbl_Ticket tk INNER JOIN Tbl_Tecnico te ON tk.IdTecnico = te.IdTecnico WHERE tk.IdTicket = @IdTicket AND te.IdUsuario = @IdUsuario)
        BEGIN
            RAISERROR(
                'El usuario no es el tecnico asignado al ticket',
                16, 1
            );
        END;

        -- Cambiar de Asignado (2) a En Proceso (3)
        UPDATE Tbl_Ticket
        SET IdEstadoTicket = 3
        WHERE IdTicket = @IdTicket
          AND IdEstadoTicket = 2;

        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR(
                'El ticket debe estar en estado Asignado',
                16, 1
            );
        END;

        -- Registrar seguimiento
        INSERT INTO Tbl_SeguimientoTicket (IdTicket,IdUsuario,Titulo,Descripcion,FechaAccion)VALUES(@IdTicket,@IdUsuario,'Atencion iniciada','El tecnico inicio la atencion del ticket',GETDATE());
        -- Registrar auditoria
        INSERT INTO Tbl_AuditoriaTicket(IdTicket,IdUsuario,Accion,Descripcion,FechaAccion)VALUES(@IdTicket,@IdUsuario,'Inicio de atencion','El tecnico cambio el estado del ticket a En Proceso',GETDATE());
        COMMIT TRAN;
        PRINT 'Atencion iniciada correctamente';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRAN;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROC SP_RegistrarObservacion  -- SP guradar laobservacion echa por el tecnico
(
    @IdTicket INT,
    @IdUsuario INT,
    @Observacion VARCHAR(200)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        -- Validar que la observacion tenga contenido
        IF NULLIF(LTRIM(RTRIM(@Observacion)), '') IS NULL
        BEGIN
            RAISERROR('La observacion no puede estar vacia', 16, 1);
        END;
        -- Validar que exista el ticket
        IF NOT EXISTS (SELECT 1 FROM Tbl_Ticket WHERE IdTicket = @IdTicket)
        BEGIN
            RAISERROR('El ticket no existe', 16, 1);
        END;

        -- Validar que el usuario sea el tecnico asignado
        IF NOT EXISTS (SELECT 1 FROM Tbl_Ticket tk INNER JOIN Tbl_Tecnico te ON tk.IdTecnico = te.IdTecnico WHERE tk.IdTicket = @IdTicket AND te.IdUsuario = @IdUsuario)
        BEGIN
            RAISERROR(
                'El usuario no es el tecnico asignado',
                16, 1
            );
        END;
        -- Solo permitir observaciones si esta En Proceso
        IF NOT EXISTS (SELECT 1 FROM Tbl_Ticket WHERE IdTicket = @IdTicket AND IdEstadoTicket = 3)
        BEGIN
            RAISERROR(
                'El ticket debe estar En Proceso',
                16, 1
            );
        END;
        -- Guardar observacion en seguimiento
        INSERT INTO Tbl_SeguimientoTicket(IdTicket,IdUsuario,Titulo,Descripcion,FechaAccion)VALUES(@IdTicket,@IdUsuario,'Observacion registrada',@Observacion,GETDATE());
        -- Registrar auditoria
        INSERT INTO Tbl_AuditoriaTicket(IdTicket,IdUsuario,Accion,Descripcion,FechaAccion)VALUES(@IdTicket,@IdUsuario,'Registro de observacion','El tecnico registro una observacion',GETDATE());
        COMMIT TRAN;
        PRINT 'Observacion registrada correctamente';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRAN;
        THROW;
    END CATCH
END;
GO


USE GETICKETS;
GO

CREATE OR ALTER PROC SP_FinalizarTicket  --sp de finalizar tiket asignado al tecnico
(
    @IdTicket INT,
    @IdUsuario INT,
    @Diagnostico VARCHAR(MAX),
    @Solucion VARCHAR(MAX)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        -- Validar que exista el ticket
        IF NOT EXISTS (SELECT 1 FROM Tbl_Ticket WHERE IdTicket = @IdTicket)
        BEGIN
            RAISERROR('El ticket no existe', 16, 1);
        END;
        -- Validar que el usuario sea el tecnico asignado
        IF NOT EXISTS (SELECT 1 FROM Tbl_Ticket tk INNER JOIN Tbl_Tecnico te ON tk.IdTecnico = te.IdTecnico WHERE tk.IdTicket = @IdTicket AND te.IdUsuario = @IdUsuario)
        BEGIN
            RAISERROR(
                'El usuario no es el tecnico asignado al ticket',
                16, 1
            );
        END;
        -- Validar que el ticket este En Proceso
        IF NOT EXISTS (SELECT 1 FROM Tbl_Ticket WHERE IdTicket = @IdTicket AND IdEstadoTicket = 3)
        BEGIN
            RAISERROR(
                'El ticket debe estar En Proceso para finalizar',
                16, 1
            );
        END;
        -- Validar diagnostico
        IF NULLIF(LTRIM(RTRIM(@Diagnostico)), '') IS NULL
        BEGIN
            RAISERROR(
                'El diagnostico es obligatorio',
                16, 1
            );
        END;
        -- Validar solucion
        IF NULLIF(LTRIM(RTRIM(@Solucion)), '') IS NULL
        BEGIN
            RAISERROR(
                'La solucion es obligatoria',
                16, 1
            );
        END;
        -- Evitar duplicar el detalle tecnico
        IF EXISTS (SELECT 1FROM Tbl_DetalleTicket WITH (UPDLOCK, HOLDLOCK)WHERE IdTicket = @IdTicket)
        BEGIN
            RAISERROR(
                'El ticket ya tiene un detalle tecnico registrado',
                16, 1
            );
        END;
        -- Guardar diagnostico y solucion
        INSERT INTO Tbl_DetalleTicket(IdTicket,Diagnostico,Solucion)VALUES(@IdTicket,@Diagnostico,@Solucion);
        -- Actualizar el estado y fecha de resolucion
        UPDATE Tbl_Ticket
        SET
            IdEstadoTicket = 4,
            Fechaesolucion = GETDATE()
        WHERE IdTicket = @IdTicket
          AND IdEstadoTicket = 3;
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR(
                'No se pudo actualizar el estado del ticket',
                16, 1
            );
        END;
        -- Registrar seguimiento
        INSERT INTO Tbl_SeguimientoTicket(IdTicket,IdUsuario,Titulo,Descripcion,FechaAccion)VALUES(@IdTicket,@IdUsuario,'Ticket resuelto','El tecnico registro la solucion y resolvio el ticket',GETDATE());
        -- Registrar auditoria
        INSERT INTO Tbl_AuditoriaTicket(IdTicket,IdUsuario,Accion,Descripcion,FechaAccion)VALUES(@IdTicket,@IdUsuario,'Resolucion de ticket','El tecnico finalizo el ticket con diagnostico y solucion',GETDATE());
        COMMIT TRAN;
        PRINT 'Ticket finalizado correctamente';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRAN;
        THROW;
    END CATCH
END;
GO


--exec LISTAS
exec SP_ListarRoles
exec SP_ListarEstados
exec SP_ListarUsuarios
exec SP_ListarCategorias
exec SP_ListarPrioridad
exec SP_ListarEstadoTiketc
exec SP_ListarTecnicos
exec SP_ListarTicket
exec SP_ListarDetalleTicket 1
exec SP_ListarDetalleTicket 2
exec SP_ListarDetalleTicket 3
exec SP_ListarDetalleTicket 4
exec SP_ListarDetalleTicket 5
exec SP_ListarAuditoriaTicket
exec SP_ListarSeguimiento 4
exec SP_ListarSeguimiento 3
exec SP_ListarSeguimiento 2
exec SP_ListarSeguimiento 1
select*from Tbl_DetalleTicket   --esta tabla no tiene sp pero es donde guardamos la info de las onservaciones y la solucion del tecnico

--exec Insert
exec SP_NuevoRol 'Tecnico' 
exec SP_NuevoEstado 'Bloaqueado'
exec SP_NuevoUsuario 'Lester','Hernandez','lesterhernandez@gmail.com','lester123',2
exec SP_NuevaCategoria 'Sorfware',1
exec SP_NuevaPrioridad 'Baja'
exec SP_NuevoEstadoTicket 'Cancelado'
exec SP_NuevoTecnico 'Hardware','maicolsanchez@gmail.com',2
exec SP_NuevoTicket 'No craga pornhub',2,3,1


--exec updates
exec SP_AsignarTicket 2,2,1
exec SP_IniciarAtencion 2,2
exec SP_RegistrarObservacion 2,2,'Fuente de poder desconetada'  ---este exec es un insert pero se autoidentifica como update; inclusivos hasta en sql
exec SP_FinalizarTicket 2,2,'La computadora tenia desconetado la fuente de poder del tomacorriente','Reconexion del componente'





--Fecha 07/11/26  CULMINADO
--pendiente:
--asignar tiked , inicar tencion , guardar seguimiento ,  finalizar atencion 


--FECHA 08/11/26
--PENDIENTE:
--updates
--deletes


--//APARTADO DE PRUEBAS/////
select*from Tbl_DetalleTicket
update Tbl_Ticket
set IdUsuario = 3
where IdTicket =1

-- Verificar el estado del ticket
SELECT
    IdTicket,
    CodigoTiket,
    IdEstadoTicket,
    Fechaesolucion
FROM Tbl_Ticket
WHERE IdTicket = 2;

-- Verificar diagnostico y solucion
SELECT *
FROM Tbl_DetalleTicket
WHERE IdTicket = 2;

-- Verificar seguimiento
SELECT *
FROM Tbl_SeguimientoTicket
WHERE IdTicket = 2
ORDER BY IdSeguimiento DESC;

-- Verificar auditoria
SELECT *
FROM Tbl_AuditoriaTicket
WHERE IdTicket = 2
ORDER BY IdAuditoria DESC;
