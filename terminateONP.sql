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
    IdPrioridad int references Tbl_Prioridad (IdPrioridad) not null,
    IdEstadoTicket int references Tbl_EstadoTicket (IdEstadoTicket) not null,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Fechaesolucion DATETIME null
);
CREATE TABLE Tbl_SeguimientoTicket (
    IdSeguimiento INT PRIMARY KEY IDENTITY(1,1),
    IdTicket int references Tbl_Ticket (IdTicket) not null,
    IdTecnico int references Tbl_Tecnico (IdTecnico) not null,
    Titulo VARCHAR(200) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    FechaAccion DATETIME DEFAULT GETDATE(),
);

CREATE TABLE Tbl_AuditoriaTicket (
    IdAuditoria INT PRIMARY KEY IDENTITY(1,1),
    IdTicket int references Tbl_Ticket (IdTicket) not null,
    IdTecnico int references Tbl_Tecnico (IdTecnico) not null,
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
     select pr.IdTecnico, pr.Nombre  ,pr.correo, pr.Especialidad,u.Nombre AS Usuario  from Tbl_Tecnico as pr
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

create or alter proc SP_ListarTicket
 as 
  begin    
  set nocount on;
   begin try 
     select tk.IdTicket ,tk.CodigoTiket as Ticket, tk.Descripcion  , tc.Nombre as Tecnico , cat.NombreCategoria as Categoria, pr.NombrePrioridad as Prioridad , kt.NombreEstado as EstadoTicket ,tk.FechaCreacion  from Tbl_Ticket as tk
     inner join Tbl_Tecnico tc on tk.IdTecnico=tc.Nombre
     inner join Tbl_Categoria cat on tk.IdCategoria=cat.NombreCategoria
     inner join Tbl_Prioridad pr on tk.IdPrioridad=pr.NombrePrioridad
     inner join Tbl_EstadoTicket kt on kt.IdEstadoTicket=kt.NombreEstado
     Print 'Estado de ticktes listadas correctamente'
   end try
   begin catch
     Print 'No se pudo listar'+@@error
   end catch
  end
go

CREATE OR ALTER PROCEDURE SP_ListarDetalleTicket
    @IdTicket INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        T.IdTicket,
        T.Descripcion,
        T.FechaCreacion,
        T.Fechaesolucion,
        D.Diagnostico,
        D.Observaciones,
        D.Solucion
    FROM Tbl_Ticket T
    INNER JOIN Tbl_DetalleTicket D
        ON T.IdTicket = D.IdTicket
    WHERE T.IdTicket = @IdTicket;
END;
GO

Create or alter proc SP_ListarAuditoria
 as
  begin
     set nocount on;
   begin try
select au.IdAuditoria , t.CodigoTiket ,ti.Nombre as Responsable,au.Descripcion ,au.Accion ,au.FechaAccion from Tbl_AuditoriaTicket as au
     inner join Tbl_Ticket t on au.IdTicket= t.CodigoTiket
     inner join Tbl_Tecnico ti on au.IdTecnico=ti.Nombre
     Print 'Usuarios listados Exitosamente'
   end try 
   begin catch
      Print 'No se pudo listar'+ @@error
   end catch
 end
go

Create or alter proc SP_ListarSeguimiento
 as
  begin
     set nocount on;
   begin try
select sg.IdSeguimiento,t.CodigoTiket,ti.Nombre , sg.Titulo , sg.Descripcion, sg.FechaAccion from Tbl_SeguimientoTicket as sg
     inner join Tbl_Ticket t on sg.IdTicket= t.CodigoTiket
     inner join Tbl_Tecnico ti on sg.IdTecnico=ti.Nombre
     Print 'Usuarios listados Exitosamente'
   end try 
   begin catch
      Print 'No se pudo listar'+ @@error
   end catch
 end
go

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

        -- Validar campo obligatorio
        IF (@NombreRol IS NULL OR LTRIM(RTRIM(@NombreRol)) = '')
        BEGIN
            THROW 50001, 'El nombre del rol es obligatorio.', 1;
        END;

        -- Validar que no exista
        IF EXISTS (
            SELECT 1 FROM Tbl_Rol
            WHERE NombreRol = LTRIM(RTRIM(@NombreRol))
        )
        BEGIN
            THROW 50002, 'El rol ya se encuentra registrado.', 1;
        END;

        INSERT INTO Tbl_Rol (NombreRol)
        VALUES (LTRIM(RTRIM(@NombreRol)));

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF (@@TRANCOUNT > 0)
            ROLLBACK TRAN;

        THROW;
    END CATCH
END;
GO


exec SP_ListarRoles
exec SP_ListarEstados
exec SP_ListarUsuarios
exec SP_ListarCategorias
exec SP_ListarPrioridad
exec SP_ListarTecnicos
exec SP_ListarEstadoTiketc
exec SP_ListarTicket
exec SP_ListarDetalleTicket 1
exec SP_ListarAuditoria
exec SP_ListarSeguimiento

