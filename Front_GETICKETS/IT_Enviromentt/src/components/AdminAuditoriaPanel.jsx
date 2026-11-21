import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { obtenerAuditorias } from '../API/api';
import { useAppTheme } from '../context/AppThemeContext';

function leer(item, ...keys) {
  for (const key of keys) {
    const value = item?.[key] ?? item?.[key[0]?.toUpperCase() + key.slice(1)];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
}

function fechaOrden(evento) {
  const time = new Date(leer(evento, 'fechaSeguimiento', 'fechaAccion', 'fecha', 'createdAt')).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function fechaVisible(value) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-NI', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminAuditoriaPanel({ compacto }) {
  const { isDark } = useAppTheme();
  const palette = isDark ? dark : light;
  const styles = useMemo(() => createStyles(palette), [isDark]);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const auditorias = await obtenerAuditorias();
      setEventos(auditorias.sort((a, b) => fechaOrden(b) - fechaOrden(a)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar la auditoría.');
      setEventos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return eventos;
    return eventos.filter((evento) => `${leer(evento, 'accion')} ${leer(evento, 'descripcion')} ${leer(evento, 'responsable')} ${leer(evento, 'ticket')}`.toLowerCase().includes(q));
  }, [eventos, busqueda]);
  const actores = useMemo(() => new Set(eventos.map((evento) => leer(evento, 'responsable')).filter(Boolean)).size, [eventos]);

  return (
    <View style={styles.container}>
      <View style={[styles.stats, compacto && styles.statsCompact]}>
        <View style={[styles.stat, compacto && styles.statCompact]}><Text style={styles.statLabel}>Eventos registrados</Text><Text style={styles.statValue}>{eventos.length}</Text></View>
        <View style={[styles.stat, compacto && styles.statCompact]}><Text style={styles.statLabel}>Personas identificadas</Text><Text style={styles.statValue}>{actores}</Text></View>
        <View style={[styles.stat, compacto && styles.statCompact]}><Text style={styles.statLabel}>Tickets con actividad</Text><Text style={styles.statValue}>{new Set(eventos.map((item) => leer(item, 'ticket')).filter(Boolean)).size}</Text></View>
      </View>

      <View style={styles.card}>
        <View style={[styles.cardHeader, compacto && styles.cardHeaderCompact]}>
          <View style={styles.headerCopy}><Text style={styles.title}>Registro de actividad</Text><Text style={styles.subtitle}>Movimientos registrados en el seguimiento de los tickets.</Text></View>
          <Pressable accessibilityRole="button" onPress={() => void cargar()} disabled={cargando} style={styles.refresh}><Text style={styles.refreshText}>{cargando ? 'Cargando…' : '↻  Actualizar'}</Text></Pressable>
        </View>
        <TextInput value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por acción, persona o ticket" placeholderTextColor={palette.placeholder} style={styles.search} />
        {cargando ? <View style={styles.state}><ActivityIndicator color={palette.accent} /><Text style={styles.stateText}>Cargando actividad…</Text></View>
          : error ? <View style={styles.state}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void cargar()} style={styles.retry}><Text style={styles.retryText}>Reintentar</Text></Pressable></View>
            : visibles.length === 0 ? <View style={styles.state}><Text style={styles.emptyTitle}>{busqueda ? 'No encontramos coincidencias' : 'Todavía no hay actividad registrada'}</Text><Text style={styles.stateText}>{busqueda ? 'Probá con otro término de búsqueda.' : 'Los seguimientos aparecerán aquí cuando se registren acciones en los tickets.'}</Text></View>
              : <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {visibles.map((evento, index) => {
                  const titulo = leer(evento, 'accion') || 'Acción registrada';
                  const descripcion = leer(evento, 'descripcion') || 'Sin descripción adicional.';
                  const responsable = leer(evento, 'responsable') || 'Sistema';
                  const key = leer(evento, 'idAuditoria') || `${leer(evento, 'ticket')}-${fechaOrden(evento)}-${index}`;
                  return <View key={String(key)} style={styles.event}>
                    <View style={styles.markerColumn}><View style={styles.marker} /></View>
                    <View style={styles.eventCopy}>
                      <View style={[styles.eventHead, compacto && styles.eventHeadCompact]}><Text style={styles.eventTitle}>{titulo}</Text><Text style={styles.date}>{fechaVisible(leer(evento, 'fechaAccion'))}</Text></View>
                      <Text style={styles.description}>{descripcion}</Text>
                      <View style={styles.meta}><Text style={styles.actor}>{responsable}</Text><Text style={styles.dot}>·</Text><Text style={styles.ticket}>{leer(evento, 'ticket') || 'Ticket sin referencia'}</Text></View>
                    </View>
                  </View>;
                })}
              </ScrollView>}
        {!cargando && !error ? <Text style={styles.footer}>Mostrando {visibles.length} de {eventos.length} eventos</Text> : null}
      </View>
    </View>
  );
}

const dark = { surface: '#1d2030', item: '#1d2030', input: '#111525', ink: '#F3F7FF', muted: '#B4C0D8', line: 'rgba(158,218,255,0.25)', accent: '#60D9FF', placeholder: '#96A5C0' };
const light = { surface: '#ffffff', item: '#fff', input: '#fbfcfe', ink: '#18233b', muted: '#78859a', line: '#e7edf4', accent: '#355df4', placeholder: '#9aa5b6' };
function createStyles(c) {
  return StyleSheet.create({
    container: { gap: 16 }, stats: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' }, statsCompact: { gap: 8 },
    stat: { flexGrow: 1, flexBasis: 0, minWidth: 145, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
    statCompact: { width: '48%', minWidth: 0, flexGrow: 0, flexBasis: '48%', padding: 12 },
    statLabel: { color: c.muted, fontSize: 10, fontWeight: '700' }, statValue: { color: c.ink, fontSize: 25, fontWeight: '800', marginTop: 7 },
    card: { borderWidth: 1, borderColor: c.line, borderRadius: 15, backgroundColor: c.surface, overflow: 'hidden' },
    cardHeader: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.line },
    cardHeaderCompact: { alignItems: 'flex-start', flexDirection: 'column' }, headerCopy: { flex: 1 }, title: { color: c.ink, fontSize: 14, fontWeight: '800' }, subtitle: { color: c.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
    refresh: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: c.line, borderRadius: 9 }, refreshText: { color: c.accent, fontSize: 10, fontWeight: '800' },
    search: { minHeight: 40, marginHorizontal: 17, marginTop: 14, marginBottom: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: c.line, borderRadius: 9, backgroundColor: c.input, color: c.ink, fontSize: 11 },
    partial: { marginHorizontal: 18, marginTop: 7, color: '#c2831c', fontSize: 10 },
    list: { maxHeight: 580 }, listContent: { paddingHorizontal: 18, paddingBottom: 4 },
    event: { flexDirection: 'row', gap: 12, minHeight: 84, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.line }, markerColumn: { width: 12, alignItems: 'center' }, marker: { width: 9, height: 9, marginTop: 4, borderRadius: 5, backgroundColor: c.accent }, eventCopy: { flex: 1, gap: 5 }, eventHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }, eventHeadCompact: { flexDirection: 'column', gap: 3 }, eventTitle: { flex: 1, color: c.ink, fontSize: 11, fontWeight: '800' }, date: { color: c.muted, fontSize: 9 }, description: { color: c.muted, fontSize: 10, lineHeight: 15 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }, actor: { color: c.ink, fontSize: 9, fontWeight: '700' }, dot: { color: c.muted, fontSize: 11 }, ticket: { color: c.accent, fontSize: 9, fontWeight: '800' },
    state: { minHeight: 180, justifyContent: 'center', alignItems: 'center', padding: 22, gap: 9 }, stateText: { color: c.muted, fontSize: 11, textAlign: 'center', lineHeight: 17 }, emptyTitle: { color: c.ink, fontSize: 13, fontWeight: '800', textAlign: 'center' }, error: { color: '#d44a51', fontSize: 11, textAlign: 'center' }, retry: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: c.accent }, retryText: { color: '#fff', fontSize: 10, fontWeight: '800' }, footer: { paddingHorizontal: 18, paddingBottom: 13, color: c.muted, fontSize: 9 },
  });
}
