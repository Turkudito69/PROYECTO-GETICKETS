import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ProfileThemeModal({ visible, onClose, name, role, userId, isDark, onChangeTheme }) {
  const palette = isDark ? dark : light;
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar perfil" onPress={onClose} style={styles.dismiss} />
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={[styles.avatar, { backgroundColor: palette.accentSoft }]}><Text style={[styles.avatarText, { color: palette.accent }]}>{String(name || 'U').trim().charAt(0).toUpperCase()}</Text></View>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>PERFIL DE LA CUENTA</Text>
          <Text style={[styles.name, { color: palette.text }]}>{name || 'Usuario'}</Text>
          <Text style={[styles.role, { color: palette.muted }]}>{role || 'Cuenta'}</Text>
          {userId ? <Text style={[styles.id, { color: palette.muted }]}>ID de usuario · {userId}</Text> : null}
          <View style={[styles.divider, { backgroundColor: palette.border }]} />
          <Text style={[styles.themeLabel, { color: palette.text }]}>Apariencia</Text>
          <View style={[styles.toggle, { backgroundColor: palette.toggle, borderColor: palette.border }]}>
            {['dark', 'light'].map((mode) => {
              const active = mode === (isDark ? 'dark' : 'light');
              return <Pressable key={mode} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onChangeTheme(mode)} style={[styles.option, active && { backgroundColor: palette.active }]}><Text style={[styles.optionText, { color: active ? palette.activeText : palette.muted }]}>{mode === 'dark' ? '☾  Oscuro' : '☀  Claro'}</Text></Pressable>;
            })}
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={[styles.closeButton, { backgroundColor: palette.close }]}><Text style={[styles.closeText, { color: palette.text }]}>Listo</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const dark = { card: 'rgba(26,30,48,0.98)', border: 'rgba(153,220,255,0.45)', text: '#F3F7FF', muted: '#B4C0D8', accent: '#60D9FF', accentSoft: 'rgba(66,174,255,0.2)', toggle: 'rgba(10,13,27,0.8)', active: '#176BFF', activeText: '#fff', close: 'rgba(66,174,255,0.2)' };
const light = { card: '#fff', border: '#e1e8f2', text: '#18233b', muted: '#78859a', accent: '#355df4', accentSoft: '#ecf0ff', toggle: '#f3f6fb', active: '#355df4', activeText: '#fff', close: '#edf2f8' };
const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(4,7,18,0.62)' },
  dismiss: { ...StyleSheet.absoluteFillObject },
  card: { width: '100%', maxWidth: 360, alignItems: 'center', borderWidth: 1, borderRadius: 22, padding: 24, shadowColor: '#00BFFF', shadowOpacity: 0.22, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  avatar: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 20, marginBottom: 14 },
  avatarText: { fontSize: 24, fontWeight: '900' },
  eyebrow: { fontSize: 9, letterSpacing: 1.4, fontWeight: '900' },
  name: { fontSize: 20, fontWeight: '800', marginTop: 7, textAlign: 'center' },
  role: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  id: { fontSize: 10, marginTop: 7 },
  divider: { width: '100%', height: 1, marginVertical: 20 },
  themeLabel: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '800', marginBottom: 9 },
  toggle: { width: '100%', flexDirection: 'row', padding: 4, borderWidth: 1, borderRadius: 13 },
  option: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 42, borderRadius: 10 },
  optionText: { fontSize: 11, fontWeight: '800' },
  closeButton: { width: '100%', minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 11, marginTop: 16 },
  closeText: { fontSize: 12, fontWeight: '800' },
});
