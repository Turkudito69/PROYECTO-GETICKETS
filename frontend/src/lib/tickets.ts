import type { AuthUser, TicketItem } from '../types';

export function visibleTicketsFor(user: AuthUser, tickets: TicketItem[]) {
  if (user.rol === 'Administrador') return tickets;
  if (user.rol === 'Tecnico') {
    return tickets.filter((ticket) => ticket.idTecnico === user.idTecnico || ticket.idUsuario === user.idUsuario);
  }
  return tickets.filter((ticket) => ticket.idUsuario === user.idUsuario);
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toLocaleUpperCase() || 'U';
}
