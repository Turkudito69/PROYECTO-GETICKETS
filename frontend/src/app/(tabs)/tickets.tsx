import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, AppTextInput as TextInput } from '../../components/Typography';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import { visibleTicketsFor } from '../../lib/tickets';
import { colors, space } from '../../theme';
import type { TicketItem } from '../../types';
import { AnimatedEntry, AnimatedProgressBar, Button, EmptyState, formatDate, LoadingState, Notice, PageHeading, Screen, Surface, TicketCard } from '../../components/ui';

const filters = ['Todos', 'Abierto', 'Asignado', 'En Proceso', 'Resuelto', 'Completado'];

export default function TicketsScreen() {
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('Todos');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [priorityFilter, setPriorityFilter] = useState('Todas');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setTickets(await api.getTickets()); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar los tickets.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const visible = useMemo(() => {
    if (!user) return [];
    const scoped = visibleTicketsFor(user, tickets);
    const search = query.trim().toLocaleLowerCase();
    return scoped.filter((ticket) => {
      const matchesFilter = filter === 'Todos' || ticket.estadoTicket === filter;
      const searchable = `${ticket.tickets} ${ticket.descripcion} ${ticket.categoria} ${ticket.tecnico ?? ''} ${ticket.solicitante}`.toLocaleLowerCase();
      const date = new Date(ticket.fechaCreacion);
      const afterStart = !fromDate || date >= new Date(`${fromDate}T00:00:00`);
      const beforeEnd = !toDate || date <= new Date(`${toDate}T23:59:59`);
      return matchesFilter && (categoryFilter === 'Todas' || ticket.categoria === categoryFilter) && (priorityFilter === 'Todas' || ticket.prioridad === priorityFilter) && afterStart && beforeEnd && (!search || searchable.includes(search));
    }).sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }, [categoryFilter, filter, fromDate, query, tickets, toDate, priorityFilter, user]);

  const categories = [...new Set(tickets.map((ticket) => ticket.categoria).filter(Boolean))];
  const priorities = [...new Set(tickets.map((ticket) => ticket.prioridad).filter(Boolean))];
  const summary = user ? visibleTicketsFor(user, tickets) : [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PageHeading title={user?.rol === 'Administrador' ? 'Todos los tickets' : 'Mis Solicitudes'} subtitle="Haz clic en cualquier ticket para ver su progreso, notas y solución." right={<View style={styles.headingActions}><Pressable onPress={() => router.push('/new-ticket')} style={styles.createButton}><Ionicons name="add" size={17} color="#FFFFFF" /><Text style={styles.createText}>Reportar problema</Text></Pressable><Pressable onPress={() => void load()} style={styles.reload} accessibilityLabel="Actualizar tickets"><Ionicons name="refresh" size={18} color={colors.primaryDark} /></Pressable></View>} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilterBar} contentContainerStyle={styles.filters}>
          {filters.map((item) => {
            const selected = filter === item;
            return <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filterChip, selected && styles.filterSelected]}><Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item}</Text></Pressable>;
          })}
        </ScrollView>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Buscar ticket o descripción" placeholderTextColor={colors.muted} style={styles.searchInput} returnKeyType="search" />
          {query ? <Pressable onPress={() => setQuery('')} accessibilityLabel="Limpiar búsqueda"><Ionicons name="close-circle" size={18} color={colors.muted} /></Pressable> : null}
        </View>
        <Surface style={styles.filterPanel}>
          <View style={styles.filterGroup}><Text style={styles.filterLabel}>Categoría</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><FilterChip label="Todas" selected={categoryFilter === 'Todas'} onPress={() => setCategoryFilter('Todas')} />{categories.map((item) => <FilterChip key={item} label={item} selected={categoryFilter === item} onPress={() => setCategoryFilter(item)} />)}</ScrollView></View>
          <View style={styles.filterGroup}><Text style={styles.filterLabel}>Prioridad</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><FilterChip label="Todas" selected={priorityFilter === 'Todas'} onPress={() => setPriorityFilter('Todas')} />{priorities.map((item) => <FilterChip key={item} label={item} selected={priorityFilter === item} onPress={() => setPriorityFilter(item)} />)}</ScrollView></View>
          <View style={styles.dateRow}><View style={styles.dateField}><Text style={styles.filterLabel}>Fecha desde</Text><TextInput value={fromDate} onChangeText={setFromDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.muted} style={styles.dateInput} autoCapitalize="none" /></View><View style={styles.dateField}><Text style={styles.filterLabel}>Fecha hasta</Text><TextInput value={toDate} onChangeText={setToDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.muted} style={styles.dateInput} autoCapitalize="none" /></View></View>
          {fromDate || toDate || categoryFilter !== 'Todas' || priorityFilter !== 'Todas' ? <Pressable onPress={() => { setFromDate(''); setToDate(''); setCategoryFilter('Todas'); setPriorityFilter('Todas'); }} style={styles.clearFilters}><Ionicons name="close-circle-outline" size={15} color={colors.primaryDark} /><Text style={styles.clearFiltersText}>Limpiar filtros</Text></Pressable> : null}
        </Surface>
        <Text style={styles.resultCount}>Mostrando {visible.length} de {summary.length} tickets</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard label="Total" value={summary.length} total={summary.length} icon="layers-outline" color={colors.primary} />
          <SummaryCard label="Abiertos" value={summary.filter((item) => item.estadoTicket === 'Abierto').length} total={summary.length} icon="time-outline" color={colors.amber} />
          <SummaryCard label="En proceso" value={summary.filter((item) => ['Asignado', 'En Proceso'].includes(item.estadoTicket)).length} total={summary.length} icon="construct-outline" color={colors.indigo} />
          <SummaryCard label="Cerrados" value={summary.filter((item) => item.estadoTicket === 'Completado').length} total={summary.length} icon="checkmark-circle-outline" color={colors.green} />
        </View>
        {error ? <Notice message={error} /> : null}
        {loading ? <LoadingState label="Cargando tickets…" /> : (
          <>
            {visible.length ? wide ? <Surface style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}><Text style={[styles.tableHead, styles.codeCol]}>Código</Text><Text style={[styles.tableHead, styles.categoryCol]}>Categoría</Text><Text style={[styles.tableHead, styles.subjectCol]}>Asunto</Text><Text style={[styles.tableHead, styles.priorityCol]}>Prioridad</Text><Text style={[styles.tableHead, styles.stateCol]}>Estado</Text><Text style={[styles.tableHead, styles.techCol]}>Técnico</Text><Text style={[styles.tableHead, styles.dateCol]}>Fecha</Text></View>
              {visible.map((ticket, index) => <AnimatedEntry key={ticket.idTicket} delay={Math.min(index, 8) * 24}><Pressable onPress={() => router.push(`/ticket/${ticket.idTicket}`)} style={({ pressed }) => [styles.tableRow, index > 0 && styles.tableDivider, pressed && styles.rowPressed]}>
                <Text style={[styles.codeText, styles.codeCol]} numberOfLines={1}>{ticket.tickets || `TCK-${String(ticket.idTicket).padStart(6, '0')}`}</Text>
                <View style={[styles.categoryCell, styles.categoryCol]}><View style={styles.categoryIcon}><Ionicons name="grid-outline" size={14} color={colors.primary} /></View><Text style={styles.cellText} numberOfLines={2}>{ticket.categoria || 'Sin categoría'}</Text></View>
                <View style={[styles.subjectCell, styles.subjectCol]}><Text style={styles.subjectText} numberOfLines={1}>{ticket.descripcion || 'Sin descripción'}</Text><Text style={styles.subjectMeta} numberOfLines={1}>Solicitante: {ticket.solicitante || '—'}</Text></View>
                <Text style={[styles.cellText, styles.priorityCol]}>{ticket.prioridad || 'Media'}</Text><View style={styles.stateCol}><StatusText status={ticket.estadoTicket} /></View><Text style={[styles.cellText, styles.techCol]} numberOfLines={1}>{ticket.tecnico || 'Sin asignar'}</Text><Text style={[styles.dateText, styles.dateCol]} numberOfLines={1}>{formatDate(ticket.fechaCreacion)}</Text><Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable></AnimatedEntry>)}
            </Surface> : visible.map((ticket, index) => <AnimatedEntry key={ticket.idTicket} delay={Math.min(index, 8) * 24}><TicketCard ticket={ticket} onPress={() => router.push(`/ticket/${ticket.idTicket}`)} /></AnimatedEntry>) : (
              <EmptyState title={query || filter !== 'Todos' ? 'No encontramos coincidencias' : 'Todavía no hay tickets'} description={query || filter !== 'Todos' ? 'Prueba con otro texto o cambia el filtro.' : 'Crea una solicitud para empezar a dar seguimiento.'} icon="search-outline" action={filter === 'Todos' && !query ? <Button onPress={() => router.push('/new-ticket')} icon="add" compact>Crear ticket</Button> : undefined} />
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.filterChip, selected && styles.filterSelected]}><Text style={[styles.filterText, selected && styles.filterTextSelected]} numberOfLines={1}>{label}</Text></Pressable>;
}

function SummaryCard({ label, value, total, icon, color }: { label: string; value: number; total: number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  const tint = color === colors.primary ? colors.skySoft : color === colors.amber ? colors.amberSoft : color === colors.indigo ? colors.indigoSoft : colors.greenSoft;
  const ratio = label === 'Total' ? (total ? 100 : 0) : total ? Math.round(value / total * 100) : 0;
  return <Surface style={[styles.summaryCard, { backgroundColor: tint, borderColor: `${color}55` }]}><View style={styles.summaryTop}><Text style={[styles.summaryLabel, { color }]}>{label}</Text><View style={[styles.summaryIcon, { backgroundColor: color }]}><Ionicons name={icon} size={16} color="#FFFFFF" /></View></View><Text style={styles.summaryValue}>{value}</Text><AnimatedProgressBar value={ratio} color={color} height={6} delay={60} trackColor="rgba(255,255,255,0.9)" /><Text style={styles.summaryCaption}>{label === 'Total' ? 'En vista actual' : label === 'Abiertos' ? 'Esperando técnico' : label === 'Cerrados' ? 'Finalizados' : 'En atención'}</Text></Surface>;
}

function StatusText({ status }: { status: string }) {
  const color = status === 'Completado' || status === 'Resuelto' ? colors.green : status === 'En Proceso' ? colors.indigo : status === 'Asignado' ? colors.primary : colors.amber;
  const tint = status === 'Completado' || status === 'Resuelto' ? colors.greenSoft : status === 'En Proceso' ? colors.indigoSoft : status === 'Asignado' ? colors.skySoft : colors.amberSoft;
  return <View style={[styles.status, { backgroundColor: tint, borderColor: `${color}66` }]}><Text style={[styles.statusText, { color }]}>{status}</Text></View>;
}

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 26, gap: 14, width: '100%', maxWidth: 1280, alignSelf: 'center' },
  headingActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, createButton: { minHeight: 40, borderRadius: 12, backgroundColor: colors.primary, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 5 }, createText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryCard: { flex: 1, minWidth: 132, padding: 14, minHeight: 126, gap: 7, borderWidth: 1 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12, fontWeight: '900' }, summaryIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryValue: { color: colors.ink, fontSize: 27, fontWeight: '900' }, summaryCaption: { color: colors.muted, fontSize: 10 },
  reload: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  search: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 11 },
  statusFilterBar: { maxHeight: 48, borderRadius: 11, backgroundColor: '#E9EDF3', padding: 4 }, filters: { gap: 5, paddingRight: 8, alignItems: 'center' },
  filterChip: { minHeight: 34, borderRadius: 9, justifyContent: 'center', paddingHorizontal: 13, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'transparent' },
  filterSelected: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  filterTextSelected: { color: colors.ink },
  resultCount: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 1 },
  filterPanel: { gap: 12, paddingVertical: 13 },
  filterGroup: { gap: 6 },
  filterLabel: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateField: { flex: 1, gap: 6 },
  dateInput: { minHeight: 42, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.surfaceSoft, paddingHorizontal: 10, color: colors.ink, fontSize: 12 },
  clearFilters: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end' },
  clearFiltersText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  table: { padding: 0, overflow: 'hidden' }, tableRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }, tableHeader: { minHeight: 43, backgroundColor: '#FAFBFD', borderBottomWidth: 1, borderBottomColor: colors.line }, tableHead: { color: colors.muted, fontSize: 10, fontWeight: '800' }, tableDivider: { borderTopWidth: 1, borderTopColor: colors.line }, rowPressed: { backgroundColor: '#F3F8FC' }, codeCol: { flex: .9, minWidth: 95 }, categoryCol: { flex: 1.15, minWidth: 115 }, subjectCol: { flex: 2.1, minWidth: 180 }, priorityCol: { flex: .65, minWidth: 62 }, stateCol: { flex: .9, minWidth: 83 }, techCol: { flex: 1.2, minWidth: 100 }, dateCol: { flex: .9, minWidth: 80 }, codeText: { color: colors.ink, fontSize: 11, fontWeight: '900' }, categoryCell: { flexDirection: 'row', alignItems: 'center', gap: 7 }, categoryIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' }, cellText: { color: colors.ink, fontSize: 11, fontWeight: '600' }, subjectCell: { gap: 3 }, subjectText: { color: colors.ink, fontSize: 12, fontWeight: '800' }, subjectMeta: { color: colors.muted, fontSize: 10 }, dateText: { color: colors.muted, fontSize: 10 }, status: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 8 }, statusText: { fontSize: 10, fontWeight: '800' },
});
