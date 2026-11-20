import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/Typography';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../context/SessionContext';
import { useReducedMotion } from '../lib/motion';

const splashDuration = 1750;

export default function EntryRoute() {
  const { user } = useSession();
  const reduceMotion = useReducedMotion();
  const destination = user ? '/(tabs)' : '/login';
  const [logoProgress] = useState(() => new Animated.Value(0));
  const [copyProgress] = useState(() => new Animated.Value(0));
  const [glowProgress] = useState(() => new Animated.Value(0));
  const [barProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const timeout = setTimeout(() => router.replace(destination), splashDuration);
    return () => clearTimeout(timeout);
  }, [destination]);

  useEffect(() => {
    if (reduceMotion) {
      logoProgress.setValue(1); copyProgress.setValue(1); glowProgress.setValue(1); barProgress.setValue(1);
      return;
    }
    const useNativeDriver = Platform.OS !== 'web';
    const entrance = Animated.parallel([
      Animated.sequence([
        Animated.delay(120),
        Animated.timing(logoProgress, { toValue: 1, duration: 460, easing: Easing.out(Easing.back(1.15)), useNativeDriver }),
      ]),
      Animated.timing(copyProgress, { toValue: 1, duration: 450, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver }),
      Animated.timing(glowProgress, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver }),
      Animated.timing(barProgress, { toValue: 1, duration: 1250, delay: 420, easing: Easing.out(Easing.cubic), useNativeDriver }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [barProgress, copyProgress, glowProgress, logoProgress, reduceMotion]);

  const logoScale = logoProgress.interpolate({ inputRange: [0, 1], outputRange: [.55, 1] });
  const logoRotate = logoProgress.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '0deg'] });
  const copyY = copyProgress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const glowScale = glowProgress.interpolate({ inputRange: [0, 1], outputRange: [.65, 1.15] });
  const glowOpacity = glowProgress.interpolate({ inputRange: [0, 1], outputRange: [0, .34] });
  const barScale = barProgress.interpolate({ inputRange: [0, 1], outputRange: [.04, 1] });

  const skip = () => router.replace(destination);

  return (
    <Pressable onPress={skip} accessibilityRole="button" accessibilityLabel="Iniciando GETICKETS. Toca para continuar." style={styles.screen}>
      <StatusBar style="light" />
      <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.emblemOuter, { opacity: logoProgress, transform: [{ scale: logoScale }, { rotate: logoRotate }] }]}>
          <View style={styles.emblem}><Ionicons name="ticket" size={40} color="#070C17" /></View>
        </Animated.View>
        <Animated.View style={[styles.copy, { opacity: copyProgress, transform: [{ translateY: copyY }] }]}>
          <Text style={styles.welcome}>BIENVENIDO A</Text>
          <Text style={styles.brand}>GETICKETS</Text>
          <Text style={styles.subtitle}>Mesa de ayuda técnica inteligente</Text>
        </Animated.View>
        <View style={styles.track}>
          <Animated.View style={[styles.progress, { transform: [{ scaleX: barScale }] }]}>
            <View style={[styles.progressSegment, styles.amber]} /><View style={[styles.progressSegment, styles.sky]} /><View style={[styles.progressSegment, styles.green]} />
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: '100%', backgroundColor: '#070C17', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, overflow: 'hidden' },
  glow: { position: 'absolute', width: 288, height: 288, borderRadius: 144, backgroundColor: '#0099D8', shadowColor: '#06B6D4', shadowOpacity: .55, shadowRadius: 70, elevation: 22 },
  content: { alignItems: 'center', justifyContent: 'center', gap: 17, zIndex: 1 },
  emblemOuter: { width: 108, height: 108, borderRadius: 37, borderWidth: 9, borderColor: 'rgba(250, 204, 21, 0.19)', alignItems: 'center', justifyContent: 'center' },
  emblem: { width: 90, height: 90, borderRadius: 27, backgroundColor: '#FFB800', alignItems: 'center', justifyContent: 'center', shadowColor: '#FBBF24', shadowOpacity: .23, shadowRadius: 19, elevation: 8 },
  copy: { alignItems: 'center', gap: 3 }, welcome: { color: '#11C5F2', fontSize: 11, lineHeight: 17, fontWeight: '900', letterSpacing: 3.2 }, brand: { color: '#FFFFFF', fontSize: 38, lineHeight: 43, fontWeight: '900', letterSpacing: -1.3 }, subtitle: { color: '#93A1B8', fontSize: 14, lineHeight: 20, marginTop: 2 },
  track: { width: 180, height: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginTop: 10 }, progress: { width: '100%', height: '100%', flexDirection: 'row', overflow: 'hidden' }, progressSegment: { flex: 1 }, amber: { backgroundColor: '#FBBF24' }, sky: { backgroundColor: '#22D3EE' }, green: { backgroundColor: '#10B981' },
});
