import type {
  ActivityItem,
  AuditItem,
  AuthUser,
  CategoryItem,
  PriorityItem,
  RoleItem,
  SeatHistoryItem,
  SeatItem,
  SeatZone,
  SystemStateItem,
  TechnicianItem,
  TicketStatusItem,
  TicketDetail,
  TicketItem,
  UserItem,
} from '../types';
import { Platform } from 'react-native';

const defaultApiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5116' : 'http://localhost:5116';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || defaultApiUrl).replace(/\/$/, '');
const defaultOffice3dUrl = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000/office3d-embed'
  : 'http://localhost:3000/office3d-embed';
export const OFFICE_3D_URL = (process.env.EXPO_PUBLIC_OFFICE_3D_URL || defaultOffice3dUrl).replace(/\/$/, '');

type ApiErrorBody = { msj?: string; mensaje?: string; error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(`No se pudo conectar con la API en ${API_URL}. Revisa que esté ejecutándose y que la URL corresponda al dispositivo.`);
  }

  if (response.status === 204) return undefined as T;

  const raw = await response.text();
  let data: unknown = raw;
  if (raw) {
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      data = raw;
    }
  }

  if (!response.ok) {
    const body = typeof data === 'object' && data !== null ? (data as ApiErrorBody) : undefined;
    const message = body?.msj || body?.mensaje || body?.error || (typeof data === 'string' && data) || 'Error al procesar la solicitud.';
    throw new Error(message);
  }

  return data as T;
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : value == null ? fallback : String(value);
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function normalizeTicket(value: unknown): TicketItem {
  const item = asRecord(value);
  const codigoTicket = stringValue(item.codigoTicket ?? item.CodigoTicket ?? item.tickets ?? item.Tickets ?? item.ticket ?? item.Ticket);
  return {
    idTicket: numberValue(item.idTicket ?? item.IdTicket),
    idUsuario: numberValue(item.idUsuario ?? item.IdUsuario),
    idTecnico: nullableNumber(item.idTecnico ?? item.IdTecnico),
    idCategoria: numberValue(item.idCategoria ?? item.IdCategoria),
    idPrioridad: numberValue(item.idPrioridad ?? item.IdPrioridad),
    idEstadoTicket: numberValue(item.idEstadoTicket ?? item.IdEstadoTicket),
    codigoTicket,
    fechaSolucion: stringValue(item.fechaSolucion ?? item.FechaSolucion) || null,
    tickets: codigoTicket,
    descripcion: stringValue(item.descripcion ?? item.Descripcion),
    solicitante: stringValue(item.solicitante ?? item.Solicitante),
    tecnico: (item.tecnico ?? item.Tecnico) == null ? null : stringValue(item.tecnico ?? item.Tecnico),
    categoria: stringValue(item.categoria ?? item.Categoria),
    prioridad: stringValue(item.prioridad ?? item.Prioridad),
    estadoTicket: stringValue(item.estadoTicket ?? item.EstadoTicket),
    fechaCreacion: stringValue(item.fechaCreacion ?? item.FechaCreacion ?? item.fehaCreacion ?? item.FehaCreacion),
  };
}

function normalizeUser(value: unknown): UserItem {
  const item = asRecord(value);
  return {
    idUsuario: numberValue(item.idUsuario ?? item.IdUsuario),
    nombre: stringValue(item.nombre ?? item.Nombre),
    apellido: stringValue(item.apellido ?? item.Apellido),
    correo: stringValue(item.correo ?? item.Correo),
    idRol: numberValue(item.idRol ?? item.IdRol),
    rol: stringValue(item.rol ?? item.Rol ?? item.nombreRol ?? item.NombreRol),
    idEstado: numberValue(item.idEstado ?? item.IdEstado),
    estado: stringValue(item.estado ?? item.Estado),
    fotoUrl: (item.fotoUrl ?? item.FotoUrl) == null ? null : stringValue(item.fotoUrl ?? item.FotoUrl),
  };
}

function normalizeRole(value: unknown): RoleItem {
  const item = asRecord(value);
  const rawPermissions = item.permisos ?? item.Permisos;
  let permisos: string[] = [];
  if (Array.isArray(rawPermissions)) permisos = rawPermissions.map((permission) => stringValue(permission)).filter(Boolean);
  else if (typeof rawPermissions === 'string' && rawPermissions.trim()) {
    try {
      const parsed: unknown = JSON.parse(rawPermissions);
      permisos = Array.isArray(parsed) ? parsed.map((permission) => stringValue(permission)).filter(Boolean) : [rawPermissions];
    } catch { permisos = rawPermissions.split(/[,;\n]/).map((permission) => permission.trim()).filter(Boolean); }
  }
  return {
    idRol: numberValue(item.idRol ?? item.IdRol),
    nombreRol: stringValue(item.nombreRol ?? item.NombreRol),
    descripcion: stringValue(item.descripcion ?? item.Descripcion) || null,
    permisos,
    idEstado: numberValue(item.idEstado ?? item.IdEstado),
    estado: stringValue(item.estado ?? item.Estado),
  };
}

function normalizeSeat(value: unknown): SeatItem {
  const item = asRecord(value);
  const zone = stringValue(item.zona ?? item.Zona, 'Operaciones');
  return {
    idPuesto: numberValue(item.idPuesto ?? item.IdPuesto),
    codigoPuesto: stringValue(item.codigoPuesto ?? item.CodigoPuesto),
    nombrePuesto: stringValue(item.nombrePuesto ?? item.NombrePuesto),
    zona: (['Soporte TI', 'Administración', 'Operaciones'].includes(zone) ? zone : 'Operaciones') as SeatZone,
    idUsuarioActual: nullableNumber(item.idUsuarioActual ?? item.IdUsuarioActual),
    ocupanteNombre: (item.ocupanteNombre ?? item.OcupanteNombre) == null ? null : stringValue(item.ocupanteNombre ?? item.OcupanteNombre),
    ocupanteRol: (item.ocupanteRol ?? item.OcupanteRol) == null ? null : stringValue(item.ocupanteRol ?? item.OcupanteRol),
    ocupanteCorreo: (item.ocupanteCorreo ?? item.OcupanteCorreo) == null ? null : stringValue(item.ocupanteCorreo ?? item.OcupanteCorreo),
    ocupanteFotoUrl: (item.ocupanteFotoUrl ?? item.OcupanteFotoUrl) == null ? null : stringValue(item.ocupanteFotoUrl ?? item.OcupanteFotoUrl),
    fechaAsignacion: (item.fechaAsignacion ?? item.FechaAsignacion) == null ? null : stringValue(item.fechaAsignacion ?? item.FechaAsignacion),
    idEstado: numberValue(item.idEstado ?? item.IdEstado),
    estado: stringValue(item.estado ?? item.Estado),
  };
}

export const api = {
  async login(correo: string, contrasena: string): Promise<AuthUser> {
    const result = await request<{ usuario?: unknown }>('/api/Login', {
      method: 'POST',
      body: JSON.stringify({ correo, contrasena }),
    });
    const user = asRecord(result?.usuario);
    const idUsuario = numberValue(user.idUsuario ?? user.IdUsuario);
    if (!idUsuario) {
      throw new Error('La API aceptó el inicio de sesión, pero no devolvió el perfil del usuario. Aplica el parche SQL y de C# incluido en frontend/sql.');
    }
    return {
      idUsuario,
      idTecnico: nullableNumber(user.idTecnico ?? user.IdTecnico),
      idRol: numberValue(user.idRol ?? user.IdRol),
      correo: stringValue(user.correo ?? user.Correo, correo),
      nombre: stringValue(user.nombre ?? user.Nombre, 'Usuario'),
      apellido: stringValue(user.apellido ?? user.Apellido),
      rol: stringValue(user.rol ?? user.Rol, 'Usuario'),
      fotoUrl: (user.fotoUrl ?? user.FotoUrl) == null ? null : stringValue(user.fotoUrl ?? user.FotoUrl),
    };
  },

  async getTickets(): Promise<TicketItem[]> {
    const data = await request<unknown[]>('/api/Ticket');
    return Array.isArray(data) ? data.map(normalizeTicket) : [];
  },

  async getTicketDetail(id: number): Promise<TicketDetail | null> {
    const data = await request<unknown>(`/api/DetalleTicket/${id}`);
    const first = Array.isArray(data) ? data[0] : data;
    if (!first) return null;
    const item = asRecord(first);
    return {
      ...normalizeTicket(item),
      codigoTicket: stringValue(item.codigoTicket ?? item.CodigoTicket ?? item.tickets ?? item.Ticket),
      tickets: stringValue(item.codigoTicket ?? item.CodigoTicket ?? item.tickets ?? item.Ticket),
      fechaSolucion: stringValue(item.fechaSolucion ?? item.FechaSolucion) || null,
    };
  },

  async getSeguimiento(id: number): Promise<ActivityItem[]> {
    const data = await request<unknown[]>(`/api/SeguimientoTicket/${id}`);
    return Array.isArray(data)
      ? data.map((value) => {
          const item = asRecord(value);
          return {
            idSeguimientoTicket: numberValue(item.idSeguimientoTicket ?? item.IdSeguimientoTicket),
            codigoTicket: stringValue(item.codigoTicket ?? item.CodigoTicket),
            responsable: stringValue(item.responsable ?? item.Responsable),
            titulo: stringValue(item.titulo ?? item.Titulo),
            descripcion: stringValue(item.descripcion ?? item.Descripcion ?? item.descripsion ?? item.Descripsion),
            fechaSeguimiento: stringValue(item.fechaSeguimiento ?? item.FechaSeguimiento),
          };
        })
      : [];
  },

  async getCategorias(): Promise<CategoryItem[]> {
    const data = await request<unknown[]>('/api/Categoria');
    return Array.isArray(data)
      ? data.map((value) => {
          const item = asRecord(value);
          return {
            idCategoria: numberValue(item.idCategoria ?? item.IdCategoria),
            nombreCategoria: stringValue(item.nombreCategoria ?? item.NombreCategoria ?? item.nombre ?? item.Nombre ?? item.nombrecat ?? item.Nombrecat),
            icono: stringValue(item.icono ?? item.Icono) || null,
            descripcion: stringValue(item.descripcion ?? item.Descripcion) || null,
            idEstado: numberValue(item.idEstado ?? item.IdEstado),
            estado: stringValue(item.estado ?? item.Estado),
          };
        })
      : [];
  },

  async getPrioridades(): Promise<PriorityItem[]> {
    const data = await request<unknown[]>('/api/Prioridad');
    return Array.isArray(data)
      ? data.map((value) => {
          const item = asRecord(value);
          return {
            idPrioridad: numberValue(item.idPrioridad ?? item.IdPrioridad),
            nombrePrioridad: stringValue(item.nombrePrioridad ?? item.NombrePrioridad),
            idEstado: numberValue(item.idEstado ?? item.IdEstado),
            estado: stringValue(item.estado ?? item.Estado),
          };
        })
      : [];
  },

  async getTecnicos(): Promise<TechnicianItem[]> {
    const data = await request<unknown[]>('/api/Tecnico');
    return Array.isArray(data)
      ? data.map((value) => {
          const item = asRecord(value);
          return {
            idTecnico: numberValue(item.idTecnico ?? item.IdTecnico),
            idUsuario: numberValue(item.idUsuario ?? item.IdUsuario),
            nombre: stringValue(item.nombre ?? item.Nombre),
            apellido: stringValue(item.apellido ?? item.Apellido),
            correo: stringValue(item.correo ?? item.Correo),
            especialidad: stringValue(item.especialidad ?? item.Especialidad),
            idEstado: numberValue(item.idEstado ?? item.IdEstado),
            estado: stringValue(item.estado ?? item.Estado),
            fotoUrl: (item.fotoUrl ?? item.FotoUrl) == null ? null : stringValue(item.fotoUrl ?? item.FotoUrl),
          };
        })
      : [];
  },

  async getAuditoria(): Promise<AuditItem[]> {
    const data = await request<unknown[]>('/api/Auditoria');
    return Array.isArray(data)
      ? data.map((value) => {
          const item = asRecord(value);
          return {
            idAuditoria: numberValue(item.idAuditoria ?? item.IdAuditoria),
            idTicket: numberValue(item.idTicket ?? item.IdTicket),
            ticket: stringValue(item.ticket ?? item.Ticket),
            responsable: stringValue(item.responsable ?? item.Responsable),
            accion: stringValue(item.accion ?? item.Accion),
            descripcion: stringValue(item.descripcion ?? item.Descripcion),
            fechaAccion: stringValue(item.fechaAccion ?? item.FechaAccion),
          };
        })
      : [];
  },

  async getUsuarios(): Promise<UserItem[]> {
    const data = await request<unknown[]>('/api/Usuario');
    return Array.isArray(data) ? data.map(normalizeUser) : [];
  },

  async getRoles(): Promise<RoleItem[]> {
    const data = await request<unknown[]>('/api/Rol');
    return Array.isArray(data) ? data.map(normalizeRole) : [];
  },

  async getEstadosTicket(): Promise<TicketStatusItem[]> {
    const data = await request<unknown[]>('/api/EstadoTicket');
    return Array.isArray(data) ? data.map((value) => {
      const item = asRecord(value);
      return { idEstadoTicket: numberValue(item.idEstadoTicket ?? item.IdEstadoTicket), nombreEstado: stringValue(item.nombreEstado ?? item.NombreEstado), idEstado: numberValue(item.idEstado ?? item.IdEstado), estado: stringValue(item.estado ?? item.Estado) };
    }) : [];
  },

  async getEstados(): Promise<SystemStateItem[]> {
    const data = await request<unknown[]>('/api/Estado');
    return Array.isArray(data) ? data.map((value) => {
      const item = asRecord(value);
      return { idEstado: numberValue(item.idEstado ?? item.IdEstado), nombreEstado: stringValue(item.nombreEstado ?? item.NombreEstado) };
    }) : [];
  },

  async getPuestos(): Promise<SeatItem[]> {
    const data = await request<unknown[]>('/api/Puesto');
    return Array.isArray(data) ? data.map(normalizeSeat) : [];
  },

  async getHistorialPuestos(idPuesto?: number): Promise<SeatHistoryItem[]> {
    const data = await request<unknown[]>(idPuesto ? `/api/Puesto/Historial/${idPuesto}` : '/api/Puesto/Historial');
    return Array.isArray(data) ? data.map((value) => {
      const item = asRecord(value);
      return {
        idHistorial: numberValue(item.idHistorial ?? item.IdHistorial), idPuesto: numberValue(item.idPuesto ?? item.IdPuesto),
        codigoPuesto: stringValue(item.codigoPuesto ?? item.CodigoPuesto), nombrePuesto: stringValue(item.nombrePuesto ?? item.NombrePuesto),
        idUsuario: numberValue(item.idUsuario ?? item.IdUsuario), nombreUsuario: stringValue(item.nombreUsuario ?? item.NombreUsuario),
        rolUsuario: stringValue(item.rolUsuario ?? item.RolUsuario), fotoUrl: stringValue(item.fotoUrl ?? item.FotoUrl) || null,
        accion: stringValue(item.accion ?? item.Accion), motivo: stringValue(item.motivo ?? item.Motivo),
        fechaInicio: stringValue(item.fechaInicio ?? item.FechaInicio), fechaFin: stringValue(item.fechaFin ?? item.FechaFin) || null,
        realizadoPor: stringValue(item.realizadoPor ?? item.RealizadoPor),
      };
    }) : [];
  },

  createTicket: (payload: { descripcion: string; idUsuario: number; idCategoria: number; idPrioridad: number }) =>
    request<{ mensaje: string; idTicket: number; codigoTicket: string }>('/api/Ticket/Insertar%20ticket', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  assignTicket: (payload: { idTicket: number; idTecnico: number; idUsuario: number }) =>
    request<void>('/api/Ticket/Asignar', { method: 'PUT', body: JSON.stringify(payload) }),

  startAttention: (payload: { idTicket: number; idUsuario: number }) =>
    request<void>('/api/Ticket/IniciarAtencion', { method: 'PUT', body: JSON.stringify(payload) }),

  addObservation: (payload: { idTicket: number; idUsuario: number; observacion: string }) =>
    request<void>('/api/Ticket/GuardarObservacion', { method: 'PUT', body: JSON.stringify(payload) }),

  finishTicket: (payload: { idTicket: number; idUsuario: number; diagnostico: string; solucion: string }) =>
    request<void>('/api/Ticket/Finalizar', { method: 'PUT', body: JSON.stringify(payload) }),

  confirmComplete: (payload: { idTicket: number; idUsuario: number }) =>
    request<void>('/api/Ticket/ConfirmarCompletado', { method: 'PUT', body: JSON.stringify(payload) }),

  reopenTicket: (payload: { idTicket: number; idUsuario: number; motivo: string }) =>
    request<void>('/api/Ticket/Reabrir', { method: 'PUT', body: JSON.stringify(payload) }),

  createUsuario: (payload: { nombre: string; apellido: string; correo: string; contrasena: string; idRol: number; fotoUrl?: string | null; asignarPuesto?: boolean; idPuesto?: number | null; idUsuarioAccion?: number }) =>
    request<{ mensaje: string; idUsuario: number; idPuesto: number | null }>('/api/Usuario', { method: 'POST', body: JSON.stringify(payload) }),

  updateUsuario: (id: number, payload: { nombre: string; apellido: string; correo: string; contrasena?: string; idRol: number; idEstado: number; fotoUrl?: string | null }) =>
    request<void>(`/api/Usuario/Editar/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  updateUsuarioFoto: (id: number, fotoUrl: string | null) =>
    request<void>(`/api/Usuario/Foto/${id}`, { method: 'PUT', body: JSON.stringify({ fotoUrl }) }),

  deleteUsuario: (id: number) => request<void>(`/api/Usuario/Eliminar/${id}`, { method: 'DELETE' }),

  createTecnico: (payload: { especialidad: string; correo: string; idUsuario: number }) =>
    request<{ mensaje: string; idTecnico: number }>('/api/Tecnico', { method: 'POST', body: JSON.stringify(payload) }),

  updateTecnico: (id: number, payload: { especialidad: string; correo: string; idUsuario: number; idEstado: number }) =>
    request<void>(`/api/Tecnico/Editar/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteTecnico: (id: number) => request<void>(`/api/Tecnico/Eliminar/${id}`, { method: 'DELETE' }),

  createCategoria: (payload: { nombreCategoria: string; icono?: string | null; descripcion?: string | null }) =>
    request<{ mensaje: string; idCategoria: number }>('/api/Categoria', { method: 'POST', body: JSON.stringify(payload) }),

  updateCategoria: (id: number, payload: { nombreCategoria: string; icono?: string | null; descripcion?: string | null; idEstado: number }) =>
    request<void>(`/api/Categoria/Editar/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteCategoria: (id: number) => request<void>(`/api/Categoria/Eliminar/${id}`, { method: 'DELETE' }),

  createPrioridad: (payload: { nombrePrioridad: string }) =>
    request<{ mensaje: string; idPrioridad: number }>('/api/Prioridad', { method: 'POST', body: JSON.stringify(payload) }),

  updatePrioridad: (id: number, payload: { nombrePrioridad: string; idEstado: number }) =>
    request<void>(`/api/Prioridad/Editar/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deletePrioridad: (id: number) => request<void>(`/api/Prioridad/Eliminar/${id}`, { method: 'DELETE' }),

  createEstadoTicket: (payload: { nombreEstado: string }) =>
    request<{ mensaje: string; idEstadoTicket: number }>('/api/EstadoTicket', { method: 'POST', body: JSON.stringify(payload) }),

  updateEstadoTicket: (id: number, payload: { nombreEstado: string; idEstado: number }) =>
    request<void>(`/api/EstadoTicket/Editar/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteEstadoTicket: (id: number) => request<void>(`/api/EstadoTicket/Eliminar/${id}`, { method: 'DELETE' }),

  createRol: (payload: { nombreRol: string; descripcion?: string | null; permisos?: string[] }) =>
    request<{ mensaje: string; idRol: number }>('/api/Rol', { method: 'POST', body: JSON.stringify(payload) }),

  updateRol: (id: number, payload: { nombreRol: string; descripcion?: string | null; permisos?: string[]; idEstado: number }) =>
    request<void>(`/api/Rol/Editar/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteRol: (id: number) => request<void>(`/api/Rol/Eliminar/${id}`, { method: 'DELETE' }),

  assignSeat: (payload: { idPuesto: number; idUsuario: number | null; motivo?: string; idUsuarioAccion?: number; swap?: boolean }) =>
    request<void>('/api/Puesto/Asignar', { method: 'PUT', body: JSON.stringify(payload) }),

  createSeat: (payload: { codigoPuesto?: string; nombrePuesto: string; zona: SeatZone; idUsuarioActual?: number | null; idUsuarioAccion?: number; motivo?: string }) =>
    request<{ mensaje: string; idPuesto: number; codigoPuesto: string }>('/api/Puesto', { method: 'POST', body: JSON.stringify(payload) }),
};
