import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Typography';
import { useSession } from '../context/SessionContext';
import { api } from '../lib/api';
import { isNotificationRead, markAllNotificationsRead, markNotificationRead } from '../lib/notificationState';
import { visibleTicketsFor } from '../lib/tickets';
import { colors, space } from '../theme';
import type { AuditItem, TicketItem } from '../types';
import { AnimatedEntry, EmptyState, LoadingState, Notice, PageHeading, Screen, Surface, formatDate } from '../components/ui';

type NotificationRow = { id: number; title: string; description: string; date: string; code: string; ticketId: number | null; action: string };

export default function NotificationsScreen() {
  const { user } = useSession();
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, refreshReadState] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [events, allTickets] = await Promise.all([
        api.getAuditoria().catch(() => [] as AuditItem[]),
        api.getTickets(),
      ]);
      setAudit(events); setTickets(allTickets);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar las notificaciones.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const rows = useMemo<NotificationRow[]>(() => {
    if (!user) return [];
    const visible = visibleTicketsFor(user, tickets);
    const ticketByCode = new Map(visible.map((item) => [item.tickets.trim().toLocaleLowerCase(), item]));
    const allowed = new Set(visible.map((item) => item.tickets.trim().toLocaleLowerCase()));
    const currentUserName = `${user.nombre} ${user.apellido}`.trim().toLocaleLowerCase();
    const relevant = audit.filter((item) =>
      (user.rol === 'Administrador' || allowed.has(item.ticket.trim().toLocaleLowerCase()))
      && item.responsable.trim().toLocaleLowerCase() !== currentUserName,
    );
    if (relevant.length) return relevant.map((item) => {
      const linked = ticketByCode.get(item.ticket.trim().toLocaleLowerCase());
      return { id: item.idAuditoria, title: `${item.accion || 'Actividad'} · ${item.ticket || 'GETICKETS'}`, description: `${item.responsable || 'Sistema'}: ${item.descripcion || 'Se actualizó la solicitud.'}`, date: item.fechaAccion, code: item.ticket, ticketId: linked?.idTicket ?? item.idTicket ?? null, action: item.accion };
    });
    return visible.slice().sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()).slice(0, 8).map((item) => ({ id: -item.idTicket, title: `${item.estadoTicket || 'Solicitud'} · ${item.tickets}`, description: item.descripcion || 'Revisa el estado y los detalles de esta solicitud.', date: item.fechaCreacion, code: item.tickets, ticketId: item.idTicket, action: item.estadoTicket }));
  }, [audit, tickets, user]);

  if (!user) return null;
  const unreadCount = rows.filter((item) => !isNotificationRead(item.id)).length;
  const openNotification = (item: NotificationRow) => {
    markNotificationRead(item.id); refreshReadState((version) => version + 1);
    if (item.ticketId) router.push(`/ticket/${item.ticketId}`);
  };
  const markAllRead = () => { markAllNotificationsRead(rows.map((item) => item.id)); refreshReadState((version) => version + 1); };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topLine}><Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button"><Ionicons name="arrow-back" size={18} color={colors.primaryDark} /><Text style={styles.backText}>Volver</Text></Pressable><Pressable onPress={() => void load()} style={styles.reload} accessibilityLabel="Actualizar notificaciones"><Ionicons name="refresh" size={18} color={colors.primaryDark} /></Pressable></View>
        <PageHeading title="Notificaciones" subtitle="Novedades registradas en tus tickets." right={unreadCount > 0 ? <Pressable onPress={markAllRead} style={styles.readAll}><Ionicons name="checkmark-done-outline" size={15} color={colors.primaryDark} /><Text style={styles.readAllText}>Marcar leídas</Text></Pressable> : undefined} />
        {error ? <Notice message={error} /> : null}
        {!loading ? <Surface style={styles.summary}><View style={styles.summaryIcon}><Ionicons name="notifications-outline" size={20} color={colors.primaryDark} /></View><View style={styles.summaryCopy}><Text style={styles.summaryTitle}>{unreadCount ? `${unreadCount} novedades sin leer` : 'Estás al día'}</Text><Text style={styles.summaryText}>{rows.length} eventos disponibles para tu rol.</Text></View><View style={styles.summaryCount}><Text style={styles.summaryCountText}>{unreadCount}</Text></View></Surface> : null}
        {loading ? <LoadingState label="Cargando notificaciones…" /> : rows.length ? <View style={styles.list}>{rows.map((item, index) => {
          const read = isNotificationRead(item.id);
          const icon = iconForAction(item.action);
          return <AnimatedEntry key={item.id} delay={Math.min(index, 6) * 35}><Pressable onPress={() => openNotification(item)} accessibilityRole="button" style={({ pressed }) => [styles.row, !read && styles.unreadRow, pressed && styles.pressed]}><View style={[styles.rowIcon, read && styles.rowIconRead]}><Ionicons name={icon} size={17} color={read ? colors.muted : colors.primaryDark} /></View><View style={styles.rowCopy}><View style={styles.rowTitleLine}><Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>{!read ? <View style={styles.unreadDot} /> : null}</View><Text style={styles.rowDescription} numberOfLines={3}>{item.description}</Text><View style={styles.rowMeta}><Text style={styles.rowDate}>{formatDate(item.date)}</Text>{item.code ? <Text style={styles.rowCode}>{item.code}</Text> : null}</View></View><Ionicons name="chevron-forward" size={17} color={colors.muted} /></Pressable></AnimatedEntry>;
        })}</View> : <Surface><EmptyState title="Sin notificaciones" description="Cuando haya cambios en tus tickets, aparecerán aquí." icon="notifications-off-outline" /></Surface>}
        <Text style={styles.footnote}>Las notificaciones se construyen a partir de la actividad que registra la API GETICKETS.</Text>
      </ScrollView>
    </Screen>
  );
}

function iconForAction(action: string): keyof typeof Ionicons.glyphMap {
  const value = action.toLocaleLowerCase();
  if (value.includes('asign')) return 'person-add-outline';
  if (value.includes('inicio')) return 'play-outline';
  if (value.includes('observ')) return 'chatbubble-ellipses-outline';
  if (value.includes('resolu') || value.includes('confirm') || value.includes('complet')) return 'checkmark-circle-outline';
  if (value.includes('reapert')) return 'refresh-outline';
  if (value.includes('cread') || value.includes('nuevo')) return 'add-circle-outline';
  return 'document-text-outline';
}

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 32, gap: 15, width: '100%', maxWidth: 900, alignSelf: 'center' },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }, backText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' }, reload: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  readAll: { minHeight: 38, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 5 }, readAllText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.skySoft, borderColor: '#A5DDF8' }, summaryIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, summaryCopy: { flex: 1, gap: 3 }, summaryTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' }, summaryText: { color: colors.muted, fontSize: 10 }, summaryCount: { minWidth: 29, height: 29, paddingHorizontal: 6, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, summaryCountText: { color: colors.onPrimary, fontWeight: '900', fontSize: 11 },
  list: { gap: 8 }, row: { minHeight: 82, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, unreadRow: { borderColor: '#9DDCF8', backgroundColor: '#F2FAFF' }, rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' }, rowIconRead: { backgroundColor: '#F1F5F9' }, rowCopy: { flex: 1, gap: 5 }, rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 }, rowTitle: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 17, fontWeight: '800' }, unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary }, rowDescription: { color: colors.muted, fontSize: 11, lineHeight: 16 }, rowMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 1 }, rowDate: { color: colors.muted, fontSize: 9 }, rowCode: { color: colors.primaryDark, fontSize: 9, fontWeight: '800' }, footnote: { color: colors.muted, textAlign: 'center', fontSize: 10, lineHeight: 15 }, pressed: { opacity: 0.83 },
});
