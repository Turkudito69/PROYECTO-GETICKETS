import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '../../components/Icons';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, AppTextInput as TextInput } from '../../components/Typography';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import { visibleTicketsFor } from '../../lib/tickets';
import { categoryIconFor } from '../../lib/statusUtils';
import { colors, getThemeColors, space } from '../../theme';
import type { CategoryItem, PriorityItem, TicketItem } from '../../types';
import { AnimatedEntry, AnimatedProgressBar, Button, EmptyState, formatDate, LoadingState, Notice, PageHeading, PriorityIndicator, Screen, Surface, TicketCard } from '../../components/ui';
import { useReducedMotion } from '../../lib/motion';
import { useFocusedPolling } from '../../hooks/useFocusedPolling';

const filters = ['Todos', 'Abierto', 'Asignado', 'En Proceso', 'Resuelto', 'Completado'];

export default function TicketsScreen() {
  const { user, darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const mobileNav = Platform.OS !== 'web' || width < 1024;
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CategoryItem[]>([]);
  const [catalogPriorities, setCatalogPriorities] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('Todos');
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [priorityFilter, setPriorityFilter] = useState('Todas');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const isRegularUser = user?.rol === 'Usuario';
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const ticketData = await api.getTickets();
      setTickets(ticketData);
      if (isRegularUser) {
        setCatalogCategories([]);
        setCatalogPriorities([]);
      } else {
        const [categoryData, priorityData] = await Promise.all([api.getCategorias(), api.getPrioridades()]);
        setCatalogCategories(categoryData); setCatalogPriorities(priorityData);
      }
    }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar los tickets.'); }
    finally { setLoading(false); }
  }, [isRegularUser]);
  useFocusEffect(useCallback(() => { void load(true); }, [load]));
  const refreshTickets = useCallback(async () => {
    try { setTickets(await api.getTickets()); } catch { /* Keep the last successful list during temporary network failures. */ }
  }, []);
  useFocusedPolling(refreshTickets, 4000);

  const visibleBase = useMemo(() => {
    if (!user) return [];
    return visibleTicketsFor(user, tickets);
  }, [tickets, user]);
  const activeCategories = catalogCategories.filter((item) => item.estado.trim().toLocaleLowerCase() === 'activo');
  const activePriorities = catalogPriorities.filter((item) => item.estado.trim().toLocaleLowerCase() === 'activo');
  const categoryIcons = useMemo(() => new Map(catalogCategories.map((item) => [item.idCategoria, item.icono])), [catalogCategories]);
  const activeAdvancedCount = Number(categoryFilter !== 'Todas') + Number(priorityFilter !== 'Todas') + Number(Boolean(fromDate)) + Number(Boolean(toDate));

  const visible = useMemo(() => {
    if (!user) return [];
    const search = query.trim().toLocaleLowerCase();
    const selectedCategory = activeCategories.find((item) => String(item.idCategoria) === categoryFilter)?.nombreCategoria.trim().toLocaleLowerCase();
    const selectedPriority = activePriorities.find((item) => String(item.idPrioridad) === priorityFilter)?.nombrePrioridad.trim().toLocaleLowerCase();
    return visibleBase.filter((ticket) => {
      const matchesFilter = filter === 'Todos' || ticket.estadoTicket.trim().toLocaleLowerCase() === filter.toLocaleLowerCase();
      const searchable = `${ticket.tickets} ${ticket.descripcion} ${ticket.categoria} ${ticket.tecnico ?? ''} ${ticket.solicitante}`.toLocaleLowerCase();
      const date = new Date(ticket.fechaCreacion);
      const afterStart = !fromDate || date >= new Date(`${fromDate}T00:00:00`);
      const beforeEnd = !toDate || date <= new Date(`${toDate}T23:59:59.999`);
      const matchesCategory = categoryFilter === 'Todas' || ticket.idCategoria === Number(categoryFilter) || ticket.categoria.trim().toLocaleLowerCase() === selectedCategory;
      const matchesPriority = priorityFilter === 'Todas' || ticket.idPrioridad === Number(priorityFilter) || ticket.prioridad.trim().toLocaleLowerCase() === selectedPriority;
      return matchesFilter && matchesCategory && matchesPriority && afterStart && beforeEnd && (!search || searchable.includes(search));
    }).sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }, [activeCategories, activePriorities, categoryFilter, filter, fromDate, query, visibleBase, toDate, priorityFilter, user]);

  const clearAdvancedFilters = () => { setFromDate(''); setToDate(''); setCategoryFilter('Todas'); setPriorityFilter('Todas'); };
  const hasAnyFilter = filter !== 'Todos' || Boolean(query.trim()) || activeAdvancedCount > 0;
  const clearAllFilters = () => { setFilter('Todos'); setQuery(''); clearAdvancedFilters(); };
  const heading = user?.rol === 'Administrador' ? 'Todos los Tickets' : user?.rol === 'Tecnico' ? 'Mi Bandeja de Atención' : 'Mis Solicitudes';

  return (
    <Screen safeTop={false}>
      <ScrollView contentContainerStyle={[styles.content, mobileNav && styles.contentMobile]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PageHeading title={heading} subtitle={isRegularUser ? 'Consulta el avance de tus reportes y revisa la solución de cada caso.' : 'Haz clic en cualquier ticket para ver su progreso completo, notas y solución.'} right={<View style={[styles.headingActions, width < 640 && styles.headingActionsCompact]}><Pressable onPress={() => router.push('/new-ticket')} style={styles.createButton}><Ionicons name="add" size={17} color="#FFFFFF" /><Text style={styles.createText}>{isRegularUser ? 'Reportar problema' : 'Nuevo ticket'}</Text></Pressable><Pressable onPress={() => void load()} style={[styles.reload, { backgroundColor: palette.surface, borderColor: palette.line }]} accessibilityLabel="Actualizar tickets"><Ionicons name="refresh" size={18} color={colors.primaryDark} /></Pressable></View>} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.statusFilterBar, { backgroundColor: palette.surfaceSoft, borderColor: palette.line }]} contentContainerStyle={styles.filters}>
          {filters.map((item) => {
            const selected = filter === item;
            return <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filterChip, { backgroundColor: selected ? palette.surface : palette.surfaceSoft, borderColor: selected ? palette.line : 'transparent' }]}><Text style={[styles.filterText, { color: selected ? palette.ink : palette.muted }]}>{item}</Text></Pressable>;
          })}
        </ScrollView>
        <View style={styles.primaryFilters}>
          <View style={[styles.search, styles.searchInline, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <Ionicons name="search-outline" size={18} color={palette.muted} />
            <TextInput value={query} onChangeText={setQuery} placeholder={isRegularUser ? 'Buscar en mis solicitudes…' : 'Buscar código (TCK-...), tema o persona...'} placeholderTextColor={palette.muted} style={[styles.searchInput, { color: palette.ink }]} returnKeyType="search" />
            {query ? <Pressable onPress={() => setQuery('')} accessibilityLabel="Limpiar búsqueda"><Ionicons name="close-circle" size={18} color={palette.muted} /></Pressable> : null}
          </View>
          {!isRegularUser ? <Pressable onPress={() => setShowAdvanced((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: showAdvanced }} style={[styles.scopeButton, { backgroundColor: showAdvanced || activeAdvancedCount ? palette.skySoft : palette.surface, borderColor: showAdvanced || activeAdvancedCount ? colors.primary : palette.line }]}><Ionicons name="options-outline" size={15} color={showAdvanced || activeAdvancedCount ? palette.primaryDark : palette.ink} /><Text style={[styles.scopeText, { color: showAdvanced || activeAdvancedCount ? palette.primaryDark : palette.ink }]}>Filtros{activeAdvancedCount ? ` (${activeAdvancedCount})` : ''}</Text></Pressable> : null}
        </View>
        {!isRegularUser && showAdvanced ? <Surface style={styles.filterPanel}>
          <View style={styles.filterGroup}><Text style={styles.filterLabel}>Categoría</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><FilterChip label="Todas las categorías" selected={categoryFilter === 'Todas'} onPress={() => setCategoryFilter('Todas')} />{activeCategories.map((item) => <FilterChip key={item.idCategoria} label={item.nombreCategoria} selected={categoryFilter === String(item.idCategoria)} onPress={() => setCategoryFilter(String(item.idCategoria))} />)}</ScrollView></View>
          <View style={styles.filterGroup}><Text style={styles.filterLabel}>Prioridad</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><FilterChip label="Todas las prioridades" selected={priorityFilter === 'Todas'} onPress={() => setPriorityFilter('Todas')} />{activePriorities.map((item) => <FilterChip key={item.idPrioridad} label={item.nombrePrioridad} selected={priorityFilter === String(item.idPrioridad)} onPress={() => setPriorityFilter(String(item.idPrioridad))} />)}</ScrollView></View>
          <View style={styles.dateRow}><View style={styles.dateField}><Text style={styles.filterLabel}>Fecha desde</Text><DateFilterField label="Fecha desde" value={fromDate} max={toDate} onChange={setFromDate} /></View><View style={styles.dateField}><Text style={styles.filterLabel}>Fecha hasta</Text><DateFilterField label="Fecha hasta" value={toDate} min={fromDate} onChange={setToDate} /></View></View>
          {hasAnyFilter ? <Pressable onPress={clearAllFilters} style={styles.clearFilters}><Ionicons name="refresh-outline" size={15} color={colors.primaryDark} /><Text style={styles.clearFiltersText}>Limpiar filtros</Text></Pressable> : null}
        </Surface> : null}
        <Text style={styles.resultCount}>{isRegularUser ? `${visible.length} ${visible.length === 1 ? 'solicitud' : 'solicitudes'}` : `Mostrando ${visible.length} de ${visibleBase.length} tickets`}</Text>
        {!isRegularUser ? <View style={styles.summaryGrid}>
          <SummaryCard index={0} label="Total" value={visible.length} total={visible.length} icon="layers-outline" color={colors.primary} />
          <SummaryCard index={1} label="Abiertos" value={visible.filter((item) => item.estadoTicket === 'Abierto').length} total={visible.length} icon="time-outline" color={colors.amber} />
          <SummaryCard index={2} label="En Proceso" value={visible.filter((item) => item.estadoTicket.toLocaleLowerCase().includes('proceso')).length} total={visible.length} icon="construct-outline" color={colors.indigo} />
          <SummaryCard index={3} label="Cerrados" value={visible.filter((item) => ['complet', 'resuelt', 'cerrad', 'finaliz', 'cancel'].some((status) => item.estadoTicket.toLocaleLowerCase().includes(status))).length} total={visible.length} icon="checkmark-circle-outline" color={colors.green} />
        </View> : null}
        {error ? <Notice message={error} /> : null}
        {loading ? <LoadingState label="Cargando tickets…" /> : (
          <>
            {visible.length ? wide && !isRegularUser ? <Surface style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: palette.surfaceSoft, borderBottomColor: palette.line }]}><Text style={[styles.tableHead, styles.codeCol]}>Código</Text><Text style={[styles.tableHead, styles.categoryCol]}>Categoría</Text><Text style={[styles.tableHead, styles.subjectCol]}>Asunto</Text><Text style={[styles.tableHead, styles.priorityCol]}>Prioridad</Text><Text style={[styles.tableHead, styles.stateCol]}>Estado</Text><Text style={[styles.tableHead, styles.techCol]}>Técnico</Text><Text style={[styles.tableHead, styles.dateCol]}>Fecha</Text></View>
              {visible.map((ticket, index) => <AnimatedEntry key={ticket.idTicket} delay={Math.min(index, 8) * 24}><Pressable onPress={() => router.push(`/ticket/${ticket.idTicket}`)} style={({ pressed }) => [styles.tableRow, index > 0 && [styles.tableDivider, { borderTopColor: palette.line }], pressed && { backgroundColor: palette.surfaceSoft }]}>
                <Text style={[styles.codeText, styles.codeCol]} numberOfLines={1}>{ticket.tickets || `TCK-${String(ticket.idTicket).padStart(6, '0')}`}</Text>
                <View style={[styles.categoryCell, styles.categoryCol]}><View style={[styles.categoryIcon, { backgroundColor: palette.skySoft }]}><Ionicons name={categoryIconFor(ticket.categoria, categoryIcons.get(ticket.idCategoria))} size={14} color={colors.primary} /></View><Text style={styles.cellText} numberOfLines={2}>{ticket.categoria || 'Sin categoría'}</Text></View>
                <View style={[styles.subjectCell, styles.subjectCol]}><Text style={styles.subjectText} numberOfLines={1}>{ticket.descripcion || 'Sin descripción'}</Text><Text style={styles.subjectMeta} numberOfLines={1}>Solicitante: {ticket.solicitante || '—'}</Text></View>
                <View style={styles.priorityCol}><PriorityIndicator priority={ticket.prioridad || 'Media'} /></View><View style={styles.stateCol}><StatusText status={ticket.estadoTicket} /></View><Text style={[styles.cellText, styles.techCol]} numberOfLines={1}>{ticket.tecnico || 'Sin asignar'}</Text><Text style={[styles.dateText, styles.dateCol]} numberOfLines={1}>{formatDate(ticket.fechaCreacion)}</Text><Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable></AnimatedEntry>)}
            </Surface> : visible.map((ticket, index) => <AnimatedEntry key={ticket.idTicket} delay={Math.min(index, 8) * 24}><TicketCard ticket={ticket} onPress={() => router.push(`/ticket/${ticket.idTicket}`)} /></AnimatedEntry>) : (
              <EmptyState title={hasAnyFilter ? 'No encontramos solicitudes con esos criterios' : isRegularUser ? 'Aún no tienes solicitudes' : 'Todavía no hay tickets'} description={hasAnyFilter ? 'Prueba limpiar la búsqueda o los filtros.' : isRegularUser ? 'Reporta tu problema y podrás seguir cada actualización desde aquí.' : 'Crea una solicitud para empezar a dar seguimiento.'} icon={isRegularUser ? 'ticket-outline' : 'search-outline'} action={<View style={styles.emptyActions}>{hasAnyFilter && !isRegularUser ? <Button onPress={clearAllFilters} icon="refresh-outline" compact>Limpiar filtros</Button> : null}<Button onPress={() => router.push('/new-ticket')} icon="add" compact>{isRegularUser ? 'Reportar problema' : 'Crear solicitud'}</Button></View>} />
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  return <Pressable onPress={onPress} style={[styles.filterChip, { backgroundColor: selected ? palette.primary : palette.surfaceSoft, borderColor: selected ? palette.primary : palette.line }]}><Text style={[styles.filterText, { color: selected ? '#FFFFFF' : palette.ink }]} numberOfLines={1}>{label}</Text></Pressable>;
}

function DateFilterField({ label, value, min, max, onChange }: { label: string; value: string; min?: string; max?: string; onChange: (value: string) => void }) {
  const { darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => value ? new Date(`${value}T12:00:00`) : new Date());
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const monthName = month.toLocaleDateString('es-NI', { month: 'long', year: 'numeric' });
  const firstDayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [...Array(firstDayOffset).fill(0), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const selectedDay = selected?.getFullYear() === year && selected.getMonth() === monthIndex ? selected.getDate() : null;
  const today = new Date();
  const todayDay = today.getFullYear() === year && today.getMonth() === monthIndex ? today.getDate() : null;
  const moveMonth = (offset: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const isoFor = (day: number) => `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const displayDate = value ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : 'dd/mm/aaaa';

  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value || 'sin seleccionar'}`} onPress={() => { setMonth(value ? new Date(`${value}T12:00:00`) : new Date()); setOpen(true); }} style={[styles.dateInput, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <Ionicons name="calendar-outline" size={15} color={palette.muted} /><Text style={[styles.dateValue, { color: value ? palette.ink : palette.muted }]}>{displayDate}</Text><Ionicons name="chevron-down" size={14} color={palette.muted} />
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.dateBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="Cerrar calendario" /><View style={[styles.calendarCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.calendarHeader, { borderBottomColor: palette.line }]}><View><Text style={[styles.calendarTitle, { color: palette.ink }]}>{label}</Text><Text style={[styles.calendarSubtitle, { color: palette.muted }]}>Selecciona una fecha</Text></View><Pressable onPress={() => setOpen(false)} accessibilityLabel="Cerrar calendario"><Ionicons name="close" size={20} color={palette.muted} /></Pressable></View>
        <View style={styles.calendarMonth}><Pressable onPress={() => moveMonth(-1)} style={styles.calendarArrow} accessibilityLabel="Mes anterior"><Ionicons name="chevron-back" size={17} color={palette.ink} /></Pressable><Text style={[styles.calendarMonthText, { color: palette.ink }]}>{monthName}</Text><Pressable onPress={() => moveMonth(1)} style={styles.calendarArrow} accessibilityLabel="Mes siguiente"><Ionicons name="chevron-forward" size={17} color={palette.ink} /></Pressable></View>
        <View style={styles.calendarGrid}>{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => <Text key={`${day}${index}`} style={[styles.calendarWeekday, { color: palette.muted }]}>{day}</Text>)}{cells.map((day, index) => {
          if (!day) return <View key={`blank-${index}`} style={styles.calendarDay} />;
          const iso = isoFor(day);
          const disabled = Boolean((min && iso < min) || (max && iso > max));
          const isSelected = day === selectedDay;
          const isToday = day === todayDay;
          return <Pressable key={iso} disabled={disabled} onPress={() => { onChange(iso); setOpen(false); }} style={[styles.calendarDay, isToday && { borderColor: palette.primary, borderWidth: 1 }, isSelected && { backgroundColor: palette.primary, borderColor: palette.primary }, disabled && { opacity: 0.3 }]}><Text style={[styles.calendarDayText, { color: isSelected ? '#FFFFFF' : palette.ink }]}>{day}</Text></Pressable>;
        })}</View>
        <View style={[styles.calendarFooter, { borderTopColor: palette.line }]}><Pressable onPress={() => { onChange(''); setOpen(false); }}><Text style={[styles.calendarActionText, { color: palette.muted }]}>Limpiar fecha</Text></Pressable><Pressable onPress={() => setOpen(false)}><Text style={[styles.calendarActionText, { color: palette.primaryDark }]}>Cerrar</Text></Pressable></View>
      </View></View>
    </Modal>
  </>;
}

function SummaryCard({ index, label, value, total, icon, color }: { index: number; label: string; value: number; total: number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  const { darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const reduceMotion = useReducedMotion();
  const [hover] = useState(() => new Animated.Value(0));
  const tint = color === colors.primary ? palette.skySoft : color === colors.amber ? palette.amberSoft : color === colors.indigo ? palette.indigoSoft : palette.greenSoft;
  const ratio = label === 'Total' ? (total ? 100 : 0) : total ? Math.round(value / total * 100) : 0;
  const setHover = (toValue: number) => {
    if (reduceMotion) { hover.setValue(0); return; }
    Animated.spring(hover, { toValue, stiffness: 320, damping: 25, useNativeDriver: Platform.OS !== 'web' }).start();
  };
  const translateY = hover.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  return (
    <AnimatedEntry style={styles.summaryEntry} delay={index * 30} duration={180} distance={8}>
      <Pressable accessible={false} onHoverIn={() => setHover(1)} onHoverOut={() => setHover(0)}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Surface style={[styles.summaryCard, { backgroundColor: tint, borderColor: `${color}55` }]}>
            <View style={styles.summaryTop}>
              <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
              <View style={[styles.summaryIcon, { backgroundColor: color }]}><Ionicons name={icon} size={16} color="#FFFFFF" /></View>
            </View>
            <Text style={styles.summaryValue}>{value}</Text>
            <AnimatedProgressBar value={ratio} color={color} height={6} delay={0} duration={400} trackColor={darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)'} />
            <Text style={styles.summaryCaption}>{label === 'Total' ? 'En vista actual' : label === 'Abiertos' ? 'Esperando técnico' : label === 'Cerrados' ? 'Finalizados' : 'En atención'}</Text>
          </Surface>
        </Animated.View>
      </Pressable>
    </AnimatedEntry>
  );
}

function StatusText({ status }: { status: string }) {
  const { darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const color = status === 'Completado' || status === 'Resuelto' ? colors.green : status === 'En Proceso' ? colors.indigo : status === 'Asignado' ? colors.primary : colors.amber;
  const tint = status === 'Completado' || status === 'Resuelto' ? palette.greenSoft : status === 'En Proceso' ? palette.indigoSoft : status === 'Asignado' ? palette.skySoft : palette.amberSoft;
  return <View style={[styles.status, { backgroundColor: tint, borderColor: `${color}66` }]}><Text style={[styles.statusText, { color }]}>{status}</Text></View>;
}

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 26, gap: 14, width: '100%', maxWidth: 1280, alignSelf: 'center' }, contentMobile: { paddingBottom: 112 },
  headingActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, headingActionsCompact: { width: '100%', justifyContent: 'flex-end' }, createButton: { minHeight: 40, borderRadius: 12, backgroundColor: colors.primary, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 5 }, createText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  primaryFilters: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }, searchInline: { flex: 1 }, scopeButton: { minHeight: 40, borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, scopeText: { fontSize: 11, fontWeight: '700' }, emptyActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, summaryEntry: { flex: 1, minWidth: 132 },
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
  dateInput: { minHeight: 42, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.surfaceSoft, paddingHorizontal: 10, color: colors.ink, fontSize: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dateValue: { flex: 1, fontSize: 12, fontWeight: '600' },
  dateBackdrop: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,6,23,0.55)' },
  calendarCard: { width: '100%', maxWidth: 380, borderWidth: 2, borderRadius: 18, padding: 16, gap: 10 },
  calendarHeader: { minHeight: 42, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 9 },
  calendarTitle: { fontSize: 15, fontWeight: '800' }, calendarSubtitle: { fontSize: 11, marginTop: 2 },
  calendarMonth: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, calendarMonthText: { fontSize: 14, fontWeight: '800', textTransform: 'capitalize' }, calendarArrow: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, calendarWeekday: { width: '14.285%', height: 30, textAlign: 'center', textAlignVertical: 'center', fontSize: 10, fontWeight: '800' }, calendarDay: { width: '14.285%', height: 38, borderWidth: 1, borderColor: 'transparent', borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, calendarDayText: { fontSize: 12, fontWeight: '700' },
  calendarFooter: { minHeight: 40, borderTopWidth: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 9 }, calendarActionText: { fontSize: 12, fontWeight: '800' },
  clearFilters: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end' },
  clearFiltersText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  table: { padding: 0, overflow: 'hidden' }, tableRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }, tableHeader: { minHeight: 43, backgroundColor: '#FAFBFD', borderBottomWidth: 1, borderBottomColor: colors.line }, tableHead: { color: colors.muted, fontSize: 10, fontWeight: '800' }, tableDivider: { borderTopWidth: 1, borderTopColor: colors.line }, rowPressed: { backgroundColor: '#F3F8FC' }, codeCol: { flex: .9, minWidth: 95 }, categoryCol: { flex: 1.15, minWidth: 115 }, subjectCol: { flex: 2.1, minWidth: 180 }, priorityCol: { flex: .65, minWidth: 62 }, stateCol: { flex: .9, minWidth: 83 }, techCol: { flex: 1.2, minWidth: 100 }, dateCol: { flex: .9, minWidth: 80 }, codeText: { color: colors.ink, fontSize: 11, fontWeight: '900' }, categoryCell: { flexDirection: 'row', alignItems: 'center', gap: 7 }, categoryIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' }, cellText: { color: colors.ink, fontSize: 11, fontWeight: '600' }, subjectCell: { gap: 3 }, subjectText: { color: colors.ink, fontSize: 12, fontWeight: '800' }, subjectMeta: { color: colors.muted, fontSize: 10 }, dateText: { color: colors.muted, fontSize: 10 }, status: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 8 }, statusText: { fontSize: 10, fontWeight: '800' },
});
