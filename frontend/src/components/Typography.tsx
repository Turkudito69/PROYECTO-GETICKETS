import { StyleSheet, Text as NativeText, TextInput as NativeTextInput } from 'react-native';
import type { TextInputProps, TextProps, TextStyle } from 'react-native';

const weightFamilies: Record<string, string> = {
  '100': 'PublicSans-Regular', '200': 'PublicSans-Regular', '300': 'PublicSans-Regular',
  normal: 'PublicSans-Regular', '400': 'PublicSans-Regular', '500': 'PublicSans-Medium',
  '600': 'PublicSans-SemiBold', '700': 'PublicSans-Bold', bold: 'PublicSans-Bold',
  '800': 'PublicSans-ExtraBold', '900': 'PublicSans-ExtraBold',
};

export function Text({ style, ...props }: TextProps) {
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const declaredFamily = flattened?.fontFamily;
  const weight = String(flattened?.fontWeight ?? '400');
  const fontSize = typeof flattened?.fontSize === 'number' ? flattened.fontSize : 14;
  const tabular = Array.isArray(flattened?.fontVariant) && flattened.fontVariant.includes('tabular-nums');
  const display = fontSize >= 24 || (Number(weight) >= 800 && (flattened?.letterSpacing ?? 0) >= 0.2);
  const fontFamily = declaredFamily?.toLowerCase().includes('mono') || (tabular && fontSize < 24)
    ? 'IBMPlexMono-Medium'
    : display && Number(weight) >= 700
      ? 'BricolageGrotesque-ExtraBold'
      : weightFamilies[weight] ?? 'PublicSans-Regular';

  return <NativeText {...props} style={[style, { fontFamily, fontWeight: '400' }]} />;
}

export function AppTextInput({ style, ...props }: TextInputProps) {
  return <NativeTextInput {...props} style={[{ fontFamily: 'PublicSans-Regular' }, style]} />;
}

