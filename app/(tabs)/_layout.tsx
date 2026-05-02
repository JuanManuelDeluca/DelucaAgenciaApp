import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.subtext,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: Colors.card },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 20 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          headerTitle: 'Deluca Agencia',
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: 'Jugadores',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          headerTitle: 'Jugadores',
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle" size={size} color={color} />,
          headerTitle: 'Tareas',
        }}
      />
      <Tabs.Screen
        name="scouting"
        options={{
          title: 'Scouting',
          tabBarIcon: ({ color, size }) => <Ionicons name="eye" size={size} color={color} />,
          headerTitle: 'Scouting',
        }}
      />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
