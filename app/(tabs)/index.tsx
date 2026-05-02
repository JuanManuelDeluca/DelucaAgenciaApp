import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { playerStorage, taskStorage, eventStorage } from '../../lib/storage';
import { Player, Task, AgencyEvent } from '../../types';

const { width } = Dimensions.get('window');

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function daysUntil(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function eventIcon(type: AgencyEvent['type']): string {
  if (type === 'birthday') return '🎂';
  if (type === 'match') return '🏀';
  return '📌';
}

export default function HomeScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<AgencyEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [p, t, e] = await Promise.all([
      playerStorage.getAll(),
      taskStorage.getAll(),
      eventStorage.getUpcoming(30),
    ]);
    setPlayers(p);
    setTasks(t);
    setEvents(e);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pending = tasks.filter(t => t.status === 'pending');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const activePlayer = players.filter(p => p.availability === 'active');
  const today = events.filter(e => daysUntil(e.eventDate) === 0);
  const upcoming = events.filter(e => daysUntil(e.eventDate) > 0);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greet()}, Juan</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: Colors.card }]} onPress={() => router.push('/(tabs)/players')}>
          <Text style={styles.statNumber}>{activePlayer.length}</Text>
          <Text style={styles.statLabel}>Jugadores</Text>
          <Ionicons name="people" size={20} color={Colors.accent} style={styles.statIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: Colors.card }]} onPress={() => router.push('/(tabs)/tasks')}>
          <Text style={styles.statNumber}>{pending.length}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
          <Ionicons name="time" size={20} color={Colors.warning} style={styles.statIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: Colors.card }]} onPress={() => router.push('/(tabs)/tasks')}>
          <Text style={styles.statNumber}>{inProgress.length}</Text>
          <Text style={styles.statLabel}>En curso</Text>
          <Ionicons name="hourglass" size={20} color={Colors.info} style={styles.statIcon} />
        </TouchableOpacity>
      </View>

      {today.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoy</Text>
          {today.map(event => (
            <View key={event.id} style={[styles.eventCard, { borderLeftColor: Colors.accent }]}>
              <Text style={styles.eventEmoji}>{eventIcon(event.type)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventSub}>Hoy</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos eventos</Text>
          {upcoming.slice(0, 5).map(event => {
            const days = daysUntil(event.eventDate);
            return (
              <View key={event.id} style={styles.eventCard}>
                <Text style={styles.eventEmoji}>{eventIcon(event.type)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventSub}>
                    {formatDate(event.eventDate)} · en {days} día{days !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            );
          })}
          <TouchableOpacity onPress={() => router.push('/event/new')} style={styles.addEventBtn}>
            <Ionicons name="add-circle-outline" size={16} color={Colors.accent} />
            <Text style={styles.addEventText}>Agregar evento</Text>
          </TouchableOpacity>
        </View>
      )}

      {upcoming.length === 0 && today.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos eventos</Text>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay eventos próximos</Text>
            <TouchableOpacity onPress={() => router.push('/event/new')} style={styles.addEventBtn}>
              <Ionicons name="add-circle-outline" size={16} color={Colors.accent} />
              <Text style={styles.addEventText}>Agregar evento</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {(pending.length > 0 || inProgress.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tareas urgentes</Text>
          {[...inProgress, ...pending]
            .filter(t => !t.playerId)
            .slice(0, 4)
            .map(task => (
              <TouchableOpacity key={task.id} style={styles.taskRow} onPress={() => router.push('/(tabs)/tasks')}>
                <View style={[styles.priorityDot, {
                  backgroundColor: task.priority === 'high' ? Colors.danger
                    : task.priority === 'medium' ? Colors.warning : Colors.success
                }]} />
                <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                <View style={[styles.statusBadge, {
                  backgroundColor: task.status === 'in_progress' ? Colors.info + '33' : Colors.cardAlt
                }]}>
                  <Text style={[styles.statusText, {
                    color: task.status === 'in_progress' ? Colors.info : Colors.subtext
                  }]}>
                    {task.status === 'in_progress' ? 'En curso' : 'Pendiente'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>Ver todas las tareas</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/player/new')}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.accent + '22' }]}>
              <Ionicons name="person-add" size={22} color={Colors.accent} />
            </View>
            <Text style={styles.actionLabel}>Nuevo jugador</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/task/new')}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.warning + '22' }]}>
              <Ionicons name="add-circle" size={22} color={Colors.warning} />
            </View>
            <Text style={styles.actionLabel}>Nueva tarea</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/event/new')}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.info + '22' }]}>
              <Ionicons name="calendar" size={22} color={Colors.info} />
            </View>
            <Text style={styles.actionLabel}>Nuevo evento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/team/new')}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.success + '22' }]}>
              <Ionicons name="shield" size={22} color={Colors.success} />
            </View>
            <Text style={styles.actionLabel}>Nuevo equipo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 26, fontWeight: '800', color: Colors.text },
  date: { fontSize: 14, color: Colors.subtext, marginTop: 2, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 14, alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.subtext, marginTop: 2, fontWeight: '600' },
  statIcon: { position: 'absolute', top: 10, right: 10, opacity: 0.6 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  eventCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: 12, padding: 14, marginBottom: 8, gap: 12,
    borderLeftWidth: 3, borderLeftColor: Colors.border,
  },
  eventEmoji: { fontSize: 22 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  eventSub: { fontSize: 12, color: Colors.subtext, marginTop: 2 },
  addEventBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 4 },
  addEventText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  emptyBox: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 20,
    alignItems: 'center', gap: 8,
  },
  emptyText: { color: Colors.subtext, fontSize: 14 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: 12, padding: 14, marginBottom: 8, gap: 10,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, marginTop: 4, paddingVertical: 8,
  },
  seeAllText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  quickActions: { marginBottom: 8 },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtn: { width: (width - 52) / 2, alignItems: 'center', gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.subtext, textAlign: 'center' },
});
