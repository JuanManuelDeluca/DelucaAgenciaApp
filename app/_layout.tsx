import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { requestPermissions } from '../lib/notifications';
import { supabase } from '../lib/supabase';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const [authChecked, setAuthChecked] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestPermissions();
      SplashScreen.hideAsync();
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      }
      setAuthChecked(true);
    }).catch(() => {
      router.replace('/login');
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login');
      } else {
        router.replace('/(tabs)');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

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
        <Stack.Screen name="login" options={{ headerShown: false }} />
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
