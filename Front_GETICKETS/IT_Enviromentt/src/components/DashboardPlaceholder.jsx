import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function DashboardPlaceholder({ titulo, descripcion }) {
  const { nombre, apellido } = useLocalSearchParams();
  const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>SISTEMA DE TICKETS TI</Text>
        <Text style={styles.title}>{titulo}</Text>
        {nombreCompleto ? <Text style={styles.greeting}>Hola, {nombreCompleto}</Text> : null}
        <Text style={styles.description}>{descripcion}</Text>
        <View style={styles.note}>
          <Text style={styles.noteText}>La navegación por rol está lista. Aquí construiremos este dashboard paso a paso.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6f9' },
  container: { flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center', padding: 24, justifyContent: 'center' },
  eyebrow: { color: '#355df4', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#18233b', fontSize: 28, fontWeight: '800', marginTop: 10 },
  greeting: { color: '#526078', fontSize: 17, marginTop: 12 },
  description: { color: '#78859a', fontSize: 14, marginTop: 8, lineHeight: 21 },
  note: { marginTop: 24, padding: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7edf4' },
  noteText: { color: '#526078', fontSize: 13, lineHeight: 20 },
});
