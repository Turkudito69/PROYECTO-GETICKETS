import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { PublicSans_400Regular, PublicSans_500Medium, PublicSans_600SemiBold, PublicSans_700Bold, PublicSans_800ExtraBold } from '@expo-google-fonts/public-sans';
import { SessionProvider } from '../context/SessionContext';
import { colors } from '../theme';
import { useReducedMotion } from '../lib/motion';

export default function RootLayout() {
  const reduceMotion = useReducedMotion();
  const [fontsLoaded, fontError] = useFonts({
    'BricolageGrotesque-ExtraBold': BricolageGrotesque_800ExtraBold,
    'IBMPlexMono-Medium': IBMPlexMono_500Medium,
    'PublicSans-Regular': PublicSans_400Regular,
    'PublicSans-Medium': PublicSans_500Medium,
    'PublicSans-SemiBold': PublicSans_600SemiBold,
    'PublicSans-Bold': PublicSans_700Bold,
    'PublicSans-ExtraBold': PublicSans_800ExtraBold,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new-ticket" options={{ presentation: 'transparentModal', animation: reduceMotion ? 'none' : 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
        <Stack.Screen name="ticket/[id]" options={{ animation: reduceMotion ? 'none' : 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: reduceMotion ? 'none' : 'fade_from_bottom' }} />
        <Stack.Screen name="account" options={{ animation: reduceMotion ? 'none' : 'fade_from_bottom' }} />
      </Stack>
    </SessionProvider>
  );
}
