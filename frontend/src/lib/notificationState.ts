import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'getickets_read_notifs_';
const readIdsByUser = new Map<number, Set<number>>();
const hydrationByUser = new Map<number, Promise<void>>();
const existingState = new Set<number>();

function getReadIds(userId: number): Set<number> {
  let ids = readIdsByUser.get(userId);
  if (!ids) {
    ids = new Set<number>();
    readIdsByUser.set(userId, ids);
  }
  return ids;
}

function persist(userId: number) {
  void AsyncStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify([...getReadIds(userId)])).catch(() => undefined);
}

export function hydrateNotificationState(userId: number): Promise<void> {
  const pending = hydrationByUser.get(userId);
  if (pending) return pending;

  const task = AsyncStorage.getItem(`${STORAGE_PREFIX}${userId}`)
    .then((stored) => {
      if (stored == null) return;
      existingState.add(userId);
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => {
          const value = Number(id);
          if (Number.isFinite(value)) getReadIds(userId).add(value);
        });
      }
    })
    .catch(() => undefined);
  hydrationByUser.set(userId, task);
  return task;
}

export function initializeNotificationState(userId: number, olderNotificationIds: number[]) {
  if (existingState.has(userId)) return;
  existingState.add(userId);
  const readIds = getReadIds(userId);
  olderNotificationIds.forEach((id) => readIds.add(id));
  persist(userId);
}

export function isNotificationRead(id: number, userId: number) {
  return getReadIds(userId).has(id);
}

export function markNotificationRead(id: number, userId: number) {
  getReadIds(userId).add(id);
  existingState.add(userId);
  persist(userId);
}

export function markAllNotificationsRead(ids: number[], userId: number) {
  const readIds = getReadIds(userId);
  ids.forEach((id) => readIds.add(id));
  existingState.add(userId);
  persist(userId);
}
