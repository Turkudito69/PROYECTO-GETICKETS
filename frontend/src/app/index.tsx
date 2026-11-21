import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Text } from '../components/Typography';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '../components/Icons';
import { useSession } from '../context/SessionContext';
import { useReducedMotion } from '../lib/motion';

const splashDuration = 1750;

export default function EntryRoute() {
  const { user, isReady } = useSession();
  const reduceMotion = useReducedMotion();
  const destination = user ? '/(tabs)' : '/login';
  const logoProgress = useSharedValue(0);
  const copyProgress = useSharedValue(0);
  const glowProgress = useSharedValue(0);
  const barProgress = useSharedValue(0);

  useEffect(() => {
    if (!isReady) return;
    const timeout = setTimeout(() => router.replace(destination), splashDuration);
    return () => clearTimeout(timeout);
  }, [destination, isReady]);

  useEffect(() => {
    if (reduceMotion) {
      logoProgress.value = 1; copyProgress.value = 1; glowProgress.value = 1; barProgress.value = 1;
      return;
    }
    logoProgress.value = 0; copyProgress.value = 0; glowProgress.value = 0; barProgress.value = 0;
    logoProgress.value = withDelay(120, withSpring(1, { stiffness: 300, damping: 20 }));
    copyProgress.value = withDelay(300, withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }));
    glowProgress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    barProgress.value = withDelay(420, withTiming(1, { duration: 1250, easing: Easing.out(Easing.cubic) }));
    return () => {
      cancelAnimation(logoProgress); cancelAnimation(copyProgress); cancelAnimation(glowProgress); cancelAnimation(barProgress);
    };
  }, [barProgress, copyProgress, glowProgress, logoProgress, reduceMotion]);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logoProgress.value, transform: [{ scale: .55 + logoProgress.value * .45 }, { rotate: `${-14 + logoProgress.value * 14}deg` }] }));
  const copyStyle = useAnimatedStyle(() => ({ opacity: copyProgress.value, transform: [{ translateY: 14 * (1 - copyProgress.value) }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowProgress.value * .34, transform: [{ scale: .65 + glowProgress.value * .5 }] }));
  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: .04 + barProgress.value * .96 }] }));

  const skip = () => { if (isReady) router.replace(destination); };

  return (
    <Pressable onPress={skip} accessibilityRole="button" accessibilityLabel="Iniciando GETICKETS. Toca para continuar." style={styles.screen}>
      <StatusBar style="light" />
      <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]} />
      <View style={styles.content}>
        <Animated.View style={[styles.emblemOuter, logoStyle]}>
          <View style={styles.emblem}><Ionicons name="ticket" size={40} color="#070C17" /></View>
        </Animated.View>
        <Animated.View style={[styles.copy, copyStyle]}>
          <Text style={styles.welcome}>BIENVENIDO A</Text>
          <Text style={styles.brand}>GETICKETS</Text>
          <Text style={styles.subtitle}>Mesa de ayuda técnica inteligente</Text>
        </Animated.View>
        <View style={styles.track}>
          <Animated.View style={[styles.progress, barStyle]}>
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
