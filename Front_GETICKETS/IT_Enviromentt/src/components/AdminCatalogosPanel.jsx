import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { desactivarCatalogo, guardarCatalogo, obtenerCategorias, obtenerEstados, obtenerPrioridades, obtenerRoles } from '../API/api';
import { useAppTheme } from '../context/AppThemeContext';

const C_DARK = {
  surface: 'rgba(35,39,58,0.78)', modalSurface: '#1a1d2e', inputSurface: '#111525', ink: '#F3F7FF', muted: '#B4C0D8', line: 'rgba(158,218,255,0.42)',
  brand: '#60D9FF', brandLight: 'rgba(66,174,255,0.20)', green: '#19966b', red: '#d44a51',
  background: '#080914',
};
const C_LIGHT = { surface: '#ffffff', modalSurface: '#ffffff', inputSurface: '#fbfcfe', ink: '#18233b', muted: '#78859a', line: '#e7edf4', brand: '#355df4', brandLight: '#ecf0ff', green: '#19966b', red: '#d44a51', background: '#f4f7fb' };
let C = C_DARK;
let styles;

const catalogos = {
  categorias: {
    label: 'Categorías', singular: 'categoría', id: 'idCategoria', name: 'nombrecat', payloadName: 'NombreCategoria',
    list: obtenerCategorias, icon: '▦',
  },
  prioridades: {
    label: 'Prioridades', singular: 'prioridad', id: 'idPrioridad', name: 'nombrePrioridad', payloadName: 'NombrePrioridad',
    list: obtenerPrioridades, icon: '⚑',
  },
  roles: {
    label: 'Roles', singular: 'rol', id: 'idRol', name: 'nombreRol', payloadName: 'NombreRol',
    list: obtenerRoles, icon: '♙',
  },
  estados: {
    label: 'Estados', singular: 'estado', id: 'idEstado', name: 'nombreEstado', payloadName: 'NombreEstado',
    list: obtenerEstados, icon: '◉',
  },
};

function normalizar(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function leer(item, campo) {
  const mayuscula = campo[0].toUpperCase() + campo.slice(1);
  return item?.[campo] ?? item?.[mayuscula];
}

function idEstadoActivo(estados) {
  const activo = estados.find((estado) => normalizar(leer(estado, 'nombreEstado')) === 'activo');
  return leer(activo, 'idEstado') ?? leer(estados[0], 'idEstado') ?? '';
}

export default function AdminCatalogosPanel({ activeTab, onTabChange, compacto }) {
  const { isDark } = useAppTheme();
  C = isDark ? C_DARK : C_LIGHT;
  styles = useMemo(() => createStyles(), [isDark]);
  const [items, setItems] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [registroEditado, setRegistroEditado] = useState(null);
  const [nombre, setNombre] = useState('');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [confirmarDesactivacion, setConfirmarDesactivacion] = useState(null);

  const config = catalogos[activeTab] || catalogos.categorias;
  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const lista = await config.list();
      const estadosActuales = activeTab === 'estados' ? lista : await obtenerEstados();
      setItems(lista);
      setEstados(estadosActuales);
      setEstadoSeleccionado((actual) => actual || String(idEstadoActivo(estadosActuales)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `No se pudieron cargar ${config.label.toLowerCase()}.`);
    } finally {
      setCargando(false);
    }
  }, [activeTab, config]);

  useEffect(() => { void cargar(); }, [cargar]);

  const registrosOrdenados = useMemo(() => [...items].sort((a, b) =>
    String(leer(a, config.name) || '').localeCompare(String(leer(b, config.name) || ''), 'es'),
  ), [items, config]);

  const abrirNuevo = () => {
    setRegistroEditado(null);
    setNombre('');
    setEstadoSeleccionado(String(idEstadoActivo(estados)));
    setError('');
    setMensaje('');
    setModalVisible(true);
  };

  const abrirEdicion = (item) => {
    setRegistroEditado(item);
    setNombre(String(leer(item, config.name) || ''));
    const estadoNombre = normalizar(leer(item, 'estado'));
    const estadoActual = estados.find((estado) => normalizar(leer(estado, 'nombreEstado')) === estadoNombre);
    setEstadoSeleccionado(String(leer(estadoActual, 'idEstado') ?? idEstadoActivo(estados)));
    setError('');
    setMensaje('');
    setModalVisible(true);
  };

  const guardar = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError(`Escribí el nombre de la ${config.singular}.`);
      return;
    }
    if (activeTab !== 'estados' && !estadoSeleccionado) {
      setError('Primero agregá un estado, por ejemplo Activo, desde el catálogo Estados.');
      return;
    }

    const id = registroEditado ? leer(registroEditado, config.id) : null;
    const datos = { [config.payloadName]: nombreLimpio };
    if (activeTab !== 'estados') datos.IdEstado = Number(estadoSeleccionado);
    if (id !== null && id !== undefined) datos[config.id[0].toUpperCase() + config.id.slice(1)] = Number(id);

    setGuardando(true);
    setError('');
    try {
      await guardarCatalogo(activeTab, datos, id ?? null);
      setModalVisible(false);
      setMensaje(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} ${registroEditado ? 'actualizada' : 'agregada'} correctamente.`);
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `No se pudo guardar la ${config.singular}.`);
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async () => {
    if (!confirmarDesactivacion) return;
    const registro = confirmarDesactivacion;
    const id = leer(registro, config.id);
    setGuardando(true);
    setError('');
    try {
      await desactivarCatalogo(activeTab, id);
      setConfirmarDesactivacion(null);
      setMensaje(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} desactivada.`);
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `No se pudo desactivar la ${config.singular}.`);
      setConfirmarDesactivacion(null);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.panel}>
      <View style={[styles.panelHeader, compacto && styles.panelHeaderCompact]}>
        <Pressable accessibilityRole="button" onPress={abrirNuevo} style={styles.addButton}>
          <Text style={styles.addButtonText}>＋  Agregar</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {Object.entries(catalogos).map(([key, item]) => (
          <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: activeTab === key }} onPress={() => { setError(''); setMensaje(''); onTabChange(key); }} style={[styles.tab, activeTab === key && styles.tabActive]}>
            <Text style={[styles.tabIcon, activeTab === key && styles.tabTextActive]}>{item.icon}</Text>
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {mensaje ? <Notice tone="success" text={mensaje} /> : null}
      {error ? <Notice tone="error" text={error} onRetry={() => void cargar()} /> : null}

      <View style={styles.listCard}>
        <View style={styles.listHeader}>
          <View><Text style={styles.listTitle}>Registros</Text><Text style={styles.listSubtitle}>{items.length} {items.length === 1 ? 'elemento' : 'elementos'}</Text></View>
          <Pressable accessibilityRole="button" onPress={() => void cargar()} style={styles.refreshButton}><Text style={styles.refreshText}>↻ Actualizar</Text></Pressable>
        </View>

        {cargando ? (
          <View style={styles.stateBox}><ActivityIndicator color={C.brand} /><Text style={styles.stateText}>Cargando {config.label.toLowerCase()}…</Text></View>
        ) : registrosOrdenados.length === 0 ? (
          <View style={styles.stateBox}><Text style={styles.emptyIcon}>{config.icon}</Text><Text style={styles.emptyTitle}>Todavía no hay registros</Text><Text style={styles.stateText}>Agregá el primero para que esté disponible en el sistema.</Text></View>
        ) : (
          <View style={styles.rows}>
            {registrosOrdenados.map((item, index) => {
              const estado = String(leer(item, 'estado') || (activeTab === 'estados' ? 'Activo' : ''));
              const estaActivo = !normalizar(estado).includes('inactiv') && (activeTab === 'estados' || normalizar(estado) === 'activo' || normalizar(estado) === 'activa');
              return (
                <View key={`${activeTab}-${String(leer(item, config.id) ?? 'registro')}-${index}`} style={[styles.row, compacto && styles.rowCompact]}>
                  <View style={styles.rowMain}>
                    <View style={[styles.rowIcon, { backgroundColor: `${C.brand}12` }]}><Text style={styles.rowIconText}>{config.icon}</Text></View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowName}>{String(leer(item, config.name) || 'Sin nombre')}</Text>
                    </View>
                    {activeTab !== 'estados' ? <View style={[styles.statusBadge, estaActivo ? styles.statusActive : styles.statusInactive]}><Text style={[styles.statusText, estaActivo ? styles.statusActiveText : styles.statusInactiveText]}>{estado || 'Sin estado'}</Text></View> : null}
                  </View>
                  <View style={styles.rowActions}>
                    <Pressable accessibilityRole="button" onPress={() => abrirEdicion(item)} style={styles.actionButton}><Text style={styles.actionText}>Editar</Text></Pressable>
                    {activeTab !== 'estados' ? <Pressable accessibilityRole="button" onPress={() => {
                      const existeInactivo = estados.some((estado) => normalizar(leer(estado, 'nombreEstado')) === 'inactivo');
                      if (!existeInactivo) {
                        setError('Agregá el estado “Inactivo” en la pestaña Estados antes de desactivar registros.');
                        return;
                      }
                      setConfirmarDesactivacion(item);
                    }} style={styles.deactivateButton}><Text style={styles.deactivateText}>Desactivar</Text></Pressable> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <Text style={styles.footnote}>Los cambios se guardan directamente en la base de datos del sistema.</Text>

      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => !guardando && setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, compacto && styles.modalCardCompact]}>
            <View style={styles.modalHeader}>
              <View><Text style={styles.modalEyebrow}>{registroEditado ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'}</Text><Text style={styles.modalTitle}>{registroEditado ? `Editar ${config.singular}` : `Agregar ${config.singular}`}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar formulario" disabled={guardando} onPress={() => setModalVisible(false)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            <Text style={styles.formLabel}>Nombre</Text>
            <TextInput autoFocus value={nombre} onChangeText={setNombre} placeholder={`Nombre de ${config.singular}`} placeholderTextColor="#a2acbc" style={styles.input} editable={!guardando} maxLength={100} />
            {activeTab !== 'estados' ? <>
              <Text style={[styles.formLabel, styles.statusLabel]}>Estado</Text>
              {estados.length === 0 ? <Text style={styles.helperText}>No hay estados todavía. Creá “Activo” en la pestaña Estados y volvé a este formulario.</Text> : (
                <View style={styles.stateOptions}>
                  {estados.map((estado) => {
                    const id = String(leer(estado, 'idEstado'));
                    const selected = estadoSeleccionado === id;
                    return <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setEstadoSeleccionado(id)} style={[styles.stateOption, selected && styles.stateOptionSelected]}><Text style={[styles.stateOptionText, selected && styles.stateOptionTextSelected]}>{String(leer(estado, 'nombreEstado') || 'Estado')}</Text></Pressable>;
                  })}
                </View>
              )}
            </> : <Text style={styles.helperText}>Este estado estará disponible para asignarse a categorías, prioridades y roles.</Text>}
            {error ? <Notice tone="error" text={error} /> : null}
            <View style={styles.modalActions}>
              <Pressable disabled={guardando} onPress={() => setModalVisible(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
              <Pressable disabled={guardando || (activeTab !== 'estados' && estados.length === 0)} onPress={() => void guardar()} style={[styles.saveButton, (guardando || (activeTab !== 'estados' && estados.length === 0)) && styles.disabledButton]}>{guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{registroEditado ? 'Guardar cambios' : 'Agregar'}</Text>}</Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={Boolean(confirmarDesactivacion)} onRequestClose={() => !guardando && setConfirmarDesactivacion(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.confirmCard]}>
            <View style={styles.confirmIcon}><Text style={styles.confirmIconText}>!</Text></View>
            <Text style={styles.confirmTitle}>¿Desactivar {config.singular}?</Text>
            <Text style={styles.confirmCopy}>“{String(leer(confirmarDesactivacion, config.name) || '')}” dejará de estar disponible para nuevos registros. Podés volver a activarla editando su estado.</Text>
            <View style={styles.modalActions}>
              <Pressable disabled={guardando} onPress={() => setConfirmarDesactivacion(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
              <Pressable disabled={guardando} onPress={() => void desactivar()} style={[styles.deleteButton, guardando && styles.disabledButton]}>{guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Desactivar</Text>}</Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Notice({ tone, text, onRetry }) {
  const success = tone === 'success';
  return <View style={[styles.notice, success ? styles.noticeSuccess : styles.noticeError]}><Text style={[styles.noticeText, success ? styles.noticeSuccessText : styles.noticeErrorText]}>{success ? '✓  ' : '⚠  '}{text}</Text>{onRetry ? <Pressable onPress={onRetry}><Text style={styles.retryLink}>Reintentar</Text></Pressable> : null}</View>;
}

function createStyles() { return StyleSheet.create({
  panel: { gap: 20 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  panelHeaderCompact: { alignItems: 'center' },
  addButton: { minHeight: 44, borderRadius: 11, backgroundColor: '#087DFF', paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  tabs: { gap: 8, paddingVertical: 2 },
  tab: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 11, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 14 },
  tabActive: { borderColor: '#cbd6ff', backgroundColor: C.brandLight },
  tabIcon: { color: C.muted, fontSize: 14, fontWeight: '800' },
  tabText: { color: C.muted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: C.brand },
  notice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11 },
  noticeSuccess: { backgroundColor: '#eaf7f1' },
  noticeError: { backgroundColor: '#fff0ef' },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18 },
  noticeSuccessText: { color: '#137a56' },
  noticeErrorText: { color: '#b53c43' },
  retryLink: { color: C.brand, fontSize: 12, fontWeight: '800' },
  listCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 17, overflow: 'hidden' },
  listHeader: { minHeight: 70, borderBottomWidth: 1, borderBottomColor: C.line, paddingHorizontal: 19, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  listTitle: { color: C.ink, fontSize: 15, fontWeight: '800' },
  listSubtitle: { color: C.muted, fontSize: 11, marginTop: 4 },
  refreshButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: C.brandLight },
  refreshText: { color: C.muted, fontSize: 11, fontWeight: '700' },
  rows: { paddingHorizontal: 18 },
  row: { minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottomWidth: 1, borderBottomColor: C.line },
  rowCompact: { alignItems: 'flex-start', flexDirection: 'column', paddingVertical: 14, gap: 10 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowIconText: { color: C.brand, fontSize: 15, fontWeight: '800' },
  rowCopy: { flex: 1 },
  rowName: { color: C.ink, fontSize: 13, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99 },
  statusActive: { backgroundColor: '#eaf7f1' },
  statusInactive: { backgroundColor: '#f1f3f6' },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusActiveText: { color: C.green },
  statusInactiveText: { color: '#758196' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionButton: { borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  actionText: { color: C.brand, fontSize: 11, fontWeight: '800' },
  deactivateButton: { borderWidth: 1, borderColor: '#f0d8d8', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8 },
  deactivateText: { color: C.red, fontSize: 11, fontWeight: '800' },
  stateBox: { minHeight: 205, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 9 },
  stateText: { color: C.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  emptyIcon: { color: '#9eacd0', fontSize: 24, fontWeight: '800' },
  emptyTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  footnote: { color: '#98a2b2', fontSize: 10, lineHeight: 15 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,28,50,0.43)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  modalCard: { width: '100%', maxWidth: 480, borderRadius: 18, backgroundColor: C.modalSurface, borderWidth: 1, borderColor: C.line, padding: 23, gap: 11, shadowColor: '#14223b', shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 7 },
  modalCardCompact: { padding: 19, borderRadius: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  modalEyebrow: { color: C.brand, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  modalTitle: { color: C.ink, fontSize: 20, fontWeight: '800', marginTop: 5 },
  closeButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f4f8', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#6d7b90', fontSize: 24, lineHeight: 27 },
  formLabel: { color: '#3c4c65', fontSize: 11, fontWeight: '800' },
  statusLabel: { marginTop: 5 },
  input: { minHeight: 46, borderWidth: 1, borderColor: C.line, borderRadius: 10, backgroundColor: C.inputSurface, paddingHorizontal: 13, color: C.ink, fontSize: 13, outlineStyle: 'none' },
  stateOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stateOption: { borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8 },
  stateOptionSelected: { backgroundColor: C.brandLight, borderColor: '#bdcaff' },
  stateOptionText: { color: '#647188', fontSize: 11, fontWeight: '700' },
  stateOptionTextSelected: { color: C.brand },
  helperText: { color: C.muted, fontSize: 11, lineHeight: 17 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 9 },
  cancelButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 9, backgroundColor: C.brandLight },
  cancelText: { color: C.muted, fontSize: 11, fontWeight: '800' },
  saveButton: { minHeight: 40, minWidth: 104, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 9, backgroundColor: C.brand },
  deleteButton: { minHeight: 40, minWidth: 104, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 9, backgroundColor: C.red },
  saveText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
  confirmCard: { maxWidth: 410, alignItems: 'center', padding: 24 },
  confirmIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff0ef', alignItems: 'center', justifyContent: 'center' },
  confirmIconText: { color: C.red, fontSize: 20, fontWeight: '800' },
  confirmTitle: { color: C.ink, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  confirmCopy: { color: C.muted, fontSize: 12, lineHeight: 19, textAlign: 'center' },
}); }
styles = createStyles();








