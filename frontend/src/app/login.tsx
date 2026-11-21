import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Ionicons } from '../components/Icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { Text, AppTextInput as TextInput } from '../components/Typography';
import { useSession } from '../context/SessionContext';
import { colors, getThemeColors, radius } from '../theme';
import { Brand, Button, Notice, Screen } from '../components/ui';

const quickProfiles = [
  { role: 'Usuario', description: 'Reporta problemas y sigue cada paso en vivo', email: 'lesterhernandez@gmail.com', password: 'lester123', icon: 'person-outline' as const, tone: colors.green },
  { role: 'Técnico', description: 'Atiende tickets asignados y documenta soluciones', email: 'maicolsanchez@gmail.com', password: 'maicol123', icon: 'construct-outline' as const, tone: colors.indigo },
  { role: 'Administrador', description: 'Supervisa la bandeja, asigna técnicos y catálogos', email: 'admin@getickets.com', password: 'admin123', icon: 'shield-checkmark-outline' as const, tone: colors.primary },
];

export default function LoginScreen() {
  const { user, isReady, darkMode, toggleDarkMode, signIn } = useSession();
  const { width } = useWindowDimensions();
  const palette = getThemeColors(darkMode);
  const wide = width >= 1000;
  const [correo, setCorreo] = useState('lesterhernandez@gmail.com');
  const [contrasena, setContrasena] = useState('lester123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isReady) return null;
  if (user) return <Redirect href="/(tabs)" />;

  const handleLogin = async (email = correo, password = contrasena) => {
    if (!email.trim() || !password) { setError('Ingresa tu correo y contraseña para continuar.'); return; }
    setError(null); setLoading(true);
    try { await signIn(email, password); router.replace('/(tabs)'); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.'); }
    finally { setLoading(false); }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.content, wide && styles.contentWide]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topbar}><Brand /><View style={styles.topbarActions}><Text style={[styles.topbarCaption, { color: palette.muted }]}>SISTEMA DE GESTIÓN DE SOPORTE</Text><Pressable onPress={toggleDarkMode} accessibilityRole="button" accessibilityLabel={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} style={[styles.modeButton, { backgroundColor: palette.surface, borderColor: palette.line }]}><Ionicons name={darkMode ? 'sunny-outline' : 'moon-outline'} size={15} color={darkMode ? colors.amber : colors.primary} /><Text style={[styles.modeButtonText, { color: palette.ink }]}>{darkMode ? 'Modo claro' : 'Modo oscuro'}</Text></Pressable></View></View>
          <View style={[styles.columns, wide && styles.columnsWide]}>
            <View style={[styles.hero, { backgroundColor: palette.navy }, wide && styles.heroWide]}>
              <Svg pointerEvents="none" width="100%" height="100%" style={styles.dotField}><Defs><Pattern id="login-dot-pattern" width="18" height="18" patternUnits="userSpaceOnUse"><Circle cx="1" cy="1" r="1" fill="#FFFFFF" fillOpacity={0.14} /></Pattern></Defs><Rect width="100%" height="100%" fill="url(#login-dot-pattern)" /></Svg>
              <View style={styles.orbit} /><View style={styles.orbitInner} />
              <View style={styles.kicker}><Ionicons name="ticket" size={14} color={colors.navy} /><Text style={styles.kickerText}>Mesa de Ayuda Visual</Text></View>
              <Text style={styles.heroTitle}>Soporte técnico claro, rápido y pensado para todos.</Text>
              <Text style={styles.heroBody}>Reporta cualquier falla en segundos, sigue cada avance visualmente y consulta soluciones reales en un solo lugar.</Text>
              <View style={[styles.features, wide && styles.featuresWide]}>
                <Feature icon="person-outline" tone={colors.green} title="Para Usuarios" copy="Crea solicitudes guiadas y mira quién atiende tu caso." />
                <Feature icon="construct-outline" tone={colors.indigo} title="Para Técnicos" copy="Bandeja priorizada, notas rápidas y base de soluciones." />
                <Feature icon="shield-checkmark-outline" tone={colors.amber} title="Para Admins" copy="Carga de trabajo en vivo, auditoría y control total." />
              </View>
            </View>

            <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.line }, wide && styles.formCardWide]}>
              <View style={[styles.formHeading, { borderBottomColor: palette.line }]}><Text style={[styles.formTitle, { color: palette.ink }]}>Iniciar sesión</Text><Text style={[styles.formSub, { color: palette.muted }]}>Ingresa tus credenciales o elige un perfil rápido abajo.</Text></View>
              {error ? <Notice message={error} /> : null}
              <View style={styles.field}><Text style={[styles.label, { color: palette.ink }]}>Correo electrónico</Text><TextInput value={correo} onChangeText={setCorreo} placeholder="nombre@empresa.com" placeholderTextColor={palette.muted} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.line, color: palette.ink }]} /></View>
              <View style={styles.field}><Text style={[styles.label, { color: palette.ink }]}>Contraseña</Text><View style={[styles.passwordWrap, { backgroundColor: palette.surface, borderColor: palette.line }]}><TextInput value={contrasena} onChangeText={setContrasena} placeholder="Tu contraseña" placeholderTextColor={palette.muted} autoCapitalize="none" secureTextEntry={!showPassword} textContentType="password" onSubmitEditing={() => void handleLogin()} style={[styles.passwordInput, { color: palette.ink }]} /><Pressable onPress={() => setShowPassword((value) => !value)} accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={styles.eyeButton}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={palette.muted} /></Pressable></View></View>
              <Button onPress={() => void handleLogin()} loading={loading} icon="log-in-outline">Entrar al portal</Button>
              <View style={[styles.quickHeading, { borderTopColor: palette.line }]}><Text style={[styles.quickTitle, { color: palette.ink }]}>Acceso directo en 1 clic:</Text></View>
              <View style={styles.quickList}>{quickProfiles.map((profile) => <Pressable key={profile.role} disabled={loading} onPress={() => { setCorreo(profile.email); setContrasena(profile.password); void handleLogin(profile.email, profile.password); }} style={({ pressed }) => [styles.quickCard, { backgroundColor: darkMode ? palette.surfaceSoft : '#FAFAFA', borderColor: palette.line }, pressed && styles.pressed]}>
                <View style={[styles.quickIcon, { backgroundColor: profile.tone }]}><Ionicons name={profile.icon} size={17} color="#FFFFFF" /></View><View style={styles.quickCopy}><Text style={[styles.quickRole, { color: palette.ink }]}>{profile.role}</Text><Text numberOfLines={1} style={[styles.quickDescription, { color: palette.muted }]}>{profile.description}</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted} />
              </Pressable>)}</View>
            </View>
          </View>
          <Text style={[styles.footer, { color: palette.muted }]}>GETICKETS · Sistema de Gestión de Soporte Técnico</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Feature({ icon, tone, title, copy }: { icon: keyof typeof Ionicons.glyphMap; tone: string; title: string; copy: string }) {
  return <View style={styles.feature}><View style={[styles.featureIcon, { backgroundColor: tone }]}><Ionicons name={icon} size={17} color="#FFFFFF" /></View><View style={styles.featureCopy}><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureBody}>{copy}</Text></View></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 18, paddingBottom: 24, gap: 18, width: '100%', maxWidth: 760, alignSelf: 'center', justifyContent: 'center' },
  contentWide: { maxWidth: 1360, paddingHorizontal: 42, paddingVertical: 22, gap: 30 },
  topbar: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  topbarActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modeButton: { minHeight: 40, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeButtonText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  topbarCaption: { color: colors.muted, fontWeight: '700', fontSize: 11, letterSpacing: .8 },
  columns: { gap: 18 }, columnsWide: { flexDirection: 'row', alignItems: 'stretch', gap: 26 },
  hero: { overflow: 'hidden', position: 'relative', minHeight: 430, padding: 22, justifyContent: 'flex-start', borderRadius: radius.lg, backgroundColor: colors.navy, gap: 15 },
  heroWide: { flex: 1.25, minHeight: 620, padding: 44, justifyContent: 'flex-start' },
  dotField: { ...StyleSheet.absoluteFill, opacity: .6 },
  orbit: { position: 'absolute', width: 230, height: 230, borderWidth: 2, borderColor: '#0878AF55', borderRadius: 115, right: -28, bottom: -52 }, orbitInner: { position: 'absolute', width: 185, height: 185, borderWidth: 2, borderStyle: 'dashed', borderColor: '#0878AF55', borderRadius: 93, right: -5, bottom: -29 },
  kicker: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.amber, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8 }, kickerText: { fontSize: 12, color: '#111827', fontWeight: '900' },
  heroTitle: { maxWidth: 620, color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -.7, marginTop: 4 },
  heroBody: { maxWidth: 560, color: '#E1E8F3', fontSize: 15, lineHeight: 23 },
  features: { gap: 9, marginTop: 'auto', zIndex: 1 }, featuresWide: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  feature: { flex: 1, minHeight: 106, borderRadius: 13, borderWidth: 1, borderColor: '#5B6680', backgroundColor: '#2C3851', padding: 13, justifyContent: 'flex-start', gap: 9 },
  featureIcon: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, featureCopy: { gap: 3 }, featureTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 }, featureBody: { color: '#D5DCE8', fontSize: 11, lineHeight: 15 },
  formCard: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.lg, padding: 20, gap: 14 }, formCardWide: { flex: .9, padding: 28, justifyContent: 'center' },
  formHeading: { gap: 5, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.line, marginBottom: 3 }, formTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', letterSpacing: -.3 }, formSub: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  field: { gap: 6 }, label: { color: colors.ink, fontSize: 12, fontWeight: '700' }, input: { height: 47, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 11, backgroundColor: '#FFFFFF', paddingHorizontal: 13, color: colors.ink, fontSize: 14, outlineStyle: 'none' as never },
  passwordWrap: { minHeight: 47, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 11, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center' }, passwordInput: { flex: 1, minHeight: 45, paddingHorizontal: 13, color: colors.ink, fontSize: 14, outlineStyle: 'none' as never }, eyeButton: { width: 45, alignItems: 'center', justifyContent: 'center' },
  quickHeading: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14, marginTop: 2 }, quickTitle: { color: colors.ink, fontSize: 12, fontWeight: '700' }, quickList: { gap: 8 }, quickCard: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FAFAFA', borderRadius: 12 }, pressed: { opacity: .82, transform: [{ scale: .99 }] }, quickIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, quickCopy: { flex: 1, gap: 2 }, quickRole: { color: colors.ink, fontSize: 12, fontWeight: '900' }, quickDescription: { color: colors.muted, fontSize: 11 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 2 },
});
