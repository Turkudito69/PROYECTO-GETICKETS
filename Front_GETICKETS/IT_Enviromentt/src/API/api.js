const API_BASE_URL = 'http://192.168.1.46:12190/api';

export async function obtenerTickets() {
  const response = await fetch(`${API_BASE_URL}/Ticket`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`La API respondió con el estado ${response.status}.`);
  }

  const tickets = await response.json();

  if (!Array.isArray(tickets)) {
    throw new Error('La respuesta de Ticket no es una lista válida.');
  }

  return tickets;
}

export async function obtenerTicketsPorUsuario(idUsuario) {
  if (!idUsuario) {
    throw new Error('No recibimos el ID del usuario para consultar sus tickets.');
  }

  const response = await fetch(`${API_BASE_URL}/Ticket/Usuario/${encodeURIComponent(idUsuario)}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`La API respondió con el estado ${response.status}.`);
  }

  const tickets = await response.json();

  if (!Array.isArray(tickets)) {
    throw new Error('La respuesta de tickets del usuario no es una lista válida.');
  }

  return tickets;
}

async function obtenerLista(url, mensajeError) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`La API respondió con el estado ${response.status}.`);

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error(mensajeError);
  return data;
}

export async function obtenerCategorias() {
  return obtenerLista(`${API_BASE_URL}/Categoria`, 'La respuesta de categorías no es una lista válida.');
}

export async function obtenerPrioridades() {
  return obtenerLista(`${API_BASE_URL}/Prioridad`, 'La respuesta de prioridades no es una lista válida.');
}

export async function obtenerRoles() {
  return obtenerLista(`${API_BASE_URL}/Rol`, 'La respuesta de roles no es una lista válida.');
}

export async function obtenerEstados() {
  return obtenerLista(`${API_BASE_URL}/Estado`, 'La respuesta de estados no es una lista válida.');
}

export async function obtenerUsuarios() {
  return obtenerLista(`${API_BASE_URL}/Usuario`, 'La respuesta de usuarios no es una lista válida.');
}

async function guardarRecurso(url, method, datos) {
  const response = await fetch(url, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  if (!response.ok) {
    const detalle = await response.text();
    throw new Error(detalle || `La API respondió con el estado ${response.status}.`);
  }
}

async function desactivarRecurso(url) {
  const response = await fetch(url, { method: 'DELETE', headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const detalle = await response.text();
    throw new Error(detalle || `La API respondió con el estado ${response.status}.`);
  }
}

export async function guardarUsuario(datos, id = null) {
  const url = id === null
    ? `${API_BASE_URL}/Usuario/Insertar%20usuario`
    : `${API_BASE_URL}/Usuario/Editar/${encodeURIComponent(id)}`;
  return guardarRecurso(url, id === null ? 'POST' : 'PUT', datos);
}

export async function desactivarUsuario(id) {
  return desactivarRecurso(`${API_BASE_URL}/Usuario/Eliminar/${encodeURIComponent(id)}`);
}

export async function guardarTecnico(datos, id = null) {
  const url = id === null
    ? `${API_BASE_URL}/Tecnico/Insertar%20tecnico`
    : `${API_BASE_URL}/Tecnico/Editar/${encodeURIComponent(id)}`;
  return guardarRecurso(url, id === null ? 'POST' : 'PUT', datos);
}

export async function desactivarTecnico(id) {
  return desactivarRecurso(`${API_BASE_URL}/Tecnico/Eliminar/${encodeURIComponent(id)}`);
}

const rutasCatalogos = {
  categorias: { recurso: 'Categoria', insertar: 'Insertar%20categoria' },
  prioridades: { recurso: 'Prioridad', insertar: 'Insertar%20prioridad' },
  roles: { recurso: 'Rol', insertar: 'Insertar%20rol' },
  estados: { recurso: 'Estado', insertar: 'Insertar%20estado' },
};

export async function guardarCatalogo(tipo, datos, id = null) {
  const ruta = rutasCatalogos[tipo];
  if (!ruta) throw new Error('El catálogo solicitado no está disponible.');

  const url = id === null
    ? `${API_BASE_URL}/${ruta.recurso}/${ruta.insertar}`
    : `${API_BASE_URL}/${ruta.recurso}/Editar/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: id === null ? 'POST' : 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    const detalle = await response.text();
    throw new Error(detalle || `La API respondió con el estado ${response.status}.`);
  }
}

export async function desactivarCatalogo(tipo, id) {
  const ruta = rutasCatalogos[tipo];
  if (!ruta || tipo === 'estados') throw new Error('Este catálogo no admite desactivación desde esta pantalla.');

  const response = await fetch(`${API_BASE_URL}/${ruta.recurso}/Eliminar/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const detalle = await response.text();
    throw new Error(detalle || `La API respondió con el estado ${response.status}.`);
  }
}

export async function obtenerTecnicos() {
  return obtenerLista(`${API_BASE_URL}/Tecnico`, 'La respuesta de técnicos no es una lista válida.');
}

export async function obtenerAuditorias() {
  return obtenerLista(`${API_BASE_URL}/Auditoria`, 'La respuesta de auditoría no es una lista válida.');
}

export async function asignarTicket(datos) {
  const response = await fetch(`${API_BASE_URL}/Ticket/Asignar`, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    const detalle = await response.text();
    throw new Error(detalle || `La API respondió con el estado ${response.status}.`);
  }
}

export async function iniciarAtencionTicket(datos) {
  return guardarRecurso(`${API_BASE_URL}/Ticket/IniciarAtencion`, 'PUT', datos);
}

export async function guardarObservacionTicket(datos) {
  return guardarRecurso(`${API_BASE_URL}/Ticket/GuardarObservacion`, 'PUT', datos);
}

export async function finalizarTicket(datos) {
  return guardarRecurso(`${API_BASE_URL}/Ticket/Finalizar`, 'PUT', datos);
}

export async function crearTicket(datos) {
  const response = await fetch(`${API_BASE_URL}/Ticket/Insertar%20ticket`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    const detalle = await response.text();
    throw new Error(detalle || `La API respondió con el estado ${response.status}.`);
  }
}

export async function obtenerDetalleTicket(idTicket) {
  return obtenerLista(
    `${API_BASE_URL}/DetalleTicket/${encodeURIComponent(idTicket)}`,
    'La respuesta del detalle del ticket no es válida.',
  );
}

export async function obtenerSeguimientoTicket(idTicket) {
  return obtenerLista(
    `${API_BASE_URL}/SeguimientoTicket/${encodeURIComponent(idTicket)}`,
    'La respuesta del seguimiento no es válida.',
  );
}

export async function obtenerDetallesGeneralesTicket() {
  return obtenerLista(
    `${API_BASE_URL}/DetalleTicketGeneral`,
    'La respuesta de detalles generales no es una lista válida.',
  );
}
