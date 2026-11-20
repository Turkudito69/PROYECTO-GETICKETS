import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { Text } from '../../components/Typography';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import { visibleTicketsFor, initials } from '../../lib/tickets';
import { colors, space } from '../../theme';
import type { CategoryItem, TechnicianItem, TicketItem } from '../../types';
import { AnimatedEntry, AnimatedProgressBar, AnimatedProgressRing, Button, EmptyState, LoadingState, Notice, Surface } from '../../components/ui';
import { useReducedMotion } from '../../lib/motion';

export default function DashboardScreen() {
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const reduceMotion = useReducedMotion();
  const [screenProgress] = useState(() => new Animated.Value(0));
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = user?.rol === 'Administrador';
  const isTech = user?.rol === 'Tecnico';

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const [allTickets, techList, categoryList] = await Promise.all([
        api.getTickets(), api.getTecnicos(), api.getCategorias(),
      ]);
      setTickets(allTickets); setTechnicians(techList); setCategories(categoryList);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo sincronizar la mesa de ayuda.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useFocusEffect(useCallback(() => {
    if (reduceMotion) { screenProgress.setValue(1); return; }
    screenProgress.setValue(0);
    const animation = Animated.timing(screenProgress, { toValue: 1, duration: 200, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, screenProgress]));
  const visible = user ? visibleTicketsFor(user, tickets) : [];
  const count = (status: string) => visible.filter((item) => item.estadoTicket.toLocaleLowerCase() === status.toLocaleLowerCase()).length;
  const activeCount = count('Asignado') + count('En Proceso');
  const closedCount = count('Completado');
  const percentage = visible.length ? Math.round(closedCount / visible.length * 100) : 0;
  const pendingConfirmation = visible.filter((item) => item.estadoTicket === 'Resuelto' && (isAdmin || item.idUsuario === user?.idUsuario));
  const queue = (isAdmin ? visible.filter((item) => item.estadoTicket === 'Abierto') : isTech ? visible.filter((item) => ['Asignado', 'En Proceso'].includes(item.estadoTicket)) : visible)
    .slice().sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()).slice(0, 4);
  const activeTechs = technicians.filter((item) => !item.estado || item.estado.toLocaleLowerCase() === 'activo');
  const countsByCategory = visible.reduce<Record<string, number>>((all, ticket) => { const key = ticket.categoria || 'Sin categoría'; all[key] = (all[key] ?? 0) + 1; return all; }, {});
  const categoryBreakdown = Object.entries(countsByCategory).map(([name, total]) => ({ name, total, percent: visible.length ? Math.round(total / visible.length * 100) : 0, icono: categories.find((category) => category.nombreCategoria === name)?.icono ?? null })).sort((a, b) => b.total - a.total).slice(0, 6);
  const greeting = isAdmin
    ? 'Supervisa la mesa de ayuda en un vistazo, asigna especialistas y monitorea la carga de trabajo.'
    : isTech
      ? 'Revisa tus casos asignados, registra notas de progreso y cierra solicitudes con solución.'
      : '¿Tienes un problema técnico? Envía un reporte en segundos y mira cómo avanza paso a paso.';
  if (!user) return null;

  return (
    <Animated.View style={[styles.screen, { opacity: screenProgress, transform: [{ translateX: screenProgress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      <ScrollView contentContainerStyle={[styles.content, wide && styles.contentWide]} showsVerticalScrollIndicator={false}>
        <AnimatedEntry delay={0}><View style={[styles.hero, wide && styles.heroWide]}>
          <DotPattern />
          <View style={styles.heroCopy}>
            <View style={styles.eyebrowPill}><Text style={styles.eyebrow}>Panel de {user.rol}</Text><Text style={styles.eyebrowDot}>·</Text><Text style={styles.eyebrowCount}>{visible.length} tickets visibles</Text></View>
            <Text style={styles.title}>¡Hola, {user.nombre} {user.apellido}!</Text>
            <Text style={styles.subtitle}>{greeting}</Text>
            <View style={styles.heroButtons}><Pressable onPress={() => router.push('/new-ticket')} style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}><Ionicons name="add" size={18} color="#111827" /><Text style={styles.reportButtonText}>{isAdmin || isTech ? 'Nuevo ticket' : 'Reportar problema'}</Text></Pressable><Pressable onPress={() => router.push('/(tabs)/tickets')} style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}><Text style={styles.outlineText}>Explorar bandeja</Text><Ionicons name="arrow-forward" size={14} color="#FFFFFF" /></Pressable></View>
          </View>
          <View style={[styles.completionCard, wide && styles.completionCardWide]}><View style={styles.completionRing}><AnimatedProgressRing value={percentage} size={wide ? 82 : 68} strokeWidth={7} /><Text style={styles.completionValue}>{percentage}%</Text></View><View style={styles.completionCopy}><Text style={styles.completionTitle}>Completados</Text><Text style={styles.completionLabel}>{closedCount} de {visible.length} confirmados</Text><Text style={styles.completionFoot}>{count('Resuelto') > 0 ? `${count('Resuelto')} por confirmar` : `${activeCount + count('Abierto')} activos ahora`}</Text></View></View>
        </View></AnimatedEntry>

        {error ? <Notice message={error} /> : null}
        {loading ? <LoadingState label="Cargando la mesa de ayuda…" /> : <View style={styles.statsGrid}>
          <MetricCard wide={wide} index={0} label={isAdmin ? 'Sin asignar' : 'En espera'} value={count('Abierto')} icon="time-outline" color={colors.amber} tint={colors.amberSoft} note="Esperando técnico" total={visible.length} onPress={() => router.push('/(tabs)/tickets')} />
          <MetricCard wide={wide} index={1} label={isTech ? 'Por iniciar' : 'Asignados'} value={count('Asignado')} icon="person-add-outline" color={colors.primary} tint={colors.skySoft} note="Con técnico asignado" total={visible.length} onPress={() => router.push('/(tabs)/tickets')} />
          <MetricCard wide={wide} index={2} label="En proceso" value={count('En Proceso')} icon="construct-outline" color={colors.indigo} tint={colors.indigoSoft} note="Siendo atendidos" total={visible.length} onPress={() => router.push('/(tabs)/tickets')} />
          <MetricCard wide={wide} index={3} label="Completados" value={count('Completado')} icon="checkmark-circle-outline" color={colors.green} tint={colors.greenSoft} note={count('Resuelto') ? `${count('Resuelto')} por confirmar` : '0 por confirmar'} total={visible.length} onPress={() => router.push('/(tabs)/tickets')} />
        </View>}

        {pendingConfirmation.length > 0 ? <Surface style={styles.confirmBanner}><View style={styles.confirmIcon}><Ionicons name="checkmark-done-outline" size={19} color={colors.green} /></View><View style={styles.confirmCopy}><Text style={styles.confirmTitle}>{pendingConfirmation.length} {pendingConfirmation.length === 1 ? 'solución pendiente' : 'soluciones pendientes'}</Text><Text style={styles.confirmText}>Confirma la solución o vuelve a abrir el ticket.</Text></View><Pressable onPress={() => router.push(`/ticket/${pendingConfirmation[0].idTicket}`)} accessibilityLabel="Revisar solución"><Ionicons name="chevron-forward" size={20} color={colors.green} /></Pressable></Surface> : null}

        {!isAdmin && !isTech ? <View style={[styles.steps, wide && styles.stepsWide]}>
          <StepCard number="1" color={colors.primary} tint={colors.skySoft} title="Reporta en 3 clics" copy="Elige el área afectada, la urgencia y describe qué ocurrió." />
          <StepCard number="2" color={colors.indigo} tint={colors.indigoSoft} title="Seguimiento visual" copy="Mira en la barra de progreso quién atiende tu caso ahora." />
          <StepCard number="3" color={colors.green} tint={colors.greenSoft} title="Solución documentada" copy="Al cerrarse el ticket, consulta cómo se resolvió." />
        </View> : null}

        <View style={[styles.lowerGrid, wide && styles.lowerGridWide]}>
          <View style={styles.ticketColumn}>
            <View style={[styles.listPanel, styles.panel]}>
              <View style={styles.panelHeader}><Text style={styles.sectionTitle}>{isAdmin ? 'Solicitudes pendientes por asignar' : isTech ? 'Casos asignados para atender' : 'Tus solicitudes recientes'}</Text><Pressable onPress={() => router.push('/(tabs)/tickets')} style={styles.linkButton}><Text style={styles.linkText}>Ver todos</Text><Ionicons name="arrow-forward" size={14} color={colors.primaryDark} /></Pressable></View>
              {loading ? <LoadingState label="Cargando solicitudes…" /> : queue.length ? queue.map((ticket, index) => <AnimatedEntry key={ticket.idTicket} delay={index * 40}><DashboardTicketRow ticket={ticket} onPress={() => router.push(`/ticket/${ticket.idTicket}`)} /></AnimatedEntry>) : <EmptyState title={isAdmin ? 'Todo al día: no hay tickets pendientes de asignación.' : isTech ? 'No tienes tickets pendientes en este momento.' : 'Aún no has enviado solicitudes de soporte.'} description="" icon="checkmark-done-outline" action={!isAdmin && user.rol === 'Usuario' ? <Button onPress={() => router.push('/new-ticket')} compact icon="add">Crear mi primera solicitud</Button> : undefined} />}
            </View>
          </View>
          {!isAdmin && !isTech ? <View style={styles.categoryColumn}><View style={[styles.panel, styles.categoryPanel]}><View style={styles.panelHeader}><Text style={styles.sectionTitle}>Tickets por Área</Text></View>{categoryBreakdown.length ? <View style={styles.categoryContent}>{categoryBreakdown.map((item, index) => <View key={item.name} style={styles.categoryRow}><View style={styles.categoryTop}><Text style={styles.categoryName}>{item.name}</Text><Text style={styles.categoryCount}>{item.total} ({item.percent}%)</Text></View><AnimatedProgressBar value={Math.max(5, item.percent)} color={categoryColors[index % categoryColors.length]} height={8} trackColor="#F1F3F5" delay={index * 40} /></View>)}</View> : <EmptyState title="Sin tickets por área" description="La distribución aparecerá cuando reportes una solicitud." icon="bar-chart-outline" />}</View></View> : null}
        </View>

        {isAdmin && !loading ? <>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Disponibilidad de técnicos</Text><Text style={styles.sectionCaption}>{activeTechs.length} técnicos activos</Text></View></View>
          {activeTechs.length ? <Surface style={styles.analyticsCard}>{activeTechs.slice(0, 6).map((tech, index) => {
            const assigned = tickets.filter((item) => item.idTecnico === tech.idTecnico && ['Asignado', 'En Proceso'].includes(item.estadoTicket)).length;
            const resolved = tickets.filter((item) => item.idTecnico === tech.idTecnico && ['Resuelto', 'Completado'].includes(item.estadoTicket)).length;
            return <View key={tech.idTecnico} style={[styles.techRow, index > 0 && styles.divider]}><View style={styles.techAvatar}><Text style={styles.techInitials}>{initials(tech.nombre, tech.apellido)}</Text></View><View style={styles.techInfo}><Text style={styles.techName}>{tech.nombre} {tech.apellido}</Text><Text style={styles.techSpecialty}>{tech.especialidad || 'Soporte técnico'}</Text><AnimatedProgressBar value={Math.min(100, assigned * 28 + 12)} color={colors.primary} delay={index * 40} /></View><View style={styles.techStats}><Text style={styles.techActiveCount}>{assigned} activos</Text><Text style={styles.techResolvedCount}>{resolved} resueltos</Text></View></View>;
          })}</Surface> : <Surface><EmptyState title="Sin técnicos activos" description="Los técnicos disponibles aparecerán cuando estén registrados y activos." icon="people-outline" /></Surface>}

          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Tickets por área</Text><Text style={styles.sectionCaption}>Distribución de las solicitudes</Text></View></View>
          {categoryBreakdown.length ? <Surface style={styles.analyticsCard}>{categoryBreakdown.map((item, index) => <View key={item.name} style={styles.categoryRow}><View style={styles.categoryTop}><Text style={styles.categoryName}>{item.name}</Text><Text style={styles.categoryCount}>{item.total} · {item.percent}%</Text></View><AnimatedProgressBar value={Math.max(5, item.percent)} color={categoryColors[index % categoryColors.length]} delay={index * 40} /></View>)}</Surface> : <Surface><EmptyState title="Sin datos de categorías" description="La distribución aparecerá cuando haya tickets registrados." icon="bar-chart-outline" /></Surface>}
        </> : null}

        {(!wide || isAdmin || isTech) ? (!isAdmin ? <View style={styles.quickLinks}><QuickLink icon="cube-outline" title="Oficina" subtitle="Ver puestos y zonas" onPress={() => router.push('/(tabs)/office')} /><QuickLink icon="time-outline" title={isTech ? 'Actividad' : 'Mi perfil'} subtitle={isTech ? 'Revisar movimientos' : 'Datos de tu cuenta'} onPress={() => router.push(isTech ? '/(tabs)/audit' : '/(tabs)/profile')} /></View> : <View style={styles.quickLinks}><QuickLink icon="cube-outline" title="Oficina" subtitle="Ver mapa de puestos" onPress={() => router.push('/(tabs)/office')} /><QuickLink icon="server-outline" title="Catálogos" subtitle="Cuentas y configuración" onPress={() => router.push('/(tabs)/catalogs')} /></View>) : null}
        {visible.length > 0 ? <Text style={styles.dataFootnote}>Datos sincronizados con GETICKETS · {visible.length} solicitudes</Text> : null}
      </ScrollView>
    </Animated.View>
  );
}

function MetricCard({ label, value, icon, color, tint, note, total, wide, index, onPress }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap; color: string; tint: string; note: string; total: number; wide: boolean; index: number; onPress: () => void }) {
  const ratio = total ? Math.min(100, Math.round(value / total * 100)) : 0;
  return <AnimatedEntry delay={index * 40}><Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.metricCard, wide && styles.metricCardWide, { backgroundColor: tint, borderColor: `${color}55` }, pressed && styles.pressed]}><View style={styles.metricTop}><Text style={[styles.metricLabel, { color }]}>{label}</Text><View style={[styles.metricIcon, { backgroundColor: color }]}><Ionicons name={icon} size={20} color="#FFFFFF" /></View></View><Text style={styles.metricValue}>{value}</Text><AnimatedProgressBar value={ratio ? Math.max(12, ratio) : 0} color={color} delay={80 + index * 40} height={6} trackColor="rgba(255,255,255,0.9)" style={styles.metricBarTrack} /><View style={styles.metricFooter}><Text style={styles.metricNote}>{note}</Text><Text style={styles.metricPct}>{total ? `${ratio}%` : '0%'}</Text></View></Pressable></AnimatedEntry>;
}

function DashboardTicketRow({ ticket, onPress }: { ticket: TicketItem; onPress: () => void }) {
  const category = ticket.categoria.toLowerCase();
  const visual = category.includes('software') ? { icon: 'desktop-outline' as const, color: '#5940F5', tint: '#EEF0FF' }
    : category.includes('red') || category.includes('conect') ? { icon: 'wifi-outline' as const, color: '#009B8B', tint: '#DDF8F4' }
      : category.includes('hardware') ? { icon: 'hardware-chip-outline' as const, color: '#0284C7', tint: '#E0F2FE' }
        : category.includes('impres') ? { icon: 'print-outline' as const, color: '#E11D48', tint: '#FFF0F2' }
          : category.includes('acceso') || category.includes('cuenta') ? { icon: 'key-outline' as const, color: '#F59E0B', tint: '#FFF7E6' }
            : { icon: 'apps-outline' as const, color: '#5940F5', tint: '#EEF0FF' };
  const priority = ticket.prioridad.toLocaleLowerCase();
  const priorityColor = priority.includes('alta') ? '#E11D48' : priority.includes('media') ? '#D97706' : '#009B71';
  const state = ticket.estadoTicket.toLocaleLowerCase();
  const status = state.includes('complet') || state.includes('resuelt')
    ? { label: ticket.estadoTicket, icon: 'checkmark-circle-outline' as const, color: '#009B71', tint: '#E8FAF3' }
    : state.includes('proceso') ? { label: ticket.estadoTicket, icon: 'construct-outline' as const, color: '#5940F5', tint: '#EEF0FF' }
      : state.includes('asign') ? { label: ticket.estadoTicket, icon: 'person-add-outline' as const, color: '#0284C7', tint: '#E0F2FE' }
        : { label: ticket.estadoTicket || 'Abierto', icon: 'time-outline' as const, color: '#B45309', tint: '#FFF7E6' };
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.ticketRow, pressed && styles.ticketRowPressed]}>
      <View style={[styles.categoryIcon, { backgroundColor: visual.tint, borderColor: `${visual.color}22` }]}><Ionicons name={visual.icon} size={17} color={visual.color} /></View>
      <View style={styles.ticketMain}>
        <View style={styles.ticketMetaLine}><Text style={styles.ticketCode}>{ticket.tickets}</Text><Text style={styles.metaDot}>·</Text><Text style={styles.ticketCategory} numberOfLines={1}>{ticket.categoria}</Text><Text style={styles.metaDot}>·</Text><View style={styles.priorityMark}><View style={[styles.priorityBar, { height: 5, backgroundColor: priorityColor }]} /><View style={[styles.priorityBar, { height: 8, backgroundColor: priorityColor }]} /><View style={[styles.priorityBar, { height: 11, backgroundColor: priorityColor }]} /></View><Text style={[styles.priorityText, { color: priorityColor }]}>{ticket.prioridad}</Text></View>
        <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.descripcion || 'Sin descripción'}</Text>
      </View>
      <View style={styles.ticketAside}>
        <View style={[styles.compactStatus, { backgroundColor: status.tint, borderColor: `${status.color}88` }]}><Ionicons name={status.icon} size={12} color={status.color} /><Text style={[styles.compactStatusText, { color: status.color }]}>{status.label}</Text></View>
        <Text style={styles.ticketDate}>{formatShortDate(ticket.fechaCreacion)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color="#9CA3AF" />
    </Pressable>
  );
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date).replace('.', ',');
}

function DotPattern() {
  return <Svg pointerEvents="none" width="100%" height="100%" style={styles.heroDots}>
    <Defs><Pattern id="hero-dot-pattern" width="18" height="18" patternUnits="userSpaceOnUse"><Circle cx="1" cy="1" r="1" fill="#FFFFFF" fillOpacity={0.14} /></Pattern></Defs>
    <Rect width="100%" height="100%" fill="url(#hero-dot-pattern)" />
  </Svg>;
}

function StepCard({ number, color, tint, title, copy }: { number: string; color: string; tint: string; title: string; copy: string }) {
  return <Surface style={[styles.stepCard, { backgroundColor: tint, borderColor: `${color}55` }]}><View style={[styles.stepNumber, { backgroundColor: color }]}><Text style={styles.stepNumberText}>{number}</Text></View><View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepBody}>{copy}</Text></View></Surface>;
}

function QuickLink({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]}><View style={styles.quickIcon}><Ionicons name={icon} size={17} color={colors.primaryDark} /></View><View style={styles.quickCopy}><Text style={styles.quickTitle}>{title}</Text><Text style={styles.quickSubtitle}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.muted} /></Pressable>;
}

const categoryColors = [colors.indigo, colors.amber, colors.green, colors.primary, colors.red, '#A855F7'];
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.md, paddingBottom: 32, gap: 16, width: '100%', maxWidth: 1224, alignSelf: 'center' },
  contentWide: { paddingTop: 28, paddingHorizontal: 28, paddingBottom: 36 },
  topbarDesktop: { display: 'none' },
  topbar: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.amber },
  brandText: { color: colors.ink, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  roleTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#182236' },
  roleTagText: { color: '#9AAED1', fontSize: 9, fontWeight: '800' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topIcon: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notificationBadge: { position: 'absolute', right: -4, top: -4, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: '#E11D48', borderWidth: 1, borderColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A2945', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#EAF2FF', fontSize: 11, fontWeight: '900' },
  hero: { overflow: 'hidden', position: 'relative', backgroundColor: colors.navy, borderColor: '#172441', borderWidth: 1, borderRadius: 20, padding: 18, gap: 14 },
  heroWide: { minHeight: 280, padding: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 26 },
  heroDots: { ...StyleSheet.absoluteFill, opacity: .42 },
  heroDot: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: '#92A8CE' },
  heroCopy: { gap: 10, flex: 1 },
  eyebrowPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#303D59', borderWidth: 1, borderColor: '#53617A' },
  eyebrow: { color: '#A8DFFF', fontSize: 12, fontWeight: '700' },
  eyebrowDot: { color: '#D5E7FB', fontSize: 12 },
  eyebrowCount: { color: '#E8F2FF', fontSize: 12, fontWeight: '600', fontFamily: 'IBM Plex Mono' },
  title: { color: '#FFFFFF', fontSize: 30, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: '#E0E7F0', fontSize: 15, lineHeight: 23, maxWidth: 650 },
  heroButtons: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 5 },
  reportButton: { minHeight: 46, borderRadius: 13, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFB900' },
  reportButtonText: { color: '#111827', fontSize: 13, fontWeight: '700' },
  outlineButton: { minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: '#53617A', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2A3854' },
  outlineText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  completionCard: { alignSelf: 'flex-start', minWidth: 230, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#53617A', backgroundColor: '#30405D', flexDirection: 'row', alignItems: 'center', gap: 12 },
  completionCardWide: { minWidth: 292, minHeight: 124, padding: 18, gap: 16 },
  completionRing: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center' },
  completionValue: { position: 'absolute', color: '#FFFFFF', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  completionCopy: { gap: 4 },
  completionTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  completionLabel: { color: '#34D399', fontSize: 12, fontWeight: '600', fontFamily: 'IBM Plex Mono' },
  completionFoot: { color: '#D6DDE7', fontSize: 11 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 1 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  sectionCaption: { color: colors.muted, fontSize: 12, marginTop: 3 },
  refreshButton: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metricCard: { width: '48%', minWidth: 145, flexGrow: 1, minHeight: 136, padding: 16, justifyContent: 'space-between', borderWidth: 2, borderRadius: 14, gap: 8 },
  metricCardWide: { width: '23%', minWidth: 0, minHeight: 140 },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 13, fontWeight: '700' },
  metricIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  metricValue: { color: colors.ink, fontSize: 31, lineHeight: 37, fontWeight: '800', fontVariant: ['tabular-nums'] },
  barTrack: { height: 6, backgroundColor: '#FFFFFF', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  metricBarTrack: { marginTop: 2 },
  metricFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 },
  metricNote: { color: colors.muted, fontSize: 11, flex: 1 },
  metricPct: { color: colors.ink, fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'], fontFamily: 'IBM Plex Mono' },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  steps: { gap: 9 },
  stepsWide: { flexDirection: 'row' },
  stepCard: { flex: 1, minHeight: 95, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 17, borderWidth: 1, borderRadius: 14 },
  stepNumber: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  stepCopy: { flex: 1, gap: 3 },
  stepTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  stepBody: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  lowerGrid: { gap: 16 },
  lowerGridWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 22 },
  ticketColumn: { flex: 1.55, gap: 11 },
  categoryColumn: { flex: .8, gap: 11, minWidth: 260 },
  panel: { backgroundColor: colors.surface, borderColor: '#E0E0E0', borderWidth: 2, borderRadius: 14, overflow: 'hidden' },
  listPanel: { width: '100%' },
  categoryPanel: { width: '100%' },
  panelHeader: { minHeight: 57, paddingHorizontal: 17, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#E2E2E2', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ticketRow: { minHeight: 82, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E4E4E4' },
  ticketRowPressed: { backgroundColor: '#F4FAFD', opacity: .92 },
  categoryIcon: { width: 44, height: 44, borderRadius: 15, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  ticketMain: { flex: 1, minWidth: 0, gap: 4 },
  ticketMetaLine: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  ticketCode: { color: colors.ink, fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'], fontFamily: 'IBM Plex Mono' },
  metaDot: { color: '#9CA3AF', fontSize: 12 },
  ticketCategory: { color: colors.muted, fontSize: 11, maxWidth: 160 },
  priorityMark: { flexDirection: 'row', alignItems: 'flex-end', gap: 1, height: 12 },
  priorityBar: { width: 2, borderRadius: 1 },
  priorityText: { fontSize: 11, fontWeight: '600' },
  ticketTitle: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  ticketAside: { alignItems: 'flex-end', gap: 5 },
  compactStatus: { minHeight: 29, paddingHorizontal: 9, borderRadius: 7, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  compactStatusText: { fontSize: 11, fontWeight: '600' },
  ticketDate: { color: colors.muted, fontSize: 10, fontVariant: ['tabular-nums'], fontFamily: 'IBM Plex Mono' },
  confirmBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.greenSoft, borderColor: '#A4E8D1' },
  confirmIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#CCF6E8', alignItems: 'center', justifyContent: 'center' },
  confirmCopy: { flex: 1, gap: 3 },
  confirmTitle: { color: colors.green, fontSize: 12, fontWeight: '700' },
  confirmText: { color: '#3F6B5C', fontSize: 10 },
  analyticsCard: { paddingVertical: 7 },
  techRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  techAvatar: { width: 31, height: 31, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  techInitials: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  techInfo: { flex: 1, gap: 3 },
  techName: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  techSpecialty: { color: colors.muted, fontSize: 9 },
  techStats: { alignItems: 'flex-end', gap: 3 },
  techActiveCount: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  techResolvedCount: { color: colors.muted, fontSize: 9 },
  categoryContent: { paddingHorizontal: 17, paddingVertical: 8 },
  categoryRow: { gap: 8, paddingVertical: 8 },
  categoryTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  categoryName: { color: colors.ink, fontSize: 13, fontWeight: '500', flex: 1 },
  categoryCount: { color: colors.ink, fontSize: 13, fontWeight: '500', fontVariant: ['tabular-nums'], fontFamily: 'IBM Plex Mono' },
  categoryBar: { height: '100%', borderRadius: 4 },
  quickLinks: { flexDirection: 'row', gap: 8 },
  quickLink: { flex: 1, minHeight: 64, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' },
  quickCopy: { flex: 1, gap: 3 },
  quickTitle: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  quickSubtitle: { color: colors.muted, fontSize: 9 },
  dataFootnote: { color: colors.muted, fontSize: 10, textAlign: 'center' },
  pressed: { opacity: 0.82 },
});
