import { StyleSheet, Text as NativeText, TextInput as NativeTextInput } from 'react-native';
import type { TextInputProps, TextProps, TextStyle } from 'react-native';
import { useSession } from '../context/SessionContext';

const weightFamilies: Record<string, string> = {
  '100': 'PublicSans-Regular', '200': 'PublicSans-Regular', '300': 'PublicSans-Regular',
  normal: 'PublicSans-Regular', '400': 'PublicSans-Regular', '500': 'PublicSans-Medium',
  '600': 'PublicSans-SemiBold', '700': 'PublicSans-Bold', bold: 'PublicSans-Bold',
  '800': 'PublicSans-ExtraBold', '900': 'PublicSans-ExtraBold',
};

export function Text({ style, ...props }: TextProps) {
  const { darkMode } = useSession();
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const declaredFamily = flattened?.fontFamily;
  const weight = String(flattened?.fontWeight ?? '400');
  const fontSize = typeof flattened?.fontSize === 'number' ? flattened.fontSize : 14;
  const tabular = Array.isArray(flattened?.fontVariant) && flattened.fontVariant.includes('tabular-nums');
  const plainValue = typeof props.children === 'string' || typeof props.children === 'number' ? String(props.children).trim() : '';
  const display = fontSize >= 24 || (Number(weight) >= 800 && (flattened?.letterSpacing ?? 0) >= 0.2);
  const isMonoValue = /^(?:TCK-\d{3,}|\d+(?:\s*\/\s*\d+)?%?)$/i.test(plainValue) && fontSize >= 16;
  const fontFamily = declaredFamily?.toLowerCase().includes('mono') || (tabular && fontSize < 24) || isMonoValue
    ? 'IBMPlexMono-Medium'
    : display && Number(weight) >= 700
      ? 'BricolageGrotesque-ExtraBold'
      : weightFamilies[weight] ?? 'PublicSans-Regular';
  const normalizedColor = String(flattened?.color ?? '').toUpperCase();
  const darkTextColors: Record<string, string> = {
    '#111827': '#F5F5F5',
    '#1F2937': '#F1F5F9',
    '#334155': '#CBD5E1',
    '#425B70': '#B8C7D8',
    '#475569': '#CBD5E1',
    '#64748B': '#A3A3A3',
    '#6B7280': '#A3A3A3',
    '#0F172A': '#F8FAFC',
  };
  const textColor = darkMode ? darkTextColors[normalizedColor] ?? flattened?.color ?? '#F5F5F5' : flattened?.color ?? '#111827';

  return <NativeText {...props} style={[style, { color: textColor, fontFamily, fontWeight: '400' }]} />;
}

export function AppTextInput({ style, ...props }: TextInputProps) {
  return <NativeTextInput {...props} style={[{ fontFamily: 'PublicSans-Regular' }, style]} />;
}

