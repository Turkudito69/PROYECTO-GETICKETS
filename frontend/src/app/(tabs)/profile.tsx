import { Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../components/Typography';
import { useSession } from '../../context/SessionContext';
import { initials } from '../../lib/tickets';
import { colors, space } from '../../theme';
import { Screen, Surface } from '../../components/ui';

const roles = [
  { name: 'Administrador', description: 'Control total de la mesa de ayuda, asignación de casos y catálogos.', permissions: ['Ver todos los tickets de la organización', 'Asignar técnicos disponibles según carga', 'Confirmar o reabrir cualquier solicitud', 'Auditar el historial de movimientos', 'Crear y editar usuarios, técnicos, categorías y roles', 'Explorar el mapa 3D de puestos y estado'] },
  { name: 'Técnico', description: 'Atiende incidencias asignadas, registra avances y documenta soluciones.', permissions: ['Consultar su bandeja de casos asignados', 'Iniciar atención y actualizar el estado', 'Agregar notas técnicas al historial', 'Registrar diagnóstico y solución', 'Crear solicitudes internas', 'Consultar el mapa de puestos'] },
  { name: 'Usuario', description: 'Colaborador que reporta incidentes y confirma la solución aplicada.', permissions: ['Reportar incidentes por categoría y prioridad', 'Dar seguimiento visual a sus tickets', 'Confirmar que una solución funcionó', 'Reabrir el caso si el problema persiste', 'Recibir notificaciones y consultar el espacio 3D'] },
];

export default function ProfileScreen({ showBackButton = false }: { showBackButton?: boolean }) {
  const { user, signOut } = useSession();
  const { width } = useWindowDimensions();
  const wide = width >= 950;
  if (!user) return <Redirect href="/login" />;
  const handleSignOut = () => { signOut(); router.replace('/login'); };

  return (
    <Screen scroll contentStyle={styles.content}>
      {showBackButton ? <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button"><Ionicons name="arrow-back" size={18} color={colors.primaryDark} /><Text style={styles.backText}>Volver</Text></Pressable> : null}
      <PageHeading title="Mi Perfil y Roles del Sistema" subtitle="Consulta la información de tu cuenta y los permisos disponibles en GETICKETS." />
      <View style={[styles.columns, wide && styles.columnsWide]}>
        <Surface style={[styles.profileCard, wide && styles.profileCardWide]}>
          <View style={styles.identity}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(user.nombre, user.apellido)}</Text></View><View style={styles.identityCopy}><Text style={styles.name}>{user.nombre} {user.apellido}</Text><Text style={styles.email}>{user.correo}</Text><View style={styles.rolePill}><View style={styles.activeDot} /><Text style={styles.roleText}>{user.rol}</Text></View></View></View>
          <View style={styles.activeRole}><Text style={styles.activeRoleTitle}>Tu rol activo: {user.rol}</Text><Text style={styles.activeRoleCopy}>{user.rol === 'Administrador' ? 'Supervisa la operación, asigna solicitudes y mantiene los catálogos de la mesa de ayuda.' : user.rol === 'Tecnico' ? 'Atiende los casos asignados, registra avances y comparte soluciones con el equipo.' : 'Puedes reportar incidentes de soporte, seguir su avance y confirmar la solución.'}</Text></View>
          <View style={styles.details}><ProfileRow icon="mail-outline" label="Correo electrónico" value={user.correo} /><View style={styles.divider} /><ProfileRow icon="person-outline" label="Identificador de usuario" value={`#${user.idUsuario}`} />{user.idTecnico ? <><View style={styles.divider} /><ProfileRow icon="construct-outline" label="Identificador de técnico" value={`#${user.idTecnico}`} /></> : null}</View>
          <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}><Ionicons name="log-out-outline" size={17} color={colors.red} /><Text style={styles.signOutText}>Cerrar sesión</Text></Pressable>
          <Text style={styles.version}>Cuenta conectada a GETICKETS API</Text>
        </Surface>
        <Surface style={[styles.rolesPanel, wide && styles.rolesPanelWide]}>
          <View style={styles.rolesHeading}><Ionicons name="shield-checkmark-outline" size={19} color={colors.indigo} /><Text style={styles.rolesTitle}>¿Qué puede hacer cada rol?</Text></View>
          <View style={styles.rolesList}>{roles.map((role) => {
            const active = role.name === user.rol;
            return <View key={role.name} style={[styles.roleCard, active && styles.roleCardActive]}>
              <View style={styles.roleCardTop}><View><Text style={styles.roleCardTitle}>{role.name}</Text><Text style={styles.roleDescription}>{role.description}</Text></View>{active ? <View style={styles.youBadge}><Text style={styles.youBadgeText}>Tu perfil</Text></View> : null}</View>
              <View style={styles.permissionGrid}>{role.permissions.map((permission) => <View key={permission} style={styles.permission}><Ionicons name="checkmark" size={15} color={colors.green} /><Text style={styles.permissionText}>{permission}</Text></View>)}</View>
            </View>;
          })}</View>
        </Surface>
      </View>
    </Screen>
  );
}

function ProfileRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <View style={styles.row}><View style={styles.rowIcon}><Ionicons name={icon} size={16} color={colors.primaryDark} /></View><View style={styles.rowText}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View></View>;
}

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.pageHeading}><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageSubtitle}>{subtitle}</Text></View>;
}

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 32, gap: 18, width: '100%', maxWidth: 1280, alignSelf: 'center' },
  back: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }, backText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  pageHeading: { gap: 5 }, pageTitle: { color: colors.ink, fontSize: 26, fontWeight: '900', letterSpacing: -.4 }, pageSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  columns: { gap: 16 }, columnsWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  profileCard: { gap: 17, padding: 21 }, profileCardWide: { flex: .9 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 13 }, avatar: { width: 66, height: 66, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#FFFFFF', fontWeight: '900', fontSize: 21 }, identityCopy: { flex: 1, gap: 4 }, name: { color: colors.ink, fontWeight: '900', fontSize: 19 }, email: { color: colors.muted, fontSize: 12 },
  rolePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }, activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green }, roleText: { color: colors.muted, fontSize: 11 },
  activeRole: { padding: 14, borderRadius: 13, borderWidth: 1, borderColor: '#A5DDF8', backgroundColor: '#F1FAFF', gap: 5 }, activeRoleTitle: { color: colors.primaryDark, fontSize: 12, fontWeight: '900' }, activeRoleCopy: { color: '#425B70', fontSize: 12, lineHeight: 19 },
  details: { paddingHorizontal: 2 }, row: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 10 }, rowIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' }, rowText: { flex: 1, gap: 3 }, rowLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' }, rowValue: { color: colors.ink, fontSize: 13, fontWeight: '700' }, divider: { height: 1, backgroundColor: colors.line },
  signOut: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: '#FDA4AF', borderRadius: 11 }, signOutText: { color: colors.red, fontSize: 12, fontWeight: '800' }, pressed: { opacity: .8 }, version: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: -8 },
  rolesPanel: { padding: 18, gap: 13 }, rolesPanelWide: { flex: 1.45 }, rolesHeading: { minHeight: 37, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 12 }, rolesTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, rolesList: { gap: 10 },
  roleCard: { borderWidth: 1, borderColor: colors.line, borderRadius: 13, padding: 14, gap: 11 }, roleCardActive: { borderColor: colors.primary, backgroundColor: '#F4FBFF' }, roleCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }, roleCardTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' }, roleDescription: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4, maxWidth: 620 }, youBadge: { borderRadius: 7, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: colors.primary }, youBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  permissionGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 7, columnGap: 8 }, permission: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, width: '48%' }, permissionText: { flex: 1, color: '#475569', fontSize: 10, lineHeight: 15 },
});
