import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function BrandLogo({
  size = 40,
  subtitle = 'MESA DE AYUDA TI',
  vertical = false,
  light = false,
  titleSize = 14,
  subtitleSize = 9,
}) {
  return (
    <View style={[styles.container, vertical && styles.vertical]}>
      <View style={[styles.iconViewport, { width: size, height: size, borderRadius: size * 0.28 }]}>
        <Image
          accessible={false}
          source={require('../../assets/images/it-environment-emblem.png')}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
      </View>
      <View style={[styles.copy, vertical && styles.copyVertical]}>
        <Text style={[styles.title, { fontSize: titleSize }, light && styles.titleLight]}>TI Environment</Text>
        {subtitle ? <Text style={[styles.subtitle, { fontSize: subtitleSize }, light && styles.subtitleLight]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vertical: { flexDirection: 'column', justifyContent: 'center', gap: 8 },
  iconViewport: { position: 'relative', overflow: 'hidden', backgroundColor: '#f8fbff', borderWidth: 1, borderColor: '#dce6f4' },
  copy: { gap: 3 },
  copyVertical: { alignItems: 'center' },
  title: { color: '#18233b', fontWeight: '800', letterSpacing: 0.1 },
  titleLight: { color: '#ffffff' },
  subtitle: { color: '#8290a5', fontWeight: '800', letterSpacing: 0.9 },
  subtitleLight: { color: '#c6d5ef' },
});
