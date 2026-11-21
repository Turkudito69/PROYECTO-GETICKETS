import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  asignarTicket,
  obtenerDetalleTicket,
  obtenerDetallesGeneralesTicket,
  obtenerSeguimientoTicket,
  obtenerTecnicos,
  obtenerTickets,
} from '../../API/api';
import BrandLogo from '../../components/BrandLogo';
import GlassBackdrop from '../../components/GlassBackdrop';
import DetalleGeneralTicketModal from '../../components/DetalleGeneralTicketModal';
import AdminCatalogosPanel from '../../components/AdminCatalogosPanel';
import AdminUsuariosTecnicosPanel from '../../components/AdminUsuariosTecnicosPanel';
import AdminAuditoriaPanel from '../../components/AdminAuditoriaPanel';
import ProfileThemeModal from '../../components/ProfileThemeModal';
import { useAppTheme } from '../../context/AppThemeContext';

const C_DARK = {
  background: '#080914', surface: 'rgba(35,39,58,0.78)', cardSurface: '#1d2030', modalSurface: '#1a1d2e', ink: '#F3F7FF', muted: '#B4C0D8',
  line: 'rgba(158,218,255,0.42)', brand: '#60D9FF', brandLight: 'rgba(66,174,255,0.20)', green: '#19966b',
  amber: '#bb7a17', red: '#d44a51', purple: '#8558e9', ticketSurface: '#1d2030', ticketHeader: '#1d2030', ticketLine: 'rgba(158,218,255,0.20)', inputSurface: '#111525',
};
const C_LIGHT = { background: '#f4f7fb', surface: '#ffffff', cardSurface: '#ffffff', modalSurface: '#ffffff', ink: '#18233b', muted: '#78859a', line: '#e7edf4', brand: '#355df4', brandLight: '#ecf0ff', green: '#19966b', amber: '#bb7a17', red: '#d44a51', purple: '#8558e9', ticketSurface: '#ffffff', ticketHeader: '#f9fbfd', ticketLine: '#e7edf4', inputSurface: '#fbfcfe' };
let C = C_DARK;
let styles;

const modulosCatalogo = ['categorias', 'prioridades', 'roles', 'estados'];

function texto(value, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

function normalizarEstado(estado) {
  return String(estado || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function esAbierto(ticket) {
  return normalizarEstado(ticket.estadoTicket).includes('abiert');
}

function esEnProceso(ticket) {
  const estado = normalizarEstado(ticket.estadoTicket);
  return estado.includes('proceso') || estado.includes('asignad');
}

function esResuelto(ticket) {
  const estado = normalizarEstado(ticket.estadoTicket);
  return estado.includes('resuelt') || estado.includes('finaliz') || estado.includes('cerrad');
}

function fechaOrden(ticket) {
  const date = new Date(ticket.fehaCreacion).getTime();
  return Number.isNaN(date) ? 0 : date;
}

function fechaVisible(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdministradorDashboard() {
  const { isDark, setMode } = useAppTheme();
  C = isDark ? C_DARK : C_LIGHT;
  styles = useMemo(() => createStyles(), [isDark]);
  const { nombre, apellido, idUsuario } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [hidratado, setHidratado] = useState(false);
  const compacto = !hidratado || width < 760;
  const nombreCompleto = [nombre, apellido].flat().filter(Boolean).join(' ');
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [moduloActivo, setModuloActivo] = useState('resumen');
  const [tecnicos, setTecnicos] = useState([]);
  const [cargandoTecnicos, setCargandoTecnicos] = useState(false);
  const [errorTecnicos, setErrorTecnicos] = useState('');
  const [ticketAsignado, setTicketAsignado] = useState(null);
  const [asignarVisible, setAsignarVisible] = useState(false);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState('');
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [errorAsignacion, setErrorAsignacion] = useState('');
  const [mensajeAsignacion, setMensajeAsignacion] = useState('');
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [ticketDetalle, setTicketDetalle] = useState(null);
  const [detalleTicket, setDetalleTicket] = useState(null);
  const [historialTicket, setHistorialTicket] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [detalleGeneralVisible, setDetalleGeneralVisible] = useState(false);
  const [ticketDetalleGeneral, setTicketDetalleGeneral] = useState(null);
  const [detalleGeneral, setDetalleGeneral] = useState(null);
  const [cargandoDetalleGeneral, setCargandoDetalleGeneral] = useState(false);
  const [errorDetalleGeneral, setErrorDetalleGeneral] = useState('');
  const [perfilVisible, setPerfilVisible] = useState(false);
  const adminId = Array.isArray(idUsuario) ? idUsuario[0] : idUsuario;
  const esCatalogo = modulosCatalogo.includes(moduloActivo);
  const esModuloPersonas = moduloActivo === 'usuarios' || moduloActivo === 'tecnicos';
  const esAuditoria = moduloActivo === 'auditoria';
  const nombreModulo = {
    resumen: 'Resumen', tickets: 'Tickets', categorias: 'Categorías',
    prioridades: 'Prioridades', roles: 'Roles', estados: 'Estados',
    usuarios: 'Usuarios y técnicos', tecnicos: 'Usuarios y técnicos', auditoria: 'Auditoría',
  }[moduloActivo] || 'Resumen';

  const cargarTickets = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setTickets(await obtenerTickets());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los tickets.');
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarTecnicos = useCallback(async () => {
    setCargandoTecnicos(true);
    setErrorTecnicos('');
    try {
      setTecnicos(await obtenerTecnicos());
    } catch (cause) {
      setErrorTecnicos(cause instanceof Error ? cause.message : 'No se pudieron cargar los técnicos.');
    } finally {
      setCargandoTecnicos(false);
    }
  }, []);

  const abrirAsignacion = useCallback((ticket) => {
    setTicketAsignado(ticket);
    setTecnicoSeleccionado('');
    setErrorAsignacion('');
    setMensajeAsignacion('');
    setAsignarVisible(true);
    if (tecnicos.length === 0) void cargarTecnicos();
  }, [cargarTecnicos, tecnicos.length]);

  const confirmarAsignacion = async () => {
    if (!adminId) {
      setErrorAsignacion('No recibimos el ID de tu cuenta. Cerrá sesión e iniciá nuevamente.');
      return;
    }
    if (!tecnicoSeleccionado) {
      setErrorAsignacion('Seleccioná un técnico para continuar.');
      return;
    }

    setGuardandoAsignacion(true);
    setErrorAsignacion('');
    try {
      await asignarTicket({
        IdTicket: Number(ticketAsignado.idTicket),
        IdTecnico: Number(tecnicoSeleccionado),
        IdUsuario: Number(adminId),
      });
      setAsignarVisible(false);
      setMensajeAsignacion(`Técnico asignado al ticket ${ticketAsignado.tickets || ticketAsignado.idTicket}.`);
      await cargarTickets();
    } catch (cause) {
      setErrorAsignacion(cause instanceof Error ? cause.message : 'No se pudo asignar el técnico.');
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  const cargarDetalleTicket = useCallback(async (ticket) => {
    setTicketDetalle(ticket);
    setDetalleVisible(true);
    setCargandoDetalle(true);
    setErrorDetalle('');
    setDetalleTicket(null);
    setHistorialTicket([]);
    try {
      const [detalles, seguimientos] = await Promise.all([
        obtenerDetalleTicket(ticket.idTicket),
        obtenerSeguimientoTicket(ticket.idTicket),
      ]);
      setDetalleTicket(detalles[0] || null);
      setHistorialTicket(seguimientos);
    } catch (cause) {
      setErrorDetalle(cause instanceof Error ? cause.message : 'No se pudo cargar el detalle del ticket.');
    } finally {
      setCargandoDetalle(false);
    }
  }, []);

  const cargarDetalleGeneral = useCallback(async (ticket) => {
    setTicketDetalleGeneral(ticket);
    setDetalleGeneralVisible(true);
    setCargandoDetalleGeneral(true);
    setErrorDetalleGeneral('');
    setDetalleGeneral(null);
    try {
      const detalles = await obtenerDetallesGeneralesTicket();
      const codigo = texto(ticket.tickets, `TCK-${String(ticket.idTicket).padStart(6, '0')}`).trim().toLowerCase();
      setDetalleGeneral(detalles.find((item) => String(item.ticket || '').trim().toLowerCase() === codigo) || null);
    } catch (cause) {
      setErrorDetalleGeneral(cause instanceof Error ? cause.message : 'No se pudo cargar el detalle general.');
    } finally {
      setCargandoDetalleGeneral(false);
    }
  }, []);

  useEffect(() => { void cargarTickets(); }, [cargarTickets]);
  useEffect(() => { setHidratado(true); }, []);

  const ticketsOrdenados = useMemo(
    () => [...tickets].sort((a, b) => fechaOrden(b) - fechaOrden(a)),
    [tickets],
  );
  const recientes = useMemo(() => ticketsOrdenados.slice(0, 5), [ticketsOrdenados]);

  const resumen = useMemo(() => ({
    total: tickets.length,
    abiertos: tickets.filter(esAbierto).length,
    proceso: tickets.filter(esEnProceso).length,
    resueltos: tickets.filter(esResuelto).length,
  }), [tickets]);

  return (
    <SafeAreaView style={[styles.safeArea, !isDark && styles.safeAreaLight]}>
      <GlassBackdrop isDark={isDark} />
          <View style={[styles.layout, compacto && styles.layoutCompacto]}>
        {!compacto ? <Sidebar moduloActivo={moduloActivo} onNavigate={setModuloActivo} onProfile={() => setPerfilVisible(true)} isDark={isDark} /> : null}

        <View style={styles.main}>
          {compacto ? <MobileHeader nombre={nombreCompleto} onProfile={() => setPerfilVisible(true)} isDark={isDark} /> : <Topbar nombre={nombreCompleto} modulo={moduloActivo} />}
          <ScrollView contentContainerStyle={[styles.content, compacto && styles.contentCompacto]}>
            <View style={[styles.pageHead, compacto && styles.pageHeadCompacto]}>
              <View style={styles.pageHeadCopy}>
                <Text style={styles.eyebrow}>PANEL DE ADMINISTRACIÓN</Text>
                <Text style={[styles.pageTitle, compacto && styles.pageTitleCompacto]}>
                  {moduloActivo === 'resumen'
                    ? (nombreCompleto ? `¡Hola, ${nombreCompleto.split(' ')[0]}!` : 'Resumen de soporte')
                    : (esCatalogo || esModuloPersonas || esAuditoria) ? nombreModulo : 'Todos los tickets'}
                </Text>
                <Text style={styles.pageSubtitle}>
                  {moduloActivo === 'resumen'
                    ? 'Este es el estado general de las solicitudes de soporte.'
                    : esAuditoria ? 'Consultá quién realizó cada cambio registrado en los tickets.'
                    : esCatalogo ? `Administrá el catálogo de ${nombreModulo.toLowerCase()}.`
                      : esModuloPersonas ? 'Administrá cuentas de usuario y perfiles técnicos.'
                      : 'Listado completo de las solicitudes registradas en el sistema.'}
                </Text>
              </View>
              {!(esCatalogo || esModuloPersonas || esAuditoria) ? <Pressable accessibilityRole="button" onPress={() => void cargarTickets()} style={styles.refreshButton}>
                <Text style={styles.refreshText}>↻  Actualizar</Text>
              </Pressable> : null}
            </View>

            {mensajeAsignacion ? <View style={styles.assignmentSuccess}><Text style={styles.assignmentSuccessText}>✓  {mensajeAsignacion}</Text></View> : null}

            {esModuloPersonas ? (
              <AdminUsuariosTecnicosPanel activeTab={moduloActivo === 'tecnicos' ? 'tecnicos' : 'usuarios'} onTabChange={setModuloActivo} compacto={compacto} />
            ) : esCatalogo ? (
              <AdminCatalogosPanel activeTab={moduloActivo} onTabChange={setModuloActivo} compacto={compacto} />
            ) : esAuditoria ? (
              <AdminAuditoriaPanel compacto={compacto} />
            ) : moduloActivo === 'resumen' ? (
              <>
                <View style={[styles.stats, compacto && styles.statsCompact]}>
                  <StatCard label="Todos los tickets" value={resumen.total} icon="▤" hint="Registros del sistema" color={isDark ? C_DARK.brand : C_LIGHT.brand} compacto={compacto} isDark={isDark} />
                  <StatCard label="Abiertos" value={resumen.abiertos} icon="◷" hint="Pendientes de asignación" color={isDark ? C_DARK.brand : C_LIGHT.brand} compacto={compacto} isDark={isDark} />
                  <StatCard label="En atención" value={resumen.proceso} icon="⚒" hint="Asignados o en proceso" color={C.amber} compacto={compacto} isDark={isDark} />
                  <StatCard label="Resueltos" value={resumen.resueltos} icon="✓" hint="Atención completada" color={C.green} compacto={compacto} isDark={isDark} />
                </View>
                <TicketListPanel
                  titulo="Tickets recientes"
                  subtitulo="Últimas solicitudes registradas"
                  tickets={recientes}
                  total={tickets.length}
                  compacto={compacto}
                  cargando={cargando}
                  error={error}
                  onRetry={() => void cargarTickets()}
                  onAssign={null}
                  onDetails={cargarDetalleTicket}
                  onGeneralDetails={cargarDetalleGeneral}
                  isDark={isDark}
                />
              </>
            ) : (
              <TicketListPanel
                titulo="Todos los tickets"
                subtitulo="Listado completo de solicitudes"
                tickets={ticketsOrdenados}
                total={tickets.length}
                compacto={compacto}
                cargando={cargando}
                error={error}
                onRetry={() => void cargarTickets()}
                onAssign={abrirAsignacion}
                onDetails={cargarDetalleTicket}
                onGeneralDetails={cargarDetalleGeneral}
                isDark={isDark}
              />
            )}

            <Text style={styles.footer}>TI ENVIRONMENT · CENTRO DE SOPORTE</Text>
          </ScrollView>
        </View>
        {compacto ? <MobileNavigation moduloActivo={moduloActivo} onNavigate={setModuloActivo} isDark={isDark} /> : null}
      </View>
      <AsignarTecnicoModal
        visible={asignarVisible}
        ticket={ticketAsignado}
        tecnicos={tecnicos.filter((item) => {
          const estado = item.estado ?? item.Estado;
          return !estado || ['activo', 'activa'].includes(normalizarEstado(estado));
        })}
        tecnicoSeleccionado={tecnicoSeleccionado}
        onClose={() => setAsignarVisible(false)}
        onConfirmar={() => void confirmarAsignacion()}
        onSelect={(id) => { setTecnicoSeleccionado(id); setErrorAsignacion(''); }}
        cargando={cargandoTecnicos}
        error={errorAsignacion || errorTecnicos}
        onRetry={() => { setErrorAsignacion(''); void cargarTecnicos(); }}
        guardando={guardandoAsignacion}
      />
      <DetalleTicketAdminModal
        visible={detalleVisible}
        ticket={ticketDetalle}
        detalle={detalleTicket}
        seguimiento={historialTicket}
        cargando={cargandoDetalle}
        error={errorDetalle}
        isDark={isDark}
        onClose={() => setDetalleVisible(false)}
        onRetry={() => ticketDetalle && void cargarDetalleTicket(ticketDetalle)}
      />
      <DetalleGeneralTicketModal
        visible={detalleGeneralVisible}
        ticket={ticketDetalleGeneral}
        detalle={detalleGeneral}
        cargando={cargandoDetalleGeneral}
        error={errorDetalleGeneral}
        isDark={isDark}
        onClose={() => setDetalleGeneralVisible(false)}
        onRetry={() => ticketDetalleGeneral && void cargarDetalleGeneral(ticketDetalleGeneral)}
      />
      <ProfileThemeModal visible={perfilVisible} onClose={() => setPerfilVisible(false)} name={nombreCompleto} role="Administrador" userId={adminId} isDark={isDark} onChangeTheme={setMode} />
    </SafeAreaView>
  );
}

function TicketListPanel({ titulo, subtitulo, tickets, total, compacto, cargando, error, onRetry, onAssign, onDetails, onGeneralDetails, isDark }) {
  const theme = isDark
    ? { surface: '#1d2030', ink: '#F3F7FF', muted: '#B4C0D8', line: 'rgba(158,218,255,0.20)' }
    : { surface: '#ffffff', ink: '#18233b', muted: '#78859a', line: '#e7edf4' };
  return (
    <View style={[styles.panel, styles.recentPanel, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={[styles.panelHead, { backgroundColor: theme.surface, borderBottomColor: theme.line }]}>
        <View>
          <Text style={[styles.panelTitle, { color: theme.ink }]}>{titulo}</Text>
          <Text style={[styles.panelSubtitle, { color: theme.muted }]}>{subtitulo}</Text>
        </View>
        <Text style={[styles.resultCount, { color: theme.muted }]}>{total} total</Text>
      </View>
      {cargando ? (
        <View style={styles.stateBox}><ActivityIndicator color={C.brand} /><Text style={styles.stateText}>Cargando tickets…</Text></View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>No se pudieron cargar los tickets</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Reintentar</Text></Pressable>
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.stateBox}><Text style={styles.emptyIcon}>▤</Text><Text style={styles.emptyTitle}>Todavía no hay tickets</Text><Text style={styles.stateText}>Cuando se registren solicitudes, aparecerán aquí.</Text></View>
      ) : (
        <View>
          {!compacto ? <TicketColumns showAssignment={Boolean(onAssign)} showDetails={Boolean(onDetails || onGeneralDetails)} isDark={isDark} /> : null}
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.idTicket}
              ticket={ticket}
              compacto={compacto}
              isDark={isDark}
              onAssign={onAssign ? () => onAssign(ticket) : null}
              onDetails={onDetails ? () => onDetails(ticket) : null}
              onGeneralDetails={onGeneralDetails && esResuelto(ticket) ? () => onGeneralDetails(ticket) : null}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function DetalleTicketAdminModal({ visible, ticket, detalle, seguimiento, cargando, error, onClose, onRetry, isDark }) {
  const item = detalle || ticket || {};
  const theme = isDark
    ? { surface: '#1a1d2e', raised: '#252a3d', ink: '#F3F7FF', muted: '#B4C0D8', line: 'rgba(158,218,255,0.24)', brand: '#60D9FF' }
    : { surface: '#ffffff', raised: '#f7f9fc', ink: '#18233b', muted: '#78859a', line: '#e7edf4', brand: '#355df4' };
  const codigo = item.codigoTicket || item.tickets || `TCK-${String(item.idTicket || '').padStart(6, '0')}`;
  const estado = texto(item.estadoTicket, 'Sin estado');
  const estilo = estiloEstado(estado);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.ticketDetailOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar detalle" onPress={onClose} style={styles.assignmentBackdrop} />
        <View style={[styles.ticketDetailCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={[styles.ticketDetailHeader, { backgroundColor: theme.surface, borderBottomColor: theme.line }]}>
            <View style={styles.pageHeadCopy}>
              <Text style={[styles.eyebrow, { color: theme.brand }]}>DETALLE Y SEGUIMIENTO</Text>
              <Text style={[styles.assignmentTitle, { color: theme.ink }]}>{codigo}</Text>
            </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar detalle" onPress={onClose} style={[styles.assignmentClose, { backgroundColor: theme.raised }]}>
              <Text style={[styles.assignmentCloseText, { color: theme.ink }]}>×</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ticketDetailContent}>
            {cargando ? (
              <View style={styles.assignmentState}><ActivityIndicator color={C.brand} /><Text style={styles.stateText}>Cargando detalle y seguimiento…</Text></View>
            ) : error ? (
              <View style={styles.assignmentState}>
                <Text style={styles.errorTitle}>No se pudo cargar el detalle</Text>
                <Text style={styles.stateText}>{error}</Text>
                <Pressable onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Reintentar</Text></Pressable>
              </View>
            ) : (
              <>
                <View style={[styles.ticketDetailSummary, { backgroundColor: theme.raised }]}>
                  <StatusBadge status={estado} style={estilo} />
                  <Text style={[styles.ticketDetailDescription, { color: theme.ink }]}>{texto(item.descripcion, 'Sin descripción')}</Text>
                </View>
                <View style={styles.ticketDetailFields}>
                  <TicketDetailField label="Solicitante" value={item.solicitante} isDark={isDark} />
                  <TicketDetailField label="Técnico" value={item.tecnico || 'Sin asignar'} isDark={isDark} />
                  <TicketDetailField label="Categoría" value={item.categoria} isDark={isDark} />
                  <TicketDetailField label="Prioridad" value={item.prioridad} isDark={isDark} />
                  <TicketDetailField label="Creado" value={fechaVisible(item.fechaCreacion || item.fehaCreacion)} isDark={isDark} />
                  {item.fechaSolucion ? <TicketDetailField label="Resuelto" value={fechaVisible(item.fechaSolucion)} isDark={isDark} /> : null}
                </View>
                <View style={styles.ticketTimeline}>
                  <Text style={[styles.ticketTimelineTitle, { color: theme.ink }]}>Historial del ticket</Text>
                  {seguimiento.length === 0 ? (
                    <Text style={styles.stateText}>Todavía no hay actualizaciones de seguimiento.</Text>
                  ) : seguimiento.map((evento, index) => (
                    <View key={evento.idSeguimientoTicket || `${evento.fechaSeguimiento}-${index}`} style={styles.ticketTimelineItem}>
                      <View style={styles.ticketTimelineMarker}><View style={styles.ticketTimelineDot} /></View>
                      <View style={[styles.ticketTimelineCopy, { borderBottomColor: theme.line }]}>
                        <Text style={[styles.ticketTimelineEventTitle, { color: theme.ink }]}>{texto(evento.titulo, 'Actualización del ticket')}</Text>
                        <Text style={[styles.ticketTimelineDescription, { color: theme.muted }]}>{texto(evento.descripsion || evento.descripcion, 'Sin descripción adicional.')}</Text>
                        <Text style={[styles.ticketTimelineMeta, { color: theme.muted }]}>{texto(evento.responsable, 'Sistema')} · {fechaVisible(evento.fechaSeguimiento)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TicketDetailField({ label, value, isDark }) {
  const theme = isDark
    ? { surface: '#252a3d', ink: '#F3F7FF', muted: '#B4C0D8', line: 'rgba(158,218,255,0.20)' }
    : { surface: '#ffffff', ink: '#18233b', muted: '#78859a', line: '#e7edf4' };
  return (
    <View style={[styles.ticketDetailField, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.ticketDetailFieldLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.ticketDetailFieldValue, { color: theme.ink }]}>{texto(value)}</Text>
    </View>
  );
}

function AsignarTecnicoModal({
  visible, ticket, tecnicos, tecnicoSeleccionado, onSelect,
  onClose, onConfirmar, cargando, error, onRetry, guardando,
}) {
  const codigo = ticket ? texto(ticket.tickets, `TCK-${String(ticket.idTicket).padStart(6, '0')}`) : '';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.assignmentOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar asignación" onPress={onClose} style={styles.assignmentBackdrop} />
        <View style={styles.assignmentCard}>
          <View style={styles.assignmentHeader}>
            <View style={styles.pageHeadCopy}>
              <Text style={styles.eyebrow}>GESTIÓN DE TICKETS</Text>
              <Text style={styles.assignmentTitle}>Asignar técnico</Text>
              <Text style={styles.pageSubtitle}>{codigo} · {texto(ticket?.descripcion, 'Ticket seleccionado')}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar asignación" onPress={onClose} style={styles.assignmentClose}>
              <Text style={styles.assignmentCloseText}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.assignmentLabel}>Seleccioná un técnico activo</Text>
          {cargando ? (
            <View style={styles.assignmentState}><ActivityIndicator color={C.brand} /><Text style={styles.stateText}>Cargando técnicos…</Text></View>
          ) : error && tecnicos.length === 0 ? (
            <View style={styles.assignmentState}>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Reintentar</Text></Pressable>
            </View>
          ) : tecnicos.length === 0 ? (
            <View style={styles.assignmentState}><Text style={styles.emptyTitle}>No hay técnicos activos disponibles.</Text></View>
          ) : (
            <ScrollView style={styles.technicianOptions} keyboardShouldPersistTaps="handled">
              {tecnicos.map((tecnico) => {
                const id = tecnico.idTecnico ?? tecnico.IdTecnico;
                const nombre = [tecnico.nombre ?? tecnico.Nombre, tecnico.apellido ?? tecnico.Apellido].filter(Boolean).join(' ')
                  || tecnico.usuario || tecnico.Usuario || `Técnico ${id}`;
                const selected = String(tecnicoSeleccionado) === String(id);
                return (
                  <Pressable key={id} onPress={() => onSelect(String(id))} style={[styles.technicianOption, selected && styles.technicianOptionSelected]}>
                    <View style={[styles.technicianAvatar, selected && styles.technicianAvatarSelected]}>
                      <Text style={[styles.technicianAvatarText, selected && styles.technicianAvatarTextSelected]}>{nombre.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.technicianCopy}>
                      <Text style={styles.technicianName}>{nombre}</Text>
                      <Text style={styles.technicianMeta}>{tecnico.especialidad ?? tecnico.Especialidad ?? 'Técnico de soporte'}</Text>
                    </View>
                    {selected ? <Text style={styles.technicianCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {error && tecnicos.length > 0 ? <Text style={styles.assignmentError}>{error}</Text> : null}
          <View style={styles.assignmentActions}>
            <Pressable disabled={guardando} onPress={onClose} style={styles.assignmentCancel}><Text style={styles.assignmentCancelText}>Cancelar</Text></Pressable>
            <Pressable disabled={guardando || cargando || tecnicos.length === 0} onPress={onConfirmar} style={[styles.assignmentConfirm, (guardando || cargando || tecnicos.length === 0) && styles.assignmentDisabled]}>
              {guardando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.assignmentConfirmText}>Confirmar asignación</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Sidebar({ moduloActivo, onNavigate, onProfile, isDark }) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brandRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil y apariencia" onPress={onProfile}><BrandLogo size={40} titleSize={14} subtitleSize={9} subtitle="MESA DE AYUDA TI" light={isDark} /></Pressable>
      </View>
      <Text style={styles.navLabel}>ESPACIO DE TRABAJO</Text>
      <View style={styles.navItems}>
        <NavItem icon="⌂" label="Resumen" active={moduloActivo === 'resumen'} onPress={() => onNavigate('resumen')} />
        <NavItem icon="▤" label="Tickets" active={moduloActivo === 'tickets'} onPress={() => onNavigate('tickets')} />
      </View>
      <Text style={styles.navLabel}>ADMINISTRACIÓN</Text>
      <View style={styles.navItems}>
        <NavItem icon="♙" label="Usuarios y técnicos" active={moduloActivo === 'usuarios' || moduloActivo === 'tecnicos'} onPress={() => onNavigate('usuarios')} />
        <View style={styles.catalogGroup}>
          <View style={styles.catalogParent}>
            <Text style={styles.navIcon}>▦</Text>
            <Text style={styles.navText}>Catálogos</Text>
          </View>
          <View style={styles.catalogChildren}>
            <CatalogNavItem label="Categorías" module="categorias" active={moduloActivo === 'categorias'} onPress={onNavigate} />
            <CatalogNavItem label="Prioridades" module="prioridades" active={moduloActivo === 'prioridades'} onPress={onNavigate} />
            <CatalogNavItem label="Roles" module="roles" active={moduloActivo === 'roles'} onPress={onNavigate} />
            <CatalogNavItem label="Estados" module="estados" active={moduloActivo === 'estados'} onPress={onNavigate} />
          </View>
        </View>
        <NavItem icon="◴" label="Auditoría" active={moduloActivo === 'auditoria'} onPress={() => onNavigate('auditoria')} />
      </View>
      <View style={styles.sidebarBottom}>
        <View style={styles.adminChip}>
          <View style={styles.adminAvatar}><Text style={styles.adminAvatarText}>A</Text></View>
          <View><Text style={styles.adminName}>Administrador</Text><Text style={styles.adminRole}>Panel de control</Text></View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.logoutButton}>
          <Text style={styles.logoutIcon}>↪</Text><Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MobileHeader({ nombre, onProfile, isDark }) {
  return (
    <View style={styles.mobileHeader}>
      <View style={styles.mobileBrandCopy}>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil y apariencia" onPress={onProfile}><BrandLogo size={40} titleSize={14} subtitleSize={9} subtitle={nombre || 'ADMINISTRACIÓN'} light={isDark} /></Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={() => router.replace('/')} style={styles.mobileLogout}><Text style={styles.logoutIcon}>↪</Text></Pressable>
    </View>
  );
}

function MobileNavigation({ moduloActivo, onNavigate, isDark }) {
  const items = [
    ['⌂', 'Resumen', 'resumen'],
    ['▤', 'Tickets', 'tickets'],
    ['♙', 'Usuarios y técnicos', 'usuarios'],
    ['▦', 'Catálogos', 'catalogos'],
    ['◴', 'Auditoría', 'auditoria'],
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.mobileNavigationScroll, { backgroundColor: isDark ? '#1d2030' : '#ffffff', borderTopColor: isDark ? 'rgba(158,218,255,0.42)' : '#e7edf4' }]} contentContainerStyle={styles.mobileNavigation}>
      {items.map(([icon, label, module]) => {
        const active = module === 'catalogos' ? modulosCatalogo.includes(moduloActivo)
          : module === 'usuarios' ? moduloActivo === 'usuarios' || moduloActivo === 'tecnicos'
            : moduloActivo === module;
        const available = module === 'resumen' || module === 'tickets' || module === 'catalogos' || module === 'usuarios' || module === 'auditoria';
        return (
          <Pressable key={label} disabled={!available} onPress={() => onNavigate(module === 'catalogos' ? 'categorias' : module)} style={[styles.mobileNavItem, active && styles.mobileNavItemActive, active && { backgroundColor: isDark ? 'rgba(66,174,255,0.20)' : '#ecf0ff' }]}>
            <Text style={[styles.mobileNavIcon, active && styles.mobileNavTextActive]}>{icon}</Text>
            <Text style={[styles.mobileNavText, active && styles.mobileNavTextActive]}>{label}</Text>
            {!available ? <Text style={styles.mobileNavSoon}>PRONTO</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Topbar({ nombre, modulo }) {
  const nombreModulo = {
    resumen: 'Resumen', tickets: 'Tickets', categorias: 'Categorías', auditoria: 'Auditoría',
    prioridades: 'Prioridades', roles: 'Roles', estados: 'Estados',
    usuarios: 'Usuarios y técnicos', tecnicos: 'Usuarios y técnicos',
  }[modulo] || 'Resumen';
  return (
    <View style={styles.topbar}>
      <Text style={styles.crumb}>TI ENVIRONMENT  /  <Text style={styles.crumbCurrent}>{nombreModulo}</Text></Text>
      <View style={styles.topbarRight}><Text style={styles.adminTag}>● ADMINISTRADOR</Text><View style={styles.topAvatar}><Text style={styles.topAvatarText}>{nombre ? nombre[0].toUpperCase() : 'A'}</Text></View></View>
    </View>
  );
}

function NavItem({ icon, label, active = false, onPress }) {
  const Item = onPress ? Pressable : View;
  return (
    <Item accessibilityRole={onPress ? 'button' : undefined} accessibilityState={{ disabled: !onPress }} onPress={onPress} style={[styles.navItem, active && styles.navItemActive]}>
      <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
      {!active && !onPress ? <Text style={styles.navSoon}>PRONTO</Text> : null}
    </Item>
  );
}

function CatalogNavItem({ label, module, active, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onPress(module)} style={[styles.catalogChild, active && styles.catalogChildActive]}>
      <View style={[styles.catalogChildDot, active && styles.catalogChildDotActive]} />
      <Text style={[styles.catalogChildText, active && styles.catalogChildTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ label, value, icon, hint, color, compacto, isDark }) {
  const theme = isDark
    ? { surface: '#1d2030', ink: '#F3F7FF', muted: '#B4C0D8', line: 'rgba(158,218,255,0.20)' }
    : { surface: '#ffffff', ink: '#18233b', muted: '#78859a', line: '#e7edf4' };
  return (
    <View style={[styles.statCard, compacto && styles.statCardCompact, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.statTop}><Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text><View style={[styles.statIcon, { backgroundColor: `${color}15` }]}><Text style={[styles.statIconText, { color }]}>{icon}</Text></View></View>
      <Text style={[styles.statValue, { color: theme.ink }]}>{value}</Text>
      <Text style={[styles.statHint, { color: theme.muted }]}>{hint}</Text>
    </View>
  );
}

function TicketColumns({ showAssignment = false, showDetails = false, isDark }) {
  const theme = isDark ? { surface: '#1d2030', muted: '#B4C0D8' } : { surface: '#f9fbfd', muted: '#78859a' };
  const columnStyle = [styles.columnText, { color: theme.muted }];
  return (
    <View style={[styles.ticketColumns, { backgroundColor: theme.surface }]}>
      <Text style={[columnStyle, styles.columnTicket]}>TICKET</Text>
      <Text style={[columnStyle, styles.columnCategory]}>CATEGORÍA</Text>
      <Text style={[columnStyle, styles.columnPriority]}>PRIORIDAD</Text>
      <Text style={[columnStyle, styles.columnStatus]}>ESTADO</Text>
      <Text style={[columnStyle, styles.columnTechnician]}>TÉCNICO</Text>
      <Text style={[columnStyle, styles.columnDate]}>FECHA</Text>
      {showAssignment || showDetails ? <Text style={[columnStyle, styles.columnAction]}>ACCIONES</Text> : null}
    </View>
  );
}

function TicketRow({ ticket, compacto, onAssign, onDetails, onGeneralDetails, isDark }) {
  const theme = isDark
    ? { surface: '#1d2030', ink: '#F3F7FF', muted: '#B4C0D8', brand: '#60D9FF', line: 'rgba(158,218,255,0.20)' }
    : { surface: '#ffffff', ink: '#18233b', muted: '#78859a', brand: '#355df4', line: '#e7edf4' };
  const ticketCode = texto(ticket.tickets, `TCK-${String(ticket.idTicket).padStart(6, '0')}`);
  const prioridad = texto(ticket.prioridad);
  const status = texto(ticket.estadoTicket, 'Sin estado');
  const badgeStyle = estiloEstado(status);
  const puedeAsignar = Boolean(onAssign) && !esResuelto(ticket);
  const priorityColor = normalizarEstado(prioridad).includes('alta') || normalizarEstado(prioridad).includes('critica') ? C.red : normalizarEstado(prioridad).includes('media') ? C.amber : C.green;

  if (compacto) {
    return (
      <View style={[styles.ticketCard, { backgroundColor: theme.surface, borderTopColor: theme.line }]}>
        <View style={styles.ticketCardTop}>
          <Text style={[styles.ticketCode, { color: theme.brand }]}>{ticketCode}</Text>
          <StatusBadge status={status} style={badgeStyle} />
        </View>
        <Text numberOfLines={2} style={[styles.ticketDescription, { color: theme.ink }]}>{texto(ticket.descripcion, 'Sin descripción')}</Text>
        <View style={styles.ticketMetaRow}>
          <Text style={[styles.ticketMeta, { color: theme.muted }]}>{texto(ticket.categoria)}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: fondoPrioridad(priorityColor), borderColor: colorBordePrioridad(priorityColor) }]}><View style={[styles.priorityDot, { backgroundColor: priorityColor }]} /><Text style={[styles.priorityBadgeText, { color: priorityColor }]}>{prioridad}</Text></View>
        </View>
        <Text style={[styles.ticketFooterMeta, { color: theme.muted }]}>{texto(ticket.tecnico, 'Sin asignar')}  ·  {fechaVisible(ticket.fehaCreacion)}</Text>
        <View style={styles.mobileTicketActions}>
          {onDetails ? <Pressable accessibilityRole="button" onPress={onDetails} style={styles.detailTicketButton}><Text style={styles.detailTicketButtonText}>Ver detalle y seguimiento</Text></Pressable> : null}
          {onGeneralDetails ? <Pressable accessibilityRole="button" onPress={onGeneralDetails} style={styles.generalTicketButton}><Text style={styles.generalTicketButtonText}>Ver detalle general</Text></Pressable> : null}
          {puedeAsignar ? (
            <Pressable accessibilityRole="button" onPress={onAssign} style={styles.assignTicketButton}>
              <Text style={styles.assignTicketButtonText}>{ticket.tecnico ? 'Cambiar técnico' : 'Asignar técnico'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.ticketRow, { backgroundColor: theme.surface, borderTopColor: theme.line }]}>
      <View style={styles.ticketCell}>
        <Text style={[styles.ticketCode, { color: theme.brand }]}>{ticketCode}</Text>
        <Text numberOfLines={1} style={[styles.ticketDescription, { color: theme.ink }]}>{texto(ticket.descripcion, 'Sin descripción')}</Text>
      </View>
      <Text numberOfLines={1} style={[styles.cellText, styles.columnCategory, { color: theme.muted }]}>{texto(ticket.categoria)}</Text>
      <View style={styles.priorityCell}><View style={[styles.priorityDot, { backgroundColor: priorityColor }]} /><Text style={[styles.cellText, { color: theme.muted }]}>{prioridad}</Text></View>
      <View style={styles.statusCell}><StatusBadge status={status} style={badgeStyle} /></View>
      <Text numberOfLines={1} style={[styles.cellText, styles.columnTechnician, { color: theme.muted }]}>{texto(ticket.tecnico, 'Sin asignar')}</Text>
      <Text style={[styles.cellText, styles.columnDate, { color: theme.muted }]}>{fechaVisible(ticket.fehaCreacion)}</Text>
      {puedeAsignar || onDetails || onGeneralDetails ? (
        <View style={styles.assignmentActionCell}>
          {onDetails ? <Pressable accessibilityRole="button" onPress={onDetails} style={styles.detailTicketButton}><Text style={styles.detailTicketButtonText}>Detalle</Text></Pressable> : null}
          {onGeneralDetails ? <Pressable accessibilityRole="button" onPress={onGeneralDetails} style={styles.generalTicketButton}><Text style={styles.generalTicketButtonText}>General</Text></Pressable> : null}
          {puedeAsignar ? <Pressable accessibilityRole="button" onPress={onAssign} style={styles.assignTicketButton}><Text style={styles.assignTicketButtonText}>{ticket.tecnico ? 'Cambiar' : 'Asignar'}</Text></Pressable> : null}
        </View>
      ) : null}
    </View>
  );
}

function fondoPrioridad(color) {
  if (color === C.red) return 'rgba(255, 91, 121, 0.15)';
  if (color === C.amber) return 'rgba(255, 193, 74, 0.15)';
  return 'rgba(49, 226, 175, 0.15)';
}

function colorBordePrioridad(color) {
  if (color === C.red) return 'rgba(255, 91, 121, 0.42)';
  if (color === C.amber) return 'rgba(255, 193, 74, 0.42)';
  return 'rgba(49, 226, 175, 0.42)';
}

function StatusBadge({ status, style }) {
  return <View style={[styles.statusBadge, style]}><Text style={[styles.statusBadgeText, { color: style.color }]}>● {status}</Text></View>;
}

function estiloEstado(estado) {
  const normalized = normalizarEstado(estado);
  if (normalized.includes('resuelt') || normalized.includes('finaliz') || normalized.includes('cerrad')) return { backgroundColor: '#e6f7ef', color: C.green };
  if (normalized.includes('proceso')) return { backgroundColor: '#fff3dd', color: C.amber };
  if (normalized.includes('asignad')) return { backgroundColor: '#f1ebff', color: C.purple };
  if (normalized.includes('cancel')) return { backgroundColor: '#fff0f0', color: C.red };
  return { backgroundColor: '#eef3ff', color: C.brand };
}

function createStyles() { return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#080914', position: 'relative' },
  safeAreaLight: { backgroundColor: '#f4f7fb' },
  layout: { flex: 1, flexDirection: 'row', backgroundColor: 'transparent' },
  layoutCompacto: { flexDirection: 'column' },
  sidebar: { width: 250, backgroundColor: C.surface, borderRightWidth: 1, borderRightColor: C.line, paddingHorizontal: 17, paddingTop: 26, paddingBottom: 15 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 30 },
  navLabel: { paddingHorizontal: 13, marginTop: 13, marginBottom: 8, color: '#a4aec0', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  navItems: { gap: 3 },
  navItem: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 9, paddingHorizontal: 13, opacity: 0.66 },
  navItemActive: { backgroundColor: C.brandLight, opacity: 1 },
  navIcon: { color: '#78859a', fontSize: 18, width: 22, textAlign: 'center' },
  navIconActive: { color: C.brand },
  navText: { color: '#69788f', fontSize: 12, fontWeight: '700', flex: 1 },
  navTextActive: { color: C.brand },
  navSoon: { color: '#a4aec0', fontSize: 7, fontWeight: '800', letterSpacing: 0.3 },
  assignmentSuccess: { paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16, borderRadius: 10, backgroundColor: '#e6f7ef' },
  assignmentSuccessText: { color: C.green, fontSize: 11, fontWeight: '700' },
  catalogGroup: { marginTop: 3 },
  catalogParent: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 9, paddingHorizontal: 13 },
  catalogChildren: { marginLeft: 35, marginTop: 1, marginBottom: 4, paddingLeft: 11, borderLeftWidth: 1, borderLeftColor: C.line, gap: 2 },
  catalogChild: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 7 },
  catalogChildDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#a4aec0' },
  catalogChildText: { flex: 1, color: '#78859a', fontSize: 10, fontWeight: '600' },
  catalogChildActive: { backgroundColor: '#f3f6ff', borderRadius: 7, paddingHorizontal: 6, marginLeft: -6 },
  catalogChildDotActive: { backgroundColor: C.brand },
  catalogChildTextActive: { color: C.brand, fontWeight: '800' },
  catalogChildStatus: { color: '#a4aec0', fontSize: 6, fontWeight: '800', letterSpacing: 0.2 },
  sidebarBottom: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 15 },
  adminChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 7 },
  adminAvatar: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#dce6ff', alignItems: 'center', justifyContent: 'center' },
  adminAvatarText: { color: C.brand, fontWeight: '800' },
  adminName: { color: C.ink, fontWeight: '800', fontSize: 11 },
  adminRole: { color: C.muted, fontSize: 10, marginTop: 3 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11, marginTop: 5, borderRadius: 9, backgroundColor: C.brandLight },
  logoutIcon: { color: C.brand, fontSize: 16 },
  logoutText: { color: C.brand, fontSize: 12, fontWeight: '700' },
  main: { flex: 1, minWidth: 0, backgroundColor: 'transparent' },
  topbar: { height: 70, paddingHorizontal: 34, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  crumb: { color: '#9aa5b6', fontSize: 12 },
  crumbCurrent: { color: C.ink, fontWeight: '700' },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminTag: { color: C.green, backgroundColor: '#ecf7f2', overflow: 'hidden', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7, fontSize: 9, fontWeight: '800' },
  topAvatar: { height: 34, width: 34, borderRadius: 11, backgroundColor: '#dce6ff', alignItems: 'center', justifyContent: 'center' },
  topAvatarText: { color: C.brand, fontWeight: '800' },
  mobileHeader: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 9, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line },
  mobileBrandCopy: { flex: 1 },
  mobileLogout: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', padding: 9, borderRadius: 10, backgroundColor: C.brandLight },
  mobileNavigationScroll: { height: 64, flexGrow: 0, flexShrink: 0, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.line },
  mobileNavigation: { minWidth: '100%', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 5, paddingTop: 5, paddingBottom: 5, gap: 3 },
  mobileNavItem: { minHeight: 45, minWidth: 61, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 10, paddingHorizontal: 5, opacity: 0.7 },
  mobileNavItemActive: { backgroundColor: C.brandLight, opacity: 1 },
  mobileNavIcon: { fontSize: 15, color: C.muted },
  mobileNavText: { fontSize: 8, fontWeight: '700', color: C.muted, textAlign: 'center' },
  mobileNavSoon: { fontSize: 6, fontWeight: '800', color: '#a4aec0', letterSpacing: 0.3 },
  content: { paddingHorizontal: 34, paddingTop: 30, paddingBottom: 32, width: '100%', maxWidth: 1600, alignSelf: 'center' },
  contentCompacto: { paddingHorizontal: 16, paddingTop: 23 },
  pageHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 23 },
  pageHeadCompacto: { alignItems: 'flex-start', flexDirection: 'column' },
  pageHeadCopy: { flex: 1 },
  eyebrow: { color: C.brand, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  pageTitle: { color: C.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.7, marginTop: 7 },
  pageTitleCompacto: { fontSize: 23 },
  pageSubtitle: { color: C.muted, fontSize: 12, marginTop: 6, lineHeight: 18 },
  refreshButton: { borderWidth: 1, borderColor: C.line, borderRadius: 9, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: C.surface },
  refreshText: { color: C.ink, fontSize: 11, fontWeight: '700' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 13, marginBottom: 21 },
  statsCompact: { gap: 9 },
  statCard: { flexGrow: 1, flexBasis: 0, minWidth: 145, backgroundColor: C.cardSurface, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 17, shadowColor: '#00CFFF', shadowOpacity: 0.24, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  statCardCompact: { width: '48%', minWidth: 0, flexBasis: '48%', padding: 13 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  statLabel: { color: C.muted, fontSize: 10, fontWeight: '700', flex: 1 },
  statIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statIconText: { fontSize: 16, fontWeight: '800' },
  statValue: { color: C.ink, fontSize: 27, fontWeight: '800', marginTop: 9 },
  statHint: { color: '#a2acbc', fontSize: 9, marginTop: 3 },
  panel: { backgroundColor: C.cardSurface, borderWidth: 1, borderColor: C.line, borderRadius: 14, overflow: 'hidden', shadowColor: '#00CFFF', shadowOpacity: 0.24, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  recentPanel: { width: '100%' },
  panelHead: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  panelTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  panelSubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  resultCount: { color: C.muted, fontSize: 10 },
  ticketColumns: { minHeight: 39, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, backgroundColor: C.ticketHeader },
  columnText: { color: '#8996a8', fontSize: 8, fontWeight: '800' },
  columnTicket: { flex: 2.2, minWidth: 120 },
  columnCategory: { flex: 0.95, minWidth: 62 },
  columnPriority: { flex: 0.75, minWidth: 55 },
  columnStatus: { flex: 1, minWidth: 72 },
  columnTechnician: { flex: 0.9, minWidth: 60 },
  columnDate: { flex: 0.85, minWidth: 72, textAlign: 'right' },
  columnAction: { width: 220, textAlign: 'right' },
  ticketRow: { minHeight: 65, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 9, backgroundColor: C.ticketSurface, borderTopWidth: 1, borderTopColor: C.ticketLine, gap: 5 },
  ticketCell: { flex: 2.2, minWidth: 120, paddingRight: 8 },
  ticketCode: { color: C.brand, fontSize: 10, fontWeight: '800' },
  ticketDescription: { color: C.ink, fontSize: 10, fontWeight: '700', marginTop: 4 },
  cellText: { color: '#536078', fontSize: 9 },
  priorityCell: { flex: 0.75, minWidth: 55, flexDirection: 'row', alignItems: 'center', gap: 5 },
  priorityDot: { height: 7, width: 7, borderRadius: 4 },
  priorityBadge: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  priorityBadgeText: { fontSize: 9, fontWeight: '800' },
  statusCell: { flex: 1, minWidth: 72, alignItems: 'flex-start' },
  statusBadge: { width: 'auto', flexGrow: 0, alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 5 },
  statusBadgeText: { fontSize: 8, fontWeight: '800' },
  ticketCard: { padding: 14, backgroundColor: C.ticketSurface, borderTopWidth: 1, borderTopColor: C.ticketLine },
  ticketCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  ticketMeta: { color: C.muted, fontSize: 10, fontWeight: '700' },
  ticketFooterMeta: { color: '#9aa5b6', fontSize: 9, marginTop: 8 },
  assignmentActionCell: { width: 220, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 5 },
  mobileTicketActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 10 },
  detailTicketButton: { minHeight: 30, justifyContent: 'center', paddingHorizontal: 9, borderWidth: 1, borderColor: C.line, borderRadius: 8, backgroundColor: C.surface },
  detailTicketButtonText: { color: C.muted, fontSize: 9, fontWeight: '800' },
  generalTicketButton: { alignSelf: 'flex-start', minHeight: 30, justifyContent: 'center', paddingHorizontal: 9, borderRadius: 8, backgroundColor: '#e6f7ef' },
  generalTicketButtonText: { color: C.green, fontSize: 9, fontWeight: '800' },
  assignTicketButton: { minHeight: 30, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.brandLight },
  assignTicketButtonText: { color: C.brand, fontSize: 9, fontWeight: '800' },
  stateBox: { minHeight: 170, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 22 },
  stateText: { color: C.muted, fontSize: 11, textAlign: 'center', lineHeight: 17 },
  emptyIcon: { color: '#aab3c5', fontSize: 26 },
  emptyTitle: { color: C.ink, fontWeight: '800', fontSize: 12 },
  errorBox: { alignItems: 'center', padding: 21, gap: 9 },
  errorTitle: { color: C.red, fontSize: 12, fontWeight: '800' },
  retryButton: { marginTop: 3, backgroundColor: C.brand, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 8 },
  retryText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  assignmentOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(15, 27, 48, 0.4)' },
  assignmentBackdrop: { ...StyleSheet.absoluteFillObject },
  assignmentCard: { width: '100%', maxWidth: 520, maxHeight: '90%', padding: 21, borderRadius: 18, backgroundColor: C.modalSurface, borderWidth: 1, borderColor: C.line, shadowColor: '#14213a', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  assignmentHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.line },
  assignmentTitle: { color: C.ink, fontSize: 21, fontWeight: '800', marginTop: 6 },
  assignmentClose: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f6fb' },
  assignmentCloseText: { color: C.ink, fontSize: 23, lineHeight: 26 },
  assignmentLabel: { color: '#3c4c65', fontSize: 11, fontWeight: '800', marginTop: 17, marginBottom: 9 },
  assignmentState: { minHeight: 155, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  technicianOptions: { maxHeight: 280 },
  technicianOption: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: C.line, borderRadius: 11, marginBottom: 7, backgroundColor: C.surface },
  technicianOptionSelected: { borderColor: C.brand, backgroundColor: C.brandLight },
  technicianAvatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f3f8' },
  technicianAvatarSelected: { backgroundColor: '#dce5ff' },
  technicianAvatarText: { color: C.muted, fontSize: 12, fontWeight: '800' },
  technicianAvatarTextSelected: { color: C.brand },
  technicianCopy: { flex: 1 },
  technicianName: { color: C.ink, fontSize: 11, fontWeight: '800' },
  technicianMeta: { color: C.muted, fontSize: 9, marginTop: 3 },
  technicianCheck: { color: C.brand, fontSize: 16, fontWeight: '800' },
  assignmentError: { color: C.red, fontSize: 10, marginTop: 9 },
  assignmentActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 16 },
  assignmentCancel: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: C.line, borderRadius: 9 },
  assignmentCancelText: { color: C.muted, fontSize: 10, fontWeight: '700' },
  assignmentConfirm: { minHeight: 40, minWidth: 146, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 9, backgroundColor: C.brand },
  assignmentDisabled: { opacity: 0.55 },
  assignmentConfirmText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  ticketDetailOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(15, 27, 48, 0.4)' },
  ticketDetailCard: { width: '100%', maxWidth: 620, maxHeight: '90%', borderRadius: 18, overflow: 'hidden', backgroundColor: C.modalSurface, borderWidth: 1, borderColor: C.line, shadowColor: '#14213a', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  ticketDetailHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingHorizontal: 22, paddingTop: 21, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: C.line },
  ticketDetailContent: { padding: 22, paddingBottom: 25 },
  ticketDetailSummary: { padding: 15, borderRadius: 12, backgroundColor: '#f7f9fc' },
  ticketDetailDescription: { color: C.ink, fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 10 },
  ticketDetailFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  ticketDetailField: { width: '48%', minWidth: 130, padding: 11, borderWidth: 1, borderColor: C.line, borderRadius: 10, backgroundColor: C.surface },
  ticketDetailFieldLabel: { color: '#99a4b5', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  ticketDetailFieldValue: { color: C.ink, fontSize: 11, fontWeight: '700', marginTop: 5 },
  ticketTimeline: { marginTop: 22 },
  ticketTimelineTitle: { color: C.ink, fontSize: 13, fontWeight: '800', marginBottom: 12 },
  ticketTimelineItem: { flexDirection: 'row', minHeight: 62 },
  ticketTimelineMarker: { width: 22, alignItems: 'center', marginRight: 9 },
  ticketTimelineDot: { width: 9, height: 9, marginTop: 4, borderRadius: 5, backgroundColor: C.brand },
  ticketTimelineCopy: { flex: 1, paddingBottom: 15, borderLeftWidth: 1, borderLeftColor: '#dfe6f2', paddingLeft: 13, marginLeft: -16 },
  ticketTimelineEventTitle: { color: C.ink, fontSize: 11, fontWeight: '800' },
  ticketTimelineDescription: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  ticketTimelineMeta: { color: '#9aa5b6', fontSize: 9, marginTop: 5 },
  footer: { color: '#a2acbc', textAlign: 'center', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 24 },
}); }
styles = createStyles();









