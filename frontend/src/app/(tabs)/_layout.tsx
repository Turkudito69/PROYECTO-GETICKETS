import { Redirect, router, useFocusEffect, usePathname } from 'expo-router';
import { Ionicons } from '../../components/Icons';
import { TopTabs as SwipeTabs, type MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import { useCallback, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/Typography';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import { hydrateNotificationState, initializeNotificationState, isNotificationRead } from '../../lib/notificationState';
import { initials, visibleTicketsFor } from '../../lib/tickets';
import { colors, getThemeColors } from '../../theme';
import type { AuditItem } from '../../types';
import { useReducedMotion } from '../../lib/motion';
import { useFocusedPolling } from '../../hooks/useFocusedPolling';

type NavItem = { label: string; icon: keyof typeof Ionicons.glyphMap; href: string };

export default function TabsLayout() {
  const { user, isReady, signOut, darkMode, toggleDarkMode } = useSession();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const palette = getThemeColors(darkMode);
  const reduceMotion = useReducedMotion();
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

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const [, events, allTickets] = await Promise.all([hydrateNotificationState(user.idUsuario), api.getAuditoria().catch(() => [] as AuditItem[]), api.getTickets()]);
      const visible = visibleTicketsFor(user, allTickets);
      const allowedCodes = new Set(visible.map((ticket) => ticket.tickets.trim().toLocaleLowerCase()));
      const currentUserName = `${user.nombre} ${user.apellido}`.trim().toLocaleLowerCase();
      const relevant = events.filter((item) => (isAdmin || allowedCodes.has(item.ticket.trim().toLocaleLowerCase())) && item.responsable.trim().toLocaleLowerCase() !== currentUserName)
        .sort((a, b) => new Date(b.fechaAccion).getTime() - new Date(a.fechaAccion).getTime());
      const ids = relevant.length ? relevant.map((item) => item.idAuditoria) : visible.slice().sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()).slice(0, 8).map((item) => -item.idTicket);
      initializeNotificationState(user.idUsuario, ids.slice(2));
      setUnreadCount(ids.filter((id) => !isNotificationRead(id, user.idUsuario)).length);
    } catch { setUnreadCount(0); }
  }, [isAdmin, user]);
  useFocusEffect(useCallback(() => { void refreshUnreadCount(); }, [refreshUnreadCount]));
  useFocusedPolling(refreshUnreadCount, 8000);

  if (!isReady) return null;
  if (!user) return <Redirect href="/login" />;

  const bottomItems = [
    { label: 'Inicio', route: 'index', icon: 'home-outline' as const },
    { label: isAdmin ? 'Tickets' : isTech ? 'Bandeja' : 'Tickets', route: 'tickets', icon: 'ticket-outline' as const },
    { label: 'Nuevo', action: true, icon: 'add' as const },
    { label: '3D', route: 'office', icon: 'cube-outline' as const },
    { label: isAdmin ? 'Catálogos' : 'Perfil', route: isAdmin ? 'catalogs' : 'profile', icon: isAdmin ? 'server-outline' as const : 'person-outline' as const },
  ];
  const tabs = (
    <SwipeTabs
      tabBar={(props) => <FixedBottomBar {...props} items={bottomItems} desktop={desktop} palette={palette} bottomInset={insets.bottom} reduceMotion={reduceMotion} />}
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: !desktop && Platform.OS !== 'web',
        animationEnabled: true,
        lazy: true,
        sceneStyle: { backgroundColor: palette.canvas },
      }}
    >
      <SwipeTabs.Screen name="index" options={{ title: 'Inicio' }} />
      <SwipeTabs.Screen name="tickets" options={{ title: isAdmin ? 'Tickets' : 'Solicitudes' }} />
      <SwipeTabs.Screen name="office" options={{ title: 'Oficina 3D' }} />
      <SwipeTabs.Screen name="audit" options={{ title: isAdmin ? 'Auditoría' : 'Actividad', hidden: !isAdmin && !isTech }} />
      <SwipeTabs.Screen name="catalogs" options={{ title: 'Catálogos', hidden: !isAdmin }} />
      <SwipeTabs.Screen name="profile" options={{ title: 'Perfil' }} />
      <SwipeTabs.Screen name="create" options={{ hidden: true }} />
    </SwipeTabs>
  );

  if (!desktop) return (
    <View style={styles.mobileShell}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: palette.navy }}>
        <View style={[styles.mobileHeader, { backgroundColor: palette.navy }]}>
          <View style={styles.mobileBrand}><View style={styles.mobileLogo}><Ionicons name="ticket" size={17} color={colors.navy} /></View><Text style={styles.mobileBrandName}>GETICKETS</Text>{width >= 400 ? <Text style={styles.mobileRole}>· {user.rol}</Text> : null}</View>
          <View style={[styles.mobileActions, width < 380 && styles.mobileActionsCompact]}>
            <NotificationButton onPress={() => router.push('/notifications')} style={styles.mobileAction} reduceMotion={reduceMotion} accessibilityLabel={`Abrir notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`}><NotificationBell unreadCount={unreadCount} color="#FFFFFF" reduceMotion={reduceMotion} /><UnreadBadge unreadCount={unreadCount} reduceMotion={reduceMotion} /></NotificationButton>
            <Pressable onPress={toggleDarkMode} style={({ pressed }) => [styles.mobileAction, pressed && styles.mobileActionPressed]} accessibilityLabel={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}><Ionicons name={darkMode ? 'sunny-outline' : 'moon-outline'} size={19} color={darkMode ? colors.amber : '#FFFFFF'} /></Pressable>
            <Pressable onPress={() => void signOut()} style={({ pressed }) => [styles.mobileAction, pressed && styles.mobileActionPressed]} accessibilityLabel="Cerrar sesión"><Ionicons name="log-out-outline" size={19} color="#FFFFFF" /></Pressable>
          </View>
        </View>
      </SafeAreaView>
      <ScrollView horizontal style={[styles.quickNav, { backgroundColor: palette.surface, borderBottomColor: palette.line }]} contentContainerStyle={styles.quickNavContent} showsHorizontalScrollIndicator={false}>
        {items.map((item) => {
          const routeName = item.href.split('/').pop() ?? '';
          const active = item.href === '/(tabs)'
            ? pathname === '/' || pathname === '/index' || pathname.endsWith('/index') || pathname.endsWith('/(tabs)')
            : pathname.endsWith(routeName);
          const activeColor = darkMode ? '#7DD3FC' : colors.primaryDark;
          return <Pressable key={item.label} onPress={() => router.push(item.href as never)} style={({ pressed }) => [styles.quickChip, { backgroundColor: palette.surface, borderColor: active ? colors.primary : palette.line }, active && { backgroundColor: palette.skySoft }, pressed && styles.navPressed]}><Ionicons name={item.icon} size={15} color={active ? activeColor : palette.muted} /><Text style={[styles.quickChipText, { color: active ? activeColor : palette.ink }]}>{item.label}</Text></Pressable>;
        })}
        <Pressable onPress={() => router.push('/new-ticket')} style={({ pressed }) => [styles.quickChip, styles.quickNew, pressed && styles.navPressed]}><Ionicons name="add" size={16} color="#111827" /><Text style={styles.quickNewText}>Nuevo</Text></Pressable>
      </ScrollView>
      <View style={styles.mobileTabs}>{tabs}</View>
    </View>
  );

  return (
    <View style={styles.desktopShell}>
      <View style={[styles.sidebar, { backgroundColor: palette.navy }]}>
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
        <View style={[styles.desktopHeader, { backgroundColor: palette.surface, borderBottomColor: palette.line }]}><View style={styles.breadcrumb}><Text style={[styles.breadcrumbBrand, { color: palette.muted }]}>GETICKETS</Text><Ionicons name="chevron-forward" size={14} color={palette.muted} /><Text style={[styles.breadcrumbPage, { color: palette.ink }]}>{page}</Text></View><View style={styles.headerActions}><NotificationButton onPress={() => router.push('/notifications')} style={[styles.headerIcon, { backgroundColor: palette.surface, borderColor: palette.line }]} reduceMotion={reduceMotion} accessibilityLabel={`Abrir notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`}><NotificationBell unreadCount={unreadCount} color={palette.ink} reduceMotion={reduceMotion} /><UnreadBadge unreadCount={unreadCount} reduceMotion={reduceMotion} /></NotificationButton><Pressable onPress={toggleDarkMode} style={[styles.headerIcon, { backgroundColor: palette.surface, borderColor: palette.line }]} accessibilityLabel={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}><Ionicons name={darkMode ? 'sunny-outline' : 'moon-outline'} size={18} color={darkMode ? colors.amber : palette.ink} /></Pressable><Pressable onPress={() => router.push('/new-ticket')} style={styles.headerPrimary}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.headerPrimaryText}>Reportar problema</Text></Pressable><Pressable onPress={() => void signOut()} style={[styles.headerIcon, { backgroundColor: palette.surface, borderColor: palette.line }]} accessibilityLabel="Cerrar sesión"><Ionicons name="log-out-outline" size={18} color={palette.ink} /></Pressable></View></View>
        <View style={styles.tabsArea}>{tabs}</View>
      </View>
    </View>
  );
}

function NotificationBell({ unreadCount, color, reduceMotion }: { unreadCount: number; color: string; reduceMotion: boolean }) {
  const [rotation] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduceMotion || unreadCount === 0) { rotation.setValue(0); return; }
    const wiggle = Animated.sequence([
      Animated.timing(rotation, { toValue: 0.25, duration: 112, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(rotation, { toValue: 0.5, duration: 113, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(rotation, { toValue: 0.75, duration: 112, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(rotation, { toValue: 1, duration: 113, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
    ]);
    wiggle.start(() => rotation.setValue(0));
    return () => wiggle.stop();
  }, [reduceMotion, rotation, unreadCount]);
  const rotate = rotation.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '-10deg', '10deg', '-6deg', '0deg'] });
  return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="notifications-outline" size={18} color={color} /></Animated.View>;
}

function NotificationButton({ children, onPress, style, reduceMotion, accessibilityLabel }: PropsWithChildren<{ onPress: () => void; style: StyleProp<ViewStyle>; reduceMotion: boolean; accessibilityLabel: string }>) {
  const [scale] = useState(() => new Animated.Value(1));
  const [hovering, setHovering] = useState(false);
  const animate = (toValue: number) => {
    if (reduceMotion) { scale.setValue(1); return; }
    Animated.spring(scale, { toValue, stiffness: 460, damping: 28, useNativeDriver: Platform.OS !== 'web' }).start();
  };
  return <Animated.View style={{ transform: [{ scale }] }}><Pressable onPress={onPress} onPressIn={() => animate(0.94)} onPressOut={() => animate(hovering ? 1.05 : 1)} onHoverIn={() => { setHovering(true); animate(1.05); }} onHoverOut={() => { setHovering(false); animate(1); }} style={style} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>{children}</Pressable></Animated.View>;
}

function UnreadBadge({ unreadCount, reduceMotion }: { unreadCount: number; reduceMotion: boolean }) {
  const [scale] = useState(() => new Animated.Value(0.4));
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduceMotion) { scale.setValue(unreadCount ? 1 : 0.4); opacity.setValue(unreadCount ? 1 : 0); return; }
    if (!unreadCount) {
      const animation = Animated.parallel([
        Animated.spring(scale, { toValue: 0.4, stiffness: 460, damping: 22, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacity, { toValue: 0, duration: 130, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: Platform.OS !== 'web' }),
      ]);
      animation.start();
      return () => animation.stop();
    }
    scale.setValue(0.4); opacity.setValue(0);
    const animation = Animated.parallel([
      Animated.spring(scale, { toValue: 1, stiffness: 460, damping: 22, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(opacity, { toValue: 1, duration: 160, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: Platform.OS !== 'web' }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity, reduceMotion, scale, unreadCount]);
  return <Animated.View style={[styles.headerBadge, { opacity, transform: [{ scale }] }]}>{unreadCount > 0 ? <Text style={styles.headerBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text> : null}</Animated.View>;
}

type BottomNavItem = { label: string; route?: string; icon: keyof typeof Ionicons.glyphMap; action?: boolean };

function FixedBottomBar({ state, navigateToTab, items, desktop, palette, bottomInset, reduceMotion }: MaterialTopTabBarProps & { items: BottomNavItem[]; desktop: boolean; palette: ReturnType<typeof getThemeColors>; bottomInset: number; reduceMotion: boolean }) {
  if (desktop) return null;
  const activeRoute = state.routes[state.index]?.name;
  return (
    <View style={[styles.fixedBottomBar, { paddingBottom: Math.max(6, bottomInset), backgroundColor: palette.surface, borderTopColor: palette.line }]}>
      {items.map((item) => {
        const active = !item.action && item.route === activeRoute;
        const color = item.action ? palette.primary : active ? palette.primary : palette.muted;
        const targetRoute = item.route ? state.routes.find((route) => route.name === item.route) : undefined;
        return <AnimatedBottomItem key={item.label} label={item.label} icon={item.icon} color={color} active={active} isAction={Boolean(item.action)} reduceMotion={reduceMotion} onPress={() => item.action ? router.push('/new-ticket') : targetRoute && navigateToTab(targetRoute.key)} />;
      })}
    </View>
  );
}

function AnimatedBottomItem({ label, icon, color, active, isAction, reduceMotion, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; active: boolean; isAction: boolean; reduceMotion: boolean; onPress: () => void }) {
  const [scale] = useState(() => new Animated.Value(1));
  const animate = (toValue: number) => {
    if (reduceMotion) { scale.setValue(1); return; }
    Animated.spring(scale, { toValue, stiffness: 460, damping: 25, useNativeDriver: Platform.OS !== 'web' }).start();
  };
  return <Animated.View style={{ flex: 1, transform: [{ scale }] }}><Pressable onPress={onPress} onPressIn={() => animate(0.92)} onPressOut={() => animate(1)} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={isAction ? 'Crear ticket' : label} style={({ pressed }) => [styles.fixedTab, isAction && styles.fixedNewTab, pressed && styles.navPressed]}>
    <Ionicons name={icon} size={isAction ? 22 : 19} color={color} />
    <Text style={[styles.fixedTabText, { color }]}>{label}</Text>
  </Pressable></Animated.View>;
}

const styles = StyleSheet.create({
  mobileShell: { flex: 1, backgroundColor: colors.canvas },
  mobileHeader: { minHeight: 64, paddingHorizontal: 14, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  mobileLogo: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  mobileBrandName: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  mobileRole: { color: '#8CDFFF', fontSize: 11, flexShrink: 1 },
  mobileActions: { flexDirection: 'row', alignItems: 'center', gap: 9 }, mobileActionsCompact: { gap: 4 },
  mobileAction: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', position: 'relative' }, mobileActionPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  quickNav: { maxHeight: 50, borderBottomWidth: 1 }, quickNavContent: { paddingHorizontal: 12, paddingVertical: 5, gap: 8, alignItems: 'center' }, quickChip: { minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 }, quickChipText: { fontSize: 11, fontWeight: '700' }, quickNew: { backgroundColor: colors.amber, borderColor: colors.amber }, quickNewText: { color: '#000000', fontSize: 11, fontWeight: '900' },
  mobileTabs: { flex: 1, minHeight: 0 }, fixedBottomBar: { minHeight: 60, paddingTop: 5, borderTopWidth: 1, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-around', elevation: 10, zIndex: 10 }, fixedTab: { flex: 1, minWidth: 0, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 }, fixedNewTab: { transform: [{ translateY: -1 }] }, fixedTabText: { fontSize: 9, fontWeight: '700' },
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
