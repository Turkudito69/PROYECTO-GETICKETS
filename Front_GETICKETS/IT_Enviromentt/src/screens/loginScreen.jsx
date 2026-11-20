import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';

const API_LOGIN = 'http://192.168.1.37:12190/api/Login';

const rutasPorRol = {
  administrador: '/Dashboard/administrador',
  admin: '/Dashboard/administrador',
  administradordesistema: '/Dashboard/administrador',
  tecnico: '/Tecnico/tecnico',
  tecnicoti: '/Tecnico/tecnico',
  tecnicodesoporte: '/Tecnico/tecnico',
  usuario: '/Usuario/usuario',
  usuariofinal: '/Usuario/usuario',
  user: '/Usuario/usuario',
};

function normalizarRol(rol) {
  return String(rol || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_-]/g, '');
}

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const [hidratado, setHidratado] = useState(false);
  const escritorio = hidratado && width >= 900;
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => { setHidratado(true); }, []);

  const iniciarSesion = async () => {
    if (!correo.trim() || !contrasena) {
      Alert.alert('Atención', 'Ingresá tu correo y contraseña.');
      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(API_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Correo: correo.trim(), Contrasena: contrasena }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert('No pudimos iniciar sesión', datos.mensaje || datos.msj || 'Revisá el correo y la contraseña.');
        return;
      }

      const usuario = datos.usuario;
      const rol = normalizarRol(usuario?.rol);
      const ruta = rutasPorRol[rol];

      if (!ruta) {
        Alert.alert('Rol no reconocido', `La cuenta tiene un rol que aún no tiene dashboard: ${usuario?.rol || 'sin rol'}.`);
        return;
      }

      router.replace({
        pathname: ruta,
        params: {
          idUsuario: String(usuario.idUsuario ?? usuario.IdUsuario ?? ''),
          nombre: usuario.nombre || '',
          apellido: usuario.apellido || '',
        },
      });
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor. Intentá de nuevo.');
      console.log(error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoiding}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.page, !escritorio && styles.pageMobile, escritorio && styles.pageDesktop]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}>
      {escritorio ? <WelcomePanel /> : (
        <View style={styles.mobileBrand}>
          <Image
            accessible={false}
            source={require('../../assets/images/it-environment-login.png')}
            resizeMode="contain"
            style={styles.mobileLogoImage}
          />
        </View>
      )}

      <View style={[styles.formPanel, escritorio && styles.formPanelDesktop]}>
        {escritorio ? null : <Text style={styles.mobileEyebrow}>MESA DE AYUDA TI</Text>}
        <View style={[styles.loginCard, escritorio && styles.loginCardDesktop]}>
          <View style={styles.cardHeading}>
            <Text style={styles.eyebrow}>ACCESO SEGURO</Text>
            <Text style={styles.title}>Iniciar sesión</Text>
            <Text style={styles.subtitle}>Ingresá con tu cuenta para continuar al centro de soporte.</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="nombre@empresa.com"
              placeholderTextColor="#a2acbc"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="next"
              editable={!cargando}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresá tu contraseña"
              placeholderTextColor="#a2acbc"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={iniciarSesion}
              editable={!cargando}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={iniciarSesion}
            disabled={cargando}
            style={({ pressed }) => [styles.button, pressed && !cargando && styles.buttonPressed, cargando && styles.buttonDisabled]}>
            {cargando ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Entrar al sistema <Text style={styles.buttonArrow}>→</Text></Text>}
          </Pressable>

          <View style={styles.secureNote}>
            <Text style={styles.secureIcon}>✓</Text>
            <Text style={styles.secureText}>Tus credenciales se validan de forma segura con el servidor.</Text>
          </View>
        </View>

        <Text style={styles.footer}>TI ENVIRONMENT  ·  SOPORTE EN UN SOLO LUGAR</Text>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function WelcomePanel() {
  return (
    <View style={styles.welcomePanel}>
      <View style={styles.welcomeLogoWrap}>
        <Image
          accessible={false}
          source={require('../../assets/images/it-environment-login.png')}
          resizeMode="contain"
          style={styles.welcomeLogoImage}
        />
      </View>
      <View style={styles.welcomeCopy}>
        <Text style={styles.welcomeEyebrow}>GESTIÓN DE SERVICIOS DE TI</Text>
        <Text style={styles.welcomeTitle}>Tu soporte técnico, en un solo lugar.</Text>
        <Text style={styles.welcomeDescription}>Registrá incidencias, consultá el avance de tus solicitudes y encontrá cada solución con claridad.</Text>
      </View>
      <View style={styles.welcomeFoot}>
        <View style={styles.welcomeFootLine} />
        <Text style={styles.welcomeFootText}>PLATAFORMA DE SOPORTE Y GESTIÓN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: { flex: 1, backgroundColor: '#f3f6fb' },
  scroll: { flex: 1, backgroundColor: '#f3f6fb' },
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 30, backgroundColor: '#f3f6fb' },
  pageMobile: { justifyContent: 'flex-start', paddingTop: 22, paddingBottom: 30 },
  pageDesktop: { flexDirection: 'row', alignItems: 'stretch', gap: 28, padding: 28 },
  mobileBrand: { width: '100%', maxWidth: 390, alignItems: 'center', marginBottom: 18 },
  mobileLogoImage: { width: '100%', aspectRatio: 534 / 400 },
  mobileEyebrow: { color: '#59708d', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  formPanel: { width: '100%', maxWidth: 470, alignItems: 'center' },
  formPanelDesktop: { flex: 1, maxWidth: 650, justifyContent: 'center', paddingHorizontal: 24 },
  loginCard: { width: '100%', backgroundColor: '#ffffff', borderRadius: 22, padding: 24, borderWidth: 1, borderColor: '#e5ebf3', shadowColor: '#243a60', shadowOpacity: 0.08, shadowRadius: 26, shadowOffset: { width: 0, height: 14 }, elevation: 4 },
  loginCardDesktop: { maxWidth: 440, padding: 34, borderRadius: 24, shadowOpacity: 0.055 },
  cardHeading: { marginBottom: 25 },
  eyebrow: { color: '#355df4', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#18233b', fontSize: 27, fontWeight: '800', letterSpacing: -0.6, marginTop: 8 },
  subtitle: { color: '#78859a', fontSize: 13, lineHeight: 20, marginTop: 8 },
  field: { marginBottom: 17 },
  label: { color: '#3c4c65', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { width: '100%', minHeight: 49, paddingHorizontal: 14, borderWidth: 1, borderColor: '#dfe6ef', borderRadius: 11, backgroundColor: '#fbfcfe', color: '#18233b', fontSize: 14, outlineStyle: 'none' },
  button: { minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#193f83', borderRadius: 11, paddingHorizontal: 16, marginTop: 3, shadowColor: '#193f83', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  buttonPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  buttonArrow: { fontSize: 17 },
  secureNote: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 20, paddingTop: 17, borderTopWidth: 1, borderTopColor: '#edf1f6' },
  secureIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#e8f7f1', color: '#19966b', textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', fontSize: 11, fontWeight: '800' },
  secureText: { flex: 1, color: '#8490a3', fontSize: 10, lineHeight: 15 },
  footer: { color: '#a2acbc', fontSize: 8, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginTop: 20 },
  welcomePanel: { flex: 1, minWidth: 350, minHeight: 670, overflow: 'hidden', justifyContent: 'space-between', padding: 24, borderRadius: 25, borderWidth: 1, borderColor: '#dce6f4', backgroundColor: '#eef4fc' },
  welcomeLogoWrap: { width: '100%', maxWidth: 500, aspectRatio: 534 / 400, alignSelf: 'center' },
  welcomeLogoImage: { width: '100%', height: '100%' },
  welcomeCopy: { zIndex: 1, maxWidth: 520, alignSelf: 'center', alignItems: 'center', marginVertical: 13 },
  welcomeEyebrow: { color: '#355df4', fontSize: 10, fontWeight: '800', letterSpacing: 1.6, textAlign: 'center' },
  welcomeTitle: { color: '#18233b', fontSize: 35, fontWeight: '800', lineHeight: 43, letterSpacing: -1, marginTop: 14, textAlign: 'center' },
  welcomeDescription: { maxWidth: 460, color: '#62728d', fontSize: 14, lineHeight: 23, marginTop: 10, textAlign: 'center' },
  welcomeFoot: { zIndex: 1, alignItems: 'center' },
  welcomeFootLine: { width: 38, height: 3, borderRadius: 2, backgroundColor: '#65a8e7', marginBottom: 13 },
  welcomeFootText: { color: '#7889a2', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },
});
