const readIds = new Set<number>();

export function isNotificationRead(id: number) {
  return readIds.has(id);
}

export function markNotificationRead(id: number) {
  readIds.add(id);
}

export function markAllNotificationsRead(ids: number[]) {
  ids.forEach((id) => readIds.add(id));
}
