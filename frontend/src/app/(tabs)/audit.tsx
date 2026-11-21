import { useCallback, useMemo, useState } from 'react';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '../../components/Icons';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, AppTextInput as TextInput } from '../../components/Typography';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import { visibleTicketsFor } from '../../lib/tickets';
import { colors, getThemeColors, space } from '../../theme';
import type { AuditItem, TicketItem } from '../../types';
import { EmptyState, LoadingState, Notice, PageHeading, Screen, Surface, formatDate } from '../../components/ui';

export default function AuditScreen() {
  const { user, darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const { width } = useWindowDimensions();
  const mobileNav = Platform.OS !== 'web' || width < 1024;
  const [entries, setEntries] = useState<AuditItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const load = useCallback(async (quiet = false) => {
    if (!user || !['Administrador', 'Tecnico'].includes(user.rol)) return;
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const [activity, allTickets] = await Promise.all([api.getAuditoria(), api.getTickets()]);
      setEntries(activity); setTickets(allTickets);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar la actividad.'); }
    finally { setLoading(false); }
  }, [user]);
  useFocusEffect(useCallback(() => { void load(true); }, [load]));

  const filtered = useMemo(() => {
    if (!user) return [];
    const visibleCodes = new Set(visibleTicketsFor(user, tickets).map((ticket) => ticket.tickets.trim().toLocaleLowerCase()));
    const scopedEntries = user.rol === 'Administrador' ? entries : entries.filter((entry) => visibleCodes.has(entry.ticket.trim().toLocaleLowerCase()));
    const term = query.trim().toLocaleLowerCase();
    if (!term) return scopedEntries;
    return scopedEntries.filter((entry) => `${entry.ticket} ${entry.responsable} ${entry.accion} ${entry.descripcion}`.toLocaleLowerCase().includes(term));
  }, [entries, query, tickets, user]);
  if (!user) return <Redirect href="/login" />;
  if (!['Administrador', 'Tecnico'].includes(user.rol)) return <Redirect href="/(tabs)" />;

  return (
    <Screen safeTop={false}>
      <ScrollView contentContainerStyle={[styles.content, mobileNav && styles.contentMobile]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PageHeading title="Actividad del sistema" subtitle={user.rol === 'Administrador' ? 'Consulta las acciones registradas en los tickets.' : 'Seguimiento de actividad y cambios en los tickets.'} right={<Pressable onPress={() => void load()} style={[styles.reload, { backgroundColor: palette.surface, borderColor: palette.line }]}><Ionicons name="refresh" size={18} color={colors.primaryDark} /></Pressable>} />
        <View style={[styles.search, { backgroundColor: palette.surface, borderColor: palette.line }]}><Ionicons name="search-outline" size={17} color={palette.muted} /><TextInput value={query} onChangeText={setQuery} style={[styles.searchInput, { color: palette.ink }]} placeholder="Ticket, responsable o acción" placeholderTextColor={palette.muted} /></View>
        {error ? <Notice message={error} /> : null}
        {loading ? <LoadingState label="Cargando actividad…" /> : filtered.length ? filtered.map((entry) => {
          const linkedTicket = tickets.find((ticket) => ticket.tickets === entry.ticket);
          return (
            <Pressable key={entry.idAuditoria} onPress={() => linkedTicket && router.push(`/ticket/${linkedTicket.idTicket}`)} disabled={!linkedTicket}>
              <Surface style={styles.activityCard}>
                <View style={[styles.activityIcon, { backgroundColor: palette.skySoft }]}><Ionicons name={iconForAction(entry.accion)} size={17} color={colors.primaryDark} /></View>
                <View style={styles.activityContent}>
                  <View style={styles.activityTitleRow}><Text style={styles.action}>{entry.accion}</Text><Text style={styles.date}>{formatDate(entry.fechaAccion)}</Text></View>
                  <Text style={styles.description}>{entry.descripcion || 'Sin detalles adicionales.'}</Text>
                  <View style={styles.metaRow}><Text style={styles.ticketCode}>{entry.ticket}</Text><Text style={styles.responsible}>por {entry.responsable || 'Sistema'}</Text></View>
                </View>
                {linkedTicket ? <Ionicons name="chevron-forward" size={17} color={palette.muted} /> : null}
              </Surface>
            </Pressable>
          );
        }) : <EmptyState title="Sin actividad registrada" description={query ? 'No hay eventos que coincidan con tu búsqueda.' : 'Cuando se registren cambios, aparecerán aquí.'} icon="time-outline" />}
      </ScrollView>
    </Screen>
  );
}

function iconForAction(action: string): keyof typeof Ionicons.glyphMap {
  const normalized = action.toLocaleLowerCase();
  if (normalized.includes('asign')) return 'person-add-outline';
  if (normalized.includes('cread')) return 'add-circle-outline';
  if (normalized.includes('resolu') || normalized.includes('final')) return 'checkmark-done-outline';
  if (normalized.includes('observ')) return 'chatbubble-ellipses-outline';
  if (normalized.includes('inicio')) return 'play-outline';
  return 'document-text-outline';
}

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 28, gap: 15 }, contentMobile: { paddingBottom: 112 },
  reload: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  search: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13 },
  searchInput: { flex: 1, color: colors.ink, paddingVertical: 10, fontSize: 13 },
  activityCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13 },
  activityIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.skySoft },
  activityContent: { flex: 1, gap: 6 },
  activityTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  action: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '800' },
  date: { color: colors.muted, fontSize: 10 },
  description: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  ticketCode: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  responsible: { color: colors.muted, fontSize: 11 },
});
