import { useCallback, useMemo, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '../components/Icons';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/Typography';
import { useSession } from '../context/SessionContext';
import { api } from '../lib/api';
import { hydrateNotificationState, isNotificationRead, markAllNotificationsRead, markNotificationRead } from '../lib/notificationState';
import { visibleTicketsFor } from '../lib/tickets';
import { colors, getThemeColors } from '../theme';
import type { AuditItem, TicketItem } from '../types';
import { EmptyState, LoadingState, Notice, Screen, Surface } from '../components/ui';
import { useReducedMotion } from '../lib/motion';
import { useFocusedPolling } from '../hooks/useFocusedPolling';

type NotificationRow = { id: number; title: string; description: string; date: string; code: string; ticketId: number | null; action: string; responsible: string };

export default function NotificationsScreen() {
  const { user, darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, refreshReadState] = useState(0);
  const [panelProgress] = useState(() => new Animated.Value(0));
  const closing = useRef(false);
  const panelTopOffset = width >= 1024 ? 72 : 56;
  const listMaxHeight = Math.max(100, Math.min(width >= 640 ? 384 : height * 0.6, height - panelTopOffset - 138));

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!user) return;
      await hydrateNotificationState(user.idUsuario);
      const [events, allTickets] = await Promise.all([
        api.getAuditoria().catch(() => [] as AuditItem[]),
        api.getTickets(),
      ]);
      setAudit(events); setTickets(allTickets);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar las notificaciones.'); }
    finally { setLoading(false); }
  }, [user]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [events, allTickets] = await Promise.all([
        api.getAuditoria().catch(() => [] as AuditItem[]),
        api.getTickets(),
      ]);
      setAudit(events);
      setTickets(allTickets);
    } catch { /* Keep the last successful notifications while offline. */ }
  }, [user]);
  useFocusedPolling(refreshNotifications, 6000);
  useFocusEffect(useCallback(() => {
    closing.current = false;
    if (reduceMotion) { panelProgress.setValue(1); return; }
    panelProgress.setValue(0);
    const animation = Animated.timing(panelProgress, { toValue: 1, duration: 160, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => { animation.stop(); closing.current = false; };
  }, [panelProgress, reduceMotion]));

  const rows = useMemo<NotificationRow[]>(() => {
    if (!user) return [];
    const visible = visibleTicketsFor(user, tickets);
    const ticketByCode = new Map(visible.map((item) => [item.tickets.trim().toLocaleLowerCase(), item]));
    const allowed = new Set(visible.map((item) => item.tickets.trim().toLocaleLowerCase()));
    const relevant = audit.filter((item) =>
      user.rol === 'Administrador' || allowed.has(item.ticket.trim().toLocaleLowerCase()),
    ).sort((a, b) => new Date(b.fechaAccion).getTime() - new Date(a.fechaAccion).getTime());
    if (relevant.length) return relevant.map((item) => {
      const linked = ticketByCode.get(item.ticket.trim().toLocaleLowerCase());
      return { id: item.idAuditoria, title: item.accion || 'Actividad', description: item.descripcion || 'Se actualizó la solicitud.', date: item.fechaAccion, code: item.ticket, ticketId: linked?.idTicket ?? item.idTicket ?? null, action: item.accion, responsible: item.responsable };
    });
    return visible.slice().sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()).slice(0, 8).map((item) => ({ id: -item.idTicket, title: item.estadoTicket || 'Solicitud', description: item.descripcion || 'Revisa el estado y los detalles de esta solicitud.', date: item.fechaCreacion, code: item.tickets, ticketId: item.idTicket, action: item.estadoTicket, responsible: item.solicitante }));
  }, [audit, tickets, user]);

  const closePanel = useCallback((afterClose: () => void = () => router.back()) => {
    if (closing.current) return;
    closing.current = true;
    if (reduceMotion) { afterClose(); return; }
    Animated.timing(panelProgress, { toValue: 0, duration: 140, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: Platform.OS !== 'web' }).start(({ finished }) => {
      if (finished) afterClose();
      else closing.current = false;
    });
  }, [panelProgress, reduceMotion]);
  if (!user) return null;
  const fullName = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim().toLocaleLowerCase();
  const unreadCount = rows.filter((item) => item.responsible.trim().toLocaleLowerCase() !== fullName && !isNotificationRead(item.id, user.idUsuario)).length;
  const openNotification = (item: NotificationRow) => {
    if (!user) return;
    markNotificationRead(item.id, user.idUsuario); refreshReadState((version) => version + 1);
    if (item.ticketId) closePanel(() => router.replace(`/ticket/${item.ticketId}`));
  };
  const markAllRead = () => { if (!user) return; markAllNotificationsRead(rows.map((item) => item.id), user.idUsuario); refreshReadState((version) => version + 1); };

  return (
    <Screen transparent animate={false}>
      <View style={[styles.backdrop, { paddingTop: panelTopOffset, paddingBottom: Math.max(16, insets.bottom) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closePanel()} accessibilityLabel="Cerrar notificaciones" />
        <Animated.View style={[styles.panelPosition, { maxWidth: width >= 640 ? 384 : undefined, opacity: panelProgress, transform: [{ translateY: panelProgress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }, { scale: panelProgress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }]}>
          <Surface style={[styles.panel, { maxHeight: height - panelTopOffset - 16 }]}>
            <View style={styles.panelHeader}>
              <View style={styles.panelHeading}><Text style={styles.panelTitle}>Notificaciones</Text><Text style={styles.panelSubtitle}>{unreadCount ? `${unreadCount} actualización(es) sin leer` : 'Estás al día con tus tickets'}</Text></View>
              <View style={styles.panelActions}>{unreadCount > 0 ? <Pressable onPress={markAllRead} style={[styles.readAll, { borderColor: palette.line, backgroundColor: palette.surface }]} accessibilityRole="button"><Ionicons name="checkmark-done-outline" size={14} color={palette.primaryDark} /><Text style={[styles.readAllText, { color: palette.primaryDark }]}>Marcar leídas</Text></Pressable> : null}<Pressable onPress={() => closePanel()} style={styles.close} accessibilityLabel="Cerrar"><Ionicons name="close" size={19} color={palette.muted} /></Pressable></View>
            </View>
            {error ? <Notice message={error} /> : null}
            <View style={[styles.panelDivider, { backgroundColor: palette.line }]} />
            {loading ? <LoadingState label="Cargando notificaciones…" /> : rows.length ? <ScrollView style={[styles.listScroll, { maxHeight: listMaxHeight }]} contentContainerStyle={styles.list} showsVerticalScrollIndicator>{rows.map((item) => {
              const read = !user || item.responsible.trim().toLocaleLowerCase() === fullName || isNotificationRead(item.id, user.idUsuario);
              return <NotificationRowItem key={item.id} item={item} read={read} palette={palette} onPress={() => openNotification(item)} />;
            })}</ScrollView> : <View style={styles.empty}><EmptyState title="Sin notificaciones" description="Cuando haya cambios en tus tickets, aparecerán aquí." icon="notifications-off-outline" /></View>}
            {!loading ? <View style={[styles.panelFooter, { borderTopColor: palette.line }]}><Text style={styles.footnote}>{rows.length} eventos disponibles para tu rol.</Text><Pressable onPress={() => void load()} accessibilityLabel="Actualizar notificaciones"><Ionicons name="refresh" size={16} color={palette.primaryDark} /></Pressable></View> : null}
          </Surface>
        </Animated.View>
      </View>
    </Screen>
  );
}

function NotificationRowItem({ item, read, palette, onPress }: { item: NotificationRow; read: boolean; palette: ReturnType<typeof getThemeColors>; onPress: () => void }) {
  const [hover] = useState(() => new Animated.Value(0));
  const translateX = hover.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });
  const icon = iconForAction(item.action);
  const animateHover = (value: number) => {
    if (Platform.OS !== 'web') return;
    Animated.timing(hover, { toValue: value, duration: 160, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: false }).start();
  };

  return (
    <Animated.View style={{ transform: [{ translateX }] }}>
      <Pressable onPress={onPress} onHoverIn={() => animateHover(1)} onHoverOut={() => animateHover(0)} accessibilityRole="button" style={({ pressed }) => [styles.row, { backgroundColor: read ? palette.surface : palette.skySoft, borderBottomColor: palette.line }, pressed && styles.pressed]}>
        <View style={[styles.rowIcon, { backgroundColor: read ? palette.surfaceSoft : palette.primary }]}><Ionicons name={icon} size={16} color={read ? palette.muted : '#FFFFFF'} /></View>
        <View style={styles.rowCopy}>
          <View style={styles.rowTitleLine}><Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>{item.code ? <Text style={[styles.rowCode, { color: palette.primaryDark }]} numberOfLines={1}>{item.code}</Text> : null}</View>
          <Text style={[styles.rowDescription, { color: palette.muted }]} numberOfLines={2}>{item.description}</Text>
          <View style={styles.rowMeta}><Text style={[styles.rowResponsible, { color: palette.muted }]} numberOfLines={1}>Por {item.responsible || 'Sistema'}</Text><Text style={[styles.rowDate, { color: palette.muted }]}>{formatNotificationDate(item.date)}</Text></View>
        </View>
        {!read ? <View style={styles.unreadDot} /> : null}
      </Pressable>
    </Animated.View>
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

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'transparent', alignItems: 'flex-end', paddingHorizontal: 12 },
  panelPosition: { width: '100%' },
  panel: { padding: 0, overflow: 'hidden' },
  panelHeader: { minHeight: 68, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  panelHeading: { flex: 1, gap: 4 }, panelTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' }, panelSubtitle: { color: colors.muted, fontSize: 13 },
  panelActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  readAll: { minHeight: 36, paddingHorizontal: 11, borderRadius: 9, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }, readAllText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  close: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, panelDivider: { height: 1 }, listScroll: { flexShrink: 1, minHeight: 100 },
  list: { padding: 0 }, row: { minHeight: 92, borderBottomWidth: 1, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 13 }, rowIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 2 }, rowCopy: { flex: 1, minWidth: 0, gap: 5 }, rowTitleLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, rowTitle: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '800' }, unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6 }, rowCode: { fontSize: 12, fontWeight: '800' }, rowDescription: { fontSize: 13, lineHeight: 19 }, rowMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 2 }, rowResponsible: { flex: 1, fontSize: 12 }, rowDate: { fontSize: 12, flexShrink: 0 }, empty: { padding: 24 }, panelFooter: { minHeight: 44, paddingHorizontal: 18, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, footnote: { color: colors.muted, fontSize: 12 }, pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
