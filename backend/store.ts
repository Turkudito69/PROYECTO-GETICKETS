// In-memory relational store implementing all tables and stored-procedure
// business rules from PROYECTO-GETICKETS (Backend branch - terminateONP.sql).

export interface TblEstado {
  IdEstado: number;
  NombreEstado: string;
}

export interface TblRol {
  IdRol: number;
  NombreRol: string;
  Descripcion?: string | null;
  Permisos?: string[];
  IdEstado: number;
}

export interface TblUsuario {
  IdUsuario: number;
  Nombre: string;
  Apellido: string;
  Correo: string;
  Contrasena: string;
  IdRol: number;
  IdEstado: number;
  FotoUrl?: string | null;
}

export interface TblCategoria {
  IdCategoria: number;
  NombreCategoria: string;
  Icono?: string | null;
  Descripcion?: string | null;
  IdEstado: number;
}

export interface TblPrioridad {
  IdPrioridad: number;
  NombrePrioridad: string;
  IdEstado: number;
}

export interface TblEstadoTicket {
  IdEstadoTicket: number;
  NombreEstado: string;
  IdEstado: number;
}

export interface TblTecnico {
  IdTecnico: number;
  Especialidad: string;
  Correo: string;
  IdUsuario: number;
  IdEstado: number;
}

export interface TblTicket {
  IdTicket: number;
  CodigoTiket: string;
  Descripcion: string;
  IdUsuario: number;
  IdTecnico: number | null;
  IdCategoria: number;
  IdPrioridad: number;
  IdEstadoTicket: number;
  FechaCreacion: string;
  Fechaesolucion: string | null;
}

export interface TblSeguimientoTicket {
  IdSeguimiento: number;
  IdTicket: number;
  IdUsuario: number;
  Titulo: string;
  Descripcion: string;
  FechaAccion: string;
}

export interface TblAuditoriaTicket {
  IdAuditoria: number;
  IdTicket: number;
  IdUsuario: number;
  Accion: string;
  Descripcion: string;
  FechaAccion: string;
}

export interface TblDetalleTicket {
  IdDetalleTicket: number;
  IdTicket: number;
  Diagnostico: string | null;
  Observaciones: string | null;
  Solucion: string | null;
}

export type ZonaPuesto = 'Soporte TI' | 'Administración' | 'Operaciones';

export interface TblPuesto {
  IdPuesto: number;
  CodigoPuesto: string;
  NombrePuesto: string;
  Zona: ZonaPuesto;
  IdUsuarioActual: number | null;
  FechaAsignacion: string | null;
  IdEstado: number;
}

export interface TblHistorialPuesto {
  IdHistorial: number;
  IdPuesto: number;
  IdUsuario: number;
  Accion: string;
  Motivo: string;
  FechaInicio: string;
  FechaFin: string | null;
  IdUsuarioAccion: number;
}

export class DomainError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const nowIso = (offsetMinutes = 0) =>
  new Date(Date.now() + offsetMinutes * 60_000).toISOString();

class GeTicketsStore {
  estados: TblEstado[] = [
    { IdEstado: 1, NombreEstado: 'Activo' },
    { IdEstado: 2, NombreEstado: 'Inactivo' },
  ];

  roles: TblRol[] = [
    {
      IdRol: 1,
      NombreRol: 'Administrador',
      Descripcion: 'Control total de la mesa de ayuda, asignación de casos y catálogos.',
      Permisos: [
        'Ver todos los tickets de la organización',
        'Asignar técnicos disponibles según carga',
        'Confirmar o reabrir cualquier solicitud',
        'Auditar historial completo de movimientos',
        'Crear/editar usuarios, técnicos, categorías y roles',
        'Explorar el mapa 3D de puestos y estado',
      ],
      IdEstado: 1,
    },
    {
      IdRol: 2,
      NombreRol: 'Tecnico',
      Descripcion: 'Atiende incidencias asignadas, registra avances y documenta soluciones.',
      Permisos: [
        'Consultar su bandeja de casos asignados',
        'Iniciar atención (pasar de Asignado a En Proceso)',
        'Agregar notas técnicas y avances en el historial',
        'Registrar diagnóstico y solución (estado Resuelto)',
        'Crear solicitudes internas y ver mapa 3D',
      ],
      IdEstado: 1,
    },
    {
      IdRol: 3,
      NombreRol: 'Usuario',
      Descripcion: 'Colaborador que reporta incidentes y confirma la solución aplicada.',
      Permisos: [
        'Reportar nuevos incidentes por categoría y prioridad',
        'Dar seguimiento visual en tiempo real a sus tickets',
        'Confirmar que la solución funcionó (Completado)',
        'Reabrir el caso si el problema persiste',
        'Recibir notificaciones y consultar el espacio 3D',
      ],
      IdEstado: 1,
    },
  ];

  usuarios: TblUsuario[] = [
    {
      IdUsuario: 1,
      Nombre: 'Carlos',
      Apellido: 'Mendoza',
      Correo: 'admin@getickets.com',
      Contrasena: 'admin123',
      IdRol: 1,
      IdEstado: 1,
      FotoUrl: null,
    },
    {
      IdUsuario: 2,
      Nombre: 'Maicol',
      Apellido: 'Sanchez',
      Correo: 'maicolsanchez@gmail.com',
      Contrasena: 'maicol123',
      IdRol: 2,
      IdEstado: 1,
      FotoUrl: null,
    },
    {
      IdUsuario: 3,
      Nombre: 'Lester',
      Apellido: 'Hernandez',
      Correo: 'lesterhernandez@gmail.com',
      Contrasena: 'lester123',
      IdRol: 3,
      IdEstado: 1,
      FotoUrl: null,
    },
    {
      IdUsuario: 4,
      Nombre: 'Valeria',
      Apellido: 'Rojas',
      Correo: 'valeria.rojas@getickets.com',
      Contrasena: 'tecnico123',
      IdRol: 2,
      IdEstado: 1,
      FotoUrl: null,
    },
    {
      IdUsuario: 5,
      Nombre: 'Andrea',
      Apellido: 'Castillo',
      Correo: 'andrea.castillo@getickets.com',
      Contrasena: 'usuario123',
      IdRol: 3,
      IdEstado: 1,
      FotoUrl: null,
    },
  ];

  categorias: TblCategoria[] = [
    { IdCategoria: 1, NombreCategoria: 'Hardware', Icono: 'cpu', Descripcion: 'Equipos físicos, PCs y estaciones', IdEstado: 1 },
    { IdCategoria: 2, NombreCategoria: 'Software', Icono: 'app', Descripcion: 'Aplicaciones y sistemas de oficina', IdEstado: 1 },
    { IdCategoria: 3, NombreCategoria: 'Redes y Conectividad', Icono: 'wifi', Descripcion: 'Wi-Fi, VPN y cableado de red', IdEstado: 1 },
    { IdCategoria: 4, NombreCategoria: 'Accesos y Cuentas', Icono: 'key', Descripcion: 'Credenciales, MFA y permisos', IdEstado: 1 },
    { IdCategoria: 5, NombreCategoria: 'Impresoras y Periféricos', Icono: 'printer', Descripcion: 'Impresión, escáner y periféricos', IdEstado: 1 },
    { IdCategoria: 6, NombreCategoria: 'Funciones Futuras / Cloud', Icono: 'sparkles', Descripcion: 'Nuevas integraciones, nube e iniciativas futuras', IdEstado: 1 },
  ];

  prioridades: TblPrioridad[] = [
    { IdPrioridad: 1, NombrePrioridad: 'Alta', IdEstado: 1 },
    { IdPrioridad: 2, NombrePrioridad: 'Media', IdEstado: 1 },
    { IdPrioridad: 3, NombrePrioridad: 'Baja', IdEstado: 1 },
  ];

  estadosTicket: TblEstadoTicket[] = [
    { IdEstadoTicket: 1, NombreEstado: 'Abierto', IdEstado: 1 },
    { IdEstadoTicket: 2, NombreEstado: 'Asignado', IdEstado: 1 },
    { IdEstadoTicket: 3, NombreEstado: 'En Proceso', IdEstado: 1 },
    { IdEstadoTicket: 4, NombreEstado: 'Resuelto', IdEstado: 1 },
    { IdEstadoTicket: 5, NombreEstado: 'Cancelado', IdEstado: 1 },
    { IdEstadoTicket: 6, NombreEstado: 'Completado', IdEstado: 1 },
  ];

  tecnicos: TblTecnico[] = [
    {
      IdTecnico: 1,
      Especialidad: 'Hardware',
      Correo: 'maicolsanchez@gmail.com',
      IdUsuario: 2,
      IdEstado: 1,
    },
    {
      IdTecnico: 2,
      Especialidad: 'Redes y Software',
      Correo: 'valeria.rojas@getickets.com',
      IdUsuario: 4,
      IdEstado: 1,
    },
  ];

  tickets: TblTicket[] = [
    {
      IdTicket: 1,
      CodigoTiket: 'TCK-000001',
      Descripcion: 'La impresora láser del área de Contabilidad no responde en red y muestra atasco ficticio en bandeja 2.',
      IdUsuario: 3,
      IdTecnico: 1,
      IdCategoria: 5,
      IdPrioridad: 1,
      IdEstadoTicket: 6,
      FechaCreacion: nowIso(-2880),
      Fechaesolucion: nowIso(-2520),
    },
    {
      IdTicket: 2,
      CodigoTiket: 'TCK-000002',
      Descripcion: 'Estación de trabajo en Recepción se reinicia repentinamente al abrir hojas de cálculo pesadas.',
      IdUsuario: 3,
      IdTecnico: 1,
      IdCategoria: 1,
      IdPrioridad: 1,
      IdEstadoTicket: 3,
      FechaCreacion: nowIso(-720),
      Fechaesolucion: null,
    },
    {
      IdTicket: 3,
      CodigoTiket: 'TCK-000003',
      Descripcion: 'Pérdida intermitente de conectividad VPN corporativa para el equipo de Ventas en piso 3.',
      IdUsuario: 3,
      IdTecnico: 2,
      IdCategoria: 3,
      IdPrioridad: 2,
      IdEstadoTicket: 2,
      FechaCreacion: nowIso(-360),
      Fechaesolucion: null,
    },
    {
      IdTicket: 4,
      CodigoTiket: 'TCK-000004',
      Descripcion: 'Solicitud de restablecimiento de credenciales MFA y acceso al módulo de facturación ERP.',
      IdUsuario: 5,
      IdTecnico: null,
      IdCategoria: 4,
      IdPrioridad: 1,
      IdEstadoTicket: 1,
      FechaCreacion: nowIso(-140),
      Fechaesolucion: null,
    },
    {
      IdTicket: 5,
      CodigoTiket: 'TCK-000005',
      Descripcion: 'Actualización de licencia de suite ofimática y configuración de firma digital en cliente de correo.',
      IdUsuario: 3,
      IdTecnico: null,
      IdCategoria: 2,
      IdPrioridad: 3,
      IdEstadoTicket: 1,
      FechaCreacion: nowIso(-45),
      Fechaesolucion: null,
    },
  ];

  detallesTicket: TblDetalleTicket[] = [
    {
      IdDetalleTicket: 1,
      IdTicket: 1,
      Diagnostico: 'Sensor óptico de bandeja 2 obstruido por residuo de papel y cola de impresión corrupta en servidor.',
      Observaciones: 'Se realizó limpieza preventiva del rodillo y reinicio del spooler.',
      Solucion: 'Limpieza de sensor de bandeja, reemplazo de goma de arrastre y reconfiguración de puerto IP fijo.',
    },
    {
      IdDetalleTicket: 2,
      IdTicket: 2,
      Diagnostico: null,
      Observaciones: 'Fuente de poder presentaba falso contacto en regleta; se inició prueba de estrés de memoria RAM.',
      Solucion: null,
    },
  ];

  seguimientos: TblSeguimientoTicket[] = [
    { IdSeguimiento: 1, IdTicket: 1, IdUsuario: 3, Titulo: 'Solicitud creada', Descripcion: 'El usuario registró una nueva solicitud de soporte técnico.', FechaAccion: nowIso(-2880) },
    { IdSeguimiento: 2, IdTicket: 1, IdUsuario: 1, Titulo: 'Técnico asignado', Descripcion: 'El administrador asignó a Maicol Sanchez al ticket.', FechaAccion: nowIso(-2820) },
    { IdSeguimiento: 3, IdTicket: 1, IdUsuario: 2, Titulo: 'Atención iniciada', Descripcion: 'El técnico inició la atención del ticket.', FechaAccion: nowIso(-2760) },
    { IdSeguimiento: 4, IdTicket: 1, IdUsuario: 2, Titulo: 'Observación registrada', Descripcion: 'Se realizó limpieza preventiva del rodillo y reinicio del spooler.', FechaAccion: nowIso(-2640) },
    { IdSeguimiento: 5, IdTicket: 1, IdUsuario: 2, Titulo: 'Ticket resuelto', Descripcion: 'El técnico registró la solución y resolvió el ticket.', FechaAccion: nowIso(-2520) },
    { IdSeguimiento: 14, IdTicket: 1, IdUsuario: 3, Titulo: 'Completado por usuario', Descripcion: 'El usuario verificó la solución y confirmó que el ticket quedó completado.', FechaAccion: nowIso(-2460) },

    { IdSeguimiento: 6, IdTicket: 2, IdUsuario: 3, Titulo: 'Solicitud creada', Descripcion: 'El usuario registró una nueva solicitud de soporte técnico.', FechaAccion: nowIso(-720) },
    { IdSeguimiento: 7, IdTicket: 2, IdUsuario: 1, Titulo: 'Técnico asignado', Descripcion: 'El administrador asignó a Maicol Sanchez al ticket.', FechaAccion: nowIso(-660) },
    { IdSeguimiento: 8, IdTicket: 2, IdUsuario: 2, Titulo: 'Atención iniciada', Descripcion: 'El técnico inició la atención del ticket.', FechaAccion: nowIso(-600) },
    { IdSeguimiento: 9, IdTicket: 2, IdUsuario: 2, Titulo: 'Observación registrada', Descripcion: 'Fuente de poder presentaba falso contacto en regleta; se inició prueba de estrés de memoria RAM.', FechaAccion: nowIso(-420) },

    { IdSeguimiento: 10, IdTicket: 3, IdUsuario: 3, Titulo: 'Solicitud creada', Descripcion: 'El usuario registró una nueva solicitud de soporte técnico.', FechaAccion: nowIso(-360) },
    { IdSeguimiento: 11, IdTicket: 3, IdUsuario: 1, Titulo: 'Técnico asignado', Descripcion: 'El administrador asignó a Valeria Rojas al ticket.', FechaAccion: nowIso(-300) },

    { IdSeguimiento: 12, IdTicket: 4, IdUsuario: 5, Titulo: 'Solicitud creada', Descripcion: 'El usuario registró una nueva solicitud de soporte técnico.', FechaAccion: nowIso(-140) },
    { IdSeguimiento: 13, IdTicket: 5, IdUsuario: 3, Titulo: 'Solicitud creada', Descripcion: 'El usuario registró una nueva solicitud de soporte técnico.', FechaAccion: nowIso(-45) },
  ];

  auditorias: TblAuditoriaTicket[] = [
    { IdAuditoria: 1, IdTicket: 1, IdUsuario: 3, Accion: 'Ticket creado', Descripcion: 'Se registró una nueva solicitud de soporte técnico.', FechaAccion: nowIso(-2880) },
    { IdAuditoria: 2, IdTicket: 1, IdUsuario: 1, Accion: 'Asignación de técnico', Descripcion: 'Se asignó el técnico Maicol Sanchez al ticket.', FechaAccion: nowIso(-2820) },
    { IdAuditoria: 3, IdTicket: 1, IdUsuario: 2, Accion: 'Inicio de atención', Descripcion: 'El técnico cambió el estado del ticket a En Proceso.', FechaAccion: nowIso(-2760) },
    { IdAuditoria: 4, IdTicket: 1, IdUsuario: 2, Accion: 'Registro de observación', Descripcion: 'El técnico registró una observación técnica.', FechaAccion: nowIso(-2640) },
    { IdAuditoria: 5, IdTicket: 1, IdUsuario: 2, Accion: 'Resolución de ticket', Descripcion: 'El técnico finalizó el ticket con diagnóstico y solución.', FechaAccion: nowIso(-2520) },
    { IdAuditoria: 14, IdTicket: 1, IdUsuario: 3, Accion: 'Cierre confirmado', Descripcion: 'El usuario confirmó que la solicitud quedó completada.', FechaAccion: nowIso(-2460) },

    { IdAuditoria: 6, IdTicket: 2, IdUsuario: 3, Accion: 'Ticket creado', Descripcion: 'Se registró una nueva solicitud de soporte técnico.', FechaAccion: nowIso(-720) },
    { IdAuditoria: 7, IdTicket: 2, IdUsuario: 1, Accion: 'Asignación de técnico', Descripcion: 'Se asignó el técnico Maicol Sanchez al ticket.', FechaAccion: nowIso(-660) },
    { IdAuditoria: 8, IdTicket: 2, IdUsuario: 2, Accion: 'Inicio de atención', Descripcion: 'El técnico cambió el estado del ticket a En Proceso.', FechaAccion: nowIso(-600) },
    { IdAuditoria: 9, IdTicket: 2, IdUsuario: 2, Accion: 'Registro de observación', Descripcion: 'El técnico registró una observación técnica.', FechaAccion: nowIso(-420) },

    { IdAuditoria: 10, IdTicket: 3, IdUsuario: 3, Accion: 'Ticket creado', Descripcion: 'Se registró una nueva solicitud de soporte técnico.', FechaAccion: nowIso(-360) },
    { IdAuditoria: 11, IdTicket: 3, IdUsuario: 1, Accion: 'Asignación de técnico', Descripcion: 'Se asignó el técnico Valeria Rojas al ticket.', FechaAccion: nowIso(-300) },

    { IdAuditoria: 12, IdTicket: 4, IdUsuario: 5, Accion: 'Ticket creado', Descripcion: 'Se registró una nueva solicitud de soporte técnico.', FechaAccion: nowIso(-140) },
    { IdAuditoria: 13, IdTicket: 5, IdUsuario: 3, Accion: 'Ticket creado', Descripcion: 'Se registró una nueva solicitud de soporte técnico.', FechaAccion: nowIso(-45) },
  ];

  puestos: TblPuesto[] = [
    {
      IdPuesto: 1,
      CodigoPuesto: 'ADM-01',
      NombrePuesto: 'Dirección Mesa de Ayuda',
      Zona: 'Administración',
      IdUsuarioActual: 1,
      FechaAsignacion: nowIso(-14400),
      IdEstado: 1,
    },
    {
      IdPuesto: 2,
      CodigoPuesto: 'TI-01',
      NombrePuesto: 'Estación Soporte Hardware',
      Zona: 'Soporte TI',
      IdUsuarioActual: 2,
      FechaAsignacion: nowIso(-14400),
      IdEstado: 1,
    },
    {
      IdPuesto: 3,
      CodigoPuesto: 'TI-02',
      NombrePuesto: 'Estación Redes y Software',
      Zona: 'Soporte TI',
      IdUsuarioActual: 4,
      FechaAsignacion: nowIso(-7200),
      IdEstado: 1,
    },
    {
      IdPuesto: 4,
      CodigoPuesto: 'COL-01',
      NombrePuesto: 'Módulo Operaciones A',
      Zona: 'Operaciones',
      IdUsuarioActual: 3,
      FechaAsignacion: nowIso(-5400),
      IdEstado: 1,
    },
    {
      IdPuesto: 5,
      CodigoPuesto: 'COL-02',
      NombrePuesto: 'Módulo Operaciones B',
      Zona: 'Operaciones',
      IdUsuarioActual: 5,
      FechaAsignacion: nowIso(-5400),
      IdEstado: 1,
    },
    {
      IdPuesto: 6,
      CodigoPuesto: 'COL-03',
      NombrePuesto: 'Módulo Disponible C',
      Zona: 'Operaciones',
      IdUsuarioActual: null,
      FechaAsignacion: null,
      IdEstado: 1,
    },
  ];

  historialPuestos: TblHistorialPuesto[] = [
    {
      IdHistorial: 1,
      IdPuesto: 1,
      IdUsuario: 1,
      Accion: 'Asignación inicial',
      Motivo: 'Apertura de planta GETICKETS',
      FechaInicio: nowIso(-14400),
      FechaFin: null,
      IdUsuarioAccion: 1,
    },
    {
      IdHistorial: 2,
      IdPuesto: 2,
      IdUsuario: 2,
      Accion: 'Asignación inicial',
      Motivo: 'Estación fija de Soporte Hardware',
      FechaInicio: nowIso(-14400),
      FechaFin: null,
      IdUsuarioAccion: 1,
    },
    {
      IdHistorial: 3,
      IdPuesto: 3,
      IdUsuario: 1,
      Accion: 'Asignación temporal',
      Motivo: 'Cobertura inicial antes del ingreso de Valeria Rojas',
      FechaInicio: nowIso(-14400),
      FechaFin: nowIso(-7200),
      IdUsuarioAccion: 1,
    },
    {
      IdHistorial: 4,
      IdPuesto: 3,
      IdUsuario: 4,
      Accion: 'Cambio de puesto',
      Motivo: 'Incorporación al equipo de Redes y Software',
      FechaInicio: nowIso(-7200),
      FechaFin: null,
      IdUsuarioAccion: 1,
    },
    {
      IdHistorial: 5,
      IdPuesto: 4,
      IdUsuario: 5,
      Accion: 'Asignación inicial',
      Motivo: 'Puesto original de Operaciones',
      FechaInicio: nowIso(-10800),
      FechaFin: nowIso(-5400),
      IdUsuarioAccion: 1,
    },
    {
      IdHistorial: 6,
      IdPuesto: 6,
      IdUsuario: 3,
      Accion: 'Asignación inicial',
      Motivo: 'Ubicación previa en módulo lateral',
      FechaInicio: nowIso(-10800),
      FechaFin: nowIso(-5400),
      IdUsuarioAccion: 1,
    },
    {
      IdHistorial: 7,
      IdPuesto: 5,
      IdUsuario: 5,
      Accion: 'Cambio de puesto',
      Motivo: 'Reubicación cerca de ventana para coordinación',
      FechaInicio: nowIso(-5400),
      FechaFin: null,
      IdUsuarioAccion: 1,
    },
    {
      IdHistorial: 8,
      IdPuesto: 4,
      IdUsuario: 3,
      Accion: 'Cambio de puesto',
      Motivo: 'Traslado desde COL-03 a Módulo Operaciones A',
      FechaInicio: nowIso(-5400),
      FechaFin: null,
      IdUsuarioAccion: 1,
    },
  ];

  private nextId<T extends object>(items: T[], field: keyof T): number {
    return items.reduce((max, item) => Math.max(max, Number(item[field] ?? 0)), 0) + 1;
  }

  private estadoNombre(idEstado: number): string {
    return this.estados.find((e) => e.IdEstado === idEstado)?.NombreEstado ?? 'Desconocido';
  }

  private userName(idUsuario: number): string {
    const u = this.usuarios.find((x) => x.IdUsuario === idUsuario);
    return u ? `${u.Nombre} ${u.Apellido}` : 'Sistema';
  }

  private tecnicoName(idTecnico: number | null): string | null {
    if (!idTecnico) return null;
    const t = this.tecnicos.find((x) => x.IdTecnico === idTecnico);
    if (!t) return null;
    return this.userName(t.IdUsuario);
  }

  // SP_ValidarLogin
  validarLogin(correo: string, contrasena: string) {
    const cleanCorreo = correo?.trim().toLowerCase();
    const user = this.usuarios.find(
      (u) => u.Correo.toLowerCase() === cleanCorreo && u.Contrasena === contrasena
    );
    if (!user) return null;
    const userEstado = this.estadoNombre(user.IdEstado);
    const rol = this.roles.find((r) => r.IdRol === user.IdRol);
    const rolEstado = rol ? this.estadoNombre(rol.IdEstado) : 'Inactivo';
    if (userEstado !== 'Activo' || !rol || rolEstado !== 'Activo') {
      throw new DomainError('El usuario o su rol se encuentran inactivos.', 403);
    }
    const tech = this.tecnicos.find((t) => t.IdUsuario === user.IdUsuario && t.IdEstado === 1);
    return {
      idUsuario: user.IdUsuario,
      nombre: user.Nombre,
      apellido: user.Apellido,
      correo: user.Correo,
      idRol: user.IdRol,
      rol: rol.NombreRol,
      idTecnico: tech ? tech.IdTecnico : null,
      fotoUrl: user.FotoUrl ?? null,
    };
  }

  // SP_ListarTicket
  listarTickets() {
    return [...this.tickets]
      .sort((a, b) => new Date(b.FechaCreacion).getTime() - new Date(a.FechaCreacion).getTime())
      .map((tk) => ({
        idTicket: tk.IdTicket,
        codigoTicket: tk.CodigoTiket,
        descripcion: tk.Descripcion,
        idUsuario: tk.IdUsuario,
        solicitante: this.userName(tk.IdUsuario),
        idTecnico: tk.IdTecnico,
        tecnico: this.tecnicoName(tk.IdTecnico),
        idCategoria: tk.IdCategoria,
        categoria: this.categorias.find((c) => c.IdCategoria === tk.IdCategoria)?.NombreCategoria ?? 'General',
        idPrioridad: tk.IdPrioridad,
        prioridad: this.prioridades.find((p) => p.IdPrioridad === tk.IdPrioridad)?.NombrePrioridad ?? 'Media',
        idEstadoTicket: tk.IdEstadoTicket,
        estadoTicket: this.estadosTicket.find((e) => e.IdEstadoTicket === tk.IdEstadoTicket)?.NombreEstado ?? 'Abierto',
        fechaCreacion: tk.FechaCreacion,
        fechaSolucion: tk.Fechaesolucion,
      }));
  }

  // SP_ListarDetalleTicket
  listarDetalleTicket(idOrCodigo: string) {
    const tk = this.tickets.find(
      (t) =>
        String(t.IdTicket) === idOrCodigo ||
        t.CodigoTiket.toLowerCase() === idOrCodigo.toLowerCase()
    );
    if (!tk) throw new DomainError('El ticket no existe.', 404);
    const det = this.detallesTicket.find((d) => d.IdTicket === tk.IdTicket);
    return {
      idTicket: tk.IdTicket,
      codigoTicket: tk.CodigoTiket,
      descripcion: tk.Descripcion,
      solicitante: this.userName(tk.IdUsuario),
      tecnico: this.tecnicoName(tk.IdTecnico),
      categoria: this.categorias.find((c) => c.IdCategoria === tk.IdCategoria)?.NombreCategoria ?? 'General',
      prioridad: this.prioridades.find((p) => p.IdPrioridad === tk.IdPrioridad)?.NombrePrioridad ?? 'Media',
      estadoTicket: this.estadosTicket.find((e) => e.IdEstadoTicket === tk.IdEstadoTicket)?.NombreEstado ?? 'Abierto',
      fechaCreacion: tk.FechaCreacion,
      fechaSolucion: tk.Fechaesolucion,
      diagnostico: det?.Diagnostico ?? null,
      observaciones: det?.Observaciones ?? null,
      solucion: det?.Solucion ?? null,
    };
  }

  // SP_ListarDetalleTicketGeneral
  listarDetalleTicketGeneral() {
    return this.detallesTicket.map((d) => {
      const tk = this.tickets.find((t) => t.IdTicket === d.IdTicket);
      return {
        idDetalleTicket: d.IdDetalleTicket,
        idTicket: d.IdTicket,
        ticket: tk?.CodigoTiket ?? `TCK-${d.IdTicket}`,
        diagnostico: d.Diagnostico,
        observaciones: d.Observaciones,
        solucion: d.Solucion,
      };
    });
  }

  // SP_ListarSeguimiento
  listarSeguimiento(idOrCodigo: string) {
    const tk = this.tickets.find(
      (t) =>
        String(t.IdTicket) === idOrCodigo ||
        t.CodigoTiket.toLowerCase() === idOrCodigo.toLowerCase()
    );
    if (!tk) throw new DomainError('El ticket no existe.', 404);
    return this.seguimientos
      .filter((s) => s.IdTicket === tk.IdTicket)
      .sort((a, b) => new Date(a.FechaAccion).getTime() - new Date(b.FechaAccion).getTime() || a.IdSeguimiento - b.IdSeguimiento)
      .map((s) => ({
        idSeguimientoTicket: s.IdSeguimiento,
        idTicket: s.IdTicket,
        codigoTicket: tk.CodigoTiket,
        responsable: this.userName(s.IdUsuario),
        titulo: s.Titulo,
        descripcion: s.Descripcion,
        fechaSeguimiento: s.FechaAccion,
      }));
  }

  // SP_ListarAuditoriaTicket
  listarAuditoria() {
    return [...this.auditorias]
      .sort((a, b) => new Date(b.FechaAccion).getTime() - new Date(a.FechaAccion).getTime() || b.IdAuditoria - a.IdAuditoria)
      .map((a) => {
        const tk = this.tickets.find((t) => t.IdTicket === a.IdTicket);
        return {
          idAuditoria: a.IdAuditoria,
          idTicket: a.IdTicket,
          ticket: tk?.CodigoTiket ?? `TCK-${a.IdTicket}`,
          responsable: this.userName(a.IdUsuario),
          accion: a.Accion,
          descripcion: a.Descripcion,
          fechaAccion: a.FechaAccion,
        };
      });
  }

  // SP_NuevoTicket
  nuevoTicket(input: { descripcion: string; idUsuario: number; idCategoria: number; idPrioridad: number }) {
    const desc = input.descripcion?.trim();
    if (!desc) throw new DomainError('La descripción es obligatoria.');
    if (!this.usuarios.some((u) => u.IdUsuario === Number(input.idUsuario))) {
      throw new DomainError('El usuario no existe.');
    }
    if (!this.categorias.some((c) => c.IdCategoria === Number(input.idCategoria))) {
      throw new DomainError('La categoría no existe.');
    }
    if (!this.prioridades.some((p) => p.IdPrioridad === Number(input.idPrioridad))) {
      throw new DomainError('La prioridad no existe.');
    }

    const idEstadoAbierto =
      this.estadosTicket.find((e) => e.NombreEstado === 'Abierto')?.IdEstadoTicket ?? 1;
    const idTicket = this.nextId(this.tickets, 'IdTicket');
    const codigo = `TCK-${String(idTicket).padStart(6, '0')}`;
    const fecha = nowIso();

    this.tickets.push({
      IdTicket: idTicket,
      CodigoTiket: codigo,
      Descripcion: desc,
      IdUsuario: Number(input.idUsuario),
      IdTecnico: null,
      IdCategoria: Number(input.idCategoria),
      IdPrioridad: Number(input.idPrioridad),
      IdEstadoTicket: idEstadoAbierto,
      FechaCreacion: fecha,
      Fechaesolucion: null,
    });

    this.seguimientos.push({
      IdSeguimiento: this.nextId(this.seguimientos, 'IdSeguimiento'),
      IdTicket: idTicket,
      IdUsuario: Number(input.idUsuario),
      Titulo: 'Solicitud creada',
      Descripcion: 'El usuario registró una nueva solicitud de soporte técnico.',
      FechaAccion: fecha,
    });

    this.auditorias.push({
      IdAuditoria: this.nextId(this.auditorias, 'IdAuditoria'),
      IdTicket: idTicket,
      IdUsuario: Number(input.idUsuario),
      Accion: 'Ticket creado',
      Descripcion: 'Se registró una nueva solicitud de soporte técnico.',
      FechaAccion: fecha,
    });

    return { idTicket, codigoTicket: codigo };
  }

  // SP_AsignarTicket
  asignarTicket(input: { idTicket: number; idTecnico: number; idUsuario: number }) {
    const ticket = this.tickets.find((t) => t.IdTicket === Number(input.idTicket));
    if (!ticket) throw new DomainError('El ticket no existe.', 404);

    const tecnico = this.tecnicos.find((t) => t.IdTecnico === Number(input.idTecnico));
    if (!tecnico) throw new DomainError('El técnico no existe.', 404);

    const admin = this.usuarios.find((u) => u.IdUsuario === Number(input.idUsuario));
    if (!admin) throw new DomainError('El usuario no existe.', 404);

    // Validar técnico activo, usuario activo, rol Tecnico activo
    const techUser = this.usuarios.find((u) => u.IdUsuario === tecnico.IdUsuario);
    const techRol = techUser ? this.roles.find((r) => r.IdRol === techUser.IdRol) : null;
    if (
      this.estadoNombre(tecnico.IdEstado) !== 'Activo' ||
      !techUser ||
      this.estadoNombre(techUser.IdEstado) !== 'Activo' ||
      !techRol ||
      techRol.NombreRol !== 'Tecnico' ||
      this.estadoNombre(techRol.IdEstado) !== 'Activo'
    ) {
      throw new DomainError('El técnico está inactivo, su usuario está inactivo o no tiene el rol Técnico.');
    }

    // Validar administrador activo
    const adminRol = this.roles.find((r) => r.IdRol === admin.IdRol);
    if (
      this.estadoNombre(admin.IdEstado) !== 'Activo' ||
      !adminRol ||
      adminRol.NombreRol !== 'Administrador' ||
      this.estadoNombre(adminRol.IdEstado) !== 'Activo'
    ) {
      throw new DomainError('El usuario no es un administrador activo.', 403);
    }

    const estadoActual = this.estadosTicket.find((e) => e.IdEstadoTicket === ticket.IdEstadoTicket);
    if (!estadoActual || estadoActual.NombreEstado !== 'Abierto' || ticket.IdTecnico !== null) {
      throw new DomainError('El ticket no está disponible para asignación.');
    }

    const estadoAsignado = this.estadosTicket.find((e) => e.NombreEstado === 'Asignado');
    if (!estadoAsignado) throw new DomainError('No existe el estado Asignado.');

    const nombreTecnico = `${techUser.Nombre} ${techUser.Apellido}`;
    const fecha = nowIso();

    ticket.IdTecnico = tecnico.IdTecnico;
    ticket.IdEstadoTicket = estadoAsignado.IdEstadoTicket;

    this.seguimientos.push({
      IdSeguimiento: this.nextId(this.seguimientos, 'IdSeguimiento'),
      IdTicket: ticket.IdTicket,
      IdUsuario: admin.IdUsuario,
      Titulo: 'Técnico asignado',
      Descripcion: `El administrador asignó a ${nombreTecnico} al ticket.`,
      FechaAccion: fecha,
    });

    this.auditorias.push({
      IdAuditoria: this.nextId(this.auditorias, 'IdAuditoria'),
      IdTicket: ticket.IdTicket,
      IdUsuario: admin.IdUsuario,
      Accion: 'Asignación de técnico',
      Descripcion: `Se asignó el técnico ${nombreTecnico} al ticket.`,
      FechaAccion: fecha,
    });
  }

  // SP_IniciarAtencion
  iniciarAtencion(input: { idTicket: number; idUsuario: number }) {
    const ticket = this.tickets.find((t) => t.IdTicket === Number(input.idTicket));
    if (!ticket) throw new DomainError('El ticket no existe.', 404);

    const user = this.usuarios.find((u) => u.IdUsuario === Number(input.idUsuario));
    if (!user) throw new DomainError('El usuario no existe.', 404);

    const tech = this.tecnicos.find((t) => t.IdTecnico === ticket.IdTecnico);
    if (!tech || tech.IdUsuario !== user.IdUsuario) {
      throw new DomainError('El usuario no es el técnico asignado al ticket.', 403);
    }

    const estadoActual = this.estadosTicket.find((e) => e.IdEstadoTicket === ticket.IdEstadoTicket);
    if (!estadoActual || estadoActual.NombreEstado !== 'Asignado') {
      throw new DomainError('El ticket debe estar en estado Asignado.');
    }

    const estadoEnProceso = this.estadosTicket.find((e) => e.NombreEstado === 'En Proceso');
    if (!estadoEnProceso) throw new DomainError('No existe el estado En Proceso.');

    const fecha = nowIso();
    ticket.IdEstadoTicket = estadoEnProceso.IdEstadoTicket;

    this.seguimientos.push({
      IdSeguimiento: this.nextId(this.seguimientos, 'IdSeguimiento'),
      IdTicket: ticket.IdTicket,
      IdUsuario: user.IdUsuario,
      Titulo: 'Atención iniciada',
      Descripcion: 'El técnico inició la atención del ticket.',
      FechaAccion: fecha,
    });

    this.auditorias.push({
      IdAuditoria: this.nextId(this.auditorias, 'IdAuditoria'),
      IdTicket: ticket.IdTicket,
      IdUsuario: user.IdUsuario,
      Accion: 'Inicio de atención',
      Descripcion: 'El técnico cambió el estado del ticket a En Proceso.',
      FechaAccion: fecha,
    });
  }

  // SP_RegistrarObservacion
  guardarObservacion(input: { idTicket: number; idUsuario: number; observacion: string }) {
    const obs = input.observacion?.trim();
    if (!obs) throw new DomainError('La observación no puede estar vacía.');

    const ticket = this.tickets.find((t) => t.IdTicket === Number(input.idTicket));
    if (!ticket) throw new DomainError('El ticket no existe.', 404);

    const tech = this.tecnicos.find((t) => t.IdTecnico === ticket.IdTecnico);
    if (!tech || tech.IdUsuario !== Number(input.idUsuario)) {
      throw new DomainError('El usuario no es el técnico asignado.', 403);
    }

    const estadoActual = this.estadosTicket.find((e) => e.IdEstadoTicket === ticket.IdEstadoTicket);
    if (!estadoActual || estadoActual.NombreEstado !== 'En Proceso') {
      throw new DomainError('El ticket debe estar en estado En Proceso para registrar observaciones.');
    }

    let det = this.detallesTicket.find((d) => d.IdTicket === ticket.IdTicket);
    if (!det) {
      det = {
        IdDetalleTicket: this.nextId(this.detallesTicket, 'IdDetalleTicket'),
        IdTicket: ticket.IdTicket,
        Diagnostico: null,
        Observaciones: obs,
        Solucion: null,
      };
      this.detallesTicket.push(det);
    } else {
      det.Observaciones = det.Observaciones ? `${det.Observaciones}\n• ${obs}` : obs;
    }

    const fecha = nowIso();
    this.seguimientos.push({
      IdSeguimiento: this.nextId(this.seguimientos, 'IdSeguimiento'),
      IdTicket: ticket.IdTicket,
      IdUsuario: Number(input.idUsuario),
      Titulo: 'Observación registrada',
      Descripcion: obs,
      FechaAccion: fecha,
    });

    this.auditorias.push({
      IdAuditoria: this.nextId(this.auditorias, 'IdAuditoria'),
      IdTicket: ticket.IdTicket,
      IdUsuario: Number(input.idUsuario),
      Accion: 'Registro de observación',
      Descripcion: obs,
      FechaAccion: fecha,
    });
  }

  // SP_FinalizarTicket
  finalizarTicket(input: { idTicket: number; idUsuario: number; diagnostico: string; solucion: string }) {
    const diag = input.diagnostico?.trim();
    const sol = input.solucion?.trim();
    if (!diag) throw new DomainError('El diagnóstico es obligatorio.');
    if (!sol) throw new DomainError('La solución es obligatoria.');

    const ticket = this.tickets.find((t) => t.IdTicket === Number(input.idTicket));
    if (!ticket) throw new DomainError('El ticket no existe.', 404);

    const tech = this.tecnicos.find((t) => t.IdTecnico === ticket.IdTecnico);
    if (!tech || tech.IdUsuario !== Number(input.idUsuario)) {
      throw new DomainError('El usuario no es el técnico asignado.', 403);
    }

    const estadoActual = this.estadosTicket.find((e) => e.IdEstadoTicket === ticket.IdEstadoTicket);
    if (!estadoActual || estadoActual.NombreEstado !== 'En Proceso') {
      throw new DomainError('El ticket debe estar en estado En Proceso para finalizarlo.');
    }

    const estadoResuelto = this.estadosTicket.find((e) => e.NombreEstado === 'Resuelto');
    if (!estadoResuelto) throw new DomainError('No existe el estado Resuelto.');

    let det = this.detallesTicket.find((d) => d.IdTicket === ticket.IdTicket);
    if (!det) {
      det = {
        IdDetalleTicket: this.nextId(this.detallesTicket, 'IdDetalleTicket'),
        IdTicket: ticket.IdTicket,
        Diagnostico: diag,
        Observaciones: null,
        Solucion: sol,
      };
      this.detallesTicket.push(det);
    } else {
      det.Diagnostico = diag;
      det.Solucion = sol;
    }

    const fecha = nowIso();
    ticket.IdEstadoTicket = estadoResuelto.IdEstadoTicket;
    ticket.Fechaesolucion = fecha;

    this.seguimientos.push({
      IdSeguimiento: this.nextId(this.seguimientos, 'IdSeguimiento'),
      IdTicket: ticket.IdTicket,
      IdUsuario: Number(input.idUsuario),
      Titulo: 'Solución registrada por técnico',
      Descripcion:
        'El técnico documentó el diagnóstico y la solución. Pendiente de confirmación del usuario.',
      FechaAccion: fecha,
    });

    this.auditorias.push({
      IdAuditoria: this.nextId(this.auditorias, 'IdAuditoria'),
      IdTicket: ticket.IdTicket,
      IdUsuario: Number(input.idUsuario),
      Accion: 'Resolución de ticket',
      Descripcion:
        'El técnico marcó el ticket como Resuelto con diagnóstico y solución; en espera de confirmación del usuario.',
      FechaAccion: fecha,
    });
  }

  confirmarCompletado(input: { idTicket: number; idUsuario: number }) {
    const ticket = this.tickets.find((t) => t.IdTicket === Number(input.idTicket));
    if (!ticket) throw new DomainError('El ticket no existe.', 404);

    const user = this.usuarios.find((u) => u.IdUsuario === Number(input.idUsuario));
    if (!user) throw new DomainError('El usuario no existe.', 404);

    const rol = this.roles.find((r) => r.IdRol === user.IdRol);
    const isAdmin = rol?.NombreRol === 'Administrador';
    if (ticket.IdUsuario !== user.IdUsuario && !isAdmin) {
      throw new DomainError(
        'Solo el usuario solicitante o un administrador puede confirmar el cierre del ticket.',
        403
      );
    }

    const estadoActual = this.estadosTicket.find((e) => e.IdEstadoTicket === ticket.IdEstadoTicket);
    if (!estadoActual || estadoActual.NombreEstado !== 'Resuelto') {
      throw new DomainError('El ticket debe estar en estado Resuelto para confirmarlo como completado.');
    }

    const estadoCompletado = this.estadosTicket.find((e) => e.NombreEstado === 'Completado');
    if (!estadoCompletado) throw new DomainError('No existe el estado Completado.');

    const fecha = nowIso();
    ticket.IdEstadoTicket = estadoCompletado.IdEstadoTicket;
    ticket.Fechaesolucion = ticket.Fechaesolucion ?? fecha;

    this.seguimientos.push({
      IdSeguimiento: this.nextId(this.seguimientos, 'IdSeguimiento'),
      IdTicket: ticket.IdTicket,
      IdUsuario: user.IdUsuario,
      Titulo: 'Completado por usuario',
      Descripcion: 'El usuario verificó la solución y confirmó que el ticket quedó completado.',
      FechaAccion: fecha,
    });

    this.auditorias.push({
      IdAuditoria: this.nextId(this.auditorias, 'IdAuditoria'),
      IdTicket: ticket.IdTicket,
      IdUsuario: user.IdUsuario,
      Accion: 'Cierre confirmado',
      Descripcion: 'El usuario confirmó que la solicitud quedó completada.',
      FechaAccion: fecha,
    });
  }

  reabrirTicket(input: { idTicket: number; idUsuario: number; motivo: string }) {
    const motivo = input.motivo?.trim();
    if (!motivo) throw new DomainError('Indica el motivo por el cual el problema continúa.');

    const ticket = this.tickets.find((t) => t.IdTicket === Number(input.idTicket));
    if (!ticket) throw new DomainError('El ticket no existe.', 404);

    const user = this.usuarios.find((u) => u.IdUsuario === Number(input.idUsuario));
    if (!user) throw new DomainError('El usuario no existe.', 404);

    const rol = this.roles.find((r) => r.IdRol === user.IdRol);
    const isAdmin = rol?.NombreRol === 'Administrador';
    if (ticket.IdUsuario !== user.IdUsuario && !isAdmin) {
      throw new DomainError(
        'Solo el usuario solicitante o un administrador puede reabrir el ticket.',
        403
      );
    }

    const estadoActual = this.estadosTicket.find((e) => e.IdEstadoTicket === ticket.IdEstadoTicket);
    if (!estadoActual || estadoActual.NombreEstado !== 'Resuelto') {
      throw new DomainError('Solo se pueden reabrir tickets en estado Resuelto.');
    }

    const estadoEnProceso = this.estadosTicket.find((e) => e.NombreEstado === 'En Proceso');
    if (!estadoEnProceso) throw new DomainError('No existe el estado En Proceso.');

    const fecha = nowIso();
    ticket.IdEstadoTicket = estadoEnProceso.IdEstadoTicket;
    ticket.Fechaesolucion = null;

    let det = this.detallesTicket.find((d) => d.IdTicket === ticket.IdTicket);
    const nota = `Reabierto por usuario: ${motivo}`;
    if (!det) {
      det = {
        IdDetalleTicket: this.nextId(this.detallesTicket, 'IdDetalleTicket'),
        IdTicket: ticket.IdTicket,
        Diagnostico: null,
        Observaciones: nota,
        Solucion: null,
      };
      this.detallesTicket.push(det);
    } else {
      det.Observaciones = det.Observaciones ? `${det.Observaciones}\n• ${nota}` : nota;
    }

    this.seguimientos.push({
      IdSeguimiento: this.nextId(this.seguimientos, 'IdSeguimiento'),
      IdTicket: ticket.IdTicket,
      IdUsuario: user.IdUsuario,
      Titulo: 'Caso reabierto por usuario',
      Descripcion: motivo,
      FechaAccion: fecha,
    });

    this.auditorias.push({
      IdAuditoria: this.nextId(this.auditorias, 'IdAuditoria'),
      IdTicket: ticket.IdTicket,
      IdUsuario: user.IdUsuario,
      Accion: 'Reapertura de ticket',
      Descripcion: motivo,
      FechaAccion: fecha,
    });
  }

  // --- Catálogos CRUD ---
  listarUsuarios() {
    return this.usuarios.map((u) => ({
      idUsuario: u.IdUsuario,
      nombre: u.Nombre,
      apellido: u.Apellido,
      correo: u.Correo,
      idRol: u.IdRol,
      rol: this.roles.find((r) => r.IdRol === u.IdRol)?.NombreRol ?? 'Sin rol',
      idEstado: u.IdEstado,
      estado: this.estadoNombre(u.IdEstado),
      fotoUrl: u.FotoUrl ?? null,
    }));
  }

  nuevoUsuario(input: {
    nombre: string;
    apellido: string;
    correo: string;
    contrasena: string;
    idRol: number;
    fotoUrl?: string | null;
    asignarPuesto?: boolean;
    idPuesto?: number | null;
    idUsuarioAccion?: number;
  }) {
    if (!input.nombre?.trim() || !input.apellido?.trim() || !input.correo?.trim() || !input.contrasena?.trim()) {
      throw new DomainError('Todos los campos del usuario son obligatorios.');
    }
    if (this.usuarios.some((u) => u.Correo.toLowerCase() === input.correo.trim().toLowerCase())) {
      throw new DomainError('El correo ya está registrado.');
    }
    const rol = this.roles.find((r) => r.IdRol === Number(input.idRol));
    if (!rol) {
      throw new DomainError('El rol seleccionado no existe.');
    }
    const id = this.nextId(this.usuarios, 'IdUsuario');
    this.usuarios.push({
      IdUsuario: id,
      Nombre: input.nombre.trim(),
      Apellido: input.apellido.trim(),
      Correo: input.correo.trim(),
      Contrasena: input.contrasena,
      IdRol: Number(input.idRol),
      IdEstado: 1,
      FotoUrl: input.fotoUrl ?? null,
    });

    let idPuestoAsignado: number | null = null;
    if (input.idPuesto) {
      this.asignarPuesto({
        idPuesto: Number(input.idPuesto),
        idUsuario: id,
        motivo: 'Asignación al crear usuario nuevo',
        idUsuarioAccion: input.idUsuarioAccion ?? 1,
      });
      idPuestoAsignado = Number(input.idPuesto);
    } else if (input.asignarPuesto !== false) {
      const targetZona: ZonaPuesto =
        rol.NombreRol === 'Tecnico'
          ? 'Soporte TI'
          : rol.NombreRol === 'Administrador'
            ? 'Administración'
            : 'Operaciones';
      const freeDesk =
        this.puestos.find(
          (p) => p.IdEstado === 1 && p.IdUsuarioActual === null && p.Zona === targetZona
        ) ??
        this.puestos.find((p) => p.IdEstado === 1 && p.IdUsuarioActual === null);

      if (freeDesk) {
        this.asignarPuesto({
          idPuesto: freeDesk.IdPuesto,
          idUsuario: id,
          motivo: 'Asignación automática de puesto disponible',
          idUsuarioAccion: input.idUsuarioAccion ?? 1,
        });
        idPuestoAsignado = freeDesk.IdPuesto;
      } else {
        const created = this.nuevoPuesto({
          nombrePuesto:
            targetZona === 'Soporte TI'
              ? `Estación Soporte ${input.nombre.trim()}`
              : targetZona === 'Administración'
                ? `Estación Admin ${input.nombre.trim()}`
                : `Módulo ${input.nombre.trim()}`,
          zona: targetZona,
          idUsuarioActual: id,
          idUsuarioAccion: input.idUsuarioAccion ?? 1,
          motivo: 'Puesto creado automáticamente para nuevo colaborador',
        });
        idPuestoAsignado = created.idPuesto;
      }
    }

    return { idUsuario: id, idPuesto: idPuestoAsignado };
  }

  editarUsuario(
    id: number,
    input: {
      nombre: string;
      apellido: string;
      correo: string;
      contrasena?: string;
      idRol: number;
      idEstado: number;
      fotoUrl?: string | null;
    }
  ) {
    const user = this.usuarios.find((u) => u.IdUsuario === id);
    if (!user) throw new DomainError('El usuario no existe.', 404);
    if (!input.nombre?.trim() || !input.apellido?.trim() || !input.correo?.trim()) {
      throw new DomainError('Nombre, apellido y correo son obligatorios.');
    }
    if (this.usuarios.some((u) => u.Correo.toLowerCase() === input.correo.trim().toLowerCase() && u.IdUsuario !== id)) {
      throw new DomainError('El correo ya está registrado por otro usuario.');
    }
    user.Nombre = input.nombre.trim();
    user.Apellido = input.apellido.trim();
    user.Correo = input.correo.trim();
    if (input.contrasena?.trim()) user.Contrasena = input.contrasena;
    user.IdRol = Number(input.idRol);
    user.IdEstado = Number(input.idEstado);
    if (input.fotoUrl !== undefined) user.FotoUrl = input.fotoUrl;
  }

  actualizarFotoUsuario(id: number, fotoUrl: string | null) {
    const user = this.usuarios.find((u) => u.IdUsuario === id);
    if (!user) throw new DomainError('El usuario no existe.', 404);
    user.FotoUrl = fotoUrl;
  }

  eliminarUsuario(id: number) {
    const user = this.usuarios.find((u) => u.IdUsuario === id);
    if (!user) throw new DomainError('El usuario no existe.', 404);
    user.IdEstado = 2;
    const fecha = nowIso();
    for (const p of this.puestos) {
      if (p.IdUsuarioActual === id) {
        p.IdUsuarioActual = null;
        p.FechaAsignacion = null;
      }
    }
    for (const h of this.historialPuestos) {
      if (h.IdUsuario === id && h.FechaFin === null) {
        h.FechaFin = fecha;
      }
    }
  }

  listarTecnicos() {
    return this.tecnicos.map((t) => {
      const u = this.usuarios.find((x) => x.IdUsuario === t.IdUsuario);
      return {
        idTecnico: t.IdTecnico,
        especialidad: t.Especialidad,
        correo: t.Correo,
        idUsuario: t.IdUsuario,
        nombre: u?.Nombre ?? '',
        apellido: u?.Apellido ?? '',
        usuario: u ? `${u.Nombre} ${u.Apellido}` : '',
        idEstado: t.IdEstado,
        estado: this.estadoNombre(t.IdEstado),
        fotoUrl: u?.FotoUrl ?? null,
      };
    });
  }

  nuevoTecnico(input: { especialidad: string; correo: string; idUsuario: number }) {
    if (!input.correo?.trim()) throw new DomainError('El correo del técnico es obligatorio.');
    if (this.tecnicos.some((t) => t.Correo.toLowerCase() === input.correo.trim().toLowerCase())) {
      throw new DomainError('El correo del técnico ya existe.');
    }
    if (!this.usuarios.some((u) => u.IdUsuario === Number(input.idUsuario))) {
      throw new DomainError('El usuario seleccionado no existe.');
    }
    if (this.tecnicos.some((t) => t.IdUsuario === Number(input.idUsuario))) {
      throw new DomainError('Este usuario ya está registrado como técnico.');
    }
    const id = this.nextId(this.tecnicos, 'IdTecnico');
    this.tecnicos.push({
      IdTecnico: id,
      Especialidad: input.especialidad?.trim() || 'Soporte General',
      Correo: input.correo.trim(),
      IdUsuario: Number(input.idUsuario),
      IdEstado: 1,
    });
    return { idTecnico: id };
  }

  editarTecnico(id: number, input: { especialidad: string; correo: string; idUsuario: number; idEstado: number }) {
    const tech = this.tecnicos.find((t) => t.IdTecnico === id);
    if (!tech) throw new DomainError('El técnico no existe.', 404);
    if (!input.correo?.trim()) throw new DomainError('El correo es obligatorio.');
    if (this.tecnicos.some((t) => t.Correo.toLowerCase() === input.correo.trim().toLowerCase() && t.IdTecnico !== id)) {
      throw new DomainError('El correo ya está registrado.');
    }
    if (!this.usuarios.some((u) => u.IdUsuario === Number(input.idUsuario) && u.IdEstado === 1)) {
      throw new DomainError('El usuario no existe o está inactivo.');
    }
    if (this.tecnicos.some((t) => t.IdUsuario === Number(input.idUsuario) && t.IdTecnico !== id)) {
      throw new DomainError('El usuario ya está registrado como técnico.');
    }
    tech.Especialidad = input.especialidad?.trim() || 'Soporte General';
    tech.Correo = input.correo.trim();
    tech.IdUsuario = Number(input.idUsuario);
    tech.IdEstado = Number(input.idEstado);
  }

  eliminarTecnico(id: number) {
    const tech = this.tecnicos.find((t) => t.IdTecnico === id);
    if (!tech) throw new DomainError('El técnico no existe.', 404);
    tech.IdEstado = 2;
  }

  listarCategorias() {
    return this.categorias.map((c) => ({
      idCategoria: c.IdCategoria,
      nombreCategoria: c.NombreCategoria,
      icono: c.Icono ?? null,
      descripcion: c.Descripcion ?? null,
      idEstado: c.IdEstado,
      estado: this.estadoNombre(c.IdEstado),
    }));
  }

  nuevaCategoria(input: { nombreCategoria: string; icono?: string | null; descripcion?: string | null }) {
    const nombre = input.nombreCategoria?.trim();
    if (!nombre) throw new DomainError('El nombre de la categoría es obligatorio.');
    if (this.categorias.some((c) => c.NombreCategoria.toLowerCase() === nombre.toLowerCase())) {
      throw new DomainError('La categoría ya existe.');
    }
    const id = this.nextId(this.categorias, 'IdCategoria');
    this.categorias.push({
      IdCategoria: id,
      NombreCategoria: nombre,
      Icono: input.icono?.trim() || 'sparkles',
      Descripcion: input.descripcion?.trim() || null,
      IdEstado: 1,
    });
    return { idCategoria: id };
  }

  editarCategoria(
    id: number,
    input: { nombreCategoria: string; icono?: string | null; descripcion?: string | null; idEstado: number }
  ) {
    const cat = this.categorias.find((c) => c.IdCategoria === id);
    if (!cat) throw new DomainError('La categoría no existe.', 404);
    if (!input.nombreCategoria?.trim()) throw new DomainError('El nombre de la categoría es obligatorio.');
    cat.NombreCategoria = input.nombreCategoria.trim();
    if (input.icono !== undefined) cat.Icono = input.icono?.trim() || null;
    if (input.descripcion !== undefined) cat.Descripcion = input.descripcion?.trim() || null;
    cat.IdEstado = Number(input.idEstado);
  }

  eliminarCategoria(id: number) {
    const cat = this.categorias.find((c) => c.IdCategoria === id);
    if (!cat) throw new DomainError('La categoría no existe.', 404);
    cat.IdEstado = 2;
  }

  listarPrioridades() {
    return this.prioridades.map((p) => ({
      idPrioridad: p.IdPrioridad,
      nombrePrioridad: p.NombrePrioridad,
      idEstado: p.IdEstado,
      estado: this.estadoNombre(p.IdEstado),
    }));
  }

  nuevaPrioridad(input: { nombrePrioridad: string }) {
    const nombre = input.nombrePrioridad?.trim();
    if (!nombre) throw new DomainError('El nombre de la prioridad es obligatorio.');
    if (this.prioridades.some((p) => p.NombrePrioridad.toLowerCase() === nombre.toLowerCase())) {
      throw new DomainError('La prioridad ya existe.');
    }
    const id = this.nextId(this.prioridades, 'IdPrioridad');
    this.prioridades.push({ IdPrioridad: id, NombrePrioridad: nombre, IdEstado: 1 });
    return { idPrioridad: id };
  }

  editarPrioridad(id: number, input: { nombrePrioridad: string; idEstado: number }) {
    const item = this.prioridades.find((p) => p.IdPrioridad === id);
    if (!item) throw new DomainError('La prioridad no existe.', 404);
    if (!input.nombrePrioridad?.trim()) throw new DomainError('El nombre de la prioridad es obligatorio.');
    item.NombrePrioridad = input.nombrePrioridad.trim();
    item.IdEstado = Number(input.idEstado);
  }

  eliminarPrioridad(id: number) {
    const item = this.prioridades.find((p) => p.IdPrioridad === id);
    if (!item) throw new DomainError('La prioridad no existe.', 404);
    item.IdEstado = 2;
  }

  listarEstadosTicket() {
    return this.estadosTicket.map((e) => ({
      idEstadoTicket: e.IdEstadoTicket,
      nombreEstado: e.NombreEstado,
      idEstado: e.IdEstado,
      estado: this.estadoNombre(e.IdEstado),
    }));
  }

  nuevoEstadoTicket(input: { nombreEstado: string }) {
    const nombre = input.nombreEstado?.trim();
    if (!nombre) throw new DomainError('El nombre del estado es obligatorio.');
    if (this.estadosTicket.some((e) => e.NombreEstado.toLowerCase() === nombre.toLowerCase())) {
      throw new DomainError('El estado de ticket ya existe.');
    }
    const id = this.nextId(this.estadosTicket, 'IdEstadoTicket');
    this.estadosTicket.push({ IdEstadoTicket: id, NombreEstado: nombre, IdEstado: 1 });
    return { idEstadoTicket: id };
  }

  editarEstadoTicket(id: number, input: { nombreEstado: string; idEstado: number }) {
    const item = this.estadosTicket.find((e) => e.IdEstadoTicket === id);
    if (!item) throw new DomainError('El estado del ticket no existe.', 404);
    if (!input.nombreEstado?.trim()) throw new DomainError('El nombre del estado es obligatorio.');
    item.NombreEstado = input.nombreEstado.trim();
    item.IdEstado = Number(input.idEstado);
  }

  eliminarEstadoTicket(id: number) {
    const item = this.estadosTicket.find((e) => e.IdEstadoTicket === id);
    if (!item) throw new DomainError('El estado del ticket no existe.', 404);
    item.IdEstado = 2;
  }

  listarRoles() {
    return this.roles.map((r) => ({
      idRol: r.IdRol,
      nombreRol: r.NombreRol,
      descripcion: r.Descripcion ?? null,
      permisos: r.Permisos ?? [],
      idEstado: r.IdEstado,
      estado: this.estadoNombre(r.IdEstado),
    }));
  }

  nuevoRol(input: { nombreRol: string; descripcion?: string | null; permisos?: string[] }) {
    const nombre = input.nombreRol?.trim();
    if (!nombre) throw new DomainError('El nombre del rol es obligatorio.');
    if (this.roles.some((r) => r.NombreRol.toLowerCase() === nombre.toLowerCase())) {
      throw new DomainError('El rol ya existe.');
    }
    const id = this.nextId(this.roles, 'IdRol');
    this.roles.push({
      IdRol: id,
      NombreRol: nombre,
      Descripcion: input.descripcion?.trim() || null,
      Permisos: input.permisos ?? [],
      IdEstado: 1,
    });
    return { idRol: id };
  }

  editarRol(
    id: number,
    input: { nombreRol: string; descripcion?: string | null; permisos?: string[]; idEstado: number }
  ) {
    const item = this.roles.find((r) => r.IdRol === id);
    if (!item) throw new DomainError('El rol no existe.', 404);
    if (!input.nombreRol?.trim()) throw new DomainError('El nombre del rol es obligatorio.');
    item.NombreRol = input.nombreRol.trim();
    if (input.descripcion !== undefined) item.Descripcion = input.descripcion?.trim() || null;
    if (input.permisos !== undefined) item.Permisos = input.permisos;
    item.IdEstado = Number(input.idEstado);
  }

  eliminarRol(id: number) {
    const item = this.roles.find((r) => r.IdRol === id);
    if (!item) throw new DomainError('El rol no existe.', 404);
    item.IdEstado = 2;
  }

  listarEstados() {
    return this.estados.map((e) => ({
      idEstado: e.IdEstado,
      nombreEstado: e.NombreEstado,
    }));
  }

  // --- Puestos de Trabajo & Historial ---
  private generarCodigoPuesto(zona: ZonaPuesto): string {
    const prefix = zona === 'Soporte TI' ? 'TI' : zona === 'Administración' ? 'ADM' : 'COL';
    const count = this.puestos.filter((p) => p.CodigoPuesto.startsWith(`${prefix}-`)).length + 1;
    let candidate = `${prefix}-${String(count).padStart(2, '0')}`;
    let idx = count;
    while (this.puestos.some((p) => p.CodigoPuesto.toLowerCase() === candidate.toLowerCase())) {
      idx += 1;
      candidate = `${prefix}-${String(idx).padStart(2, '0')}`;
    }
    return candidate;
  }

  listarPuestos() {
    return this.puestos.map((p) => {
      const occ = p.IdUsuarioActual
        ? this.usuarios.find((u) => u.IdUsuario === p.IdUsuarioActual)
        : null;
      const rol = occ ? this.roles.find((r) => r.IdRol === occ.IdRol)?.NombreRol ?? 'Usuario' : null;
      return {
        idPuesto: p.IdPuesto,
        codigoPuesto: p.CodigoPuesto,
        nombrePuesto: p.NombrePuesto,
        zona: p.Zona,
        idUsuarioActual: occ ? occ.IdUsuario : null,
        ocupanteNombre: occ ? `${occ.Nombre} ${occ.Apellido}` : null,
        ocupanteRol: rol,
        ocupanteCorreo: occ ? occ.Correo : null,
        ocupanteFotoUrl: occ?.FotoUrl ?? null,
        fechaAsignacion: p.FechaAsignacion,
        idEstado: p.IdEstado,
        estado: this.estadoNombre(p.IdEstado),
      };
    });
  }

  listarHistorialPuesto(idPuesto?: number) {
    return [...this.historialPuestos]
      .filter((h) => (idPuesto ? h.IdPuesto === idPuesto : true))
      .sort(
        (a, b) =>
          new Date(b.FechaInicio).getTime() - new Date(a.FechaInicio).getTime() ||
          b.IdHistorial - a.IdHistorial
      )
      .map((h) => {
        const p = this.puestos.find((x) => x.IdPuesto === h.IdPuesto);
        const u = this.usuarios.find((x) => x.IdUsuario === h.IdUsuario);
        const r = u ? this.roles.find((rl) => rl.IdRol === u.IdRol)?.NombreRol ?? 'Usuario' : 'Usuario';
        return {
          idHistorial: h.IdHistorial,
          idPuesto: h.IdPuesto,
          codigoPuesto: p?.CodigoPuesto ?? `PST-${h.IdPuesto}`,
          nombrePuesto: p?.NombrePuesto ?? 'Puesto',
          idUsuario: h.IdUsuario,
          nombreUsuario: u ? `${u.Nombre} ${u.Apellido}` : 'Usuario',
          rolUsuario: r,
          fotoUrl: u?.FotoUrl ?? null,
          accion: h.Accion,
          motivo: h.Motivo,
          fechaInicio: h.FechaInicio,
          fechaFin: h.FechaFin,
          realizadoPor: this.userName(h.IdUsuarioAccion),
        };
      });
  }

  nuevoPuesto(input: {
    codigoPuesto?: string;
    nombrePuesto: string;
    zona: ZonaPuesto;
    idUsuarioActual?: number | null;
    idUsuarioAccion?: number;
    motivo?: string;
  }) {
    const nombre = input.nombrePuesto?.trim();
    if (!nombre) throw new DomainError('El nombre del puesto es obligatorio.');
    const zona: ZonaPuesto =
      input.zona === 'Soporte TI' || input.zona === 'Administración' || input.zona === 'Operaciones'
        ? input.zona
        : 'Operaciones';
    const codigo = input.codigoPuesto?.trim().toUpperCase() || this.generarCodigoPuesto(zona);
    if (this.puestos.some((p) => p.CodigoPuesto.toLowerCase() === codigo.toLowerCase())) {
      throw new DomainError(`Ya existe un puesto con el código ${codigo}.`);
    }

    const idPuesto = this.nextId(this.puestos, 'IdPuesto');
    this.puestos.push({
      IdPuesto: idPuesto,
      CodigoPuesto: codigo,
      NombrePuesto: nombre,
      Zona: zona,
      IdUsuarioActual: null,
      FechaAsignacion: null,
      IdEstado: 1,
    });

    if (input.idUsuarioActual) {
      this.asignarPuesto({
        idPuesto,
        idUsuario: Number(input.idUsuarioActual),
        motivo: input.motivo?.trim() || 'Asignación en nuevo puesto creado',
        idUsuarioAccion: input.idUsuarioAccion ?? 1,
      });
    }

    return { idPuesto, codigoPuesto: codigo };
  }

  asignarPuesto(input: {
    idPuesto: number;
    idUsuario: number | null;
    motivo?: string;
    idUsuarioAccion?: number;
    swap?: boolean;
  }) {
    const targetPuesto = this.puestos.find((p) => p.IdPuesto === Number(input.idPuesto));
    if (!targetPuesto) throw new DomainError('El puesto de trabajo no existe.', 404);

    const actorId = Number(input.idUsuarioAccion ?? 1);
    const fecha = nowIso();
    const motivo = input.motivo?.trim() || (input.idUsuario ? 'Cambio de puesto de trabajo' : 'Puesto liberado');

    const prevOccupantId = targetPuesto.IdUsuarioActual;

    // Case 1: Liberar puesto (idUsuario === null)
    if (input.idUsuario === null || input.idUsuario === undefined) {
      if (prevOccupantId !== null) {
        const openHist = this.historialPuestos.find(
          (h) => h.IdPuesto === targetPuesto.IdPuesto && h.IdUsuario === prevOccupantId && h.FechaFin === null
        );
        if (openHist) openHist.FechaFin = fecha;
      }
      targetPuesto.IdUsuarioActual = null;
      targetPuesto.FechaAsignacion = null;
      return;
    }

    const newUser = this.usuarios.find((u) => u.IdUsuario === Number(input.idUsuario) && u.IdEstado === 1);
    if (!newUser) throw new DomainError('El usuario seleccionado no existe o está inactivo.', 404);

    if (prevOccupantId === newUser.IdUsuario) return;

    // Check if newUser currently sits on another desk
    const oldPuesto = this.puestos.find(
      (p) => p.IdUsuarioActual === newUser.IdUsuario && p.IdPuesto !== targetPuesto.IdPuesto
    );

    // Close previous occupant's active history on targetPuesto
    if (prevOccupantId !== null) {
      const targetOpenHist = this.historialPuestos.find(
        (h) => h.IdPuesto === targetPuesto.IdPuesto && h.IdUsuario === prevOccupantId && h.FechaFin === null
      );
      if (targetOpenHist) targetOpenHist.FechaFin = fecha;
    }

    // Close newUser's active history on oldPuesto
    if (oldPuesto) {
      const oldOpenHist = this.historialPuestos.find(
        (h) => h.IdPuesto === oldPuesto.IdPuesto && h.IdUsuario === newUser.IdUsuario && h.FechaFin === null
      );
      if (oldOpenHist) oldOpenHist.FechaFin = fecha;

      if (input.swap && prevOccupantId !== null) {
        // Move previous occupant to oldPuesto
        oldPuesto.IdUsuarioActual = prevOccupantId;
        oldPuesto.FechaAsignacion = fecha;
        this.historialPuestos.push({
          IdHistorial: this.nextId(this.historialPuestos, 'IdHistorial'),
          IdPuesto: oldPuesto.IdPuesto,
          IdUsuario: prevOccupantId,
          Accion: 'Intercambio de puesto',
          Motivo: `${motivo} (intercambio con ${targetPuesto.CodigoPuesto})`,
          FechaInicio: fecha,
          FechaFin: null,
          IdUsuarioAccion: actorId,
        });
      } else {
        oldPuesto.IdUsuarioActual = null;
        oldPuesto.FechaAsignacion = null;
      }
    }

    // Assign newUser to targetPuesto
    targetPuesto.IdUsuarioActual = newUser.IdUsuario;
    targetPuesto.FechaAsignacion = fecha;

    this.historialPuestos.push({
      IdHistorial: this.nextId(this.historialPuestos, 'IdHistorial'),
      IdPuesto: targetPuesto.IdPuesto,
      IdUsuario: newUser.IdUsuario,
      Accion: oldPuesto ? 'Cambio de puesto' : 'Asignación de puesto',
      Motivo: oldPuesto ? `${motivo} (desde ${oldPuesto.CodigoPuesto})` : motivo,
      FechaInicio: fecha,
      FechaFin: null,
      IdUsuarioAccion: actorId,
    });
  }
}

export const store = new GeTicketsStore();
