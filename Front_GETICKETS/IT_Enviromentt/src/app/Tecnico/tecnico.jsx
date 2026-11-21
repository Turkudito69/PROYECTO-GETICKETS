import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
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
  finalizarTicket,
  guardarObservacionTicket,
  iniciarAtencionTicket,
  obtenerDetallesGeneralesTicket,
  obtenerSeguimientoTicket,
  obtenerTickets,
} from '../../API/api';
import BrandLogo from '../../components/BrandLogo';
import GlassBackdrop from '../../components/GlassBackdrop';
import ProfileThemeModal from '../../components/ProfileThemeModal';
import { useAppTheme } from '../../context/AppThemeContext';

const C_DARK = {
  background: '#080914', surface: 'rgba(35,39,58,0.78)', modalSurface: '#1a1d2e', ink: '#F3F7FF', muted: '#B4C0D8',
  line: 'rgba(158,218,255,0.42)', brand: '#60D9FF', brandLight: 'rgba(66,174,255,0.20)', green: '#19966b',
  amber: '#bb7a17', red: '#d44a51', purple: '#8558e9', ticketSurface: '#1d2030', ticketLine: 'rgba(158,218,255,0.20)', inputSurface: '#111525',
};
const C_LIGHT = { background: '#f4f7fb', surface: '#ffffff', modalSurface: '#ffffff', ink: '#18233b', muted: '#78859a', line: '#e7edf4', brand: '#355df4', brandLight: '#ecf0ff', green: '#19966b', amber: '#bb7a17', red: '#d44a51', purple: '#8558e9', ticketSurface: '#ffffff', ticketLine: '#e7edf4', inputSurface: '#fbfcfe' };
let C = C_DARK;
let styles;

function leer(item, campo) {
  const mayuscula = campo[0].toUpperCase() + campo.slice(1);
  return item?.[campo] ?? item?.[mayuscula];
}

function normalizar(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function estadoDe(ticket) {
  return normalizar(leer(ticket, 'estadoTicket'));
}

function esAsignado(ticket) {
  return estadoDe(ticket).includes('asignad');
}

function esEnProceso(ticket) {
  return estadoDe(ticket).includes('proceso');
}

function esResuelto(ticket) {
  const estado = estadoDe(ticket);
  return estado.includes('resuelt') || estado.includes('finaliz') || estado.includes('cerrad') || estado.includes('completad');
}

function fechaOrden(ticket) {
  const fecha = new Date(leer(ticket, 'fehaCreacion') || leer(ticket, 'fechaCreacion')).getTime();
  return Number.isNaN(fecha) ? 0 : fecha;
}

function fechaVisible(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fechaHoraVisible(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleString('es-NI', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function estadoVisual(ticket) {
  if (esEnProceso(ticket)) return { label: 'En proceso', tone: 'working' };
  if (esResuelto(ticket)) return { label: 'Resuelto', tone: 'done' };
  if (esAsignado(ticket)) return { label: 'Asignado', tone: 'assigned' };
  return { label: String(leer(ticket, 'estadoTicket') || 'Pendiente'), tone: 'neutral' };
}

export default function TecnicoDashboard() {
  const { isDark, setMode } = useAppTheme();
  C = isDark ? C_DARK : C_LIGHT;
  styles = useMemo(() => createStyles(), [isDark]);
  const { idUsuario, nombre, apellido } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const compacto = width < 760;
  const usuarioId = Array.isArray(idUsuario) ? idUsuario[0] : idUsuario;
  const nombreCompleto = [nombre, apellido].flat().filter(Boolean).join(' ');
  const nombreTecnico = normalizar(nombreCompleto);

  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [seguimiento, setSeguimiento] = useState([]);
  const [detalleTecnico, setDetalleTecnico] = useState(null);
  const [modoAccion, setModoAccion] = useState('');
  const [observacion, setObservacion] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [solucion, setSolucion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [perfilVisible, setPerfilVisible] = useState(false);

  const cargarTickets = useCallback(async () => {
    if (!usuarioId || !nombreTecnico) {
      setError('No pudimos identificar tu cuenta. Cerrá sesión e iniciá nuevamente.');
      setTickets([]);
      setCargando(false);
      return [];
    }

    setCargando(true);
    setError('');
    try {
      const todos = await obtenerTickets();
      const asignados = todos.filter((ticket) => normalizar(leer(ticket, 'tecnico')) === nombreTecnico);
      setTickets(asignados);
      return asignados;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar tus tickets.');
      return [];
    } finally {
      setCargando(false);
    }
  }, [nombreTecnico, usuarioId]);

  useEffect(() => { void cargarTickets(); }, [cargarTickets]);

  const resumen = useMemo(() => ({
    total: tickets.length,
    asignados: tickets.filter(esAsignado).length,
    proceso: tickets.filter(esEnProceso).length,
    resueltos: tickets.filter(esResuelto).length,
  }), [tickets]);

  const ticketsVisibles = useMemo(() => {
    const query = normalizar(busqueda);
    return [...tickets]
      .filter((ticket) => {
        if (filtro === 'asignados') return esAsignado(ticket);
        if (filtro === 'proceso') return esEnProceso(ticket);
        if (filtro === 'resueltos') return esResuelto(ticket);
        return true;
      })
      .filter((ticket) => !query || `${leer(ticket, 'tickets')} ${leer(ticket, 'descripcion')} ${leer(ticket, 'categoria')} ${leer(ticket, 'prioridad')}`
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query))
      .sort((a, b) => fechaOrden(b) - fechaOrden(a));
  }, [busqueda, filtro, tickets]);

  const cargarComplementos = useCallback(async (idTicket) => {
    setCargandoDetalle(true);
    setErrorDetalle('');
    try {
      const [historial, detalles] = await Promise.all([
        obtenerSeguimientoTicket(idTicket),
        obtenerDetallesGeneralesTicket(),
      ]);
      setSeguimiento(historial);
      const codigo = String(leer(ticketSeleccionado, 'tickets') || '');
      setDetalleTecnico(detalles.find((detalle) => String(leer(detalle, 'ticket') || '') === codigo) || null);
    } catch (cause) {
      setErrorDetalle(cause instanceof Error ? cause.message : 'No se pudo cargar el seguimiento del ticket.');
    } finally {
      setCargandoDetalle(false);
    }
  }, [ticketSeleccionado]);

  const abrirDetalle = async (ticket) => {
    setTicketSeleccionado(ticket);
    setDetalleVisible(true);
    setModoAccion('');
    setObservacion('');
    setDiagnostico('');
    setSolucion('');
    setSeguimiento([]);
    setDetalleTecnico(null);
    setCargandoDetalle(true);
    setErrorDetalle('');
    try {
      const [historial, detalles] = await Promise.all([
        obtenerSeguimientoTicket(leer(ticket, 'idTicket')),
        obtenerDetallesGeneralesTicket(),
      ]);
      setSeguimiento(historial);
      const codigo = String(leer(ticket, 'tickets') || '');
      setDetalleTecnico(detalles.find((detalle) => String(leer(detalle, 'ticket') || '') === codigo) || null);
    } catch (cause) {
      setErrorDetalle(cause instanceof Error ? cause.message : 'No se pudo cargar el seguimiento del ticket.');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const sincronizarSeleccionado = async () => {
    const id = leer(ticketSeleccionado, 'idTicket');
    const lista = await cargarTickets();
    const actualizado = lista.find((ticket) => String(leer(ticket, 'idTicket')) === String(id));
    if (actualizado) setTicketSeleccionado(actualizado);
    if (id) await cargarComplementos(id);
  };

  const iniciarAtencion = async () => {
    if (!ticketSeleccionado || !usuarioId) return;
    setGuardando(true); setErrorDetalle(''); setMensaje('');
    try {
      await iniciarAtencionTicket({ IdTicket: Number(leer(ticketSeleccionado, 'idTicket')), IdUsuario: Number(usuarioId) });
      setMensaje(`Comenzaste la atención del ticket ${String(leer(ticketSeleccionado, 'tickets') || '')}.`);
      await sincronizarSeleccionado();
    } catch (cause) {
      setErrorDetalle(cause instanceof Error ? cause.message : 'No se pudo iniciar la atención.');
    } finally {
      setGuardando(false);
    }
  };

  const guardarNota = async () => {
    if (!observacion.trim()) {
      setErrorDetalle('Escribí una observación antes de guardarla.');
      return;
    }
    if (observacion.trim().length > 200) {
      setErrorDetalle('La observación debe tener como máximo 200 caracteres.');
      return;
    }
    setGuardando(true); setErrorDetalle('');
    try {
      await guardarObservacionTicket({
        IdTicket: Number(leer(ticketSeleccionado, 'idTicket')),
        IdUsuario: Number(usuarioId),
        Observacion: observacion.trim(),
      });
      setObservacion(''); setModoAccion('');
      setMensaje('La observación quedó registrada.');
      await sincronizarSeleccionado();
    } catch (cause) {
      setErrorDetalle(cause instanceof Error ? cause.message : 'No se pudo guardar la observación.');
    } finally {
      setGuardando(false);
    }
  };

  const finalizar = async () => {
    if (!diagnostico.trim() || !solucion.trim()) {
      setErrorDetalle('Completá el diagnóstico y la solución para finalizar el ticket.');
      return;
    }
    setGuardando(true); setErrorDetalle('');
    try {
      await finalizarTicket({
        IdTicket: Number(leer(ticketSeleccionado, 'idTicket')),
        IdUsuario: Number(usuarioId),
        Diagnostico: diagnostico.trim(),
        Solucion: solucion.trim(),
      });
      setDiagnostico(''); setSolucion(''); setModoAccion('');
      setMensaje(`El ticket ${String(leer(ticketSeleccionado, 'tickets') || '')} quedó resuelto.`);
      await sincronizarSeleccionado();
    } catch (cause) {
      setErrorDetalle(cause instanceof Error ? cause.message : 'No se pudo finalizar el ticket.');
    } finally {
      setGuardando(false);
    }
  };

  const cerrarDetalle = () => {
    if (guardando) return;
    setDetalleVisible(false);
    setTicketSeleccionado(null);
    setModoAccion('');
    setErrorDetalle('');
  };

  return (
    <SafeAreaView style={[styles.safeArea, !isDark && styles.safeAreaLight]}>
      <GlassBackdrop isDark={isDark} />
      <View style={styles.layout}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1d2030' : '#ffffff', borderBottomColor: isDark ? 'rgba(158,218,255,0.20)' : '#e7edf4' }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil y apariencia" onPress={() => setPerfilVisible(true)} style={styles.headerBrand}><BrandLogo size={39} titleSize={13} subtitleSize={8} subtitle="CENTRO DE SOPORTE" light={isDark} /></Pressable>
          <View style={styles.headerRight}>
            {!compacto ? <View style={styles.welcomeCopy}><Text style={[styles.welcomeName, { color: isDark ? '#F3F7FF' : '#18233b' }]}>{nombreCompleto ? `Hola, ${nombreCompleto}` : 'Panel técnico'}</Text><Text style={[styles.welcomeRole, { color: isDark ? '#B4C0D8' : '#78859a' }]}>Técnico de soporte</Text></View> : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={() => router.replace('/')} style={styles.logoutButton}><Text style={styles.logoutIcon}>↪</Text></Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.content, compacto && styles.contentCompact]} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, compacto && styles.heroCompact]}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>ESPACIO DE TRABAJO</Text>
              <Text style={[styles.title, compacto && styles.titleCompact]}>Mis tickets asignados</Text>
              <Text style={styles.subtitle}>Revisá las solicitudes, registrá avances y documentá las soluciones.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => void cargarTickets()} style={styles.refreshButton}><Text style={styles.refreshText}>↻  Actualizar</Text></Pressable>
          </View>

          {mensaje ? <View style={styles.successNotice}><Text style={styles.successText}>✓  {mensaje}</Text><Pressable onPress={() => setMensaje('')}><Text style={styles.noticeClose}>×</Text></Pressable></View> : null}
          {error ? <Notice text={error} onRetry={() => void cargarTickets()} /> : null}

          <View style={[styles.stats, compacto && styles.statsCompact]}>
            <StatCard label="Asignados" value={resumen.asignados} icon="◷" color={isDark ? C_DARK.brand : C_LIGHT.brand} hint="Listos para iniciar" compacto={compacto} isDark={isDark} />
            <StatCard label="En proceso" value={resumen.proceso} icon="⚒" color={C.amber} hint="Atención activa" compacto={compacto} isDark={isDark} />
            <StatCard label="Resueltos" value={resumen.resueltos} icon="✓" color={C.green} hint="Trabajo completado" compacto={compacto} isDark={isDark} />
            <StatCard label="Total" value={resumen.total} icon="▤" color={C.purple} hint="Tickets asignados" compacto={compacto} isDark={isDark} />
          </View>

          <View style={[styles.listPanel, { backgroundColor: isDark ? '#1d2030' : '#ffffff', borderColor: isDark ? 'rgba(158,218,255,0.20)' : '#e7edf4' }]}>
            <View style={[styles.listHeader, compacto && styles.listHeaderCompact, { backgroundColor: isDark ? '#1d2030' : '#ffffff', borderBottomColor: isDark ? 'rgba(158,218,255,0.20)' : '#e7edf4' }]}>
              <View><Text style={[styles.listTitle, { color: isDark ? '#F3F7FF' : '#18233b' }]}>Bandeja de atención</Text><Text style={[styles.listSubtitle, { color: isDark ? '#B4C0D8' : '#78859a' }]}>{ticketsVisibles.length} {ticketsVisibles.length === 1 ? 'ticket' : 'tickets'}</Text></View>
              <TextInput value={busqueda} onChangeText={setBusqueda} placeholder="Buscar ticket" placeholderTextColor={isDark ? '#96A5C0' : '#9aa5b5'} style={[styles.searchInput, compacto && styles.searchInputCompact, { backgroundColor: isDark ? '#111525' : '#fbfcfe', borderColor: isDark ? 'rgba(158,218,255,0.42)' : '#e7edf4', color: isDark ? '#F3F7FF' : '#18233b' }]} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {[
                ['todos', 'Todos'], ['asignados', 'Asignados'], ['proceso', 'En proceso'], ['resueltos', 'Resueltos'],
              ].map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: filtro === key }} onPress={() => setFiltro(key)} style={[styles.filterChip, filtro === key && styles.filterChipActive, { backgroundColor: filtro === key ? (isDark ? 'rgba(66,174,255,0.20)' : '#ecf0ff') : (isDark ? '#1d2030' : '#ffffff'), borderColor: isDark ? 'rgba(158,218,255,0.20)' : '#e7edf4' }]}><Text style={[styles.filterText, filtro === key && styles.filterTextActive, { color: filtro === key ? (isDark ? '#60D9FF' : '#355df4') : (isDark ? '#B4C0D8' : '#78859a') }]}>{label}</Text></Pressable>)}
            </ScrollView>

            {cargando ? <View style={styles.stateBox}><ActivityIndicator color={C.brand} /><Text style={styles.stateText}>Cargando tus tickets…</Text></View>
              : ticketsVisibles.length === 0 ? <View style={styles.stateBox}><Text style={styles.emptyIcon}>✓</Text><Text style={styles.emptyTitle}>{busqueda || filtro !== 'todos' ? 'No hay coincidencias' : 'Todo al día'}</Text><Text style={styles.stateText}>{busqueda || filtro !== 'todos' ? 'Probá con otro filtro o búsqueda.' : 'Cuando te asignen un ticket, aparecerá aquí.'}</Text></View>
                : <View style={styles.ticketRows}>{ticketsVisibles.map((ticket, index) => <TicketCard key={`${leer(ticket, 'idTicket') ?? 'ticket'}-${index}`} ticket={ticket} compacto={compacto} isDark={isDark} onOpen={() => void abrirDetalle(ticket)} />)}</View>}
          </View>
          <Text style={styles.footer}>TI ENVIRONMENT · MESA DE AYUDA</Text>
        </ScrollView>
      </View>

      <Modal transparent animationType="fade" visible={detalleVisible} onRequestClose={cerrarDetalle}>
        <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(2,4,14,0.72)' : 'rgba(15,28,50,0.38)' }]}>
          <View style={[styles.detailCard, compacto && styles.detailCardCompact, { backgroundColor: isDark ? '#1a1d2e' : '#ffffff', borderColor: isDark ? 'rgba(158,218,255,0.30)' : '#e7edf4' }]}>
            <View style={[styles.detailHeader, { backgroundColor: isDark ? '#1a1d2e' : '#ffffff', borderBottomColor: isDark ? 'rgba(158,218,255,0.24)' : '#e7edf4' }]}>
              <View style={styles.detailHeading}><Text style={[styles.detailEyebrow, { color: isDark ? '#60D9FF' : '#355df4' }]}>DETALLE DEL TICKET</Text><Text style={[styles.detailTitle, { color: isDark ? '#F3F7FF' : '#18233b' }]}>{String(leer(ticketSeleccionado, 'tickets') || 'Solicitud')}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar detalle" onPress={cerrarDetalle} style={[styles.closeButton, { backgroundColor: isDark ? '#252a3d' : '#f3f6fb' }]}><Text style={[styles.closeText, { color: isDark ? '#F3F7FF' : '#6d7b90' }]}>×</Text></Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
              {ticketSeleccionado ? <>
                <View style={[styles.detailIntro, { backgroundColor: isDark ? '#252a3d' : '#f7f9fc', borderColor: isDark ? 'rgba(158,218,255,0.20)' : '#e7edf4' }]}>
                  <Text style={[styles.descriptionLabel, { color: isDark ? '#B4C0D8' : '#78859a' }]}>Descripción del usuario</Text>
                  <Text style={[styles.descriptionText, { color: isDark ? '#F3F7FF' : '#18233b' }]}>{String(leer(ticketSeleccionado, 'descripcion') || 'Sin descripción')}</Text>
                </View>
                <View style={styles.metaGrid}>
                  <DetailField label="Categoría" value={leer(ticketSeleccionado, 'categoria')} isDark={isDark} />
                  <DetailField label="Prioridad" value={leer(ticketSeleccionado, 'prioridad')} isDark={isDark} />
                  <DetailField label="Fecha de registro" value={fechaVisible(leer(ticketSeleccionado, 'fehaCreacion') || leer(ticketSeleccionado, 'fechaCreacion'))} isDark={isDark} />
                  <DetailField label="Estado" value={String(leer(ticketSeleccionado, 'estadoTicket') || '')} isDark={isDark} />
                </View>
                {detalleTecnico ? <View style={[styles.resolutionBox, { backgroundColor: isDark ? '#172b2b' : '#f3faf6', borderColor: isDark ? 'rgba(77,220,190,0.28)' : '#dcefe6' }]}><Text style={[styles.resolutionTitle, { color: isDark ? '#60e0c0' : '#137a56' }]}>Diagnóstico y solución</Text><Text style={[styles.resolutionLabel, { color: isDark ? '#a9c9c2' : '#647c70' }]}>Diagnóstico</Text><Text style={[styles.resolutionText, { color: isDark ? '#e1f4ef' : '#355246' }]}>{String(leer(detalleTecnico, 'diagnostico') || '—')}</Text><Text style={[styles.resolutionLabel, { color: isDark ? '#a9c9c2' : '#647c70' }]}>Solución</Text><Text style={[styles.resolutionText, { color: isDark ? '#e1f4ef' : '#355246' }]}>{String(leer(detalleTecnico, 'solucion') || '—')}</Text></View> : null}

                <View style={styles.historySection}>
                  <View style={styles.historyHeading}><Text style={[styles.historyTitle, { color: isDark ? '#F3F7FF' : '#18233b' }]}>Actividad</Text>{cargandoDetalle ? <ActivityIndicator color={C.brand} size="small" /> : null}</View>
                  {errorDetalle ? <Notice text={errorDetalle} /> : null}
                  {!cargandoDetalle && !errorDetalle && seguimiento.length === 0 ? <Text style={[styles.emptyHistory, { color: isDark ? '#B4C0D8' : '#78859a' }]}>Aún no hay actividad registrada.</Text> : null}
                  {seguimiento.map((evento, index) => <View key={`${leer(evento, 'idSeguimientoTicket') ?? index}-${index}`} style={styles.timelineItem}><View style={styles.timelineMarker}><View style={styles.timelineDot} /></View><View style={[styles.timelineCopy, { borderBottomColor: isDark ? 'rgba(158,218,255,0.16)' : '#f0f3f7' }]}><Text style={[styles.timelineTitle, { color: isDark ? '#F3F7FF' : '#18233b' }]}>{String(leer(evento, 'titulo') || 'Actualización')}</Text><Text style={[styles.timelineDescription, { color: isDark ? '#B4C0D8' : '#68768b' }]}>{String(leer(evento, 'descripsion') || leer(evento, 'descripcion') || '')}</Text><Text style={[styles.timelineDate, { color: isDark ? '#91a0b9' : '#9aa5b5' }]}>{String(leer(evento, 'responsable') || 'Soporte')} · {fechaHoraVisible(leer(evento, 'fechaSeguimiento'))}</Text></View></View>)}
                </View>

                {modoAccion === 'observacion' ? <View style={styles.actionForm}><Text style={styles.actionTitle}>Registrar observación</Text><TextInput multiline value={observacion} onChangeText={setObservacion} maxLength={200} placeholder="Describe el avance o hallazgo (máximo 200 caracteres)" placeholderTextColor="#9aa5b5" style={styles.textArea} textAlignVertical="top" /><Text style={styles.characterCount}>{observacion.length}/200</Text></View> : null}
                {modoAccion === 'finalizar' ? <View style={styles.actionForm}><Text style={styles.actionTitle}>Documentar solución</Text><Text style={styles.formLabel}>Diagnóstico</Text><TextInput multiline value={diagnostico} onChangeText={setDiagnostico} placeholder="Qué causó el problema" placeholderTextColor="#9aa5b5" style={styles.textArea} textAlignVertical="top" /><Text style={styles.formLabel}>Solución aplicada</Text><TextInput multiline value={solucion} onChangeText={setSolucion} placeholder="Qué hiciste para resolverlo" placeholderTextColor="#9aa5b5" style={styles.textArea} textAlignVertical="top" /></View> : null}
              </> : null}
            </ScrollView>

            {ticketSeleccionado && !esResuelto(ticketSeleccionado) ? <View style={[styles.detailActions, compacto && styles.detailActionsCompact]}>
              {esAsignado(ticketSeleccionado) ? <Pressable disabled={guardando} onPress={() => void iniciarAtencion()} style={[styles.primaryAction, guardando && styles.disabledAction]}>{guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryActionText}>Iniciar atención</Text>}</Pressable> : null}
              {esEnProceso(ticketSeleccionado) && !modoAccion ? <>
                <Pressable onPress={() => { setErrorDetalle(''); setModoAccion('observacion'); }} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>＋ Observación</Text></Pressable>
                <Pressable onPress={() => { setErrorDetalle(''); setModoAccion('finalizar'); }} style={styles.primaryAction}><Text style={styles.primaryActionText}>Finalizar ticket</Text></Pressable>
              </> : null}
              {modoAccion ? <>
                <Pressable disabled={guardando} onPress={() => { setModoAccion(''); setErrorDetalle(''); }} style={styles.cancelAction}><Text style={styles.cancelActionText}>Cancelar</Text></Pressable>
                <Pressable disabled={guardando} onPress={() => void (modoAccion === 'observacion' ? guardarNota() : finalizar())} style={[styles.primaryAction, guardando && styles.disabledAction]}>{guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryActionText}>{modoAccion === 'observacion' ? 'Guardar observación' : 'Confirmar solución'}</Text>}</Pressable>
              </> : null}
            </View> : null}
          </View>
        </View>
      </Modal>
      <ProfileThemeModal visible={perfilVisible} onClose={() => setPerfilVisible(false)} name={nombreCompleto} role="Técnico de soporte" userId={usuarioId} isDark={isDark} onChangeTheme={setMode} />
    </SafeAreaView>
  );
}

function TicketCard({ ticket, compacto, onOpen, isDark }) {
  const theme = isDark
    ? { surface: '#1d2030', ink: '#F3F7FF', muted: '#B4C0D8', line: 'rgba(158,218,255,0.20)', brand: '#60D9FF' }
    : { surface: '#ffffff', ink: '#18233b', muted: '#78859a', line: '#e7edf4', brand: '#355df4' };
  const estado = estadoVisual(ticket);
  return (
    <View style={[styles.ticketRow, compacto && styles.ticketRowCompact, { backgroundColor: theme.surface, borderTopColor: theme.line }]}>
      <View style={styles.ticketIcon}><Text style={styles.ticketIconText}>▤</Text></View>
      <View style={styles.ticketCopy}>
        <View style={styles.ticketTitleRow}><Text style={[styles.ticketCode, { color: theme.brand }]}>{String(leer(ticket, 'tickets') || 'Ticket')}</Text><StatusBadge status={estado.label} tone={estado.tone} /></View>
        <Text numberOfLines={2} style={[styles.ticketDescription, { color: theme.ink }]}>{String(leer(ticket, 'descripcion') || 'Sin descripción')}</Text>
        <View style={styles.ticketMeta}><Text style={[styles.metaItem, { color: theme.muted }]}>{String(leer(ticket, 'categoria') || 'Sin categoría')}</Text><Text style={[styles.metaDot, { color: theme.muted }]}>·</Text><Text style={[styles.metaItem, { color: theme.muted }]}>{String(leer(ticket, 'prioridad') || 'Sin prioridad')}</Text><Text style={[styles.metaDot, { color: theme.muted }]}>·</Text><Text style={[styles.metaItem, { color: theme.muted }]}>{fechaVisible(leer(ticket, 'fehaCreacion') || leer(ticket, 'fechaCreacion'))}</Text></View>
      </View>
      <Pressable accessibilityRole="button" onPress={onOpen} style={[styles.openButton, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text style={[styles.openButtonText, { color: theme.brand }]}>Ver detalle</Text></Pressable>
    </View>
  );
}

function StatusBadge({ status, tone }) {
  const style = tone === 'working' ? styles.badgeWorking : tone === 'done' ? styles.badgeDone : tone === 'assigned' ? styles.badgeAssigned : styles.badgeNeutral;
  const textStyle = tone === 'working' ? styles.badgeWorkingText : tone === 'done' ? styles.badgeDoneText : tone === 'assigned' ? styles.badgeAssignedText : styles.badgeNeutralText;
  return <View style={[styles.statusBadge, style]}><Text style={[styles.statusText, textStyle]}>{status}</Text></View>;
}

function StatCard({ label, value, icon, hint, color, compacto, isDark }) {
  const theme = isDark
    ? { surface: '#1d2030', ink: '#F3F7FF', muted: '#B4C0D8', line: 'rgba(158,218,255,0.20)' }
    : { surface: '#ffffff', ink: '#18233b', muted: '#78859a', line: '#e7edf4' };
  return <View style={[styles.statCard, compacto && styles.statCardCompact, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={styles.statTop}><Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text><View style={[styles.statIcon, { backgroundColor: `${color}15` }]}><Text style={[styles.statIconText, { color }]}>{icon}</Text></View></View><Text style={[styles.statValue, { color: theme.ink }]}>{value}</Text><Text style={[styles.statHint, { color: theme.muted }]}>{hint}</Text></View>;
}

function DetailField({ label, value, isDark }) {
  return <View style={[styles.detailField, { backgroundColor: isDark ? '#252a3d' : '#ffffff', borderColor: isDark ? 'rgba(158,218,255,0.20)' : '#e7edf4' }]}><Text style={[styles.detailFieldLabel, { color: isDark ? '#B4C0D8' : '#78859a' }]}>{label}</Text><Text style={[styles.detailFieldValue, { color: isDark ? '#F3F7FF' : '#18233b' }]}>{String(value || '—')}</Text></View>;
}

function Notice({ text, onRetry }) {
  return <View style={styles.errorNotice}><Text style={styles.errorText}>⚠  {text}</Text>{onRetry ? <Pressable onPress={onRetry}><Text style={styles.retryText}>Reintentar</Text></Pressable> : null}</View>;
}

function createStyles() { return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#080914', position: 'relative' },
  safeAreaLight: { backgroundColor: '#f4f7fb' },
  layout: { flex: 1, width: '100%', maxWidth: 1500, alignSelf: 'center' },
  header: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line },
  headerBrand: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  welcomeCopy: { alignItems: 'flex-end' },
  welcomeName: { color: C.ink, fontSize: 12, fontWeight: '800' },
  welcomeRole: { color: C.muted, fontSize: 10, marginTop: 3 },
  logoutButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#f3f6fb' },
  logoutIcon: { color: '#65738a', fontSize: 19 },
  content: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 29, paddingBottom: 32, width: '100%', maxWidth: 1440, alignSelf: 'center', gap: 20 },
  contentCompact: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 17 },
  hero: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 },
  heroCompact: { alignItems: 'flex-start', flexDirection: 'column', gap: 13 },
  heroCopy: { flex: 1 },
  eyebrow: { color: C.brand, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: C.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.7, marginTop: 7 },
  titleCompact: { fontSize: 23 },
  subtitle: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  refreshButton: { minHeight: 38, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 9, backgroundColor: C.surface },
  refreshText: { color: '#56647b', fontSize: 11, fontWeight: '700' },
  successNotice: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 10, paddingHorizontal: 13, backgroundColor: '#eaf7f1' },
  successText: { flex: 1, color: '#137a56', fontSize: 11 },
  noticeClose: { color: '#4d8c72', fontSize: 20, paddingHorizontal: 4 },
  errorNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: '#fff0ef' },
  errorText: { flex: 1, color: '#b53c43', fontSize: 11, lineHeight: 17 },
  retryText: { color: C.brand, fontSize: 10, fontWeight: '800' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statsCompact: { gap: 9 },
  statCard: { flexGrow: 1, flexBasis: 0, minWidth: 150, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 15 },
  statCardCompact: { width: '48%', minWidth: 0, flexBasis: '48%', padding: 12 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statLabel: { color: C.muted, fontSize: 10, fontWeight: '700' },
  statIcon: { width: 29, height: 29, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statIconText: { fontSize: 13, fontWeight: '800' },
  statValue: { color: C.ink, fontSize: 25, fontWeight: '800', marginTop: 8 },
  statHint: { color: '#929daf', fontSize: 9, marginTop: 2 },
  listPanel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 15, overflow: 'hidden' },
  listHeader: { minHeight: 73, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  listHeaderCompact: { alignItems: 'flex-start', flexDirection: 'column' },
  listTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  listSubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  searchInput: { width: 240, minHeight: 38, borderWidth: 1, borderColor: C.line, borderRadius: 9, backgroundColor: C.inputSurface, paddingHorizontal: 11, color: C.ink, fontSize: 11, outlineStyle: 'none' },
  searchInputCompact: { width: '100%' },
  filters: { gap: 7, paddingHorizontal: 17, paddingVertical: 12 },
  filterChip: { minHeight: 30, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: C.line, paddingHorizontal: 11, backgroundColor: C.surface },
  filterChipActive: { backgroundColor: C.brandLight, borderColor: '#cbd6ff' },
  filterText: { color: '#65738a', fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: C.brand },
  ticketRows: { paddingHorizontal: 17 },
  ticketRow: { minHeight: 101, flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: C.ticketSurface, borderTopWidth: 1, borderTopColor: C.ticketLine, paddingVertical: 13 },
  ticketRowCompact: { alignItems: 'flex-start', flexWrap: 'wrap' },
  ticketIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#edf2ff' },
  ticketIconText: { color: C.brand, fontSize: 15, fontWeight: '800' },
  ticketCopy: { flex: 1, minWidth: 180, gap: 5 },
  ticketTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  ticketCode: { color: C.ink, fontSize: 12, fontWeight: '800' },
  ticketDescription: { color: '#647188', fontSize: 10, lineHeight: 15 },
  ticketMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 1 },
  metaItem: { color: '#929daf', fontSize: 9 },
  metaDot: { color: '#bcc4d0', fontSize: 10 },
  statusBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 9, fontWeight: '800' },
  badgeWorking: { backgroundColor: '#fff4df' },
  badgeWorkingText: { color: '#a96c0e' },
  badgeDone: { backgroundColor: '#eaf7f1' },
  badgeDoneText: { color: C.green },
  badgeAssigned: { backgroundColor: C.brandLight },
  badgeAssignedText: { color: C.brand },
  badgeNeutral: { backgroundColor: '#f1f3f6' },
  badgeNeutralText: { color: '#758196' },
  openButton: { minHeight: 34, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: '#dbe4f1', borderRadius: 8, backgroundColor: C.surface },
  openButtonText: { color: C.brand, fontSize: 10, fontWeight: '800' },
  stateBox: { minHeight: 205, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25, gap: 8 },
  stateText: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  emptyIcon: { color: C.green, fontSize: 24, fontWeight: '800' },
  emptyTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  footer: { color: '#a2acbc', fontSize: 8, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,28,50,0.48)', alignItems: 'center', justifyContent: 'center', padding: 14 },
  detailCard: { width: '100%', maxWidth: 740, maxHeight: '93%', backgroundColor: C.modalSurface, borderWidth: 1, borderColor: C.line, borderRadius: 19, overflow: 'hidden', shadowColor: '#14213a', shadowOpacity: 0.2, shadowRadius: 23, shadowOffset: { width: 0, height: 9 }, elevation: 12 },
  detailCardCompact: { maxHeight: '95%', borderRadius: 16 },
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingTop: 19, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.line },
  detailHeading: { flex: 1 },
  detailEyebrow: { color: C.brand, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  detailTitle: { color: C.ink, fontSize: 19, fontWeight: '800', marginTop: 5 },
  closeButton: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f6fb' },
  closeText: { color: '#6d7b90', fontSize: 23, lineHeight: 26 },
  detailContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 15 },
  detailIntro: { padding: 14, borderRadius: 11, backgroundColor: '#f6f8fc', borderWidth: 1, borderColor: '#edf1f6' },
  descriptionLabel: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  descriptionText: { color: C.ink, fontSize: 12, lineHeight: 19, marginTop: 7 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailField: { flexGrow: 1, flexBasis: '47%', minWidth: 130, padding: 10, borderWidth: 1, borderColor: C.line, borderRadius: 9, backgroundColor: C.surface },
  detailFieldLabel: { color: C.muted, fontSize: 9, fontWeight: '700' },
  detailFieldValue: { color: C.ink, fontSize: 11, fontWeight: '700', marginTop: 5 },
  resolutionBox: { padding: 13, borderRadius: 11, borderWidth: 1, borderColor: '#dcefe6', backgroundColor: '#f3faf6', gap: 6 },
  resolutionTitle: { color: '#137a56', fontSize: 11, fontWeight: '800', marginBottom: 2 },
  resolutionLabel: { color: '#647c70', fontSize: 9, fontWeight: '800', marginTop: 3 },
  resolutionText: { color: '#355246', fontSize: 11, lineHeight: 17 },
  historySection: { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 13 },
  historyHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  historyTitle: { color: C.ink, fontSize: 12, fontWeight: '800' },
  emptyHistory: { color: C.muted, fontSize: 10, paddingVertical: 8 },
  timelineItem: { flexDirection: 'row', gap: 9, minHeight: 52 },
  timelineMarker: { width: 10, alignItems: 'center', paddingTop: 5 },
  timelineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.brand },
  timelineCopy: { flex: 1, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f3f7' },
  timelineTitle: { color: C.ink, fontSize: 10, fontWeight: '800' },
  timelineDescription: { color: '#68768b', fontSize: 10, lineHeight: 15, marginTop: 3 },
  timelineDate: { color: '#9aa5b5', fontSize: 8, marginTop: 4 },
  actionForm: { padding: 13, borderRadius: 11, borderWidth: 1, borderColor: C.line, backgroundColor: C.inputSurface, gap: 8 },
  actionTitle: { color: C.ink, fontSize: 11, fontWeight: '800' },
  formLabel: { color: '#53637b', fontSize: 9, fontWeight: '800', marginTop: 2 },
  textArea: { minHeight: 78, maxHeight: 130, borderWidth: 1, borderColor: C.line, borderRadius: 9, backgroundColor: C.inputSurface, padding: 10, color: C.ink, fontSize: 11, lineHeight: 16, outlineStyle: 'none' },
  characterCount: { color: '#929daf', fontSize: 8, textAlign: 'right' },
  detailActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingVertical: 13, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.surface },
  detailActionsCompact: { justifyContent: 'stretch', paddingHorizontal: 14 },
  primaryAction: { minHeight: 39, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 9, backgroundColor: '#087DFF' },
  primaryActionText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  secondaryAction: { minHeight: 39, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, borderRadius: 9, borderWidth: 1, borderColor: '#dbe4f1', backgroundColor: C.surface },
  secondaryActionText: { color: C.brand, fontSize: 10, fontWeight: '800' },
  cancelAction: { minHeight: 39, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, borderRadius: 9, backgroundColor: '#f1f4f8' },
  cancelActionText: { color: '#56647b', fontSize: 10, fontWeight: '800' },
  disabledAction: { opacity: 0.55 },
}); }
styles = createStyles();









