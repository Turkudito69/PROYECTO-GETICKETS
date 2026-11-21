import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '../../components/Icons';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { Text, AppTextInput as TextInput } from '../../components/Typography';
import { useSession } from '../../context/SessionContext';
import { api, OFFICE_3D_URL } from '../../lib/api';
import { initials, visibleTicketsFor } from '../../lib/tickets';
import { colors, getThemeColors, radius, space } from '../../theme';
import { useReducedMotion } from '../../lib/motion';
import type { SeatHistoryItem, SeatItem, SeatZone, TechnicianItem, TicketItem, UserItem } from '../../types';
import { AnimatedEntry, AnimatedProgressBar, Button, EmptyState, LoadingState, Notice, PageHeading, Screen, Surface } from '../../components/ui';
import OfficeScene from '../../components/OfficeScene';

const zones: string[] = ['Vista general', 'Soporte TI', 'Administración', 'Operaciones'];

export default function OfficeScreen() {
  const { user, darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianItem[]>([]);
  const [history, setHistory] = useState<SeatHistoryItem[]>([]);
  const [zone, setZone] = useState<string>('Vista general');
  const [selectedSeat, setSelectedSeat] = useState<SeatItem | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [seatName, setSeatName] = useState('');
  const [seatCode, setSeatCode] = useState('');
  const [newSeatZone, setNewSeatZone] = useState<SeatZone>('Operaciones');
  const [viewMode, setViewMode] = useState<'3d' | 'list'>(Platform.OS === 'web' ? '3d' : 'list');
  const [historyOpen, setHistoryOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const mobileNav = Platform.OS !== 'web' || width < 1024;
  const isAdmin = user?.rol === 'Administrador';
  const sceneHeight = width < 420 ? 285 : width < 760 ? 350 : width < 1080 ? 460 : 560;

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const [seatData, userData, historyData, ticketData, technicianData] = await Promise.all([
        api.getPuestos(),
        isAdmin ? api.getUsuarios() : Promise.resolve([] as UserItem[]),
        isAdmin ? api.getHistorialPuestos() : Promise.resolve([] as SeatHistoryItem[]),
        api.getTickets().catch(() => [] as TicketItem[]),
        isAdmin ? api.getTecnicos().catch(() => [] as TechnicianItem[]) : Promise.resolve([] as TechnicianItem[]),
      ]);
      const activeSeats = seatData.filter((item) => !item.estado || item.estado.toLocaleLowerCase() === 'activo');
      setSeats(activeSeats);
      setTickets(user ? visibleTicketsFor(user, ticketData) : []);
      setTechnicians(technicianData);
      setUsers(userData.filter((item) => item.estado === 'Activo'));
      setHistory(historyData);
      setSelectedSeat((current) => current ? activeSeats.find((item) => item.idPuesto === current.idPuesto) ?? null : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el mapa de puestos.');
    } finally { setLoading(false); }
  }, [isAdmin, user]);
  useFocusEffect(useCallback(() => { void load(true); }, [load]));

  const filtered = useMemo(() => zone === 'Vista general' ? seats : seats.filter((item) => item.zona === zone), [seats, zone]);
  const occupiedCount = seats.filter((item) => item.idUsuarioActual != null).length;
  const availableCount = seats.length - occupiedCount;
  const eligibleUsers = users.filter((item) => item.idUsuario !== selectedSeat?.idUsuarioActual);
  const selectedTechnician = technicians.find((item) => item.idUsuario === selectedSeat?.idUsuarioActual);
  const activeSeatTickets = selectedSeat ? tickets.filter((ticket) => {
    if (['Completado', 'Resuelto'].includes(ticket.estadoTicket)) return false;
    if (isAdmin) {
      if (selectedSeat.ocupanteRol === 'Tecnico' && selectedTechnician) return ticket.idTecnico === selectedTechnician.idTecnico;
      if (selectedSeat.ocupanteRol === 'Administrador') return ticket.estadoTicket === 'Abierto';
      return ticket.idUsuario === selectedSeat.idUsuarioActual;
    }
    if (selectedSeat.idUsuarioActual !== user?.idUsuario) return false;
    return user.rol === 'Tecnico' ? ticket.idTecnico === user.idTecnico : ticket.idUsuario === user.idUsuario;
  }) : [];
  const selectedSeatHistory = isAdmin ? history.filter((item) => item.idPuesto === selectedSeat?.idPuesto).slice(0, 4) : [];
  const canViewSelectedSeatTickets = isAdmin || selectedSeat?.idUsuarioActual === user?.idUsuario;

  const chooseSeat = (seat: SeatItem) => {
    setSelectedSeat(seat);
    setSelectedUserId(seat.idUsuarioActual);
    setMessage(null);
  };

  const saveAssignment = async () => {
    if (!selectedSeat || !user) return;
    setSaving(true); setError(null); setMessage(null);
    try {
      await api.assignSeat({ idPuesto: selectedSeat.idPuesto, idUsuario: selectedUserId, idUsuarioAccion: user.idUsuario, swap: true, motivo: selectedUserId == null ? 'Liberación desde la app móvil' : 'Asignación desde la app móvil' });
      setMessage('El puesto se actualizó correctamente.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo actualizar el puesto.'); }
    finally { setSaving(false); }
  };

  const createSeat = async () => {
    if (!user || !seatName.trim()) { setError('Escribe el nombre del puesto.'); return; }
    setSaving(true); setError(null); setMessage(null);
    try {
      await api.createSeat({ nombrePuesto: seatName.trim(), codigoPuesto: seatCode.trim() || undefined, zona: newSeatZone, idUsuarioAccion: user.idUsuario });
      setSeatName(''); setSeatCode(''); setCreateOpen(false); setMessage('El puesto se creó correctamente.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo crear el puesto.'); }
    finally { setSaving(false); }
  };

  return (
    <Screen safeTop={false}>
      <ScrollView contentContainerStyle={[styles.content, mobileNav && styles.contentMobile]} showsVerticalScrollIndicator={false}>
        <PageHeading title="Oficina 3D y Control de Puestos" subtitle={isAdmin ? 'Planta interactiva para gestionar puestos e historial de ocupación.' : 'Consulta los puestos, las zonas y la ocupación actual.'} right={<View style={[styles.headingActions, width < 640 && styles.headingActionsCompact]}>{isAdmin ? <Pressable style={[styles.historyButton, { backgroundColor: palette.surface, borderColor: palette.line }]} onPress={() => setHistoryOpen(true)}><Ionicons name="time-outline" size={16} color={colors.primaryDark} /><Text style={styles.historyButtonText}>Historial de puestos</Text></Pressable> : null}{isAdmin ? <Pressable style={styles.addButton} onPress={() => { setCreateOpen((open) => !open); setError(null); }}><Ionicons name="add" size={17} color={colors.onPrimary} /><Text style={styles.addButtonText}>Nuevo puesto</Text></Pressable> : null}<Pressable style={[styles.reload, { backgroundColor: palette.surface, borderColor: palette.line }]} onPress={() => void load()} accessibilityLabel="Actualizar puestos"><Ionicons name="refresh" size={18} color={colors.primaryDark} /></Pressable></View>} />
        <Surface style={[styles.hero, { backgroundColor: palette.navy, borderColor: palette.line }]}>
          <View style={styles.heroIcon}><Ionicons name="business-outline" size={23} color={colors.primary} /></View>
          <View style={styles.heroCopy}><Text style={styles.heroTitle}>Planta interactiva</Text><Text style={styles.heroSub}>Selecciona un escritorio para ver a quién está asignado.</Text></View>
          <View style={styles.heroCount}><Text style={styles.heroCountValue}>{occupiedCount}/{seats.length}</Text><Text style={styles.heroCountLabel}>ocupados</Text></View>
          <AnimatedProgressBar value={seats.length ? Math.round(occupiedCount / seats.length * 100) : 0} color={colors.primary} height={7} delay={100} trackColor="#E7EDF3" style={styles.progressTrack} />
        </Surface>

        <View style={styles.summaryRow}>
          <Surface style={styles.summaryCard}><Text style={styles.summaryValue}>{occupiedCount}</Text><Text style={styles.summaryLabel}>Ocupados</Text></Surface>
          <Surface style={styles.summaryCard}><Text style={[styles.summaryValue, { color: colors.green }]}>{availableCount}</Text><Text style={styles.summaryLabel}>Disponibles</Text></Surface>
          <Surface style={styles.summaryCard}><Text style={styles.summaryValue}>{seats.length}</Text><Text style={styles.summaryLabel}>Total</Text></Surface>
        </View>

        <View style={styles.mapHeader}><View style={styles.mapHeadingCopy}><Text style={styles.sectionTitle}>{zone === 'Vista general' ? Platform.OS === 'web' ? 'Planta de la oficina' : 'Puestos de la oficina' : zone}</Text><Text style={styles.sectionCaption}>Toca un escritorio para ver sus detalles.</Text></View>{Platform.OS === 'web' ? <View style={[styles.viewSwitch, { backgroundColor: palette.surface, borderColor: palette.line }]}><Pressable onPress={() => setViewMode('3d')} style={[styles.viewOption, viewMode === '3d' && { backgroundColor: palette.skySoft }]}><Ionicons name="cube-outline" size={14} color={viewMode === '3d' ? colors.primaryDark : palette.muted} /><Text style={[styles.viewOptionText, viewMode === '3d' && styles.viewOptionTextActive]}>{'3D'}</Text></Pressable><Pressable onPress={() => setViewMode('list')} style={[styles.viewOption, viewMode === 'list' && { backgroundColor: palette.skySoft }]}><Ionicons name="list-outline" size={14} color={viewMode === 'list' ? colors.primaryDark : palette.muted} /><Text style={[styles.viewOptionText, viewMode === 'list' && styles.viewOptionTextActive]}>Lista</Text></Pressable></View> : null}</View>
        {viewMode === 'list' ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneList}>{zones.map((item) => { const selected = zone === item; return <Pressable key={item} onPress={() => setZone(item)} style={[styles.newZoneChip, { backgroundColor: selected ? palette.skySoft : palette.surface, borderColor: selected ? colors.primary : palette.line }]}><Text style={[styles.newZoneText, { color: selected ? colors.primaryDark : palette.ink }]}>{item}</Text></Pressable>; })}</ScrollView> : null}

        {createOpen && isAdmin ? <Surface style={styles.assignment}>
          <View><Text style={styles.sectionTitle}>Nuevo puesto de trabajo</Text><Text style={styles.sectionCaption}>Añade un espacio a una zona de la oficina.</Text></View>
          <View style={styles.field}><Text style={styles.chooseLabel}>Nombre del puesto</Text><TextInput value={seatName} onChangeText={setSeatName} placeholder="Ej. Mesa de soporte 06" placeholderTextColor={palette.muted} style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.line, color: palette.ink }]} /></View>
          <View style={styles.field}><Text style={styles.chooseLabel}>Código (opcional)</Text><TextInput value={seatCode} onChangeText={setSeatCode} placeholder="Ej. TI-06" placeholderTextColor={palette.muted} style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.line, color: palette.ink }]} autoCapitalize="characters" /></View>
          <Text style={styles.chooseLabel}>Zona</Text><View style={styles.newZoneRow}>{(['Soporte TI', 'Administración', 'Operaciones'] as SeatZone[]).map((item) => { const selected = newSeatZone === item; return <Pressable key={item} onPress={() => setNewSeatZone(item)} style={[styles.newZoneChip, { backgroundColor: selected ? palette.skySoft : palette.surfaceSoft, borderColor: selected ? colors.primary : palette.line }]}><Text style={[styles.newZoneText, { color: selected ? colors.primaryDark : palette.ink }]}>{item}</Text></Pressable>; })}</View>
          <View style={styles.formActions}><Button onPress={() => setCreateOpen(false)} variant="secondary" compact>Cancelar</Button><Button onPress={() => void createSeat()} disabled={saving} icon="add" compact>{saving ? 'Guardando…' : 'Crear puesto'}</Button></View>
        </Surface> : null}

        {error ? <Notice message={error} /> : null}
        {message ? <Notice message={message} tone="success" /> : null}
        {loading ? <LoadingState label="Cargando puestos…" /> : viewMode === '3d' ? <>
          <View style={[styles.sceneFrame, { height: sceneHeight }]}>
            <AnimatedEntry key={zone} style={styles.sceneContent}>
              {Platform.OS === 'web'
                ? <OfficeScene seats={filtered} tickets={tickets} technicians={technicians} selectedSeatId={selectedSeat?.idPuesto ?? null} onSelectSeat={chooseSeat} height={sceneHeight} />
                : <WebView
                    key={zone}
                    source={{ uri: `${OFFICE_3D_URL}?zone=${encodeURIComponent(zone)}` }}
                    javaScriptEnabled
                    domStorageEnabled
                    originWhitelist={['*']}
                    style={styles.webOffice}
                    onMessage={(event: WebViewMessageEvent): void => {
                      try {
                        const message = JSON.parse(event.nativeEvent.data) as { type?: string; idPuesto?: number };
                        const seat = message.type === 'seatSelected' ? seats.find((item) => item.idPuesto === message.idPuesto) : undefined;
                        if (seat) chooseSeat(seat);
                      } catch { /* Ignore messages that do not contain the seat selection payload. */ }
                    }}
                  />}
            </AnimatedEntry>
            <View style={styles.sceneOccupancy}><View style={styles.sceneOccupancyDot} /><Text style={styles.sceneOccupancyText}>{occupiedCount} ocupados · {availableCount} libres</Text></View>
            <View style={styles.sceneControls}>
              <View style={styles.controlsHeading}><Ionicons name="desktop-outline" size={13} color="#AEBBD1" /><Text style={styles.controlsLabel}>Zonas:</Text></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneList}>{zones.map((item) => <Pressable key={item} onPress={() => setZone(item)} style={[styles.zoneChip, zone === item && styles.zoneChipActive]}><Text style={[styles.zoneText, zone === item && styles.zoneTextActive]}>{item}</Text></Pressable>)}</ScrollView>
              <View style={styles.sceneHint}><Ionicons name="hand-left-outline" size={12} color="#AEBBD1" /><Text style={styles.sceneHintText}>Arrastra para girar · toca un puesto para consultar</Text></View>
            </View>
          </View>
          <View style={styles.legend}><LegendDot color={colors.indigo} label="Ocupado" /><LegendDot color={colors.green} label="Disponible" /></View>
          {filtered.length === 0 ? <Surface><EmptyState title="Todavía no hay puestos" description="La planta está lista. Administración puede crear el primer espacio con el botón Nuevo." icon="business-outline" /></Surface> : null}
        </> : filtered.length === 0 ? (
          <Surface><EmptyState title="Todavía no hay puestos" description="Cuando el administrador registre puestos, aparecerán aquí agrupados por zona." icon="business-outline" /></Surface>
        ) : (
          <View style={styles.seatGrid}>{filtered.map((seat) => {
            const occupied = seat.idUsuarioActual != null;
            const active = selectedSeat?.idPuesto === seat.idPuesto;
            return <Pressable key={seat.idPuesto} onPress={() => chooseSeat(seat)} style={[styles.seatCard, { backgroundColor: occupied ? palette.surface : palette.greenSoft, borderColor: active ? colors.primary : occupied ? palette.line : darkMode ? `${colors.green}66` : '#A4E8D1', borderWidth: active ? 2 : 1 }]}>
              <View style={styles.seatTop}><View style={[styles.seatIcon, { backgroundColor: occupied ? palette.indigoSoft : palette.greenSoft }]}><Ionicons name={occupied ? 'person' : 'person-add-outline'} size={17} color={occupied ? colors.indigo : colors.green} /></View><View style={[styles.seatDot, { backgroundColor: occupied ? colors.indigo : colors.green }]} /></View>
              <Text style={styles.seatCode}>{seat.codigoPuesto || `Puesto ${seat.idPuesto}`}</Text><Text style={styles.seatName} numberOfLines={1}>{seat.nombrePuesto}</Text><Text style={styles.seatOccupant} numberOfLines={1}>{seat.ocupanteNombre || 'Disponible'}</Text><Text style={styles.seatZone}>{seat.zona}</Text>
            </Pressable>;
          })}</View>
        )}

        {selectedSeat ? <Surface style={styles.assignment}>
          <View style={styles.assignmentTitleRow}><View><Text style={styles.sectionTitle}>{selectedSeat.codigoPuesto} · {selectedSeat.nombrePuesto}</Text><Text style={styles.sectionCaption}>{selectedSeat.zona} · {selectedSeat.ocupanteNombre || 'Puesto libre'}</Text></View><Pressable onPress={() => setSelectedSeat(null)} accessibilityLabel="Cerrar detalle del puesto"><Ionicons name="close" size={20} color={palette.muted} /></Pressable></View>
          {canViewSelectedSeatTickets ? activeSeatTickets.length ? <View style={styles.stationTickets}><Text style={styles.chooseLabel}>Tickets activos del puesto</Text>{activeSeatTickets.map((ticket) => <Pressable key={ticket.idTicket} onPress={() => router.push(`/ticket/${ticket.idTicket}`)} style={[styles.stationTicket, { backgroundColor: palette.surfaceSoft, borderColor: palette.line }]}><Ionicons name="ticket-outline" size={14} color={colors.primaryDark} /><Text style={styles.stationTicketCode}>{ticket.tickets}</Text><Text numberOfLines={1} style={styles.stationTicketDescription}>{ticket.descripcion}</Text><Text style={styles.stationTicketState}>{ticket.estadoTicket}</Text></Pressable>)}</View> : <Text style={styles.readOnlyNote}>No hay tickets activos para este puesto.</Text> : null}
          {isAdmin && selectedSeatHistory.length ? <View style={styles.stationHistory}><View style={styles.assignmentTitleRow}><Text style={styles.chooseLabel}>Ocupantes anteriores</Text><Pressable onPress={() => setHistoryOpen(true)}><Text style={styles.historyLink}>Ver historial</Text></Pressable></View>{selectedSeatHistory.map((item) => <View key={item.idHistorial} style={styles.stationHistoryRow}><Ionicons name="time-outline" size={13} color={colors.muted} /><Text style={styles.stationHistoryText}>{item.nombreUsuario} · {item.motivo || item.accion}</Text></View>)}</View> : null}
          {isAdmin ? <>
            <Text style={styles.chooseLabel}>Asignar colaborador</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.userChoices}>
              <Pressable onPress={() => setSelectedUserId(null)} style={[styles.userChip, { backgroundColor: selectedUserId == null ? palette.skySoft : palette.surfaceSoft, borderColor: selectedUserId == null ? colors.primary : palette.line }]}><Ionicons name="remove-circle-outline" size={15} color={selectedUserId == null ? colors.ink : palette.muted} /><Text style={[styles.userChipText, { color: selectedUserId == null ? palette.ink : palette.muted }]}>Dejar libre</Text></Pressable>
              {eligibleUsers.map((item) => { const selected = selectedUserId === item.idUsuario; return <Pressable key={item.idUsuario} onPress={() => setSelectedUserId(item.idUsuario)} style={[styles.userChip, { backgroundColor: selected ? palette.skySoft : palette.surfaceSoft, borderColor: selected ? colors.primary : palette.line }]}><Text style={[styles.userChipText, { color: selected ? palette.ink : palette.muted }]}>{item.nombre} {item.apellido}</Text></Pressable>; })}
            </ScrollView>
            <View style={styles.assignmentActions}><View style={styles.assignmentActionButton}><Button onPress={() => void saveAssignment()} disabled={saving} icon="swap-horizontal-outline" compact>{saving ? 'Guardando…' : selectedUserId == null ? 'Liberar puesto' : 'Cambiar / Reasignar'}</Button></View><Pressable onPress={() => router.push('/(tabs)/catalogs')} style={styles.addCollaborator}><Ionicons name="person-add-outline" size={15} color={colors.primaryDark} /><Text style={styles.addCollaboratorText}>Agregar colaborador</Text></Pressable></View>
          </> : <Text style={styles.readOnlyNote}>Solo administración puede cambiar las asignaciones.</Text>}
        </Surface> : null}

      </ScrollView>
      <Modal visible={historyOpen && isAdmin} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => setHistoryOpen(false)}>
        <View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={() => setHistoryOpen(false)} accessibilityLabel="Cerrar historial" /><View style={[styles.historyModal, { backgroundColor: palette.surface, borderColor: palette.line }]}><View style={[styles.modalTitleRow, { borderBottomColor: palette.line }]}><View><Text style={styles.modalTitle}>Historial general de ocupación</Text><Text style={styles.modalSubtitle}>{history.length} movimientos recientes</Text></View><Pressable onPress={() => setHistoryOpen(false)} accessibilityLabel="Cerrar"><Ionicons name="close" size={21} color={palette.muted} /></Pressable></View><ScrollView style={styles.modalScroll}>{history.length ? history.map((item, index) => <View key={item.idHistorial} style={[styles.modalHistoryItem, index > 0 && [styles.historyBorder, { borderTopColor: palette.line }]]}><View style={styles.modalAvatar}><Text style={styles.modalAvatarText}>{initials(item.nombreUsuario || 'Puesto', '')}</Text></View><View style={styles.historyCopy}><Text style={styles.historyTitle}>{item.codigoPuesto} · {item.nombreUsuario || 'Puesto libre'}</Text><Text style={styles.historyDescription}>{item.motivo || item.accion}</Text><Text style={styles.historyDate}>{formatShortDate(item.fechaInicio)} · {item.accion}</Text></View><View style={[styles.currentTag, { backgroundColor: palette.greenSoft }]}><Text style={styles.currentTagText}>Registrado</Text></View></View>) : <EmptyState title="Sin movimientos registrados" description="Los cambios de puesto aparecerán aquí." icon="time-outline" />}</ScrollView></View></View>
      </Modal>
    </Screen>
  );
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '—';
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' }).format(date);
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: color }]} /><Text style={styles.legendLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 32, gap: 16, width: '100%', maxWidth: 1280, alignSelf: 'center' }, contentMobile: { paddingBottom: 112 }, headingActions: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }, headingActionsCompact: { width: '100%' }, historyButton: { minHeight: 40, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 6 }, historyButtonText: { color: colors.ink, fontSize: 11, fontWeight: '700' }, addButton: { minHeight: 40, paddingHorizontal: 12, backgroundColor: colors.primary, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 4 }, addButtonText: { color: colors.onPrimary, fontSize: 11, fontWeight: '900' },
  reload: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', backgroundColor: colors.navy, borderColor: colors.navy },
  heroIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#24406A', alignItems: 'center', justifyContent: 'center' }, heroCopy: { flex: 1, minWidth: 150 }, heroTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 }, heroSub: { color: '#D2DCEB', fontSize: 12, marginTop: 3 },
  heroCount: { alignItems: 'flex-end' }, heroCountValue: { color: '#6EE7B7', fontWeight: '900', fontSize: 20 }, heroCountLabel: { color: '#D2DCEB', fontSize: 11 }, progressTrack: { height: 5, backgroundColor: '#45546E', borderRadius: 4, width: '100%', overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: colors.green, borderRadius: 4 },
  summaryRow: { flexDirection: 'row', gap: 9 }, summaryCard: { flex: 1, paddingVertical: 12, alignItems: 'center', gap: 3, borderWidth: 1, borderColor: colors.line }, summaryValue: { fontSize: 22, fontWeight: '900', color: colors.ink }, summaryLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  zoneList: { gap: 7, paddingHorizontal: 2, alignItems: 'center' }, zoneChip: { minHeight: 33, borderRadius: 9, justifyContent: 'center', paddingHorizontal: 11, backgroundColor: '#252A3B' }, zoneChipActive: { backgroundColor: '#00A6E8' }, zoneText: { color: '#D0D8E6', fontSize: 10, fontWeight: '800' }, zoneTextActive: { color: '#FFFFFF' },
  mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, mapHeadingCopy: { flex: 1, minWidth: 0 }, viewSwitch: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 11, padding: 3 }, viewOption: { minHeight: 31, paddingHorizontal: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }, viewOptionActive: { backgroundColor: colors.skySoft }, viewOptionText: { color: colors.muted, fontSize: 10, fontWeight: '800' }, viewOptionTextActive: { color: colors.primaryDark }, legend: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, legendColor: { width: 8, height: 8, borderRadius: 4 }, legendLabel: { color: colors.muted, fontSize: 10 }, legendHint: { flex: 1, color: colors.muted, fontSize: 9, textAlign: 'right' },
  sceneFrame: { width: '100%', position: 'relative', borderRadius: 18, overflow: 'hidden', backgroundColor: '#E8EFF7', borderWidth: 1, borderColor: colors.line }, sceneContent: { flex: 1 }, sceneOccupancy: { position: 'absolute', top: 14, left: 14, minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#111827E8', zIndex: 3 }, sceneOccupancyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }, sceneOccupancyText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' }, sceneControls: { position: 'absolute', left: '8%', right: '8%', bottom: 12, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 15, backgroundColor: '#111827F2', gap: 8, zIndex: 4 }, controlsHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 }, controlsLabel: { color: '#AEBBD1', fontSize: 10, fontWeight: '700' }, sceneHint: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 7, borderTopWidth: 1, borderTopColor: '#3C465A' }, sceneHintText: { color: '#AEBBD1', fontSize: 9 },
  webOffice: { flex: 1, backgroundColor: 'transparent' }, stationTickets: { gap: 7 }, stationTicket: { minHeight: 38, paddingHorizontal: 9, borderRadius: 9, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 7 }, stationTicketCode: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' }, stationTicketDescription: { flex: 1, minWidth: 20, color: colors.ink, fontSize: 10 }, stationTicketState: { color: colors.indigo, fontSize: 9, fontWeight: '800' }, stationHistory: { gap: 6 }, stationHistoryRow: { flexDirection: 'row', gap: 6, alignItems: 'center' }, stationHistoryText: { flex: 1, color: colors.muted, fontSize: 10 }, historyLink: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' }, assignmentActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, assignmentActionButton: { flexGrow: 1, flexBasis: 180 }, addCollaborator: { minHeight: 38, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, addCollaboratorText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, seatCard: { width: '46%', minWidth: 145, flexGrow: 1, borderWidth: 1, borderRadius: 16, padding: 13, gap: 5 }, seatAvailable: { backgroundColor: colors.greenSoft, borderColor: '#A4E8D1' }, seatOccupied: { backgroundColor: colors.surface, borderColor: colors.line }, seatSelected: { borderColor: colors.primary, borderWidth: 2 }, seatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }, seatIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }, seatDot: { width: 8, height: 8, borderRadius: 4 }, seatCode: { color: colors.primaryDark, fontWeight: '900', fontSize: 12 }, seatName: { color: colors.ink, fontWeight: '800', fontSize: 14 }, seatOccupant: { color: colors.muted, fontSize: 11 }, seatZone: { color: colors.muted, fontSize: 10, marginTop: 3 },
  assignment: { gap: 14 }, assignmentTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }, sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, sectionCaption: { color: colors.muted, fontSize: 11, marginTop: 3 }, chooseLabel: { color: colors.ink, fontWeight: '800', fontSize: 12 }, userChoices: { gap: 8 }, userChip: { minHeight: 38, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceSoft, paddingHorizontal: 12, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' }, userChipSelected: { borderColor: colors.primary, backgroundColor: colors.skySoft }, userChipText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, userChipTextSelected: { color: colors.ink }, readOnlyNote: { color: colors.muted, fontSize: 12 },
  field: { gap: 6 }, input: { minHeight: 45, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: colors.surfaceSoft, paddingHorizontal: 12, color: colors.ink, fontSize: 13 }, newZoneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, newZoneChip: { minHeight: 33, borderRadius: 9, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 11 }, newZoneText: { fontSize: 10, fontWeight: '800' }, formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  historyList: { paddingVertical: 3 }, historyItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 }, historyBorder: { borderTopWidth: 1, borderTopColor: colors.line }, historyIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' }, historyCopy: { flex: 1, gap: 3 }, historyTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' }, historyDescription: { color: colors.muted, fontSize: 11 }, historyDate: { color: colors.muted, fontSize: 10 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: '#10182799' }, historyModal: { width: '100%', maxWidth: 620, maxHeight: '82%', overflow: 'hidden', borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }, modalTitleRow: { minHeight: 69, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, modalTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, modalSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 }, modalScroll: { paddingHorizontal: 18 }, modalHistoryItem: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }, modalAvatar: { width: 39, height: 39, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, modalAvatarText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, currentTag: { backgroundColor: colors.greenSoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 }, currentTagText: { color: colors.green, fontSize: 9, fontWeight: '800' },
});
