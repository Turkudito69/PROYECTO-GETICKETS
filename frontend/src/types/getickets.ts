export type RolNombre = 'Administrador' | 'Tecnico' | 'Usuario' | string;

export interface AuthUser {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  idRol: number;
  rol: RolNombre;
  idTecnico: number | null;
  fotoUrl?: string | null;
}

export interface TicketItem {
  idTicket: number;
  codigoTicket: string;
  descripcion: string;
  idUsuario: number;
  solicitante: string;
  idTecnico: number | null;
  tecnico: string | null;
  idCategoria: number;
  categoria: string;
  idPrioridad: number;
  prioridad: string;
  idEstadoTicket: number;
  estadoTicket: string;
  fechaCreacion: string;
  fechaSolucion: string | null;
}

export interface DetalleTicketResponse {
  idTicket: number;
  codigoTicket: string;
  descripcion: string;
  solicitante: string;
  tecnico: string | null;
  categoria: string;
  prioridad: string;
  estadoTicket: string;
  fechaCreacion: string;
  fechaSolucion: string | null;
  diagnostico: string | null;
  observaciones: string | null;
  solucion: string | null;
}

export interface DetalleGeneralItem {
  idDetalleTicket: number;
  idTicket: number;
  ticket: string;
  diagnostico: string | null;
  observaciones: string | null;
  solucion: string | null;
}

export interface SeguimientoItem {
  idSeguimientoTicket: number;
  idTicket: number;
  codigoTicket: string;
  responsable: string;
  titulo: string;
  descripcion: string;
  fechaSeguimiento: string;
}

export interface AuditoriaItem {
  idAuditoria: number;
  idTicket: number;
  ticket: string;
  responsable: string;
  accion: string;
  descripcion: string;
  fechaAccion: string;
}

export interface UsuarioItem {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  idRol: number;
  rol: string;
  idEstado: number;
  estado: string;
  fotoUrl?: string | null;
}

export interface TecnicoItem {
  idTecnico: number;
  especialidad: string;
  correo: string;
  idUsuario: number;
  nombre: string;
  apellido: string;
  usuario: string;
  idEstado: number;
  estado: string;
  fotoUrl?: string | null;
}

export interface CategoriaItem {
  idCategoria: number;
  nombreCategoria: string;
  icono?: string | null;
  descripcion?: string | null;
  idEstado: number;
  estado: string;
}

export interface PrioridadItem {
  idPrioridad: number;
  nombrePrioridad: string;
  idEstado: number;
  estado: string;
}

export interface EstadoTicketItem {
  idEstadoTicket: number;
  nombreEstado: string;
  idEstado: number;
  estado: string;
}

export interface RolItem {
  idRol: number;
  nombreRol: string;
  descripcion?: string | null;
  permisos?: string[];
  idEstado: number;
  estado: string;
}

export interface EstadoItem {
  idEstado: number;
  nombreEstado: string;
}

export type ZonaPuesto = 'Soporte TI' | 'Administración' | 'Operaciones';

export interface PuestoItem {
  idPuesto: number;
  codigoPuesto: string;
  nombrePuesto: string;
  zona: ZonaPuesto;
  idUsuarioActual: number | null;
  ocupanteNombre: string | null;
  ocupanteRol: string | null;
  ocupanteCorreo: string | null;
  ocupanteFotoUrl: string | null;
  fechaAsignacion: string | null;
  idEstado: number;
  estado: string;
}

export interface HistorialPuestoItem {
  idHistorial: number;
  idPuesto: number;
  codigoPuesto: string;
  nombrePuesto: string;
  idUsuario: number;
  nombreUsuario: string;
  rolUsuario: string;
  fotoUrl: string | null;
  accion: string;
  motivo: string;
  fechaInicio: string;
  fechaFin: string | null;
  realizadoPor: string;
}
