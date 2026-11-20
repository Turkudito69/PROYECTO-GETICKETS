import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const colors = {
  ink: '#18233b', muted: '#78859a', line: '#e7edf4', brand: '#355df4',
  background: '#f7f9fc', red: '#d44a51', surface: '#ffffff',
};

export default function DetalleGeneralTicketModal({ visible, ticket, detalle, cargando, error, onClose, onRetry }) {
  const codigo = ticket?.tickets || `TCK-${String(ticket?.idTicket || '').padStart(6, '0')}`;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar detalle general" onPress={onClose} style={styles.backdrop} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>REPORTE DE RESOLUCIÓN</Text>
              <Text style={styles.title}>{codigo}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar detalle general" onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {cargando ? (
              <View style={styles.state}><ActivityIndicator color={colors.brand} /><Text style={styles.body}>Cargando diagnóstico y solución…</Text></View>
            ) : error ? (
              <View style={styles.state}>
                <Text style={styles.errorTitle}>No se pudo cargar el detalle general</Text>
                <Text style={styles.body}>{error}</Text>
                <Pressable onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Reintentar</Text></Pressable>
              </View>
            ) : detalle ? (
              <>
                <View style={styles.ticketDescription}>
                  <Text style={styles.sectionLabel}>DESCRIPCIÓN DEL TICKET</Text>
                  <Text style={styles.body}>{ticket?.descripcion || 'Sin descripción'}</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.sectionLabel}>DIAGNÓSTICO</Text>
                  <Text style={styles.body}>{detalle.diagnostico || 'No se registró un diagnóstico.'}</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.sectionLabel}>SOLUCIÓN APLICADA</Text>
                  <Text style={styles.body}>{detalle.solucion || 'No se registró una solución.'}</Text>
                </View>
              </>
            ) : (
              <View style={styles.state}>
                <Text style={styles.emptyTitle}>No hay detalle general disponible</Text>
                <Text style={styles.body}>Todavía no se encontró un diagnóstico o solución para este ticket.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(15, 27, 48, 0.4)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  card: { width: '100%', maxWidth: 540, maxHeight: '88%', borderRadius: 18, overflow: 'hidden', backgroundColor: colors.surface, shadowColor: '#14213a', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingHorizontal: 21, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.brand, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 6 },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#f3f6fb' },
  closeText: { color: colors.ink, fontSize: 23, lineHeight: 26 },
  content: { padding: 20, gap: 12 },
  ticketDescription: { padding: 14, borderRadius: 11, backgroundColor: colors.background },
  detailBlock: { padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: colors.surface },
  sectionLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.7, marginBottom: 7 },
  body: { color: colors.ink, fontSize: 11, lineHeight: 18 },
  state: { minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  errorTitle: { color: colors.red, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  emptyTitle: { color: colors.ink, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  retryButton: { marginTop: 2, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.brand },
  retryText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
