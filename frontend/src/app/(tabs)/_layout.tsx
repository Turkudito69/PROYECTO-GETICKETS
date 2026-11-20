import { Redirect, router, Tabs, useFocusEffect, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../components/Typography';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import { isNotificationRead } from '../../lib/notificationState';
import { initials, visibleTicketsFor } from '../../lib/tickets';
import { colors } from '../../theme';
import type { AuditItem } from '../../types';

type NavItem = { label: string; icon: keyof typeof Ionicons.glyphMap; href: string };

export default function TabsLayout() {
  const { user, signOut } = useSession();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const isAdmin = user?.rol === 'Administrador';
  const isTech = user?.rol === 'Tecnico';
  const desktop = Platform.OS === 'web' && width >= 1024;
  const items: NavItem[] = [
    { label: 'Inicio', icon: 'home-outline', href: '/(tabs)' },
    { label: isAdmin ? 'Tickets' : isTech ? 'Bandeja técnica' : 'Mis solicitudes', icon: 'ticket-outline', href: '/(tabs)/tickets' },
    { label: 'Oficina 3D', icon: 'cube-outline', href: '/(tabs)/office' },
    ...(isAdmin ? [
      { label: 'Auditoría', icon: 'time-outline' as const, href: '/(tabs)/audit' },
      { label: 'Catálogos', icon: 'server-outline' as const, href: '/(tabs)/catalogs' },
    ] : isTech ? [{ label: 'Actividad', icon: 'time-outline' as const, href: '/(tabs)/audit' }] : []),
    { label: 'Mi perfil', icon: 'person-outline', href: '/(tabs)/profile' },
  ];
  const page = pathname.includes('tickets') ? (isAdmin ? 'Tickets' : 'Mis solicitudes')
    : pathname.includes('office') ? 'Oficina 3D'
      : pathname.includes('audit') ? 'Auditoría'
        : pathname.includes('catalogs') ? 'Catálogos'
          : pathname.includes('profile') ? 'Mi perfil' : 'Inicio';

  useFocusEffect(useCallback(() => {
    if (!user) return;
    let active = true;
    void Promise.all([api.getAuditoria().catch(() => [] as AuditItem[]), api.getTickets()]).then(([events, allTickets]) => {
      const visible = visibleTicketsFor(user, allTickets);
      const allowedCodes = new Set(visible.map((ticket) => ticket.tickets.trim().toLocaleLowerCase()));
      const currentUserName = `${user.nombre} ${user.apellido}`.trim().toLocaleLowerCase();
      const relevant = events.filter((item) => (isAdmin || allowedCodes.has(item.ticket.trim().toLocaleLowerCase())) && item.responsable.trim().toLocaleLowerCase() !== currentUserName);
      const ids = relevant.length ? relevant.map((item) => item.idAuditoria) : visible.slice().sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()).slice(0, 8).map((item) => -item.idTicket);
      if (active) setUnreadCount(ids.filter((id) => !isNotificationRead(id)).length);
    }).catch(() => { if (active) setUnreadCount(0); });
    return () => { active = false; };
  }, [isAdmin, user]));

  if (!user) return <Redirect href="/login" />;

  const tabs = (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: desktop ? { display: 'none' } : styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={typeof color === 'string' ? color : colors.muted} /> }} />
      <Tabs.Screen name="tickets" options={{ title: isAdmin ? 'Tickets' : 'Solicitudes', tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" size={size} color={typeof color === 'string' ? color : colors.muted} /> }} />
      <Tabs.Screen name="create" options={{ title: 'Nuevo', tabBarIcon: () => <Ionicons name="add-circle" size={25} color={colors.primary} />, tabBarButton: () => <Pressable accessibilityRole="button" accessibilityLabel="Crear ticket" onPress={() => router.push('/new-ticket')} style={styles.createTab}><Ionicons name="add-circle" size={24} color={colors.primary} /><Text style={styles.createTabText}>Nuevo</Text></Pressable> }} />
      <Tabs.Screen name="office" options={{ title: 'Oficina 3D', tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={typeof color === 'string' ? color : colors.muted} /> }} />
      <Tabs.Screen name="audit" options={{ title: isAdmin ? 'Auditoría' : 'Actividad', href: isAdmin || isTech ? undefined : null, tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={typeof color === 'string' ? color : colors.muted} /> }} />
      <Tabs.Screen name="catalogs" options={{ title: 'Catálogos', href: isAdmin ? undefined : null, tabBarIcon: ({ color, size }) => <Ionicons name="server-outline" size={size} color={typeof color === 'string' ? color : colors.muted} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', href: desktop || isAdmin || isTech ? null : undefined, tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={typeof color === 'string' ? color : colors.muted} /> }} />
    </Tabs>
  );

  if (!desktop) return (
    <View style={styles.mobileShell}>
      <View style={styles.mobileHeader}>
        <View style={styles.mobileBrand}><View style={styles.mobileLogo}><Ionicons name="ticket" size={17} color={colors.navy} /></View><Text style={styles.mobileBrandName}>GETICKETS</Text><Text style={styles.mobileRole}>· {user.rol}</Text></View>
        <View style={styles.mobileActions}>
          <Pressable onPress={() => router.push('/notifications')} style={styles.mobileAction} accessibilityLabel={`Abrir notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`}><Ionicons name="notifications-outline" size={18} color="#FFFFFF" />{unreadCount > 0 ? <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View> : null}</Pressable>
          <Pressable onPress={() => router.push('/new-ticket')} style={styles.mobileAction} accessibilityLabel="Reportar problema"><Ionicons name="add" size={21} color="#FFFFFF" /></Pressable>
          <Pressable onPress={() => void signOut()} style={styles.mobileAction} accessibilityLabel="Cerrar sesión"><Ionicons name="log-out-outline" size={18} color="#FFFFFF" /></Pressable>
        </View>
      </View>
      <View style={styles.mobileTabs}>{tabs}</View>
    </View>
  );

  return (
    <View style={styles.desktopShell}>
      <View style={styles.sidebar}>
        <View style={styles.brand}><View style={styles.brandIcon}><Ionicons name="ticket" size={18} color="#FFFFFF" /></View><Text style={styles.brandName}>GETICKETS</Text></View>
        <ScrollView contentContainerStyle={styles.navList} showsVerticalScrollIndicator={false}>
          {items.map((item) => {
            const active = item.href === '/(tabs)' ? pathname === '/' || pathname === '/index' || pathname === '/(tabs)' || pathname === '/(tabs)/' : pathname.endsWith(item.href.split('/').pop() ?? '');
            return <Pressable key={item.label} onPress={() => router.push(item.href as never)} style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && styles.navPressed]}>
              <Ionicons name={item.icon} size={18} color={active ? '#FFFFFF' : '#C8D5E9'} /><Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
            </Pressable>;
          })}
        </ScrollView>
        <View style={styles.sidebarFooter}>
          <View style={styles.userCard}><View style={styles.userAvatar}><Text style={styles.userAvatarText}>{initials(user.nombre, user.apellido)}</Text></View><View style={styles.userCopy}><Text numberOfLines={1} style={styles.userName}>{user.nombre} {user.apellido}</Text><Text style={styles.userRole}>{user.rol}</Text></View><Pressable onPress={() => void signOut()} accessibilityLabel="Cerrar sesión"><Ionicons name="log-out-outline" size={18} color="#B8C6DA" /></Pressable></View>
        </View>
      </View>
      <View style={styles.mainColumn}>
        <View style={styles.desktopHeader}><View style={styles.breadcrumb}><Text style={styles.breadcrumbBrand}>GETICKETS</Text><Ionicons name="chevron-forward" size={14} color={colors.muted} /><Text style={styles.breadcrumbPage}>{page}</Text></View><View style={styles.headerActions}><Pressable onPress={() => router.push('/notifications')} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel={`Abrir notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`}><Ionicons name={unreadCount ? 'notifications' : 'notifications-outline'} size={19} color={colors.ink} />{unreadCount > 0 ? <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View> : null}</Pressable><Pressable onPress={() => router.push('/new-ticket')} style={styles.headerPrimary}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.headerPrimaryText}>Reportar problema</Text></Pressable></View></View>
        <View style={styles.tabsArea}>{tabs}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileShell: { flex: 1, backgroundColor: colors.canvas },
  mobileHeader: { minHeight: 56, paddingHorizontal: 14, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  mobileLogo: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  mobileBrandName: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  mobileRole: { color: '#8CDFFF', fontSize: 11, flexShrink: 1 },
  mobileActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mobileAction: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  mobileTabs: { flex: 1, minHeight: 0 },
  desktopShell: { flex: 1, flexDirection: 'row', backgroundColor: colors.canvas, minHeight: '100%' },
  sidebar: { width: 288, backgroundColor: colors.navy, borderRightWidth: 1, borderRightColor: '#263653', justifyContent: 'space-between' },
  brand: { height: 66, paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: '#34425C', flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: .2 },
  navList: { paddingHorizontal: 10, paddingTop: 14, paddingBottom: 18, gap: 6 },
  navItem: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, borderRadius: 13 },
  navItemActive: { backgroundColor: '#00A6E8' }, navPressed: { opacity: .78, transform: [{ scale: .985 }] }, navHovered: { transform: [{ translateX: 2 }] },
  navText: { color: '#D5DFEE', fontSize: 13, fontWeight: '700' }, navTextActive: { color: '#FFFFFF', fontWeight: '800' },
  sidebarFooter: { padding: 12, borderTopWidth: 1, borderTopColor: '#34425C', gap: 12 },
  userCard: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9 }, userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00A6E8', alignItems: 'center', justifyContent: 'center' }, userAvatarText: { color: '#FFFFFF', fontWeight: '900', fontSize: 11 },
  userCopy: { flex: 1, gap: 2 }, userName: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' }, userRole: { color: '#8CDFFF', fontSize: 11 },
  mainColumn: { flex: 1, minWidth: 0 }, desktopHeader: { height: 66, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 10 }, breadcrumbBrand: { color: colors.muted, fontSize: 13 }, breadcrumbPage: { color: colors.ink, fontWeight: '800', fontSize: 14 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 }, headerIcon: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, position: 'relative' }, headerBadge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 3, backgroundColor: '#E11D48', borderWidth: 1, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, headerBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  headerPrimary: { minHeight: 44, paddingHorizontal: 17, borderRadius: 13, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6 }, headerPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  tabsArea: { flex: 1, minHeight: 0 },
  tabBar: { height: 66, paddingTop: 7, paddingBottom: 7, borderTopColor: colors.line, backgroundColor: colors.surface }, tabLabel: { fontSize: 10, fontWeight: '700' },
  createTab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }, createTabText: { fontSize: 10, fontWeight: '700', color: colors.primary },
});
