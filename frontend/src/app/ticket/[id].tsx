import { useCallback, useState } from 'react';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../components/Typography';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import { colors, space } from '../../theme';
import type { ActivityItem, TechnicianItem, TicketDetail } from '../../types';
import { AnimatedEntry, Button, EmptyState, Field, LoadingState, Notice, Screen, StatusPill, Surface, formatDate } from '../../components/ui';

export default function TicketDetailScreen() {
  const { id: routeId, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const id = Number(routeId);
  const { width } = useWindowDimensions();
  const { user } = useSession();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianItem[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<number | null>(null);
  const [observation, setObservation] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [solution, setSolution] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(created === '1' ? 'Ticket creado correctamente.' : null);

  const load = useCallback(async (quiet = false) => {
    if (!user || !id) return;
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const [allTickets, detail, history, techList] = await Promise.all([
        api.getTickets(), api.getTicketDetail(id), api.getSeguimiento(id),
        user.rol === 'Administrador' ? api.getTecnicos() : Promise.resolve([] as TechnicianItem[]),
      ]);
      const base = allTickets.find((item) => item.idTicket === id);
      setTicket(detail ? { ...detail, ...base, ...detail, idUsuario: base?.idUsuario ?? detail.idUsuario, idTecnico: base?.idTecnico ?? detail.idTecnico } : base ?? null);
      setActivities(history);
      setTechnicians(techList.filter((item) => !item.estado || item.estado.toLocaleLowerCase() === 'activo'));
      setSelectedTechnician((current) => current ?? techList.find((item) => !item.estado || item.estado.toLocaleLowerCase() === 'activo')?.idTecnico ?? null);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar el ticket.'); }
    finally { setLoading(false); }
  }, [id, user]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (!user) return <Redirect href="/login" />;

  const status = ticket?.estadoTicket.toLocaleLowerCase() ?? '';
  const isAdmin = user.rol === 'Administrador';
  const isAssignedTechnician = user.rol === 'Tecnico' && ticket?.idTecnico === user.idTecnico;
  const canConfirmResolution = status === 'resuelto' && (isAdmin || ticket?.idUsuario === user.idUsuario);
  const canAssign = isAdmin && status === 'abierto' && ticket?.idTecnico == null;
  const canStart = isAssignedTechnician && status === 'asignado';
  const canWork = isAssignedTechnician && status === 'en proceso';

  const perform = async (action: () => Promise<unknown>, message: string) => {
    setActionLoading(true); setError(null); setSuccess(null);
    try { await action(); setSuccess(message); await load(true); return true; }
    catch (err) { setError(err instanceof Error ? err.message : 'La acción no se pudo completar.'); return false; }
    finally { setActionLoading(false); }
  };

  if (loading) return <Screen><LoadingState label="Cargando detalle del ticket…" /></Screen>;
  if (!ticket) return <Screen scroll contentStyle={styles.content}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={18} color={colors.primaryDark} /><Text style={styles.backText}>Volver</Text></Pressable><EmptyState title="No encontramos el ticket" description={error || 'Puede que la solicitud ya no esté disponible.'} icon="alert-circle-outline" /></Screen>;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={18} color={colors.primaryDark} /><Text style={styles.backText}>Volver a tickets</Text></Pressable>
        <View style={styles.headingRow}><View style={styles.headingCopy}><Text style={styles.eyebrow}>{ticket.tickets || `TICKET #${ticket.idTicket}`}</Text><Text style={styles.title}>Detalle de solicitud</Text></View><StatusPill status={ticket.estadoTicket} /></View>
        {error ? <Notice message={error} /> : null}
        {success ? <Notice message={success} tone="success" /> : null}

        <AnimatedEntry>
          <TicketProgress status={ticket.estadoTicket} width={width} />
        </AnimatedEntry>

        <Surface style={styles.summary}>
          <Text style={styles.description}>{ticket.descripcion || 'Sin descripción registrada.'}</Text>
          <View style={styles.separator} />
          <DetailRow icon="grid-outline" label="Categoría" value={ticket.categoria || 'Sin categoría'} />
          <DetailRow icon="flag-outline" label="Prioridad" value={ticket.prioridad || 'Sin prioridad'} />
          <DetailRow icon="calendar-outline" label="Fecha de creación" value={formatDate(ticket.fechaCreacion)} />
          {ticket.fechaSolucion ? <DetailRow icon="checkmark-circle-outline" label="Fecha de solución" value={formatDate(ticket.fechaSolucion)} /> : null}
          <DetailRow icon="person-outline" label="Solicitante" value={ticket.solicitante || `Usuario #${ticket.idUsuario}`} />
          <DetailRow icon="construct-outline" label="Técnico asignado" value={ticket.tecnico || 'Pendiente de asignación'} />
        </Surface>

        {canAssign ? <Surface style={styles.actionCard}>
          <Text style={styles.sectionTitle}>Asignar técnico</Text><Text style={styles.hint}>Selecciona quién atenderá este caso.</Text>
          {technicians.length ? <View style={styles.technicianList}>{technicians.map((tech) => {
            const selected = selectedTechnician === tech.idTecnico;
            return <Pressable key={tech.idTecnico} onPress={() => setSelectedTechnician(tech.idTecnico)} style={[styles.technician, selected && styles.technicianSelected]}><Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected ? colors.primaryDark : colors.muted} /><View style={styles.techText}><Text style={styles.techName}>{tech.nombre} {tech.apellido}</Text><Text style={styles.techSpecialty}>{tech.especialidad || tech.correo}</Text></View></Pressable>;
          })}</View> : <Text style={styles.hint}>No hay técnicos activos devueltos por la API.</Text>}
          <Button onPress={() => selectedTechnician && void perform(() => api.assignTicket({ idTicket: id, idTecnico: selectedTechnician, idUsuario: user.idUsuario }), 'Técnico asignado correctamente.')} loading={actionLoading} disabled={!selectedTechnician} icon="person-add-outline">Asignar ticket</Button>
        </Surface> : null}

        {canStart ? <Surface style={styles.actionCard}><Text style={styles.sectionTitle}>Atención del ticket</Text><Text style={styles.hint}>Inicia el trabajo para registrar el avance.</Text><Button onPress={() => void perform(() => api.startAttention({ idTicket: id, idUsuario: user.idUsuario }), 'La atención se inició correctamente.')} loading={actionLoading} icon="play-outline">Iniciar atención</Button></Surface> : null}

        {canWork ? <Surface style={styles.actionCard}>
          <Text style={styles.sectionTitle}>Actualizar atención</Text><Text style={styles.hint}>Documenta el avance o registra la solución.</Text>
          <Field label="Nueva observación" value={observation} onChangeText={setObservation} placeholder="Describe qué se revisó o qué falta…" multiline />
          <Button variant="secondary" onPress={() => {
            if (!observation.trim()) { setError('Escribe una observación antes de guardarla.'); return; }
            void perform(() => api.addObservation({ idTicket: id, idUsuario: user.idUsuario, observacion: observation.trim() }), 'Observación guardada.').then((saved) => { if (saved) setObservation(''); });
          }} loading={actionLoading} icon="chatbubble-ellipses-outline">Guardar observación</Button>
          <View style={styles.separator} />
          <Text style={styles.sectionTitle}>Resolver ticket</Text>
          <Field label="Diagnóstico" value={diagnosis} onChangeText={setDiagnosis} placeholder="¿Cuál fue la causa del problema?" multiline />
          <Field label="Solución aplicada" value={solution} onChangeText={setSolution} placeholder="¿Qué se hizo para resolverlo?" multiline />
          <Button onPress={() => {
            if (!diagnosis.trim() || !solution.trim()) { setError('Completa el diagnóstico y la solución para finalizar.'); return; }
            void perform(() => api.finishTicket({ idTicket: id, idUsuario: user.idUsuario, diagnostico: diagnosis.trim(), solucion: solution.trim() }), 'Ticket marcado como resuelto.').then((saved) => { if (saved) { setDiagnosis(''); setSolution(''); } });
          }} loading={actionLoading} icon="checkmark-done-outline">Marcar como resuelto</Button>
        </Surface> : null}

        {canConfirmResolution ? <Surface style={styles.actionCard}>
          <Text style={styles.sectionTitle}>¿La solución resolvió el problema?</Text>
          <Text style={styles.hint}>Confirma el cierre o indica por qué debe reabrirse.</Text>
          <Button onPress={() => void perform(
            () => api.confirmComplete({ idTicket: id, idUsuario: user.idUsuario }),
            'Ticket confirmado como completado.'
          )} loading={actionLoading} icon="checkmark-done-outline">Confirmar solución</Button>
          <View style={styles.separator} />
          <Field label="Motivo para reabrir" value={reopenReason} onChangeText={setReopenReason} placeholder="Describe qué problema continúa…" multiline />
          <Button variant="secondary" onPress={() => {
            const motivo = reopenReason.trim();
            if (!motivo) { setError('Escribe el motivo para reabrir el ticket.'); return; }
            if (motivo.length > 200) { setError('El motivo no debe superar los 200 caracteres.'); return; }
            void perform(
              () => api.reopenTicket({ idTicket: id, idUsuario: user.idUsuario, motivo }),
              'Ticket reabierto para continuar la atención.'
            ).then((reopened) => { if (reopened) setReopenReason(''); });
          }} loading={actionLoading} icon="refresh-outline">Reabrir ticket</Button>
        </Surface> : null}

        {status === 'resuelto' ? <Notice message="El técnico registró una solución para este ticket." tone="success" /> : null}

        <View style={styles.sectionHead}><View><Text style={styles.sectionTitle}>Historial de actividad</Text><Text style={styles.hint}>Actualizaciones registradas en la API.</Text></View></View>
        {activities.length ? activities.map((item) => <Surface key={item.idSeguimientoTicket} style={styles.historyCard}><View style={styles.timelineDot} /><View style={styles.historyContent}><View style={styles.historyTop}><Text style={styles.historyTitle}>{item.titulo || 'Actualización'}</Text><Text style={styles.historyDate}>{formatDate(item.fechaSeguimiento)}</Text></View><Text style={styles.historyDescription}>{item.descripcion || 'Sin descripción.'}</Text><Text style={styles.historyOwner}>{item.responsable || 'Sistema'}</Text></View></Surface>) : <Surface><EmptyState title="Sin actualizaciones" description="El historial aparecerá aquí cuando se registren cambios." icon="time-outline" /></Surface>}
      </ScrollView>
    </Screen>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <View style={styles.detailRow}><View style={styles.detailIcon}><Ionicons name={icon} size={16} color={colors.primaryDark} /></View><View style={styles.detailText}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View></View>;
}

const progressSteps = [
  { label: 'Recibido', hint: 'En cola' },
  { label: 'Asignado', hint: 'Con técnico' },
  { label: 'En atención', hint: 'Trabajando' },
  { label: 'Resuelto', hint: 'Por confirmar' },
  { label: 'Completado', hint: 'Confirmado' },
];

function TicketProgress({ status, width }: { status: string; width: number }) {
  const normalized = status.toLocaleLowerCase();
  const activeIndex = normalized.includes('complet') || normalized.includes('cerrad') ? 4
    : normalized.includes('resuelt') ? 3
      : normalized.includes('proceso') || normalized.includes('atenci') ? 2
        : normalized.includes('asign') ? 1 : 0;
  const minWidth = Math.max(350, Math.min(width - 56, 700));

  return <Surface style={styles.progressCard}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.progressTrack, { minWidth }]}>
      {progressSteps.map((step, index) => {
        const reached = index <= activeIndex;
        return <View key={step.label} style={styles.progressItem} accessibilityLabel={`${step.label}: ${reached ? 'alcanzado' : 'pendiente'}`}>
          <View style={styles.progressNodeLine}>
            {index > 0 ? <View style={[styles.progressConnector, index <= activeIndex && styles.progressConnectorActive]} /> : null}
            <View style={[styles.progressNode, reached && styles.progressNodeActive]}><Text style={[styles.progressNumber, reached && styles.progressNumberActive]}>{index + 1}</Text></View>
            {index < progressSteps.length - 1 ? <View style={[styles.progressConnector, index < activeIndex && styles.progressConnectorActive]} /> : null}
          </View>
          <Text style={[styles.progressLabel, reached && styles.progressLabelActive]} numberOfLines={1}>{step.label}</Text>
          <Text style={styles.progressHint} numberOfLines={1}>{step.hint}</Text>
        </View>;
      })}
    </ScrollView>
  </Surface>;
}

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 30, gap: 14, width: '100%', maxWidth: 980, alignSelf: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, minHeight: 38 },
  backText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingCopy: { flex: 1, gap: 3 },
  eyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 23, lineHeight: 29, fontWeight: '900' },
  summary: { gap: 12 },
  progressCard: { paddingVertical: 13, paddingHorizontal: 10 },
  progressTrack: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  progressItem: { flex: 1, minWidth: 68, alignItems: 'center', gap: 3 },
  progressNodeLine: { width: '100%', minHeight: 30, flexDirection: 'row', alignItems: 'center' },
  progressNode: { width: 26, height: 26, borderRadius: 9, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  progressNodeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  progressNumber: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  progressNumberActive: { color: colors.onPrimary },
  progressConnector: { flex: 1, height: 3, backgroundColor: colors.line, borderRadius: 3, marginHorizontal: -1 },
  progressConnectorActive: { backgroundColor: colors.primary },
  progressLabel: { maxWidth: '100%', color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  progressLabelActive: { color: colors.ink },
  progressHint: { color: colors.muted, fontSize: 9, textAlign: 'center' },
  description: { color: colors.ink, fontSize: 15, lineHeight: 23, fontWeight: '600' },
  separator: { height: 1, backgroundColor: colors.line, marginVertical: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 34 },
  detailIcon: { width: 29, height: 29, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.skySoft },
  detailText: { flex: 1, gap: 2 },
  detailLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  detailValue: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  actionCard: { gap: 13 },
  sectionHead: { marginTop: 5 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  technicianList: { gap: 7, maxHeight: 220 },
  technician: { minHeight: 54, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surfaceSoft },
  technicianSelected: { borderColor: colors.primary, backgroundColor: colors.skySoft },
  techText: { flex: 1, gap: 2 },
  techName: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  techSpecialty: { color: colors.muted, fontSize: 11 },
  historyCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13 },
  timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginTop: 5 },
  historyContent: { flex: 1, gap: 5 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  historyTitle: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '800' },
  historyDate: { color: colors.muted, fontSize: 10 },
  historyDescription: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  historyOwner: { color: colors.primaryDark, fontSize: 11, fontWeight: '700' },
});
