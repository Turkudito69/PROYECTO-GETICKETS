import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function GlassBackdrop({ isDark = true }) {
  return (
    <View pointerEvents="none" style={[styles.root, !isDark && styles.lightRoot]}>
      <View style={[styles.blueGlow, !isDark && styles.lightBlueGlow]} />
      <View style={[styles.cyanGlow, !isDark && styles.lightCyanGlow]} />
      <View style={[styles.mintGlow, !isDark && styles.lightMintGlow]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 0, overflow: 'hidden', backgroundColor: '#080914' },
  lightRoot: { backgroundColor: '#f4f7fb' },
  blueGlow: { position: 'absolute', width: 620, height: 620, borderRadius: 310, top: -240, left: -180, backgroundColor: 'rgba(43, 78, 255, 0.90)' },
  cyanGlow: { position: 'absolute', width: 560, height: 560, borderRadius: 280, top: -160, left: 20, backgroundColor: 'rgba(0, 180, 255, 0.70)' },
  mintGlow: { position: 'absolute', width: 470, height: 470, borderRadius: 235, bottom: -180, right: '12%', backgroundColor: 'rgba(0, 235, 190, 0.70)' },
  lightBlueGlow: { backgroundColor: 'rgba(91, 137, 255, 0.12)' },
  lightCyanGlow: { backgroundColor: 'rgba(0, 180, 255, 0.10)' },
  lightMintGlow: { backgroundColor: 'rgba(0, 205, 185, 0.09)' },
});

