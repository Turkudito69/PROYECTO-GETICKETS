
import { Stack } from 'expo-router';
import { AppThemeProvider } from '../context/AppThemeContext';

export default function RootLayout() {
  return (
    <AppThemeProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
    </AppThemeProvider>
  );
}
