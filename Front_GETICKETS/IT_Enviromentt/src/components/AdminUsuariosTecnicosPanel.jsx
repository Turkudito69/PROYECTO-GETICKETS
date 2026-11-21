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

import {
  desactivarTecnico,
  desactivarUsuario,
  guardarTecnico,
  guardarUsuario,
  obtenerEstados,
  obtenerRoles,
  obtenerTecnicos,
  obtenerUsuarios,
} from '../API/api';
import { useAppTheme } from '../context/AppThemeContext';

const C_DARK = {
  ink: '#F3F7FF', muted: '#B4C0D8', line: 'rgba(158,218,255,0.42)', brand: '#60D9FF', modalSurface: '#1a1d2e', inputSurface: '#111525',
  brandLight: 'rgba(66,174,255,0.20)', green: '#19966b', red: '#d44a51', surface: 'rgba(35,39,58,0.78)',
};
const C_LIGHT = { ink: '#18233b', muted: '#78859a', line: '#e7edf4', brand: '#355df4', brandLight: '#ecf0ff', green: '#19966b', red: '#d44a51', surface: '#ffffff', modalSurface: '#ffffff', inputSurface: '#fbfcfe' };
let C = C_DARK;
let styles;

function leer(item, campo) {
  const mayuscula = campo[0].toUpperCase() + campo.slice(1);
  return item?.[campo] ?? item?.[mayuscula];
}

function normalizar(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function nombreCompleto(item) {
  return [leer(item, 'nombre'), leer(item, 'apellido')].filter(Boolean).join(' ') || 'Sin nombre';
}

function estaActivo(item) {
  const estado = normalizar(leer(item, 'estado'));
  return estado === 'activo' || estado === 'activa';
}

function estadoIdPorNombre(estados, nombre) {
  const encontrado = estados.find((item) => normalizar(leer(item, 'nombreEstado')) === normalizar(nombre));
  return leer(encontrado, 'idEstado') ?? leer(estados.find((item) => normalizar(leer(item, 'nombreEstado')) === 'activo'), 'idEstado') ?? leer(estados[0], 'idEstado') ?? '';
}

function rolEsTecnico(rol) {
  return normalizar(rol).includes('tecnic');
}

export default function AdminUsuariosTecnicosPanel({ activeTab, onTabChange, compacto }) {
  const { isDark } = useAppTheme();
  C = isDark ? C_DARK : C_LIGHT;
  styles = useMemo(() => createStyles(), [isDark]);
  const [usuarios, setUsuarios] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [edicion, setEdicion] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rolId, setRolId] = useState('');
  const [estadoId, setEstadoId] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [usuarioTecnicoId, setUsuarioTecnicoId] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [listaUsuarios, listaTecnicos, listaRoles, listaEstados] = await Promise.all([
        obtenerUsuarios(), obtenerTecnicos(), obtenerRoles(), obtenerEstados(),
      ]);
      setUsuarios(listaUsuarios);
      setTecnicos(listaTecnicos);
      setRoles(listaRoles);
      setEstados(listaEstados);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar usuarios y técnicos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const rolesActivos = useMemo(() => roles.filter(estaActivo), [roles]);
  const usuariosParaTecnico = useMemo(() => {
    const usados = new Set(tecnicos.map((item) => String(leer(item, 'correo') || '').toLowerCase()));
    return usuarios.filter((item) => {
      const correoUsuario = String(leer(item, 'correo') || '').toLowerCase();
      return estaActivo(item) && rolEsTecnico(leer(item, 'rol')) && (!usados.has(correoUsuario) || String(leer(item, 'idUsuario')) === usuarioTecnicoId);
    });
  }, [tecnicos, usuarios, usuarioTecnicoId]);

  const filtro = normalizar(busqueda);
  const usuariosVisibles = useMemo(() => usuarios.filter((item) =>
    `${nombreCompleto(item)} ${leer(item, 'correo')} ${leer(item, 'rol')} ${leer(item, 'estado')}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(filtro),
  ), [filtro, usuarios]);
  const tecnicosVisibles = useMemo(() => tecnicos.filter((item) =>
    `${nombreCompleto(item)} ${leer(item, 'correo')} ${leer(item, 'especialidad')} ${leer(item, 'estado')}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(filtro),
  ), [filtro, tecnicos]);

  const abrirNuevo = () => {
    setEdicion(null);
    setNombre(''); setApellido(''); setCorreo(''); setContrasena('');
    setRolId(''); setEstadoId(String(estadoIdPorNombre(estados, 'Activo')));
    setEspecialidad(''); setUsuarioTecnicoId(''); setError(''); setMensaje('');
    setModalVisible(true);
  };

  const abrirEdicionUsuario = (item) => {
    const rol = roles.find((registro) => normalizar(leer(registro, 'nombreRol')) === normalizar(leer(item, 'rol')));
    setEdicion(item);
    setNombre(String(leer(item, 'nombre') || ''));
    setApellido(String(leer(item, 'apellido') || ''));
    setCorreo(String(leer(item, 'correo') || ''));
    setContrasena('');
    setRolId(String(leer(rol, 'idRol') || ''));
    setEstadoId(String(estadoIdPorNombre(estados, leer(item, 'estado'))));
    setError(''); setMensaje(''); setModalVisible(true);
  };

  const abrirEdicionTecnico = (item) => {
    const usuario = usuarios.find((registro) => String(leer(registro, 'correo') || '').toLowerCase() === String(leer(item, 'correo') || '').toLowerCase());
    setEdicion(item);
    setEspecialidad(String(leer(item, 'especialidad') || ''));
    setUsuarioTecnicoId(String(leer(usuario, 'idUsuario') || ''));
    setEstadoId(String(estadoIdPorNombre(estados, leer(item, 'estado'))));
    setError(''); setMensaje(''); setModalVisible(true);
  };

  const guardar = async () => {
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      if (activeTab === 'usuarios') {
        if (!nombre.trim() || !apellido.trim() || !correo.trim() || !rolId) {
          throw new Error('Completá nombre, apellido, correo y rol.');
        }
        if (!edicion && !contrasena) throw new Error('La contraseña es obligatoria para crear el usuario.');
        if (edicion && !contrasena) throw new Error('El backend requiere una nueva contraseña al editar un usuario.');
        const id = edicion ? leer(edicion, 'idUsuario') : null;
        await guardarUsuario({
          IdUsuario: Number(id || 0), Nombre: nombre.trim(), Apellido: apellido.trim(), Correo: correo.trim(),
          Contrasena: contrasena, IdRol: Number(rolId), IdEstado: Number(estadoId || 1),
        }, id ?? null);
      } else {
        const usuario = usuarios.find((item) => String(leer(item, 'idUsuario')) === usuarioTecnicoId);
        if (!usuario) throw new Error('Seleccioná un usuario activo con rol de técnico.');
        const id = edicion ? leer(edicion, 'idTecnico') : null;
        await guardarTecnico({
          IdTecnico: Number(id || 0), Especialidad: especialidad.trim(), Correo: String(leer(usuario, 'correo')),
          IdUsuario: Number(usuarioTecnicoId), IdEstado: Number(estadoId || 1),
        }, id ?? null);
      }
      setModalVisible(false);
      setMensaje(activeTab === 'usuarios'
        ? `Usuario ${edicion ? 'actualizado' : 'creado'} correctamente.`
        : `Técnico ${edicion ? 'actualizado' : 'creado'} correctamente.`);
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el registro.');
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async () => {
    if (!confirmacion) return;
    setGuardando(true); setError('');
    try {
      const id = confirmacion.tipo === 'usuarios' ? leer(confirmacion.item, 'idUsuario') : leer(confirmacion.item, 'idTecnico');
      if (confirmacion.tipo === 'usuarios') await desactivarUsuario(id);
      else await desactivarTecnico(id);
      setMensaje(`${confirmacion.tipo === 'usuarios' ? 'Usuario' : 'Técnico'} desactivado correctamente.`);
      setConfirmacion(null);
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo desactivar el registro.');
      setConfirmacion(null);
    } finally {
      setGuardando(false);
    }
  };

  const esUsuario = activeTab === 'usuarios';
  const filas = esUsuario ? usuariosVisibles : tecnicosVisibles;
  const puedeDesactivar = estados.some((item) => normalizar(leer(item, 'nombreEstado')) === 'inactivo');

  return (
    <View style={styles.panel}>
      <View style={[styles.toolbar, compacto && styles.toolbarCompact]}>
        <Pressable accessibilityRole="button" onPress={abrirNuevo} style={styles.addButton}><Text style={styles.addButtonText}>＋  Agregar {esUsuario ? 'usuario' : 'técnico'}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => void cargar()} style={styles.refreshButton}><Text style={styles.refreshText}>↻ Actualizar</Text></Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {[
          ['usuarios', '♙', 'Usuarios', usuarios.length],
          ['tecnicos', '⚒', 'Técnicos', tecnicos.length],
        ].map(([key, icon, label, total]) => (
          <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: activeTab === key }} onPress={() => { onTabChange(key); setError(''); setMensaje(''); setBusqueda(''); }} style={[styles.tab, activeTab === key && styles.tabActive]}>
            <Text style={[styles.tabIcon, activeTab === key && styles.tabTextActive]}>{icon}</Text>
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
            <Text style={[styles.tabCount, activeTab === key && styles.tabTextActive]}>{total}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {mensaje ? <Notice text={mensaje} success /> : null}
      {error ? <Notice text={error} /> : null}

      <View style={styles.listCard}>
        <View style={[styles.listHeader, compacto && styles.listHeaderCompact]}>
          <View><Text style={styles.listTitle}>{esUsuario ? 'Cuentas de usuario' : 'Técnicos registrados'}</Text><Text style={styles.listSubtitle}>{filas.length} {filas.length === 1 ? 'registro' : 'registros'}</Text></View>
          <TextInput value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre o correo" placeholderTextColor="#9aa5b5" style={[styles.searchInput, compacto && styles.searchInputCompact]} />
        </View>

        {cargando ? <View style={styles.stateBox}><ActivityIndicator color={C.brand} /><Text style={styles.stateText}>Cargando registros…</Text></View>
          : filas.length === 0 ? <View style={styles.stateBox}><Text style={styles.emptyTitle}>{filtro ? 'No hay coincidencias' : 'Todavía no hay registros'}</Text><Text style={styles.stateText}>{filtro ? 'Probá con otro nombre o correo.' : `Agregá el primer ${esUsuario ? 'usuario' : 'técnico'} para comenzar.`}</Text></View>
            : <View style={styles.rows}>{filas.map((item, index) => {
              const id = esUsuario ? leer(item, 'idUsuario') : leer(item, 'idTecnico');
              const activo = estaActivo(item);
              return (
                <View key={`${activeTab}-${String(id ?? 'registro')}-${index}`} style={[styles.row, compacto && styles.rowCompact]}>
                  <View style={styles.personMain}>
                    <View style={[styles.avatar, activo ? styles.avatarActive : styles.avatarInactive]}><Text style={[styles.avatarText, activo ? styles.avatarTextActive : styles.avatarTextInactive]}>{nombreCompleto(item).charAt(0).toUpperCase()}</Text></View>
                    <View style={styles.personCopy}>
                      <Text style={styles.personName}>{nombreCompleto(item)}</Text>
                      <Text style={styles.personEmail}>{String(leer(item, 'correo') || 'Sin correo')}</Text>
                      <View style={styles.metaRow}>
                        {esUsuario ? <Text style={styles.metaText}>{String(leer(item, 'rol') || 'Sin rol')}</Text> : <Text style={styles.metaText}>{String(leer(item, 'especialidad') || 'Sin especialidad')}</Text>}
                        <View style={[styles.statusBadge, activo ? styles.statusActive : styles.statusInactive]}><Text style={[styles.statusText, activo ? styles.statusActiveText : styles.statusInactiveText]}>{String(leer(item, 'estado') || 'Sin estado')}</Text></View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <Pressable accessibilityRole="button" onPress={() => esUsuario ? abrirEdicionUsuario(item) : abrirEdicionTecnico(item)} style={styles.editButton}><Text style={styles.editText}>Editar</Text></Pressable>
                    {activo ? <Pressable accessibilityRole="button" disabled={!puedeDesactivar} onPress={() => {
                      if (!puedeDesactivar) {
                        setError('Agregá el estado “Inactivo” desde Catálogos antes de desactivar cuentas.');
                        return;
                      }
                      setConfirmacion({ tipo: activeTab, item });
                    }} style={[styles.disableButton, !puedeDesactivar && styles.disabledButton]}><Text style={styles.disableText}>Desactivar</Text></Pressable> : null}
                  </View>
                </View>
              );
            })}</View>}
      </View>
      <Text style={styles.footnote}>{puedeDesactivar
        ? 'Las cuentas y los perfiles técnicos se administran por separado.'
        : 'Para desactivar cuentas, primero agrega el estado “Inactivo” desde Catálogos.'}</Text>

      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => !guardando && setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, compacto && styles.modalCardCompact]}>
            <View style={styles.modalHeader}>
              <View><Text style={styles.modalEyebrow}>{edicion ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'}</Text><Text style={styles.modalTitle}>{esUsuario ? `${edicion ? 'Editar' : 'Agregar'} usuario` : `${edicion ? 'Editar' : 'Agregar'} técnico`}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar formulario" disabled={guardando} onPress={() => setModalVisible(false)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
              {esUsuario ? <>
                <FormField label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Nombre" />
                <FormField label="Apellido" value={apellido} onChangeText={setApellido} placeholder="Apellido" />
                <FormField label="Correo" value={correo} onChangeText={setCorreo} placeholder="nombre@empresa.com" keyboardType="email-address" autoCapitalize="none" />
                <FormField label={edicion ? 'Nueva contraseña' : 'Contraseña'} value={contrasena} onChangeText={setContrasena} placeholder={edicion ? 'Requerida para guardar cambios' : 'Contraseña temporal'} secureTextEntry />
                {edicion ? <Text style={styles.helperText}>El servidor requiere cambiar la contraseña cuando se editan los datos de una cuenta.</Text> : null}
                <Text style={styles.formLabel}>Rol</Text>
                {rolesActivos.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>{rolesActivos.map((rol) => {
                  const id = String(leer(rol, 'idRol'));
                  const selected = rolId === id;
                  return <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setRolId(id)} style={[styles.option, selected && styles.optionSelected]}><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{String(leer(rol, 'nombreRol') || 'Rol')}</Text></Pressable>;
                })}</ScrollView> : <Text style={styles.helperText}>No hay roles activos. Activa o agrega un rol desde Catálogos.</Text>}
                {edicion ? <>
                  <Text style={styles.formLabel}>Estado de la cuenta</Text>
                  <StatusOptions estados={estados} value={estadoId} onChange={setEstadoId} />
                </> : null}
              </> : <>
                <Text style={styles.formLabel}>Cuenta del técnico</Text>
                {usuariosParaTecnico.length ? <View style={styles.userOptions}>{usuariosParaTecnico.map((usuario) => {
                  const id = String(leer(usuario, 'idUsuario'));
                  const selected = usuarioTecnicoId === id;
                  return <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setUsuarioTecnicoId(id)} style={[styles.userOption, selected && styles.optionSelected]}><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{nombreCompleto(usuario)}</Text><Text style={styles.userOptionEmail}>{String(leer(usuario, 'correo') || '')}</Text></Pressable>;
                })}</View> : <Text style={styles.helperText}>No hay usuarios activos libres con rol de técnico. Primero creá una cuenta con ese rol.</Text>}
                <FormField label="Especialidad" value={especialidad} onChangeText={setEspecialidad} placeholder="Soporte, redes, hardware…" />
                {edicion ? <><Text style={styles.formLabel}>Estado del técnico</Text><StatusOptions estados={estados} value={estadoId} onChange={setEstadoId} /></> : null}
              </>}
              {error ? <Notice text={error} /> : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable disabled={guardando} onPress={() => setModalVisible(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
              <Pressable disabled={guardando || (esUsuario && !rolesActivos.length) || (!esUsuario && !usuariosParaTecnico.length)} onPress={() => void guardar()} style={[styles.saveButton, (guardando || (esUsuario && !rolesActivos.length) || (!esUsuario && !usuariosParaTecnico.length)) && styles.disabledButton]}>{guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar</Text>}</Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={Boolean(confirmacion)} onRequestClose={() => !guardando && setConfirmacion(null)}>
        <View style={styles.modalBackdrop}><View style={[styles.modalCard, styles.confirmCard]}>
          <View style={styles.confirmIcon}><Text style={styles.confirmIconText}>!</Text></View>
          <Text style={styles.confirmTitle}>¿Desactivar {confirmacion?.tipo === 'usuarios' ? 'esta cuenta' : 'este técnico'}?</Text>
          <Text style={styles.confirmCopy}>{confirmacion ? nombreCompleto(confirmacion.item) : ''} perderá acceso o dejará de aparecer como técnico activo. Los registros históricos se conservarán.</Text>
          <View style={styles.modalActions}><Pressable disabled={guardando} onPress={() => setConfirmacion(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable><Pressable disabled={guardando} onPress={() => void desactivar()} style={[styles.deleteButton, guardando && styles.disabledButton]}>{guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Desactivar</Text>}</Pressable></View>
        </View></View>
      </Modal>
    </View>
  );
}

function FormField({ label, ...props }) {
  return <View style={styles.field}><Text style={styles.formLabel}>{label}</Text><TextInput {...props} placeholderTextColor="#9aa5b5" style={styles.input} editable={props.editable ?? true} /></View>;
}

function StatusOptions({ estados, value, onChange }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>{estados.map((estado) => {
    const id = String(leer(estado, 'idEstado'));
    const selected = value === id;
    return <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onChange(id)} style={[styles.option, selected && styles.optionSelected]}><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{String(leer(estado, 'nombreEstado') || 'Estado')}</Text></Pressable>;
  })}</ScrollView>;
}

function Notice({ text, success = false }) {
  return <View style={[styles.notice, success ? styles.noticeSuccess : styles.noticeError]}><Text style={[styles.noticeText, success ? styles.noticeSuccessText : styles.noticeErrorText]}>{success ? '✓  ' : '⚠  '}{text}</Text></View>;
}

function createStyles() { return StyleSheet.create({
  panel: { gap: 18 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  toolbarCompact: { justifyContent: 'flex-start' },
  addButton: { minHeight: 42, borderRadius: 10, backgroundColor: '#087DFF', paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  refreshButton: { minHeight: 38, borderRadius: 9, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  refreshText: { color: C.muted, fontSize: 11, fontWeight: '700' },
  tabs: { gap: 8, paddingVertical: 2 },
  tab: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 11, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 14 },
  tabActive: { borderColor: '#cbd6ff', backgroundColor: C.brandLight },
  tabIcon: { color: C.muted, fontSize: 14, fontWeight: '800' },
  tabText: { color: C.muted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: C.brand },
  tabCount: { color: '#929daf', fontSize: 10, fontWeight: '800' },
  notice: { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11 },
  noticeSuccess: { backgroundColor: '#eaf7f1' },
  noticeError: { backgroundColor: '#fff0ef' },
  noticeText: { fontSize: 12, lineHeight: 18 },
  noticeSuccessText: { color: '#137a56' },
  noticeErrorText: { color: '#b53c43' },
  listCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, overflow: 'hidden' },
  listHeader: { minHeight: 75, borderBottomWidth: 1, borderBottomColor: C.line, paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  listHeaderCompact: { alignItems: 'flex-start', flexDirection: 'column' },
  listTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  listSubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  searchInput: { width: 260, minHeight: 39, borderWidth: 1, borderColor: C.line, borderRadius: 9, backgroundColor: C.inputSurface, paddingHorizontal: 11, color: C.ink, fontSize: 11, outlineStyle: 'none' },
  searchInputCompact: { width: '100%' },
  rows: { paddingHorizontal: 17 },
  row: { minHeight: 91, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  rowCompact: { alignItems: 'flex-start', flexDirection: 'column', paddingVertical: 14, gap: 12 },
  personMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarActive: { backgroundColor: C.brandLight },
  avatarInactive: { backgroundColor: '#f0f2f5' },
  avatarText: { fontSize: 15, fontWeight: '800' },
  avatarTextActive: { color: C.brand },
  avatarTextInactive: { color: '#8591a4' },
  personCopy: { flex: 1, gap: 3 },
  personName: { color: C.ink, fontSize: 12, fontWeight: '800' },
  personEmail: { color: C.muted, fontSize: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 2 },
  metaText: { color: C.muted, fontSize: 10, fontWeight: '700' },
  statusBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  statusActive: { backgroundColor: '#eaf7f1' },
  statusInactive: { backgroundColor: '#f1f3f6' },
  statusText: { fontSize: 9, fontWeight: '800' },
  statusActiveText: { color: C.green },
  statusInactiveText: { color: '#758196' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  editButton: { borderWidth: 1, borderColor: C.line, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8 },
  editText: { color: C.brand, fontSize: 10, fontWeight: '800' },
  disableButton: { borderWidth: 1, borderColor: '#f0d8d8', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8 },
  disableText: { color: C.red, fontSize: 10, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
  stateBox: { minHeight: 190, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 8 },
  stateText: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  emptyTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  footnote: { color: '#98a2b2', fontSize: 10, lineHeight: 15 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,28,50,0.43)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 520, maxHeight: '92%', borderRadius: 18, backgroundColor: C.modalSurface, borderWidth: 1, borderColor: C.line, padding: 22, shadowColor: '#14223b', shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 7 },
  modalCardCompact: { padding: 18, borderRadius: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 11 },
  modalEyebrow: { color: C.brand, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  modalTitle: { color: C.ink, fontSize: 19, fontWeight: '800', marginTop: 4 },
  closeButton: { width: 31, height: 31, borderRadius: 9, backgroundColor: '#f1f4f8', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#6d7b90', fontSize: 23, lineHeight: 26 },
  formContent: { gap: 11, paddingBottom: 8 },
  field: { gap: 6 },
  formLabel: { color: '#3c4c65', fontSize: 10, fontWeight: '800' },
  input: { minHeight: 43, borderWidth: 1, borderColor: C.line, borderRadius: 9, backgroundColor: C.inputSurface, paddingHorizontal: 12, color: C.ink, fontSize: 12, outlineStyle: 'none' },
  helperText: { color: C.muted, fontSize: 10, lineHeight: 15 },
  optionRow: { gap: 7, paddingVertical: 2 },
  option: { borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  optionSelected: { backgroundColor: C.brandLight, borderColor: '#bdcaff' },
  optionText: { color: '#647188', fontSize: 10, fontWeight: '700' },
  optionTextSelected: { color: C.brand },
  userOptions: { gap: 7 },
  userOption: { borderWidth: 1, borderColor: C.line, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9 },
  userOptionEmail: { color: C.muted, fontSize: 9, marginTop: 3 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 13 },
  cancelButton: { minHeight: 39, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 9, backgroundColor: C.brandLight },
  cancelText: { color: C.muted, fontSize: 10, fontWeight: '800' },
  saveButton: { minHeight: 39, minWidth: 103, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 9, backgroundColor: C.brand },
  deleteButton: { minHeight: 39, minWidth: 103, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 9, backgroundColor: C.red },
  saveText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  confirmCard: { maxWidth: 410, alignItems: 'center', padding: 24 },
  confirmIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff0ef', alignItems: 'center', justifyContent: 'center' },
  confirmIconText: { color: C.red, fontSize: 20, fontWeight: '800' },
  confirmTitle: { color: C.ink, fontSize: 17, fontWeight: '800', textAlign: 'center', marginTop: 7 },
  confirmCopy: { color: C.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 7 },
}); }
styles = createStyles();






