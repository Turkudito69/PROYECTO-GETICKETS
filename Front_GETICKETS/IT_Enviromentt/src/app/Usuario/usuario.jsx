import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  crearTicket,
  obtenerCategorias,
  obtenerDetalleTicket,
  obtenerDetallesGeneralesTicket,
  obtenerPrioridades,
  obtenerSeguimientoTicket,
  obtenerTicketsPorUsuario,
} from '../../API/api';
import BrandLogo from '../../components/BrandLogo';
import DetalleGeneralTicketModal from '../../components/DetalleGeneralTicketModal';

const C = {
  background: '#f4f7fb', surface: '#ffffff', ink: '#18233b', muted: '#78859a',
  line: '#e7edf4', brand: '#355df4', brandLight: '#ecf0ff', green: '#19966b',
  amber: '#bb7a17', red: '#d44a51', purple: '#8558e9',
};

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
  const date = new Date(ticket.fechaCreacion || ticket.fehaCreacion).getTime();
  return Number.isNaN(date) ? 0 : date;
}

function fechaVisible(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UsuarioDashboard() {
  const { idUsuario, nombre, apellido } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [hidratado, setHidratado] = useState(false);
  const compacto = !hidratado || width < 760;
  const usuarioId = Array.isArray(idUsuario) ? idUsuario[0] : idUsuario;
  const nombreCompleto = [nombre, apellido].flat().filter(Boolean).join(' ');
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [prioridadId, setPrioridadId] = useState('');
  const [categoriaAbierta, setCategoriaAbierta] = useState(false);
  const [prioridadAbierta, setPrioridadAbierta] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [seguimiento, setSeguimiento] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [detalleGeneralVisible, setDetalleGeneralVisible] = useState(false);
  const [ticketDetalleGeneral, setTicketDetalleGeneral] = useState(null);
  const [detalleGeneral, setDetalleGeneral] = useState(null);
  const [cargandoDetalleGeneral, setCargandoDetalleGeneral] = useState(false);
  const [errorDetalleGeneral, setErrorDetalleGeneral] = useState('');

  const categoriasActivas = useMemo(() => categorias
    .filter((item) => esCatalogoActivo(item.estado ?? item.Estado))
    .map((item) => ({ id: item.idCategoria ?? item.IdCategoria, label: item.nombrecat ?? item.nombreCategoria ?? item.NombreCategoria }))
    .filter((item) => item.id && item.label), [categorias]);
  const prioridadesActivas = useMemo(() => prioridades
    .filter((item) => esCatalogoActivo(item.estado ?? item.Estado))
    .map((item) => ({ id: item.idPrioridad ?? item.IdPrioridad, label: item.nombrePrioridad ?? item.NombrePrioridad }))
    .filter((item) => item.id && item.label), [prioridades]);

  const cargarTickets = useCallback(async () => {
    if (!usuarioId) {
      setError('No recibimos el ID de tu cuenta. Cerrá sesión e iniciá nuevamente.');
      setTickets([]);
      setCargando(false);
      return;
    }

    setCargando(true);
    setError('');
    try {
      setTickets(await obtenerTicketsPorUsuario(usuarioId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar tus tickets.');
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => { void cargarTickets(); }, [cargarTickets]);
  useEffect(() => { setHidratado(true); }, []);

  const resumen = useMemo(() => ({
    total: tickets.length,
    abiertos: tickets.filter(esAbierto).length,
    proceso: tickets.filter(esEnProceso).length,
    resueltos: tickets.filter(esResuelto).length,
  }), [tickets]);
  const ticketsOrdenados = useMemo(
    () => [...tickets].sort((a, b) => fechaOrden(b) - fechaOrden(a)),
    [tickets],
  );

  const cargarCatalogos = useCallback(async () => {
    setCargandoCatalogos(true);
    setErrorFormulario('');
    try {
      const [listaCategorias, listaPrioridades] = await Promise.all([obtenerCategorias(), obtenerPrioridades()]);
      setCategorias(listaCategorias);
      setPrioridades(listaPrioridades);
    } catch (cause) {
      setErrorFormulario(cause instanceof Error ? cause.message : 'No se pudieron cargar las categorías y prioridades.');
    } finally {
      setCargandoCatalogos(false);
    }
  }, []);

  const abrirFormulario = () => {
    setMensaje('');
    setErrorFormulario('');
    setFormVisible(true);
    if (categorias.length === 0 || prioridades.length === 0) void cargarCatalogos();
  };

  const enviarTicket = async () => {
    if (!usuarioId) {
      setErrorFormulario('No pudimos identificar tu cuenta. Cerrá sesión e iniciá nuevamente.');
      return;
    }
    if (!descripcion.trim()) {
      setErrorFormulario('Escribí una descripción del problema.');
      return;
    }
    if (!categoriaId || !prioridadId) {
      setErrorFormulario('Seleccioná una categoría y una prioridad.');
      return;
    }

    setGuardando(true);
    setErrorFormulario('');
    try {
      await crearTicket({
        Descripcion: descripcion.trim(),
        IdUsuario: Number(usuarioId),
        IdCategoria: Number(categoriaId),
        IdPrioridad: Number(prioridadId),
      });
      setFormVisible(false);
      setDescripcion('');
      setCategoriaId('');
      setPrioridadId('');
      setMensaje('Tu solicitud se registró correctamente.');
      await cargarTickets();
    } catch (cause) {
      setErrorFormulario(cause instanceof Error ? cause.message : 'No se pudo registrar la solicitud.');
    } finally {
      setGuardando(false);
    }
  };

  const cargarDetalle = useCallback(async (ticket) => {
    setTicketSeleccionado(ticket);
    setDetalleVisible(true);
    setCargandoDetalle(true);
    setErrorDetalle('');
    setDetalle(null);
    setSeguimiento([]);
    try {
      const [detalles, eventos] = await Promise.all([
        obtenerDetalleTicket(ticket.idTicket),
        obtenerSeguimientoTicket(ticket.idTicket),
      ]);
      setDetalle(detalles[0] || null);
      setSeguimiento(eventos);
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
      const codigo = String(ticket.tickets || ticket.codigoTicket || '').trim().toLowerCase();
      setDetalleGeneral(detalles.find((item) => String(item.ticket || '').trim().toLowerCase() === codigo) || null);
    } catch (cause) {
      setErrorDetalleGeneral(cause instanceof Error ? cause.message : 'No se pudo cargar el detalle general.');
    } finally {
      setCargandoDetalleGeneral(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.layout}>
        <View style={styles.header}>
          <BrandLogo size={42} titleSize={14} subtitleSize={9} subtitle={nombreCompleto || 'PORTAL DE USUARIO'} />
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={() => router.replace('/')} style={styles.logoutButton}>
            <Text style={styles.logoutIcon}>↪</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.content, compacto && styles.contentCompact]}>
          <View style={[styles.pageHead, compacto && styles.pageHeadCompact]}>
            <View style={styles.pageHeadCopy}>
              <Text style={styles.eyebrow}>PORTAL DE SOPORTE</Text>
              <Text style={styles.title}>{nombre ? `¡Hola, ${String(nombre).split(' ')[0]}!` : 'Mis solicitudes'}</Text>
              <Text style={styles.subtitle}>Consultá el estado de tus solicitudes de soporte.</Text>
            </View>
          </View>

          {mensaje ? <View style={styles.successBanner}><Text style={styles.successText}>✓  {mensaje}</Text></View> : null}

          <View style={[styles.stats, compacto && styles.statsCompact]}>
            <StatCard label="Mis tickets" value={resumen.total} hint="Solicitudes registradas" color={C.brand} compacto={compacto} />
            <StatCard label="Abiertos" value={resumen.abiertos} hint="Pendientes de atención" color={C.brand} compacto={compacto} />
            <StatCard label="En atención" value={resumen.proceso} hint="Asignados o en proceso" color={C.amber} compacto={compacto} />
            <StatCard label="Resueltos" value={resumen.resueltos} hint="Atención completada" color={C.green} compacto={compacto} />
          </View>

          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" onPress={() => void cargarTickets()} style={styles.refreshButton}>
              <Text style={styles.refreshText}>↻  Actualizar</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={abrirFormulario} style={styles.createButton}>
              <Text style={styles.createButtonText}>＋  Nueva solicitud</Text>
            </Pressable>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHead}>
              <View>
                <Text style={styles.panelTitle}>Mis tickets</Text>
                <Text style={styles.panelSubtitle}>Tus solicitudes más recientes</Text>
              </View>
              <Text style={styles.resultCount}>{tickets.length} total</Text>
            </View>

            {cargando ? (
              <View style={styles.stateBox}><ActivityIndicator color={C.brand} /><Text style={styles.stateText}>Cargando tus tickets…</Text></View>
            ) : error ? (
              <View style={styles.stateBox}>
                <Text style={styles.errorTitle}>No se pudieron cargar tus tickets</Text>
                <Text style={styles.stateText}>{error}</Text>
                <Pressable onPress={() => void cargarTickets()} style={styles.retryButton}><Text style={styles.retryText}>Reintentar</Text></Pressable>
              </View>
            ) : tickets.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={styles.emptyIcon}>▤</Text>
                <Text style={styles.emptyTitle}>Todavía no tenés tickets</Text>
                <Text style={styles.stateText}>Cuando registres una solicitud, aparecerá aquí.</Text>
              </View>
            ) : (
              ticketsOrdenados.map((ticket) => (
                <React.Fragment key={ticket.idTicket}>
                  <TicketCard
                    ticket={ticket}
                    compacto={compacto}
                    onPress={() => void cargarDetalle(ticket)}
                    onGeneralDetails={() => void cargarDetalleGeneral(ticket)}
                    showGeneralDetails={esResuelto(ticket)}
                  />
                </React.Fragment>
              ))
            )}
          </View>
          <Text style={styles.footer}>TI ENVIRONMENT · CENTRO DE SOPORTE</Text>
        </ScrollView>
      </View>
      <FormularioTicket
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={() => void enviarTicket()}
        descripcion={descripcion}
        onChangeDescripcion={setDescripcion}
        categorias={categoriasActivas}
        prioridades={prioridadesActivas}
        categoriaId={categoriaId}
        prioridadId={prioridadId}
        onSelectCategoria={(id) => { setCategoriaId(id); setCategoriaAbierta(false); setErrorFormulario(''); }}
        onSelectPrioridad={(id) => { setPrioridadId(id); setPrioridadAbierta(false); setErrorFormulario(''); }}
        categoriaAbierta={categoriaAbierta}
        prioridadAbierta={prioridadAbierta}
        onToggleCategoria={() => { setCategoriaAbierta((value) => !value); setPrioridadAbierta(false); }}
        onTogglePrioridad={() => { setPrioridadAbierta((value) => !value); setCategoriaAbierta(false); }}
        cargandoCatalogos={cargandoCatalogos}
        guardando={guardando}
        error={errorFormulario}
      />
      <DetalleTicketModal
        visible={detalleVisible}
        ticket={ticketSeleccionado}
        detalle={detalle}
        seguimiento={seguimiento}
        cargando={cargandoDetalle}
        error={errorDetalle}
        onClose={() => setDetalleVisible(false)}
        onRetry={() => ticketSeleccionado && void cargarDetalle(ticketSeleccionado)}
      />
      <DetalleGeneralTicketModal
        visible={detalleGeneralVisible}
        ticket={ticketDetalleGeneral}
        detalle={detalleGeneral}
        cargando={cargandoDetalleGeneral}
        error={errorDetalleGeneral}
        onClose={() => setDetalleGeneralVisible(false)}
        onRetry={() => ticketDetalleGeneral && void cargarDetalleGeneral(ticketDetalleGeneral)}
      />
    </SafeAreaView>
  );
}

function esCatalogoActivo(estado) {
  if (!estado) return true;
  return ['activo', 'activa'].includes(normalizarEstado(estado));
}

function FormularioTicket({
  visible, onClose, onSubmit, descripcion, onChangeDescripcion, categorias, prioridades,
  categoriaId, prioridadId, onSelectCategoria, onSelectPrioridad,
  categoriaAbierta, prioridadAbierta, onToggleCategoria, onTogglePrioridad,
  cargandoCatalogos, guardando, error,
}) {
  const categoriaSeleccionada = categorias.find((item) => String(item.id) === String(categoriaId));
  const prioridadSeleccionada = prioridades.find((item) => String(item.id) === String(prioridadId));

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar formulario" onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.formCard}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderCopy}>
                <Text style={styles.eyebrow}>CENTRO DE SOPORTE</Text>
                <Text style={styles.formTitle}>Nueva solicitud</Text>
                <Text style={styles.formSubtitle}>Contanos qué problema necesitás resolver.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar formulario" onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            {cargandoCatalogos ? (
              <View style={styles.catalogLoading}><ActivityIndicator color={C.brand} /><Text style={styles.stateText}>Cargando opciones…</Text></View>
            ) : (
              <>
                <Text style={styles.formLabel}>Descripción del problema</Text>
                <TextInput
                  multiline
                  maxLength={800}
                  textAlignVertical="top"
                  value={descripcion}
                  onChangeText={onChangeDescripcion}
                  placeholder="Describí qué sucede y desde cuándo…"
                  placeholderTextColor="#a2acbc"
                  style={styles.descriptionInput}
                />

                <Text style={styles.formLabel}>Categoría</Text>
                <SelectorCatalogo
                  placeholder="Elegí una categoría"
                  value={categoriaSeleccionada?.label}
                  options={categorias}
                  abierto={categoriaAbierta}
                  onToggle={onToggleCategoria}
                  onSelect={onSelectCategoria}
                />

                <Text style={styles.formLabel}>Prioridad</Text>
                <SelectorCatalogo
                  placeholder="Elegí una prioridad"
                  value={prioridadSeleccionada?.label}
                  options={prioridades}
                  abierto={prioridadAbierta}
                  onToggle={onTogglePrioridad}
                  onSelect={onSelectPrioridad}
                />
              </>
            )}

            {error ? <Text style={styles.formError}>{error}</Text> : null}
            <View style={styles.formActions}>
              <Pressable disabled={guardando} onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
              <Pressable disabled={guardando || cargandoCatalogos} onPress={onSubmit} style={[styles.submitButton, (guardando || cargandoCatalogos) && styles.submitDisabled]}>
                {guardando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>Enviar solicitud</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SelectorCatalogo({ placeholder, value, options, abierto, onToggle, onSelect }) {
  return (
    <View style={styles.selector}>
      <Pressable accessibilityRole="button" onPress={onToggle} style={styles.selectorButton}>
        <Text style={[styles.selectorText, !value && styles.selectorPlaceholder]}>{value || placeholder}</Text>
        <Text style={styles.selectorChevron}>{abierto ? '⌃' : '⌄'}</Text>
      </Pressable>
      {abierto ? (
        <ScrollView nestedScrollEnabled style={styles.optionsList} keyboardShouldPersistTaps="handled">
          {options.length ? options.map((option) => (
            <Pressable key={option.id} onPress={() => onSelect(option.id)} style={styles.option}>
              <Text style={styles.optionText}>{option.label}</Text>
            </Pressable>
          )) : <Text style={styles.noOptions}>No hay opciones activas disponibles.</Text>}
        </ScrollView>
      ) : null}
    </View>
  );
}

function DetalleTicketModal({ visible, ticket, detalle, seguimiento, cargando, error, onClose, onRetry }) {
  const item = detalle || ticket || {};
  const codigo = item.codigoTicket || item.tickets || `TCK-${String(item.idTicket || '').padStart(6, '0')}`;
  const estado = item.estadoTicket || 'Sin estado';
  const badge = estiloEstado(estado);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.detailOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar detalle" onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.formHeaderCopy}>
              <Text style={styles.eyebrow}>SEGUIMIENTO DE SOLICITUD</Text>
              <Text style={styles.formTitle}>{codigo}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar detalle" onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
            {cargando ? (
              <View style={styles.stateBox}><ActivityIndicator color={C.brand} /><Text style={styles.stateText}>Cargando detalle y seguimiento…</Text></View>
            ) : error ? (
              <View style={styles.stateBox}>
                <Text style={styles.errorTitle}>No se pudo cargar el detalle</Text>
                <Text style={styles.stateText}>{error}</Text>
                <Pressable onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Reintentar</Text></Pressable>
              </View>
            ) : (
              <>
                <View style={styles.detailSummary}>
                  <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>● {estado}</Text>
                  </View>
                  <Text style={styles.detailDescription}>{item.descripcion || 'Sin descripción'}</Text>
                </View>

                <View style={styles.detailFields}>
                  <DetailField label="Solicitante" value={item.solicitante} />
                  <DetailField label="Técnico" value={item.tecnico || 'Sin asignar'} />
                  <DetailField label="Categoría" value={item.categoria} />
                  <DetailField label="Prioridad" value={item.prioridad} />
                  <DetailField label="Creado" value={fechaVisible(item.fechaCreacion || item.fehaCreacion)} />
                  {item.fechaSolucion ? <DetailField label="Resuelto" value={fechaVisible(item.fechaSolucion)} /> : null}
                </View>

                <View style={styles.timelineSection}>
                  <Text style={styles.timelineTitle}>Historial del ticket</Text>
                  {seguimiento.length === 0 ? (
                    <Text style={styles.stateText}>Todavía no hay actualizaciones de seguimiento.</Text>
                  ) : seguimiento.map((evento, index) => (
                    <View key={evento.idSeguimientoTicket || `${evento.fechaSeguimiento}-${index}`} style={styles.timelineItem}>
                      <View style={styles.timelineMarker}><View style={styles.timelineDot} /></View>
                      <View style={styles.timelineCopy}>
                        <Text style={styles.timelineEventTitle}>{evento.titulo || 'Actualización del ticket'}</Text>
                        <Text style={styles.timelineDescription}>{evento.descripsion || evento.descripcion || 'Sin descripción adicional.'}</Text>
                        <Text style={styles.timelineMeta}>{evento.responsable || 'Sistema'}  ·  {fechaVisible(evento.fechaSeguimiento)}</Text>
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

function DetailField({ label, value }) {
  return (
    <View style={styles.detailField}>
      <Text style={styles.detailFieldLabel}>{label}</Text>
      <Text style={styles.detailFieldValue}>{value || '—'}</Text>
    </View>
  );
}

function StatCard({ label, value, hint, color, compacto }) {
  return (
    <View style={[styles.statCard, compacto && styles.statCardCompact]}>
      <View style={styles.statTop}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}><Text style={[styles.statIconText, { color }]}>▤</Text></View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

function TicketCard({ ticket, compacto, onPress, onGeneralDetails, showGeneralDetails }) {
  const codigo = ticket.codigoTicket || ticket.tickets || `TCK-${String(ticket.idTicket).padStart(6, '0')}`;
  const estado = ticket.estadoTicket || 'Sin estado';
  const badge = estiloEstado(estado);
  const fecha = ticket.fechaCreacion || ticket.fehaCreacion;

  return (
    <View style={styles.ticketCard}>
      <View style={styles.ticketCardTop}>
        <Text style={styles.ticketCode}>{codigo}</Text>
        <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={[styles.statusBadgeText, { color: badge.color }]}>● {estado}</Text>
        </View>
      </View>
      <Text style={styles.ticketDescription}>{ticket.descripcion || 'Sin descripción'}</Text>
      <View style={[styles.ticketMetaRow, compacto && styles.ticketMetaCompact]}>
        <Text style={styles.ticketMeta}>{ticket.categoria || 'Sin categoría'}</Text>
        <Text style={[styles.ticketMeta, { color: colorPrioridad(ticket.prioridad) }]}>● {ticket.prioridad || 'Sin prioridad'}</Text>
      </View>
      <Text style={styles.ticketFooterMeta}>{ticket.tecnico || 'Sin asignar'}  ·  {fechaVisible(fecha)}</Text>
      <View style={styles.ticketActionRow}>
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.viewDetailButton}>
          <Text style={styles.viewDetailButtonText}>Ver detalle y seguimiento</Text>
        </Pressable>
        {showGeneralDetails ? (
          <Pressable accessibilityRole="button" onPress={onGeneralDetails} style={styles.generalTicketButton}>
            <Text style={styles.generalTicketButtonText}>Ver detalle general</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function estiloEstado(estado) {
  const normalized = normalizarEstado(estado);
  if (normalized.includes('resuelt') || normalized.includes('finaliz') || normalized.includes('cerrad')) return { backgroundColor: '#e6f7ef', color: C.green };
  if (normalized.includes('proceso')) return { backgroundColor: '#fff3dd', color: C.amber };
  if (normalized.includes('asignad')) return { backgroundColor: '#f1ebff', color: C.purple };
  if (normalized.includes('cancel')) return { backgroundColor: '#fff0f0', color: C.red };
  return { backgroundColor: '#eef3ff', color: C.brand };
}

function colorPrioridad(prioridad) {
  const value = normalizarEstado(prioridad);
  if (value.includes('alta')) return C.red;
  if (value.includes('media')) return C.amber;
  return C.green;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  layout: { flex: 1, backgroundColor: C.background },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line },
  logoutButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#f3f6fb' },
  logoutIcon: { color: C.muted, fontSize: 18 },
  content: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 28, paddingBottom: 32, width: '100%', maxWidth: 1440, alignSelf: 'center' },
  contentCompact: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 28 },
  pageHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 22 },
  pageHeadCompact: { alignItems: 'flex-start', flexDirection: 'column' },
  pageHeadCopy: { flex: 1 },
  eyebrow: { color: C.brand, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: C.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.7, marginTop: 7 },
  subtitle: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  refreshButton: { borderWidth: 1, borderColor: C.line, borderRadius: 9, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: C.surface },
  refreshText: { color: C.ink, fontSize: 11, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 17 },
  createButton: { alignSelf: 'flex-start', borderRadius: 9, paddingVertical: 10, paddingHorizontal: 13, backgroundColor: C.brand },
  createButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  successBanner: { paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16, borderRadius: 10, backgroundColor: '#e6f7ef' },
  successText: { color: C.green, fontSize: 11, fontWeight: '700' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statsCompact: { gap: 9 },
  statCard: { flexGrow: 1, flexBasis: 0, minWidth: 145, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 16, shadowColor: '#21385d', shadowOpacity: 0.035, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  statCardCompact: { width: '48%', minWidth: 0, flexBasis: '48%', padding: 13 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  statLabel: { color: C.muted, fontSize: 10, fontWeight: '700', flex: 1 },
  statIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statIconText: { fontSize: 15, fontWeight: '800' },
  statValue: { color: C.ink, fontSize: 27, fontWeight: '800', marginTop: 8 },
  statHint: { color: '#a2acbc', fontSize: 9, marginTop: 3 },
  panel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, overflow: 'hidden', shadowColor: '#21385d', shadowOpacity: 0.035, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  panelHead: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  panelTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  panelSubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  resultCount: { color: C.muted, fontSize: 10 },
  stateBox: { minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 9 },
  stateText: { color: C.muted, fontSize: 11, textAlign: 'center', lineHeight: 17 },
  errorTitle: { color: C.ink, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  emptyIcon: { color: '#a8b5c9', fontSize: 24 },
  emptyTitle: { color: C.ink, fontSize: 13, fontWeight: '800' },
  retryButton: { backgroundColor: C.brand, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 8, marginTop: 4 },
  retryText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  ticketCard: { padding: 15, borderTopWidth: 1, borderTopColor: '#f0f3f7' },
  ticketActionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 11 },
  generalTicketButton: { alignSelf: 'flex-start', minHeight: 30, justifyContent: 'center', paddingHorizontal: 9, borderRadius: 8, backgroundColor: '#e6f7ef' },
  generalTicketButtonText: { color: C.green, fontSize: 9, fontWeight: '800' },
  ticketCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ticketCode: { color: C.brand, fontSize: 10, fontWeight: '800' },
  statusBadge: { width: 'auto', flexGrow: 0, alignSelf: 'flex-start', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5 },
  statusBadgeText: { fontSize: 8, fontWeight: '800' },
  ticketDescription: { color: C.ink, fontSize: 11, fontWeight: '700', marginTop: 7 },
  ticketMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 11 },
  ticketMetaCompact: { marginTop: 9 },
  ticketMeta: { color: C.muted, fontSize: 10, fontWeight: '700' },
  ticketFooterMeta: { color: '#9aa5b6', fontSize: 9, marginTop: 9 },
  viewDetailButton: { alignSelf: 'flex-start', minHeight: 30, justifyContent: 'center', paddingHorizontal: 9, borderWidth: 1, borderColor: C.line, borderRadius: 8, backgroundColor: '#fff' },
  viewDetailButtonText: { color: C.muted, fontSize: 9, fontWeight: '800' },
  footer: { color: '#a2acbc', fontSize: 8, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginTop: 20 },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(15, 27, 48, 0.4)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  formCard: { width: '100%', maxWidth: 520, maxHeight: '92%', borderRadius: 18, overflow: 'hidden', backgroundColor: C.surface, shadowColor: '#14213a', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  formContent: { padding: 22, paddingBottom: 24 },
  formHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 16, marginBottom: 17, borderBottomWidth: 1, borderBottomColor: C.line },
  formHeaderCopy: { flex: 1 },
  formTitle: { color: C.ink, fontSize: 22, fontWeight: '800', marginTop: 6 },
  formSubtitle: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  closeButton: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f6fb' },
  closeButtonText: { color: C.ink, fontSize: 23, lineHeight: 26 },
  formLabel: { color: '#3c4c65', fontSize: 11, fontWeight: '800', marginTop: 13, marginBottom: 7 },
  descriptionInput: { minHeight: 105, maxHeight: 160, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: '#dfe6ef', borderRadius: 10, backgroundColor: '#fbfcfe', color: C.ink, fontSize: 12, lineHeight: 18 },
  selector: { borderWidth: 1, borderColor: '#dfe6ef', borderRadius: 10, backgroundColor: '#fbfcfe', overflow: 'hidden' },
  selectorButton: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  selectorText: { color: C.ink, fontSize: 12 },
  selectorPlaceholder: { color: '#a2acbc' },
  selectorChevron: { color: C.muted, fontSize: 17 },
  optionsList: { maxHeight: 150, borderTopWidth: 1, borderTopColor: C.line },
  option: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f0f3f7' },
  optionText: { color: C.ink, fontSize: 11 },
  noOptions: { color: C.muted, fontSize: 10, padding: 12 },
  catalogLoading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 9 },
  formError: { color: C.red, fontSize: 10, lineHeight: 15, marginTop: 12 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 20 },
  cancelButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: C.line, borderRadius: 9 },
  cancelText: { color: C.muted, fontSize: 11, fontWeight: '700' },
  submitButton: { minHeight: 42, minWidth: 136, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 9, backgroundColor: C.brand },
  submitDisabled: { opacity: 0.55 },
  submitText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  detailOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(15, 27, 48, 0.4)' },
  detailCard: { width: '100%', maxWidth: 620, maxHeight: '90%', borderRadius: 18, overflow: 'hidden', backgroundColor: C.surface, shadowColor: '#14213a', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingHorizontal: 22, paddingTop: 21, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: C.line },
  detailContent: { padding: 22, paddingBottom: 25 },
  detailSummary: { padding: 15, borderRadius: 12, backgroundColor: '#f7f9fc' },
  detailDescription: { color: C.ink, fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 10 },
  detailFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  detailField: { width: '48%', minWidth: 130, padding: 11, borderWidth: 1, borderColor: C.line, borderRadius: 10, backgroundColor: '#fff' },
  detailFieldLabel: { color: '#99a4b5', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  detailFieldValue: { color: C.ink, fontSize: 11, fontWeight: '700', marginTop: 5 },
  timelineSection: { marginTop: 22 },
  timelineTitle: { color: C.ink, fontSize: 13, fontWeight: '800', marginBottom: 12 },
  timelineItem: { flexDirection: 'row', minHeight: 62 },
  timelineMarker: { width: 22, alignItems: 'center', marginRight: 9 },
  timelineDot: { width: 9, height: 9, marginTop: 4, borderRadius: 5, backgroundColor: C.brand },
  timelineCopy: { flex: 1, paddingBottom: 15, borderLeftWidth: 1, borderLeftColor: '#dfe6f2', paddingLeft: 13, marginLeft: -16 },
  timelineEventTitle: { color: C.ink, fontSize: 11, fontWeight: '800' },
  timelineDescription: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  timelineMeta: { color: '#9aa5b6', fontSize: 9, marginTop: 5 },
});
