import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { requestPermissions } from '../lib/notifications';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    requestPermissions();
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
          contentStyle: { backgroundColor: Colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="player/[id]" options={{ title: 'Jugador', presentation: 'card' }} />
        <Stack.Screen name="player/new" options={{ title: 'Nuevo Jugador', presentation: 'modal' }} />
        <Stack.Screen name="task/new" options={{ title: 'Nueva Tarea', presentation: 'modal' }} />
        <Stack.Screen name="event/new" options={{ title: 'Nuevo Evento', presentation: 'modal' }} />
        <Stack.Screen name="team/[id]" options={{ title: 'Equipo', presentation: 'card' }} />
        <Stack.Screen name="team/new" options={{ title: 'Nuevo Equipo', presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
