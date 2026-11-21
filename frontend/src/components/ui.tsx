import type { ComponentRef, PropsWithChildren, ReactNode } from 'react';
import { forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { CircleProps } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from './Icons';
import { colors, getThemeColors, radius, space } from '../theme';
import { useSession } from '../context/SessionContext';
import type { TicketItem } from '../types';
import { CATEGORY_ICON_OPTIONS, categoryIconFor } from '../lib/statusUtils';
import { useReducedMotion } from '../lib/motion';
import { AppTextInput as TextInput, Text } from './Typography';

const AnimatedCircleBase = forwardRef<ComponentRef<typeof Circle>, CircleProps & { collapsable?: boolean }>(function AnimatedCircleBase({ collapsable, ...props }, ref) {
  return <Circle {...props} {...(Platform.OS === 'web' ? {} : { collapsable })} ref={ref} />;
});
const AnimatedCircle = Animated.createAnimatedComponent(AnimatedCircleBase);

export function Screen({ children, scroll = false, contentStyle, transparent = false, animate = true, safeTop = true }: PropsWithChildren<{ scroll?: boolean; contentStyle?: object; transparent?: boolean; animate?: boolean; safeTop?: boolean }>) {
  const { darkMode } = useSession();
  const themePalette = getThemeColors(darkMode);
  const reduceMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!animate) return;
    if (reduceMotion) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = transparent
      ? Animated.spring(progress, { toValue: 1, damping: 25, stiffness: 320, mass: 0.8, useNativeDriver: Platform.OS !== 'web' })
      : Animated.timing(progress, { toValue: 1, duration: 200, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [animate, progress, reduceMotion, transparent]);
  const entranceStyle = transparent
    ? { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }
    : { opacity: progress, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] };
  return (
    <SafeAreaView edges={safeTop ? ['top', 'left', 'right'] : ['left', 'right']} style={[styles.screen, { backgroundColor: themePalette.canvas }, transparent && styles.transparentScreen]}>
      <Animated.View style={[styles.screenContent, animate && entranceStyle]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.scrollContent, contentStyle]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : children}
      </Animated.View>
    </SafeAreaView>
  );
}

export function AnimatedEntry({ children, delay = 0, duration = 200, distance = 10, style }: PropsWithChildren<{ delay?: number; duration?: number; distance?: number; style?: object }>) {
  const reduceMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduceMotion) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration, delay, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress, reduceMotion]);
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }]}>{children}</Animated.View>;
}

export function AnimatedProgressBar({ value, color, trackColor = '#FFFFFF', height = 5, delay = 80, duration = 450, style }: { value: number; color: string; trackColor?: string; height?: number; delay?: number; duration?: number; style?: object }) {
  const reduceMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduceMotion) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration, delay, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress, reduceMotion]);

  const targetWidth = `${Math.max(0, Math.min(100, value))}%`;
  return <View style={[styles.progressTrack, { height, backgroundColor: trackColor }, style]}><Animated.View style={[styles.progressFill, { width: targetWidth, backgroundColor: color, transformOrigin: 'left', transform: [{ scaleX: progress }] }]} /></View>;
}

export function AnimatedProgressRing({ value, size = 76, strokeWidth = 8, color = '#34D399', trackColor = 'rgba(255,255,255,0.16)' }: { value: number; size?: number; strokeWidth?: number; color?: string; trackColor?: string }) {
  const reduceMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  const center = size / 2;

  useEffect(() => {
    if (reduceMotion) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: 650, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [progress, reduceMotion]);

  const dashOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [circumference, circumference * (1 - Math.max(0, Math.min(100, value)) / 100)] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={center} cy={center} r={radiusValue} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <AnimatedCircle cx={center} cy={center} r={radiusValue} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={dashOffset} />
      </Svg>
    </View>
  );
}

export function Brand({ inverse = false }: { inverse?: boolean }) {
  const { darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}><Ionicons name="ticket" size={19} color="#FFFFFF" /></View>
      <Text style={[styles.brandName, { color: inverse ? '#FFFFFF' : palette.ink }, inverse && styles.brandNameInverse]}>GETICKETS</Text>
    </View>
  );
}

export function PageHeading({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { width } = useWindowDimensions();
  const compact = width < 640;
  return (
    <View style={[styles.pageHeading, compact && styles.pageHeadingCompact]}>
      <View style={[styles.pageHeadingText, compact && styles.pageHeadingTextCompact]}>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={[styles.pageHeadingRight, compact && styles.pageHeadingRightCompact]}>{right}</View> : null}
    </View>
  );
}

export function Surface({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { darkMode } = useSession();
  const themePalette = getThemeColors(darkMode);
  const customStyle = StyleSheet.flatten(style) ?? {};
  const sourceBackground = typeof customStyle.backgroundColor === 'string' ? customStyle.backgroundColor.toUpperCase() : customStyle.backgroundColor;
  const sourceBorder = typeof customStyle.borderColor === 'string' ? customStyle.borderColor.toUpperCase() : customStyle.borderColor;
  const darkSurfaceTints: Record<string, string> = {
    '#FFFFFF': themePalette.surface, '#FAFAFA': themePalette.surface, '#F9FAFB': themePalette.surface, '#F8FAFC': themePalette.surface,
    '#FAFBFD': themePalette.surface, '#F4F6FB': themePalette.surface, '#F1F5F9': themePalette.surfaceSoft, '#EEF2F7': themePalette.surfaceSoft,
    '#E9EDF3': themePalette.surfaceSoft, '#E0F2FE': themePalette.skySoft, '#EFF9FF': themePalette.skySoft, '#F1FAFF': themePalette.skySoft,
    '#F4FBFF': themePalette.skySoft, '#F2FAFF': themePalette.skySoft, '#FFFBEB': themePalette.amberSoft,
    '#FFF7E6': themePalette.amberSoft, '#ECFDF5': themePalette.greenSoft, '#E8FAF3': themePalette.greenSoft, '#EEF0FF': themePalette.indigoSoft,
    '#FFF0F2': themePalette.redSoft,
  };
  const darkLineColors = ['#E5E5E5', '#E0E0E0', '#E2E2E2', '#E4E4E4', '#E5E7EB', '#DDE3EC'];
  const backgroundColor = darkMode && typeof sourceBackground === 'string' ? darkSurfaceTints[sourceBackground] ?? sourceBackground : sourceBackground;
  const borderColor = darkMode && typeof sourceBorder === 'string' && darkLineColors.includes(sourceBorder) ? themePalette.line : sourceBorder;
  return <View style={[styles.surface, { backgroundColor: themePalette.surface, borderColor: themePalette.line }, customStyle, { borderWidth: 2, ...(backgroundColor ? { backgroundColor } : {}), ...(borderColor ? { borderColor } : {}) }]}>{children}</View>;
}

type ButtonProps = PropsWithChildren<{
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
}>;

export function Button({ children, onPress, variant = 'primary', loading = false, disabled = false, icon, compact = false }: ButtonProps) {
  const { darkMode } = useSession();
  const themePalette = getThemeColors(darkMode);
  const reduceMotion = useReducedMotion();
  const palette = {
    primary: { backgroundColor: themePalette.primary, color: themePalette.onPrimary, borderColor: themePalette.primary },
    secondary: { backgroundColor: themePalette.surface, color: themePalette.ink, borderColor: themePalette.line },
    ghost: { backgroundColor: 'transparent', color: themePalette.primaryDark, borderColor: 'transparent' },
    danger: { backgroundColor: themePalette.red, color: '#FFFFFF', borderColor: themePalette.red },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && (reduceMotion ? styles.pressed : styles.buttonPressed),
      ]}
    >
      {loading ? <ActivityIndicator color={palette.color} size="small" /> : icon ? <Ionicons name={icon} size={18} color={palette.color} /> : null}
      <Text style={[styles.buttonText, { color: palette.color }, compact && styles.buttonTextCompact]}>{children}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  error,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  multiline?: boolean;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  const { darkMode } = useSession();
  const themePalette = getThemeColors(darkMode);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themePalette.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoCorrect={!secureTextEntry && keyboardType !== 'email-address'}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, { backgroundColor: themePalette.surface, borderColor: themePalette.line, color: themePalette.ink }, multiline && styles.inputMultiline, error && styles.inputError]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function Notice({ message, tone = 'error' }: { message: string; tone?: 'error' | 'info' | 'success' }) {
  const { darkMode } = useSession();
  const themePalette = getThemeColors(darkMode);
  const toneStyle = tone === 'error' ? styles.noticeError : tone === 'success' ? styles.noticeSuccess : styles.noticeInfo;
  const icon = tone === 'error' ? 'alert-circle-outline' : tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline';
  const toneColors = tone === 'error'
    ? { backgroundColor: themePalette.redSoft, borderColor: themePalette.red, icon: themePalette.red }
    : tone === 'success'
      ? { backgroundColor: themePalette.greenSoft, borderColor: themePalette.green, icon: themePalette.green }
      : { backgroundColor: themePalette.skySoft, borderColor: themePalette.primary, icon: themePalette.primary };
  return (
    <View style={[styles.notice, toneStyle, { backgroundColor: toneColors.backgroundColor, borderColor: toneColors.borderColor }]} accessibilityRole={tone === 'error' ? 'alert' : undefined}>
      <Ionicons name={icon} size={18} color={toneColors.icon} />
      <Text style={[styles.noticeText, { color: themePalette.ink }]}>{message}</Text>
    </View>
  );
}

export function LoadingState({ label = 'Cargando información…' }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>{label}</Text></View>;
}

export function EmptyState({ title, description, icon = 'file-tray-outline', action }: { title: string; description: string; icon?: keyof typeof Ionicons.glyphMap; action?: ReactNode }) {
  const { darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: palette.skySoft }]}><Ionicons name={icon} size={25} color={palette.primaryDark} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {action}
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  const { darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const normalized = status.toLocaleLowerCase();
  const isDone = normalized.includes('complet') || normalized.includes('resuelt');
  const isProgress = normalized.includes('proceso') || normalized.includes('asign');
  const tone = isDone ? styles.statusDone : isProgress ? styles.statusProgress : styles.statusOpen;
  const toneColor = isDone ? palette.greenSoft : isProgress ? palette.skySoft : palette.amberSoft;
  return <View style={[styles.statusPill, tone, { backgroundColor: toneColor }]}><Text style={[styles.statusText, { color: palette.ink }]}>{status || 'Sin estado'}</Text></View>;
}

export function TicketCard({ ticket, onPress }: { ticket: TicketItem; onPress: () => void }) {
  const { darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const categoryIcon = categoryIconFor(ticket.categoria);
  const categoryOption = CATEGORY_ICON_OPTIONS.find((option) => option.key === categoryIcon);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.ticketCard, { backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 2 }, pressed && styles.pressed]}>
      <View style={styles.ticketTopline}>
        <Text style={styles.ticketCode}>{ticket.tickets || `Ticket #${ticket.idTicket}`}</Text>
        <StatusPill status={ticket.estadoTicket} />
      </View>
      <Text style={styles.ticketDescription} numberOfLines={2}>{ticket.descripcion || 'Sin descripción'}</Text>
      <View style={styles.ticketMeta}>
        <View style={styles.metaItem}><Ionicons name={categoryIcon} size={14} color={categoryOption?.color ?? palette.muted} /><Text style={styles.metaText} numberOfLines={1}>{ticket.categoria || 'Sin categoría'}</Text></View>
        <PriorityIndicator priority={ticket.prioridad || 'Media'} />
      </View>
      <View style={styles.ticketFooter}>
        <Text style={styles.ticketDate}>{formatDate(ticket.fechaCreacion)}</Text>
        <View style={styles.ticketOpen}><Text style={styles.ticketOpenText}>Ver detalle</Text><Ionicons name="chevron-forward" size={15} color={colors.primaryDark} /></View>
      </View>
    </Pressable>
  );
}

export function PriorityIndicator({ priority }: { priority: string }) {
  const { darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const normalized = priority.toLocaleLowerCase();
  const level = normalized.includes('alta') || normalized.includes('crít') ? 3 : normalized.includes('media') ? 2 : 1;
  const tone = level === 3 ? colors.red : level === 2 ? colors.amber : colors.teal;
  const heights = [6, 9, 12];
  return <View style={styles.priorityIndicator} accessibilityLabel={`Prioridad ${priority}`}>
    <View style={styles.priorityBars}>{heights.map((height, index) => <View key={height} style={{ width: 3, height, borderRadius: 2, backgroundColor: index < level ? tone : palette.line }} />)}</View>
    <Text style={[styles.priorityText, { color: darkMode && level === 1 ? '#5EEAD4' : tone }]}>{priority}</Text>
  </View>;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'Fecha pendiente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export const uiStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gap: { gap: space.sm },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
});

const styles = StyleSheet.create({
  progressTrack: { height: 5, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  screen: { flex: 1, backgroundColor: colors.canvas },
  transparentScreen: { backgroundColor: 'transparent' },
  screenContent: { flex: 1 },
  scrollContent: { padding: space.md, paddingBottom: 34, gap: space.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.amber },
  brandName: { color: colors.ink, fontSize: 16, fontWeight: '900', letterSpacing: 0.7 },
  brandNameInverse: { color: '#FFFFFF' },
  pageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, minWidth: 0 },
  pageHeadingCompact: { flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', gap: 12 },
  pageHeadingText: { flex: 1, gap: 3 },
  pageHeadingTextCompact: { width: '100%', flex: 0 },
  pageHeadingRight: { flexShrink: 0, alignItems: 'flex-end' },
  pageHeadingRightCompact: { width: '100%', flexShrink: 1, alignItems: 'flex-end' },
  pageTitle: { color: colors.ink, fontSize: 25, lineHeight: 31, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  surface: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.line, borderRadius: radius.md, padding: space.md },
  button: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonCompact: { minHeight: 42, borderRadius: 12, paddingHorizontal: 13 },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  buttonText: { fontSize: 15, fontWeight: '800' },
  buttonTextCompact: { fontSize: 13 },
  pressed: { opacity: 0.84 },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.surfaceSoft, paddingHorizontal: 14, color: colors.ink, fontSize: 15 },
  inputMultiline: { minHeight: 128, paddingTop: 13 },
  inputError: { borderColor: colors.red },
  fieldError: { color: colors.red, fontSize: 12 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 12, borderRadius: 12, borderWidth: 1 },
  noticeError: { backgroundColor: colors.redSoft, borderColor: '#F4C7C2' },
  noticeSuccess: { backgroundColor: colors.greenSoft, borderColor: '#C6E9D4' },
  noticeInfo: { backgroundColor: colors.skySoft, borderColor: '#C7E4F5' },
  noticeText: { color: colors.ink, flex: 1, fontSize: 13, lineHeight: 19 },
  loading: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: 11 },
  loadingText: { color: colors.muted, fontSize: 13 },
  emptyState: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 30, gap: 10 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.skySoft },
  emptyTitle: { color: colors.ink, fontWeight: '800', fontSize: 16, textAlign: 'center' },
  emptyDescription: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 280 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill },
  statusDone: { backgroundColor: colors.greenSoft },
  statusProgress: { backgroundColor: colors.skySoft },
  statusOpen: { backgroundColor: colors.amberSoft },
  statusText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  ticketCard: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, padding: 15, gap: 12 },
  ticketTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 9 },
  ticketCode: { flex: 1, color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  ticketDescription: { color: colors.ink, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '60%' },
  priorityIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5 }, priorityBars: { height: 13, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }, priorityText: { fontSize: 12, fontWeight: '700' },
  metaText: { color: colors.muted, fontSize: 12 },
  ticketFooter: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketDate: { color: colors.muted, fontSize: 12 },
  ticketOpen: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  ticketOpenText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
});
