import { useCallback, useMemo, useState } from 'react';
import { Redirect, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, AppTextInput as TextInput } from '../../components/Typography';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import { colors, radius, space } from '../../theme';
import type { CategoryItem, PriorityItem, RoleItem, TechnicianItem, TicketStatusItem, UserItem } from '../../types';
import { Button, EmptyState, LoadingState, Notice, PageHeading, Screen, Surface } from '../../components/ui';

type CatalogKey = 'usuarios' | 'tecnicos' | 'categorias' | 'prioridades' | 'estados' | 'roles';
type Draft = Record<string, string>;
type CatalogRow = { id: number; title: string; detail: string; state: string; source: unknown };

const catalogTabs: { key: CatalogKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'usuarios', label: 'Usuarios', icon: 'people-outline' },
  { key: 'tecnicos', label: 'Técnicos', icon: 'construct-outline' },
  { key: 'categorias', label: 'Categorías', icon: 'grid-outline' },
  { key: 'prioridades', label: 'Prioridades', icon: 'flag-outline' },
  { key: 'estados', label: 'Estados', icon: 'radio-button-on-outline' },
  { key: 'roles', label: 'Roles', icon: 'shield-checkmark-outline' },
];

export default function CatalogsScreen() {
  const { user } = useSession();
  const [active, setActive] = useState<CatalogKey>('usuarios');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [ticketStates, setTicketStates] = useState<TicketStatusItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [systemStates, setSystemStates] = useState<{ idEstado: number; nombreEstado: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const isAdmin = user?.rol === 'Administrador';

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [u, t, c, p, s, r, es] = await Promise.all([api.getUsuarios(), api.getTecnicos(), api.getCategorias(), api.getPrioridades(), api.getEstadosTicket(), api.getRoles(), api.getEstados()]);
      setUsers(u); setTechnicians(t); setCategories(c); setPriorities(p); setTicketStates(s); setRoles(r); setSystemStates(es);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar los catálogos.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const rows = useMemo<CatalogRow[]>(() => {
    switch (active) {
      case 'usuarios': return users.map((item) => ({ id: item.idUsuario, title: `${item.nombre} ${item.apellido}`, detail: `${item.correo} · ${item.rol}`, state: item.estado, source: item }));
      case 'tecnicos': return technicians.map((item) => ({ id: item.idTecnico, title: `${item.nombre} ${item.apellido}`, detail: `${item.especialidad} · ${item.correo}`, state: item.estado, source: item }));
      case 'categorias': return categories.map((item) => ({ id: item.idCategoria, title: item.nombreCategoria, detail: item.descripcion || item.icono || 'Categoría de servicio', state: item.estado, source: item }));
      case 'prioridades': return priorities.map((item) => ({ id: item.idPrioridad, title: item.nombrePrioridad, detail: 'Nivel de prioridad de tickets', state: item.estado, source: item }));
      case 'estados': return ticketStates.map((item) => ({ id: item.idEstadoTicket, title: item.nombreEstado, detail: 'Estado del flujo del ticket', state: item.estado, source: item }));
      case 'roles': return roles.map((item) => ({ id: item.idRol, title: item.nombreRol, detail: item.descripcion || `${item.permisos?.length ?? 0} permisos`, state: item.estado, source: item }));
    }
  }, [active, categories, priorities, roles, technicians, ticketStates, users]);

  if (!user) return <Redirect href="/login" />;
  if (!isAdmin) return <Screen scroll contentStyle={styles.content}><PageHeading title="Catálogos" subtitle="Esta sección requiere permisos de administrador." /><Surface><EmptyState title="Acceso restringido" description="Solicita al administrador de GETICKETS que gestione estos registros." icon="lock-closed-outline" /></Surface></Screen>;

  const setField = (key: string, value: string) => setDraft((previous) => ({ ...previous, [key]: value }));
  const openCreate = () => {
    setEditId(null); setConfirmDelete(null); setNotice(null); setError(null);
    setDraft({ nombre: '', apellido: '', correo: '', contrasena: '', idRol: String(roles.find((item) => item.nombreRol === 'Usuario')?.idRol ?? roles[0]?.idRol ?? ''), idEstado: String(systemStates[0]?.idEstado ?? 1), idUsuario: String(users.find((item) => item.estado === 'Activo' && !technicians.some((tech) => tech.idUsuario === item.idUsuario))?.idUsuario ?? ''), especialidad: '', descripcion: '', icono: 'grid-outline', permisos: '' });
  };
  const openEdit = (row: CatalogRow) => {
    const item = row.source as Record<string, unknown>;
    const value = (key: string, fallback = '') => String(item[key] ?? fallback);
    setEditId(row.id); setConfirmDelete(null); setNotice(null); setError(null);
    if (active === 'usuarios') setDraft({ nombre: value('nombre'), apellido: value('apellido'), correo: value('correo'), contrasena: '', idRol: value('idRol'), idEstado: value('idEstado') });
    else if (active === 'tecnicos') setDraft({ idUsuario: value('idUsuario'), correo: value('correo'), especialidad: value('especialidad'), idEstado: value('idEstado') });
    else if (active === 'categorias') setDraft({ nombre: value('nombreCategoria'), descripcion: value('descripcion'), icono: value('icono', 'grid-outline'), idEstado: value('idEstado') });
    else if (active === 'prioridades') setDraft({ nombre: value('nombrePrioridad'), idEstado: value('idEstado') });
    else if (active === 'estados') setDraft({ nombre: value('nombreEstado'), idEstado: value('idEstado') });
    else setDraft({ nombre: value('nombreRol'), descripcion: value('descripcion'), permisos: Array.isArray(item.permisos) ? (item.permisos as string[]).join(', ') : '', idEstado: value('idEstado') });
  };

  const save = async () => {
    setSaving(true); setError(null); setNotice(null);
    const stateId = Number(draft.idEstado || systemStates[0]?.idEstado || 1);
    try {
      if (active === 'usuarios') {
        const payload = { nombre: draft.nombre?.trim() ?? '', apellido: draft.apellido?.trim() ?? '', correo: draft.correo?.trim() ?? '', idRol: Number(draft.idRol), idEstado: stateId };
        if (!payload.nombre || !payload.apellido || !payload.correo || !payload.idRol) throw new Error('Completa nombre, apellido, correo y rol.');
        if (editId) await api.updateUsuario(editId, { ...payload, contrasena: draft.contrasena || undefined });
        else {
          if (!draft.contrasena?.trim()) throw new Error('La contraseña es obligatoria al crear un usuario.');
          await api.createUsuario({ ...payload, contrasena: draft.contrasena, asignarPuesto: false, idUsuarioAccion: user.idUsuario });
        }
      } else if (active === 'tecnicos') {
        const payload = { especialidad: draft.especialidad?.trim() ?? '', correo: draft.correo?.trim() ?? '', idUsuario: Number(draft.idUsuario) };
        if (!payload.especialidad || !payload.correo || !payload.idUsuario) throw new Error('Selecciona un usuario y registra correo y especialidad.');
        if (editId) await api.updateTecnico(editId, { ...payload, idEstado: stateId }); else await api.createTecnico(payload);
      } else if (active === 'categorias') {
        const payload = { nombreCategoria: draft.nombre?.trim() ?? '', icono: draft.icono?.trim() || null, descripcion: draft.descripcion?.trim() || null };
        if (!payload.nombreCategoria) throw new Error('Escribe el nombre de la categoría.');
        if (editId) await api.updateCategoria(editId, { ...payload, idEstado: stateId }); else await api.createCategoria(payload);
      } else if (active === 'prioridades') {
        const nombrePrioridad = draft.nombre?.trim() ?? ''; if (!nombrePrioridad) throw new Error('Escribe el nombre de la prioridad.');
        if (editId) await api.updatePrioridad(editId, { nombrePrioridad, idEstado: stateId }); else await api.createPrioridad({ nombrePrioridad });
      } else if (active === 'estados') {
        const nombreEstado = draft.nombre?.trim() ?? ''; if (!nombreEstado) throw new Error('Escribe el nombre del estado.');
        if (editId) await api.updateEstadoTicket(editId, { nombreEstado, idEstado: stateId }); else await api.createEstadoTicket({ nombreEstado });
      } else {
        const nombreRol = draft.nombre?.trim() ?? ''; if (!nombreRol) throw new Error('Escribe el nombre del rol.');
        const payload = { nombreRol, descripcion: draft.descripcion?.trim() || null, permisos: (draft.permisos ?? '').split(',').map((item) => item.trim()).filter(Boolean) };
        if (editId) await api.updateRol(editId, { ...payload, idEstado: stateId }); else await api.createRol(payload);
      }
      setEditId(null); setDraft({}); setNotice(editId ? 'Registro actualizado.' : 'Registro creado.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar el registro.'); }
    finally { setSaving(false); }
  };

  const deactivate = async (id: number) => {
    setSaving(true); setError(null);
    try {
      if (active === 'usuarios') await api.deleteUsuario(id);
      else if (active === 'tecnicos') await api.deleteTecnico(id);
      else if (active === 'categorias') await api.deleteCategoria(id);
      else if (active === 'prioridades') await api.deletePrioridad(id);
      else if (active === 'estados') await api.deleteEstadoTicket(id);
      else await api.deleteRol(id);
      setConfirmDelete(null); setNotice('Registro desactivado.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo desactivar.'); }
    finally { setSaving(false); }
  };

  const fields = active === 'usuarios'
    ? [['nombre', 'Nombre'], ['apellido', 'Apellido'], ['correo', 'Correo electrónico'], ...(!editId ? [['contrasena', 'Contraseña']] : [])]
    : active === 'tecnicos' ? [['correo', 'Correo'], ['especialidad', 'Especialidad']]
      : active === 'categorias' ? [['nombre', 'Nombre de categoría'], ['descripcion', 'Descripción'], ['icono', 'Icono (Ionicons)']]
        : active === 'roles' ? [['nombre', 'Nombre del rol'], ['descripcion', 'Descripción'], ['permisos', 'Permisos separados por coma']]
          : [['nombre', active === 'prioridades' ? 'Nombre de prioridad' : 'Nombre del estado']];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PageHeading title="Catálogos" subtitle="Administra cuentas, técnicos y parámetros de GETICKETS." right={<Pressable onPress={() => void load()} style={styles.reload} accessibilityLabel="Actualizar catálogos"><Ionicons name="refresh" size={18} color={colors.primaryDark} /></Pressable>} />
        <Surface style={styles.intro}><View style={styles.introIcon}><Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} /></View><Text style={styles.introText}>Los cambios se guardan en la API. Los puestos y sus asignaciones se gestionan desde la pestaña Oficina.</Text></Surface>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {catalogTabs.map((tab) => <Pressable key={tab.key} onPress={() => { setActive(tab.key); setEditId(null); setDraft({}); setConfirmDelete(null); setError(null); setNotice(null); }} style={[styles.tab, active === tab.key && styles.tabSelected]}><Ionicons name={tab.icon} size={15} color={active === tab.key ? colors.primaryDark : colors.muted} /><Text style={[styles.tabText, active === tab.key && styles.tabTextSelected]}>{tab.label}</Text></Pressable>)}
        </ScrollView>
        <View style={styles.listHeader}><View><Text style={styles.sectionTitle}>{catalogTabs.find((item) => item.key === active)?.label}</Text><Text style={styles.sectionCaption}>{rows.length} registros</Text></View><Button onPress={openCreate} icon="add" compact>Nuevo</Button></View>
        {error ? <Notice message={error} /> : null}{notice ? <Notice message={notice} tone="success" /> : null}
        {editId !== null || Object.keys(draft).length > 0 ? <Surface style={styles.form}>
          <View style={styles.formTitleRow}><View><Text style={styles.formTitle}>{editId ? 'Editar registro' : 'Crear registro'}</Text><Text style={styles.sectionCaption}>{catalogTabs.find((item) => item.key === active)?.label}</Text></View><Pressable onPress={() => { setEditId(null); setDraft({}); setError(null); }} accessibilityLabel="Cerrar formulario"><Ionicons name="close" size={20} color={colors.muted} /></Pressable></View>
          {fields.map(([key, label]) => <View key={key} style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={draft[key] ?? ''} onChangeText={(value) => setField(key, value)} placeholder={label} placeholderTextColor={colors.muted} secureTextEntry={key === 'contrasena'} keyboardType={key === 'correo' ? 'email-address' : 'default'} autoCapitalize={key === 'correo' || key === 'contrasena' ? 'none' : 'sentences'} multiline={key === 'descripcion' || key === 'permisos'} style={[styles.input, (key === 'descripcion' || key === 'permisos') && styles.multiline]} /></View>)}
          {active === 'usuarios' ? <PickerRow label="Rol" options={roles.map((item) => ({ id: item.idRol, label: item.nombreRol }))} value={Number(draft.idRol)} onSelect={(id) => setField('idRol', String(id))} /> : null}
          {active === 'tecnicos' ? <PickerRow label="Cuenta de usuario" options={users.filter((item) => item.estado === 'Activo' && (!technicians.some((tech) => tech.idUsuario === item.idUsuario) || Number(draft.idUsuario) === item.idUsuario)).map((item) => ({ id: item.idUsuario, label: `${item.nombre} ${item.apellido}` }))} value={Number(draft.idUsuario)} onSelect={(id) => { const selected = users.find((item) => item.idUsuario === id); setField('idUsuario', String(id)); if (selected) setField('correo', selected.correo); }} /> : null}
          {editId !== null && active !== 'usuarios' ? <PickerRow label="Estado" options={systemStates.map((item) => ({ id: item.idEstado, label: item.nombreEstado }))} value={Number(draft.idEstado)} onSelect={(id) => setField('idEstado', String(id))} /> : null}
          {error ? <Notice message={error} /> : null}
          <View style={styles.formActions}><Button onPress={() => { setEditId(null); setDraft({}); setError(null); }} variant="secondary" compact>Cancelar</Button><Button onPress={() => void save()} disabled={saving} icon="checkmark" compact>{saving ? 'Guardando…' : 'Guardar'}</Button></View>
        </Surface> : null}
        {loading ? <LoadingState label="Sincronizando catálogos…" /> : rows.length ? <Surface style={styles.rows}>{rows.map((row, index) => <View key={row.id} style={[styles.row, index > 0 && styles.rowBorder]}>
          <View style={styles.rowAvatar}><Text style={styles.rowInitial}>{row.title.trim().charAt(0).toLocaleUpperCase() || 'G'}</Text></View><View style={styles.rowCopy}><View style={styles.rowTitleLine}><Text style={styles.rowTitle} numberOfLines={1}>{row.title}</Text><View style={[styles.statePill, row.state === 'Activo' && styles.stateActive]}><View style={[styles.stateDot, row.state === 'Activo' && styles.stateDotActive]} /><Text style={[styles.stateText, row.state === 'Activo' && styles.stateTextActive]}>{row.state || 'Sin estado'}</Text></View></View><Text style={styles.rowDetail} numberOfLines={2}>{row.detail}</Text></View>
          <View style={styles.rowActions}>{confirmDelete === row.id ? <><Pressable onPress={() => setConfirmDelete(null)} style={styles.iconButton}><Ionicons name="close" size={17} color={colors.muted} /></Pressable><Pressable onPress={() => void deactivate(row.id)} style={[styles.iconButton, styles.deleteButton]} disabled={saving}><Ionicons name="power-outline" size={17} color={colors.red} /></Pressable></> : <><Pressable onPress={() => openEdit(row)} style={styles.iconButton} accessibilityLabel={`Editar ${row.title}`}><Ionicons name="create-outline" size={17} color={colors.primaryDark} /></Pressable><Pressable onPress={() => setConfirmDelete(row.id)} style={styles.iconButton} accessibilityLabel={`Desactivar ${row.title}`}><Ionicons name="power-outline" size={17} color={row.state === 'Activo' ? colors.red : colors.muted} /></Pressable></>}</View>
        </View>)}</Surface> : <Surface><EmptyState title="Catálogo vacío" description="Crea el primer registro con el botón Nuevo." icon="file-tray-outline" /></Surface>}
      </ScrollView>
    </Screen>
  );
}

function PickerRow({ label, options, value, onSelect }: { label: string; options: { id: number; label: string }[]; value: number; onSelect: (id: number) => void }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerList}>{options.map((item) => <Pressable key={item.id} onPress={() => onSelect(item.id)} style={[styles.pickerChip, value === item.id && styles.pickerSelected]}><Text style={[styles.pickerText, value === item.id && styles.pickerTextSelected]}>{item.label}</Text></Pressable>)}</ScrollView></View>;
}

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 34, gap: 15, width: '100%', maxWidth: 1080, alignSelf: 'center' },
  reload: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF9FF', borderColor: '#A5DDF8', paddingVertical: 12 }, introIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' }, introText: { flex: 1, color: '#425B70', fontSize: 12, lineHeight: 18 },
  tabs: { gap: 7, paddingRight: 10 }, tab: { minHeight: 38, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 11 }, tabSelected: { borderColor: colors.primary, backgroundColor: colors.skySoft }, tabText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, tabTextSelected: { color: colors.primaryDark },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, sectionCaption: { color: colors.muted, fontSize: 11, marginTop: 3 },
  form: { gap: 13, borderColor: '#A5DDF8' }, formTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, formTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, field: { gap: 6 }, fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: '700' }, input: { minHeight: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: colors.surfaceSoft, paddingHorizontal: 12, color: colors.ink, fontSize: 13 }, multiline: { minHeight: 76, paddingTop: 10, textAlignVertical: 'top' }, pickerList: { gap: 7 }, pickerChip: { minHeight: 34, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: 11, backgroundColor: colors.surfaceSoft, borderColor: colors.line, borderWidth: 1 }, pickerSelected: { backgroundColor: colors.skySoft, borderColor: colors.primary }, pickerText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, pickerTextSelected: { color: colors.primaryDark }, formActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  rows: { paddingVertical: 2 }, row: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 12 }, rowBorder: { borderTopWidth: 1, borderTopColor: colors.line }, rowAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2F7', alignItems: 'center', justifyContent: 'center' }, rowInitial: { color: colors.ink, fontSize: 11, fontWeight: '900' }, rowCopy: { flex: 1, minWidth: 80, gap: 4 }, rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 }, rowTitle: { color: colors.ink, fontSize: 12, fontWeight: '800', flexShrink: 1 }, rowDetail: { color: colors.muted, fontSize: 10 }, statePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: colors.amberSoft }, stateActive: { backgroundColor: colors.greenSoft }, stateDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.amber }, stateDotActive: { backgroundColor: colors.green }, stateText: { color: colors.amber, fontSize: 9, fontWeight: '800' }, stateTextActive: { color: colors.green }, rowActions: { flexDirection: 'row', gap: 6 }, iconButton: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, deleteButton: { backgroundColor: colors.redSoft, borderColor: '#FECDD3' },
});
