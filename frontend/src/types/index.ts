export type UserRole = 'Administrador' | 'Tecnico' | 'Usuario' | string;

export interface AuthUser {
  idUsuario: number;
  idTecnico: number | null;
  idRol?: number;
  correo: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  fotoUrl?: string | null;
}

export interface TicketItem {
  idTicket: number;
  idUsuario: number;
  idTecnico: number | null;
  tickets: string;
  descripcion: string;
  solicitante: string;
  tecnico: string | null;
  categoria: string;
  prioridad: string;
  estadoTicket: string;
  fechaCreacion: string;
}

export interface TicketDetail extends TicketItem {
  codigoTicket?: string;
  fechaSolucion?: string | null;
  solucion?: string | null;
  diagnostico?: string | null;
  observaciones?: string | null;
}

export interface CategoryItem {
  idCategoria: number;
  nombreCategoria: string;
  icono?: string | null;
  descripcion?: string | null;
  idEstado?: number;
  estado: string;
}

export interface PriorityItem {
  idPrioridad: number;
  nombrePrioridad: string;
  idEstado?: number;
  estado: string;
}

export interface TechnicianItem {
  idTecnico: number;
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  especialidad: string;
  idEstado?: number;
  estado: string;
  fotoUrl?: string | null;
}

export interface UserItem {
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

export interface RoleItem {
  idRol: number;
  nombreRol: string;
  descripcion?: string | null;
  permisos?: string[];
  idEstado: number;
  estado: string;
}

export interface TicketStatusItem {
  idEstadoTicket: number;
  nombreEstado: string;
  idEstado: number;
  estado: string;
}

export interface SystemStateItem {
  idEstado: number;
  nombreEstado: string;
}

export type SeatZone = 'Soporte TI' | 'Administración' | 'Operaciones';

export interface SeatItem {
  idPuesto: number;
  codigoPuesto: string;
  nombrePuesto: string;
  zona: SeatZone;
  idUsuarioActual: number | null;
  ocupanteNombre: string | null;
  ocupanteRol: string | null;
  ocupanteCorreo: string | null;
  ocupanteFotoUrl: string | null;
  fechaAsignacion: string | null;
  idEstado: number;
  estado: string;
}

export interface SeatHistoryItem {
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

export interface ActivityItem {
  idSeguimientoTicket: number;
  codigoTicket: string;
  responsable: string;
  titulo: string;
  descripcion: string;
  fechaSeguimiento: string;
}

export interface AuditItem {
  idAuditoria: number;
  idTicket?: number;
  ticket: string;
  responsable: string;
  accion: string;
  descripcion: string;
  fechaAccion: string;
}

