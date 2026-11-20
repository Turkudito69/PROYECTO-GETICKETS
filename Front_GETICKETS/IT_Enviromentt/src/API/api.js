const API_BASE_URL = 'http://192.168.1.37:12190/api';

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

export async function obtenerTecnicos() {
  return obtenerLista(`${API_BASE_URL}/Tecnico`, 'La respuesta de técnicos no es una lista válida.');
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
