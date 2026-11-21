import { useCallback, useState } from 'react';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '../components/Icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Typography';
import { useSession } from '../context/SessionContext';
import { api } from '../lib/api';
import { CATEGORY_ICON_OPTIONS, categoryIconFor } from '../lib/statusUtils';
import { colors, getThemeColors, radius } from '../theme';
import type { CategoryItem, PriorityItem } from '../types';
import { Button, Field, Notice, Screen } from '../components/ui';

export default function NewTicketScreen() {
  const { user, darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priorityId, setPriorityId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCatalogs = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [cats, prios] = await Promise.all([api.getCategorias(), api.getPrioridades()]);
      const activeCats = cats.filter((item) => !item.estado || item.estado.toLocaleLowerCase() === 'activo');
      const activePrios = prios.filter((item) => !item.estado || item.estado.toLocaleLowerCase() === 'activo');
      setCategories(activeCats); setPriorities(activePrios);
      setCategoryId((current) => current ?? activeCats[0]?.idCategoria ?? null);
      setPriorityId((current) => current ?? activePrios[0]?.idPrioridad ?? null);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar las categorías y prioridades.'); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void loadCatalogs(); }, [loadCatalogs]));
  if (!user) return <Redirect href="/login" />;

  const submit = async () => {
    if (!description.trim()) { setError('Describe el problema para poder registrar el ticket.'); return; }
    if (!categoryId || !priorityId) { setError('Selecciona una categoría y una prioridad.'); return; }
    setSaving(true); setError(null);
    try {
      const created = await api.createTicket({ descripcion: description.trim(), idUsuario: user.idUsuario, idCategoria: categoryId, idPrioridad: priorityId });
      router.replace({ pathname: '/ticket/[id]', params: { id: String(created.idTicket), created: '1' } });
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo crear el ticket.'); }
    finally { setSaving(false); }
  };

  return (
    <Screen transparent>
      <View style={styles.backdrop}>
        <View style={[styles.modal, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={styles.modalHeader}><View style={styles.headerCopy}><Text style={[styles.modalTitle, { color: palette.ink }]}>Registrar nuevo ticket</Text><Text style={[styles.modalSubtitle, { color: palette.muted }]}>A nombre de {user.nombre} {user.apellido}</Text></View><Pressable onPress={() => router.back()} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Cerrar formulario"><Ionicons name="close" size={19} color={palette.muted} /></Pressable></View>
          <View style={[styles.divider, { backgroundColor: palette.line }]} />
          <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
            {error ? <Notice message={error} /> : null}
            <View style={styles.group}>
              <View><Text style={[styles.label, { color: palette.ink }]}>1. ¿Con qué necesitas ayuda?</Text><Text style={[styles.hint, { color: palette.muted }]}>Selecciona el área relacionada.</Text></View>
              {loading ? <Text style={styles.hint}>Cargando categorías…</Text> : categories.length ? <View style={styles.optionGrid}>{categories.map((item) => { const icon = categoryIconFor(item.nombreCategoria, item.icono); const tone = CATEGORY_ICON_OPTIONS.find((option) => option.key === icon)?.color ?? colors.primary; return <SelectOption key={item.idCategoria} label={item.nombreCategoria} subtitle={item.descripcion || 'Solicitudes y soporte'} selected={categoryId === item.idCategoria} onPress={() => setCategoryId(item.idCategoria)} icon={icon} tone={tone} />; })}</View> : <Text style={styles.hint}>La API no devolvió categorías activas.</Text>}
            </View>
            <View style={styles.group}>
              <View><Text style={[styles.label, { color: palette.ink }]}>2. ¿Qué tan urgente es?</Text><Text style={[styles.hint, { color: palette.muted }]}>Elige la prioridad del caso.</Text></View>
              {loading ? <Text style={styles.hint}>Cargando prioridades…</Text> : priorities.length ? <View style={styles.priorityList}>{priorities.map((item) => <SelectOption key={item.idPrioridad} label={item.nombrePrioridad} selected={priorityId === item.idPrioridad} onPress={() => setPriorityId(item.idPrioridad)} icon="flag-outline" compact />)}</View> : <Text style={styles.hint}>La API no devolvió prioridades activas.</Text>}
            </View>
            <Field label="3. Cuéntanos qué sucede" value={description} onChangeText={setDescription} placeholder="Ej.: La impresora del piso 2 no responde o muestra error en pantalla…" multiline />
          </ScrollView>
          <View style={[styles.divider, { backgroundColor: palette.line }]} />
          <View style={styles.footer}><View style={styles.footerButton}><Button onPress={() => router.back()} variant="secondary" compact>Cancelar</Button></View><View style={styles.footerButton}><Button onPress={submit} loading={saving} disabled={loading || !categories.length || !priorities.length} icon="send-outline" compact>Enviar solicitud</Button></View></View>
        </View>
      </View>
    </Screen>
  );
}

function SelectOption({ label, subtitle, selected, onPress, icon, compact = false, tone = colors.primary }: { label: string; subtitle?: string; selected: boolean; onPress: () => void; icon: keyof typeof Ionicons.glyphMap; compact?: boolean; tone?: string }) {
  const { darkMode } = useSession();
  const palette = getThemeColors(darkMode);
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.option, { backgroundColor: palette.surface, borderColor: palette.line }, compact && styles.optionCompact, selected && { borderColor: palette.primary, backgroundColor: palette.skySoft }, pressed && styles.pressed]} accessibilityRole="radio" accessibilityState={{ selected }}>
    <View style={[styles.optionIcon, { backgroundColor: selected ? tone : `${tone}22` }]}><Ionicons name={icon} size={16} color={selected ? colors.onPrimary : tone} /></View>
    <View style={styles.optionCopy}><Text style={[styles.optionText, { color: palette.ink }, selected && styles.optionTextSelected]} numberOfLines={1}>{label}</Text>{!compact && subtitle ? <Text style={[styles.optionSubtitle, { color: palette.muted }]} numberOfLines={2}>{subtitle}</Text> : null}</View>
    {selected ? <Ionicons name="checkmark-circle" size={17} color={colors.primaryDark} /> : null}
  </Pressable>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, padding: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2, 6, 23, 0.68)' },
  modal: { width: '100%', maxWidth: 560, maxHeight: '94%', backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  modalHeader: { minHeight: 58, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, headerCopy: { flex: 1, gap: 3 }, modalTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, modalSubtitle: { color: colors.muted, fontSize: 10 }, closeButton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, divider: { height: 1, backgroundColor: colors.line },
  formScroll: { flexShrink: 1 }, formContent: { padding: 14, gap: 16 }, group: { gap: 9 }, label: { color: colors.ink, fontSize: 12, fontWeight: '800' }, hint: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 }, optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, priorityList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  option: { minHeight: 58, minWidth: '48%', flexGrow: 1, flexBasis: '47%', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceSoft, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7 }, optionCompact: { minWidth: 88, flexBasis: 'auto', flexGrow: 0, minHeight: 38, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 }, optionSelected: { borderColor: colors.primary, backgroundColor: '#EFF8FF' }, optionIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' }, optionIconSelected: { backgroundColor: colors.primary }, optionCopy: { flex: 1, minWidth: 0, gap: 2 }, optionText: { color: colors.ink, fontSize: 10, fontWeight: '800' }, optionTextSelected: { color: colors.ink }, optionSubtitle: { color: colors.muted, fontSize: 9, lineHeight: 12 },
  footer: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }, footerButton: { minWidth: 112 }, pressed: { opacity: 0.84 },
});
