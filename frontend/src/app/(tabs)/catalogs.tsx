import { useCallback, useMemo, useState } from 'react';
import { Redirect, useFocusEffect } from 'expo-router';
import { Ionicons } from '../../components/Icons';
import { Image, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, AppTextInput as TextInput } from '../../components/Typography';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import { colors, getThemeColors, radius, space } from '../../theme';
import type { CategoryItem, PriorityItem, RoleItem, SeatItem, SeatZone, TechnicianItem, TicketStatusItem, UserItem } from '../../types';
import { Button, EmptyState, LoadingState, Notice, PageHeading, Screen, Surface } from '../../components/ui';
import { CATEGORY_ICON_OPTIONS } from '../../lib/statusUtils';
import { pickProfilePhoto } from '../../lib/profilePhoto';

type CatalogKey = 'usuarios' | 'tecnicos' | 'puestos' | 'categorias' | 'prioridades' | 'estados' | 'roles';
type Draft = Record<string, string>;
type CatalogRow = { id: number; title: string; detail: string; state: string; source: unknown };

const catalogTabs: { key: CatalogKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'usuarios', label: 'Usuarios', icon: 'people-outline' },
  { key: 'tecnicos', label: 'Técnicos', icon: 'construct-outline' },
  { key: 'puestos', label: 'Puestos 3D', icon: 'desktop-outline' },
  { key: 'categorias', label: 'Categorías', icon: 'grid-outline' },
  { key: 'prioridades', label: 'Prioridades', icon: 'flag-outline' },
  { key: 'estados', label: 'Estados Ticket', icon: 'radio-button-on-outline' },
  { key: 'roles', label: 'Roles y Permisos', icon: 'shield-checkmark-outline' },
];

const DEFAULT_ROLE_PERMISSIONS = [
  'Ver todos los tickets de la organización',
  'Asignar técnicos disponibles según carga',
  'Confirmar o reabrir cualquier solicitud',
  'Auditar historial completo de movimientos',
  'Crear/editar usuarios, técnicos, categorías y roles',
  'Consultar su bandeja de casos asignados',
  'Iniciar atención (pasar de Asignado a En Proceso)',
  'Agregar notas técnicas y avances en el historial',
  'Registrar diagnóstico y solución (estado Resuelto)',
  'Reportar nuevos incidentes por categoría y prioridad',
  'Explorar el mapa 3D de puestos y estado',
];

export default function CatalogsScreen() {
  const { user, darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const { width } = useWindowDimensions();
  const mobileNav = Platform.OS !== 'web' || width < 1024;
  const [active, setActive] = useState<CatalogKey>('usuarios');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianItem[]>([]);
  const [seats, setSeats] = useState<SeatItem[]>([]);
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
  const [customPermission, setCustomPermission] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const isAdmin = user?.rol === 'Administrador';

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const [u, t, c, p, s, r, es, seatList] = await Promise.all([api.getUsuarios(), api.getTecnicos(), api.getCategorias(), api.getPrioridades(), api.getEstadosTicket(), api.getRoles(), api.getEstados(), api.getPuestos()]);
      setUsers(u); setTechnicians(t); setCategories(c); setPriorities(p); setTicketStates(s); setRoles(r); setSystemStates(es); setSeats(seatList);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar los catálogos.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => {
    if (isAdmin) void load(true);
  }, [isAdmin, load]));

  const rows = useMemo<CatalogRow[]>(() => {
    switch (active) {
      case 'usuarios': return users.map((item) => ({ id: item.idUsuario, title: `${item.nombre} ${item.apellido}`, detail: `${item.correo} · ${item.rol}`, state: item.estado, source: item }));
      case 'tecnicos': return technicians.map((item) => ({ id: item.idTecnico, title: `${item.nombre} ${item.apellido}`, detail: `${item.especialidad} · ${item.correo}`, state: item.estado, source: item }));
      case 'puestos': return seats.map((item) => ({ id: item.idPuesto, title: `${item.codigoPuesto} · ${item.nombrePuesto}`, detail: `${item.zona} · ${item.ocupanteNombre || 'Puesto libre'}`, state: item.estado, source: item }));
      case 'categorias': return categories.map((item) => ({ id: item.idCategoria, title: item.nombreCategoria, detail: item.descripcion || item.icono || 'Categoría de servicio', state: item.estado, source: item }));
      case 'prioridades': return priorities.map((item) => ({ id: item.idPrioridad, title: item.nombrePrioridad, detail: 'Nivel de prioridad de tickets', state: item.estado, source: item }));
      case 'estados': return ticketStates.map((item) => ({ id: item.idEstadoTicket, title: item.nombreEstado, detail: 'Estado del flujo del ticket', state: item.estado, source: item }));
      case 'roles': return roles.map((item) => ({ id: item.idRol, title: item.nombreRol, detail: item.descripcion || `${item.permisos?.length ?? 0} permisos`, state: item.estado, source: item }));
    }
  }, [active, categories, priorities, roles, seats, technicians, ticketStates, users]);

  if (!user) return <Redirect href="/login" />;
  if (!isAdmin) return <Screen safeTop={false} scroll contentStyle={[styles.content, mobileNav && styles.contentMobile]}><PageHeading title="Catálogos" subtitle="Esta sección requiere permisos de administrador." /><Surface><EmptyState title="Acceso restringido" description="Solicita al administrador de GETICKETS que gestione estos registros." icon="lock-closed-outline" /></Surface></Screen>;

  const setField = (key: string, value: string) => setDraft((previous) => ({ ...previous, [key]: value }));
  const selectedPermissions = (draft.permisos ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  const togglePermission = (permission: string) => {
    const next = selectedPermissions.includes(permission)
      ? selectedPermissions.filter((item) => item !== permission)
      : [...selectedPermissions, permission];
    setField('permisos', next.join(', '));
  };
  const addCustomPermission = () => {
    const clean = customPermission.trim();
    if (!clean) return;
    if (!selectedPermissions.includes(clean)) setField('permisos', [...selectedPermissions, clean].join(', '));
    setCustomPermission('');
  };
  const choosePhoto = async () => {
    setPhotoBusy(true); setError(null);
    try {
      const photo = await pickProfilePhoto();
      if (photo) setField('fotoUrl', photo);
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo cargar la imagen.'); }
    finally { setPhotoBusy(false); }
  };
  const openCreate = () => {
    setEditId(null); setConfirmDelete(null); setNotice(null); setError(null);
    setCustomPermission('');
    setDraft({ nombre: '', apellido: '', correo: '', contrasena: '', idRol: String(roles.find((item) => item.nombreRol === 'Usuario')?.idRol ?? roles[0]?.idRol ?? ''), idEstado: String(systemStates[0]?.idEstado ?? 1), idUsuario: String(users.find((item) => item.estado === 'Activo' && !technicians.some((tech) => tech.idUsuario === item.idUsuario))?.idUsuario ?? ''), especialidad: '', descripcion: '', icono: 'cpu', permisos: '', fotoUrl: '', puestoChoice: 'auto', idPuesto: '', nombrePuesto: '', codigoPuesto: '', zona: 'Operaciones', motivo: '' });
  };
  const openEdit = (row: CatalogRow) => {
    const item = row.source as Record<string, unknown>;
    const value = (key: string, fallback = '') => String(item[key] ?? fallback);
    setEditId(row.id); setConfirmDelete(null); setNotice(null); setError(null);
    if (active === 'usuarios') setDraft({ nombre: value('nombre'), apellido: value('apellido'), correo: value('correo'), contrasena: '', idRol: value('idRol'), idEstado: value('idEstado'), fotoUrl: value('fotoUrl') });
    else if (active === 'tecnicos') setDraft({ idUsuario: value('idUsuario'), correo: value('correo'), especialidad: value('especialidad'), idEstado: value('idEstado'), fotoUrl: value('fotoUrl') });
    else if (active === 'puestos') setDraft({ idPuestoUsuario: value('idUsuarioActual'), motivo: '', zona: value('zona', 'Operaciones') });
    else if (active === 'categorias') setDraft({ nombre: value('nombreCategoria'), descripcion: value('descripcion'), icono: value('icono', 'cpu'), idEstado: value('idEstado') });
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
        if (editId) await api.updateUsuario(editId, { ...payload, contrasena: draft.contrasena || undefined, fotoUrl: draft.fotoUrl || null });
        else {
          if (!draft.contrasena?.trim()) throw new Error('La contraseña es obligatoria al crear un usuario.');
          const puestoChoice = draft.puestoChoice || 'auto';
          await api.createUsuario({ ...payload, contrasena: draft.contrasena, fotoUrl: draft.fotoUrl || null, asignarPuesto: puestoChoice !== 'none', idPuesto: puestoChoice === 'auto' || puestoChoice === 'none' ? null : Number(puestoChoice), idUsuarioAccion: user.idUsuario });
        }
      } else if (active === 'tecnicos') {
        const payload = { especialidad: draft.especialidad?.trim() ?? '', correo: draft.correo?.trim() ?? '', idUsuario: Number(draft.idUsuario) };
        if (!payload.especialidad || !payload.correo || !payload.idUsuario) throw new Error('Selecciona un usuario y registra correo y especialidad.');
        if (editId) await api.updateTecnico(editId, { ...payload, idEstado: stateId }); else await api.createTecnico(payload);
        await api.updateUsuarioFoto(payload.idUsuario, draft.fotoUrl || null);
      } else if (active === 'puestos') {
        const idUsuario = draft.idPuestoUsuario ? Number(draft.idPuestoUsuario) : null;
        if (editId) await api.assignSeat({ idPuesto: editId, idUsuario, motivo: draft.motivo?.trim() || undefined, idUsuarioAccion: user.idUsuario, swap: true });
        else {
          const nombrePuesto = draft.nombrePuesto?.trim() ?? '';
          if (!nombrePuesto) throw new Error('Escribe el nombre del puesto.');
          await api.createSeat({ codigoPuesto: draft.codigoPuesto?.trim() || undefined, nombrePuesto, zona: (draft.zona || 'Operaciones') as SeatZone, idUsuarioActual: idUsuario, idUsuarioAccion: user.idUsuario, motivo: draft.motivo?.trim() || undefined });
        }
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
      setEditId(null); setDraft({}); setCustomPermission(''); setNotice(editId ? 'Registro actualizado.' : 'Registro creado.'); await load();
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
      else if (active === 'roles') await api.deleteRol(id);
      setConfirmDelete(null); setNotice('Registro desactivado.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo desactivar.'); }
    finally { setSaving(false); }
  };

  const fields = active === 'usuarios'
    ? [['nombre', 'Nombre'], ['apellido', 'Apellido'], ['correo', 'Correo electrónico'], ...(!editId ? [['contrasena', 'Contraseña']] : [])]
    : active === 'tecnicos' ? [['correo', 'Correo'], ['especialidad', 'Especialidad']]
      : active === 'puestos' ? (editId ? [['motivo', 'Motivo del cambio']] : [['nombrePuesto', 'Nombre del puesto'], ['codigoPuesto', 'Código (opcional)'], ['motivo', 'Motivo']])
        : active === 'categorias' ? [['nombre', 'Nombre de categoría'], ['descripcion', 'Descripción']]
        : active === 'roles' ? [['nombre', 'Nombre del rol'], ['descripcion', 'Descripción']]
          : [['nombre', active === 'prioridades' ? 'Nombre de prioridad' : 'Nombre del estado']];

  return (
    <Screen safeTop={false}>
      <ScrollView contentContainerStyle={[styles.content, mobileNav && styles.contentMobile]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PageHeading title="Catálogos" subtitle="Administra cuentas, técnicos y parámetros de GETICKETS." right={<Pressable onPress={() => void load()} style={[styles.reload, { backgroundColor: palette.surface, borderColor: palette.line }]} accessibilityLabel="Actualizar catálogos"><Ionicons name="refresh" size={18} color={colors.primaryDark} /></Pressable>} />
        <Surface style={styles.intro}><View style={styles.introIcon}><Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} /></View><Text style={styles.introText}>Administra usuarios, técnicos, puestos de trabajo y permisos del sistema.</Text></Surface>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {catalogTabs.map((tab) => { const selected = active === tab.key; return <Pressable key={tab.key} onPress={() => { setActive(tab.key); setEditId(null); setDraft({}); setCustomPermission(''); setConfirmDelete(null); setError(null); setNotice(null); }} style={[styles.tab, { backgroundColor: selected ? palette.skySoft : palette.surface, borderColor: selected ? colors.primary : palette.line }]}><Ionicons name={tab.icon} size={15} color={selected ? colors.primaryDark : palette.muted} /><Text style={[styles.tabText, { color: selected ? colors.primaryDark : palette.muted }]}>{tab.label}</Text></Pressable>; })}
        </ScrollView>
        <View style={styles.listHeader}><View><Text style={styles.sectionTitle}>{catalogTabs.find((item) => item.key === active)?.label}</Text><Text style={styles.sectionCaption}>{rows.length} registros</Text></View><Button onPress={openCreate} icon="add" compact>Nuevo</Button></View>
        {error ? <Notice message={error} /> : null}{notice ? <Notice message={notice} tone="success" /> : null}
        {editId !== null || Object.keys(draft).length > 0 ? <Surface style={styles.form}>
        <View style={styles.formTitleRow}><View><Text style={styles.formTitle}>{editId ? 'Editar registro' : 'Crear registro'}</Text><Text style={styles.sectionCaption}>{catalogTabs.find((item) => item.key === active)?.label}</Text></View><Pressable onPress={() => { setEditId(null); setDraft({}); setError(null); setCustomPermission(''); }} accessibilityLabel="Cerrar formulario"><Ionicons name="close" size={20} color={colors.muted} /></Pressable></View>
          {fields.map(([key, label]) => <View key={key} style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={draft[key] ?? ''} onChangeText={(value) => setField(key, value)} placeholder={label} placeholderTextColor={palette.muted} secureTextEntry={key === 'contrasena'} keyboardType={key === 'correo' ? 'email-address' : 'default'} autoCapitalize={key === 'correo' || key === 'contrasena' ? 'none' : 'sentences'} multiline={key === 'descripcion' || key === 'permisos'} style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.line, color: palette.ink }, (key === 'descripcion' || key === 'permisos') && styles.multiline]} /></View>)}
          {(active === 'usuarios' || active === 'tecnicos') ? <View style={[styles.photoForm, { backgroundColor: palette.surfaceSoft, borderColor: palette.line }]}><View style={styles.photoPreview}>{draft.fotoUrl ? <Image source={{ uri: draft.fotoUrl }} style={styles.photoPreviewImage} /> : <Text style={styles.photoPreviewInitial}>{(draft.nombre || users.find((item) => item.idUsuario === Number(draft.idUsuario))?.nombre || 'G').charAt(0).toLocaleUpperCase()}</Text>}</View><View style={styles.photoFormCopy}><Text style={styles.fieldLabel}>Foto de perfil</Text><Text style={styles.photoHelp}>Se muestra en tickets, panel y mapa 3D.</Text></View><Pressable onPress={() => void choosePhoto()} disabled={photoBusy} style={styles.photoAction}><Ionicons name="camera-outline" size={14} color="#FFFFFF" /><Text style={styles.photoActionText}>{photoBusy ? '…' : 'Subir'}</Text></Pressable>{draft.fotoUrl ? <Pressable onPress={() => setField('fotoUrl', '')} accessibilityLabel="Quitar foto" style={[styles.photoRemove, { borderColor: `${colors.red}66` }]}><Ionicons name="close" size={14} color={colors.red} /></Pressable> : null}</View> : null}
          {active === 'usuarios' ? <PickerRow label="Rol" options={roles.map((item) => ({ id: item.idRol, label: item.nombreRol }))} value={Number(draft.idRol)} onSelect={(id) => setField('idRol', String(id))} /> : null}
          {active === 'usuarios' && editId === null ? <PickerRow label="Puesto inicial" options={[{ id: -1, label: 'Asignación automática' }, { id: -2, label: 'Sin puesto' }, ...seats.filter((item) => !item.idUsuarioActual && item.estado.toLocaleLowerCase() === 'activo').map((item) => ({ id: item.idPuesto, label: `${item.codigoPuesto} · ${item.zona}` }))]} value={draft.puestoChoice === 'none' ? -2 : draft.puestoChoice === 'auto' ? -1 : Number(draft.puestoChoice)} onSelect={(id) => setField('puestoChoice', id === -1 ? 'auto' : id === -2 ? 'none' : String(id))} /> : null}
          {active === 'tecnicos' ? <PickerRow label="Cuenta de usuario" options={users.filter((item) => item.estado === 'Activo' && (!technicians.some((tech) => tech.idUsuario === item.idUsuario) || Number(draft.idUsuario) === item.idUsuario)).map((item) => ({ id: item.idUsuario, label: `${item.nombre} ${item.apellido}` }))} value={Number(draft.idUsuario)} onSelect={(id) => { const selected = users.find((item) => item.idUsuario === id); setField('idUsuario', String(id)); if (selected) { setField('correo', selected.correo); setField('fotoUrl', selected.fotoUrl ?? ''); } }} /> : null}
          {active === 'puestos' ? <><PickerRow label="Ocupante" options={[{ id: 0, label: 'Puesto libre' }, ...users.filter((item) => item.estado === 'Activo').map((item) => ({ id: item.idUsuario, label: `${item.nombre} ${item.apellido}` }))]} value={Number(draft.idPuestoUsuario || '0')} onSelect={(id) => setField('idPuestoUsuario', id ? String(id) : '')} />{editId === null ? <View style={styles.field}><Text style={styles.fieldLabel}>Zona</Text><View style={styles.zonePicker}>{(['Soporte TI', 'Administración', 'Operaciones'] as SeatZone[]).map((zone) => { const selected = draft.zona === zone; return <Pressable key={zone} onPress={() => setField('zona', zone)} style={[styles.permissionChip, { backgroundColor: selected ? palette.greenSoft : palette.surfaceSoft, borderColor: selected ? colors.green : palette.line }]}><Text style={[styles.permissionText, { color: selected ? palette.ink : palette.muted }, selected && styles.permissionTextSelected]}>{zone}</Text></Pressable>; })}</View></View> : null}</> : null}
          {active === 'categorias' ? <View style={styles.field}><Text style={styles.fieldLabel}>Ícono de la categoría</Text><View style={styles.categoryGrid}>{CATEGORY_ICON_OPTIONS.map((option) => <Pressable key={option.key} onPress={() => setField('icono', option.key)} style={[styles.categoryOption, { backgroundColor: palette.surface, borderColor: draft.icono === option.key ? colors.primary : palette.line }, draft.icono === option.key && styles.categoryOptionSelected]}><View style={[styles.categoryIcon, { backgroundColor: darkMode ? `${option.color}22` : option.tile }]}><Ionicons name={option.key} size={17} color={option.color} /></View><Text style={styles.categoryLabel} numberOfLines={1}>{option.label}</Text></Pressable>)}</View></View> : null}
          {active === 'roles' ? <View style={styles.field}><Text style={styles.fieldLabel}>Permisos del rol</Text><View style={styles.permissionsGrid}>{DEFAULT_ROLE_PERMISSIONS.map((permission) => { const selected = selectedPermissions.includes(permission); return <Pressable key={permission} onPress={() => togglePermission(permission)} style={[styles.permissionChip, { backgroundColor: selected ? palette.greenSoft : palette.surfaceSoft, borderColor: selected ? colors.green : palette.line }]}><Ionicons name={selected ? 'checkmark-circle' : 'radio-button-off'} size={15} color={selected ? colors.green : colors.muted} /><Text style={[styles.permissionText, { color: selected ? palette.ink : palette.muted }, selected && styles.permissionTextSelected]}>{permission}</Text></Pressable>; })}</View><View style={styles.customPermission}><TextInput value={customPermission} onChangeText={setCustomPermission} placeholder="Agregar permiso personalizado" placeholderTextColor={palette.muted} style={[styles.input, styles.customPermissionInput, { backgroundColor: palette.surface, borderColor: palette.line, color: palette.ink }]} /><Pressable onPress={addCustomPermission} style={styles.photoAction}><Ionicons name="add" size={15} color="#FFFFFF" /><Text style={styles.photoActionText}>Agregar</Text></Pressable></View>{selectedPermissions.filter((permission) => !DEFAULT_ROLE_PERMISSIONS.includes(permission)).map((permission) => <Pressable key={permission} onPress={() => togglePermission(permission)} style={[styles.customPermissionTag, { borderColor: palette.line, backgroundColor: palette.surfaceSoft }]}><Text style={styles.permissionText}>{permission}</Text><Ionicons name="close" size={14} color={colors.red} /></Pressable>)}</View> : null}
          {editId !== null && active !== 'usuarios' ? <PickerRow label="Estado" options={systemStates.map((item) => ({ id: item.idEstado, label: item.nombreEstado }))} value={Number(draft.idEstado)} onSelect={(id) => setField('idEstado', String(id))} /> : null}
          {error ? <Notice message={error} /> : null}
          <View style={styles.formActions}><Button onPress={() => { setEditId(null); setDraft({}); setError(null); }} variant="secondary" compact>Cancelar</Button><Button onPress={() => void save()} disabled={saving} icon="checkmark" compact>{saving ? 'Guardando…' : 'Guardar'}</Button></View>
        </Surface> : null}
        {loading ? <LoadingState label="Sincronizando catálogos…" /> : rows.length ? <Surface style={styles.rows}>{rows.map((row, index) => {
          const photoUrl = (row.source as { fotoUrl?: string | null }).fotoUrl;
          return <View key={row.id} style={[styles.row, index > 0 && styles.rowBorder, index > 0 && { borderTopColor: palette.line }]}>
            <View style={[styles.rowAvatar, { backgroundColor: palette.surfaceSoft }]}>{photoUrl ? <Image source={{ uri: photoUrl }} style={styles.rowAvatarImage} /> : <Text style={styles.rowInitial}>{row.title.trim().charAt(0).toLocaleUpperCase() || 'G'}</Text>}</View><View style={styles.rowCopy}><View style={styles.rowTitleLine}><Text style={styles.rowTitle} numberOfLines={1}>{row.title}</Text><View style={[styles.statePill, { backgroundColor: row.state === 'Activo' ? palette.greenSoft : palette.amberSoft }]}><View style={[styles.stateDot, { backgroundColor: row.state === 'Activo' ? colors.green : colors.amber }]} /><Text style={[styles.stateText, { color: row.state === 'Activo' ? colors.green : colors.amber }]}>{row.state || 'Sin estado'}</Text></View></View><Text style={styles.rowDetail} numberOfLines={2}>{row.detail}</Text></View>
            <View style={styles.rowActions}>{confirmDelete === row.id ? <><Pressable onPress={() => setConfirmDelete(null)} style={styles.iconButton}><Ionicons name="close" size={17} color={colors.muted} /></Pressable><Pressable onPress={() => void deactivate(row.id)} style={[styles.iconButton, styles.deleteButton]} disabled={saving}><Ionicons name="power-outline" size={17} color={colors.red} /></Pressable></> : <><Pressable onPress={() => openEdit(row)} style={styles.iconButton} accessibilityLabel={`Editar ${row.title}`}><Ionicons name="create-outline" size={17} color={colors.primaryDark} /></Pressable>{active !== 'puestos' ? <Pressable onPress={() => setConfirmDelete(row.id)} style={styles.iconButton} accessibilityLabel={`Desactivar ${row.title}`}><Ionicons name="power-outline" size={17} color={row.state === 'Activo' ? colors.red : colors.muted} /></Pressable> : null}</>}</View>
          </View>;
        })}</Surface> : <Surface><EmptyState title="Catálogo vacío" description="Crea el primer registro con el botón Nuevo." icon="file-tray-outline" /></Surface>}
      </ScrollView>
    </Screen>
  );
}

function PickerRow({ label, options, value, onSelect }: { label: string; options: { id: number; label: string }[]; value: number; onSelect: (id: number) => void }) {
  const { darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerList}>{options.map((item) => { const selected = value === item.id; return <Pressable key={item.id} onPress={() => onSelect(item.id)} style={[styles.pickerChip, { backgroundColor: selected ? palette.skySoft : palette.surfaceSoft, borderColor: selected ? colors.primary : palette.line }]}><Text style={[styles.pickerText, { color: selected ? colors.primaryDark : palette.muted }]}>{item.label}</Text></Pressable>; })}</ScrollView></View>;
}

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 34, gap: 15, width: '100%', maxWidth: 1080, alignSelf: 'center' }, contentMobile: { paddingBottom: 112 },
  reload: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF9FF', borderColor: '#A5DDF8', paddingVertical: 12 }, introIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' }, introText: { flex: 1, color: '#425B70', fontSize: 12, lineHeight: 18 },
  tabs: { gap: 7, paddingRight: 10 }, tab: { minHeight: 38, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 11 }, tabSelected: { borderColor: colors.primary, backgroundColor: colors.skySoft }, tabText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, tabTextSelected: { color: colors.primaryDark },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, sectionCaption: { color: colors.muted, fontSize: 11, marginTop: 3 },
  form: { gap: 13, borderColor: '#A5DDF8' }, formTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, formTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, field: { gap: 6 }, fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: '700' }, input: { minHeight: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: colors.surfaceSoft, paddingHorizontal: 12, color: colors.ink, fontSize: 13 }, multiline: { minHeight: 76, paddingTop: 10, textAlignVertical: 'top' }, pickerList: { gap: 7 }, pickerChip: { minHeight: 34, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: 11, backgroundColor: colors.surfaceSoft, borderColor: colors.line, borderWidth: 1 }, pickerSelected: { backgroundColor: colors.skySoft, borderColor: colors.primary }, pickerText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, pickerTextSelected: { color: colors.primaryDark }, formActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  photoForm: { minHeight: 70, padding: 10, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceSoft, flexDirection: 'row', alignItems: 'center', gap: 9 }, photoPreview: { width: 42, height: 42, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, photoPreviewImage: { width: '100%', height: '100%' }, photoPreviewInitial: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, photoFormCopy: { flex: 1, gap: 2 }, photoHelp: { color: colors.muted, fontSize: 9, lineHeight: 13 }, photoAction: { minHeight: 32, paddingHorizontal: 10, borderRadius: 9, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, photoActionText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' }, photoRemove: { width: 31, height: 31, borderRadius: 9, borderWidth: 1, borderColor: '#FDA4AF', alignItems: 'center', justifyContent: 'center' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, categoryOption: { width: '31%', minHeight: 61, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 11, padding: 7, alignItems: 'center', justifyContent: 'center', gap: 4 }, categoryOptionSelected: { borderColor: colors.primary, borderWidth: 2 }, categoryIcon: { width: 29, height: 29, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, categoryLabel: { color: colors.ink, fontSize: 9, fontWeight: '700', textAlign: 'center' },
  permissionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, permissionChip: { width: '48%', minHeight: 38, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceSoft, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7 }, permissionChipSelected: { borderColor: colors.green, backgroundColor: colors.greenSoft }, permissionText: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 14 }, permissionTextSelected: { color: colors.ink, fontWeight: '700' }, customPermission: { flexDirection: 'row', alignItems: 'center', gap: 7 }, customPermissionInput: { flex: 1, minWidth: 0 }, customPermissionTag: { minHeight: 34, paddingHorizontal: 9, borderRadius: 9, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 7 }, zonePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  rows: { paddingVertical: 2 }, row: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 12 }, rowBorder: { borderTopWidth: 1, borderTopColor: colors.line }, rowAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2F7', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, rowAvatarImage: { width: '100%', height: '100%' }, rowInitial: { color: colors.ink, fontSize: 11, fontWeight: '900' }, rowCopy: { flex: 1, minWidth: 80, gap: 4 }, rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 }, rowTitle: { color: colors.ink, fontSize: 12, fontWeight: '800', flexShrink: 1 }, rowDetail: { color: colors.muted, fontSize: 10 }, statePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: colors.amberSoft }, stateActive: { backgroundColor: colors.greenSoft }, stateDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.amber }, stateDotActive: { backgroundColor: colors.green }, stateText: { color: colors.amber, fontSize: 9, fontWeight: '800' }, stateTextActive: { color: colors.green }, rowActions: { flexDirection: 'row', gap: 6 }, iconButton: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, deleteButton: { backgroundColor: colors.redSoft, borderColor: '#FECDD3' },
});
