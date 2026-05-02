import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { taskStorage, playerStorage } from '../../lib/storage';
import { Task, Player } from '../../types';

const STATUSES: { key: Task['status'] | 'all'; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendiente' },
  { key: 'in_progress', label: 'En curso' },
  { key: 'done', label: 'Listo' },
];

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.success,
};

const STATUS_NEXT: Record<Task['status'], Task['status']> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
};

function TaskCard({
  task, playerName, onStatusChange, onDelete,
}: {
  task: Task;
  playerName?: string;
  onStatusChange: () => void;
  onDelete: () => void;
}) {
  const statusLabel = task.status === 'pending' ? 'Pendiente'
    : task.status === 'in_progress' ? 'En curso' : 'Listo';
  const statusColor = task.status === 'pending' ? Colors.warning
    : task.status === 'in_progress' ? Colors.info : Colors.success;

  return (
    <View style={styles.card}>
      <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="trash-outline" size={16} color={Colors.subtext} />
          </TouchableOpacity>
        </View>
        {task.description ? (
          <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
        ) : null}
        <View style={styles.cardBottom}>
          <View style={styles.metaRow}>
            {playerName && (
              <View style={styles.playerBadge}>
                <Ionicons name="person" size={11} color={Colors.accent} />
                <Text style={styles.playerBadgeText} numberOfLines={1}>{playerName}</Text>
              </View>
            )}
            {task.dueDate && (
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={11} color={Colors.subtext} />
                <Text style={styles.dateBadgeText}>
                  {new Date(task.dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.statusBtn, { borderColor: statusColor }]}
            onPress={onStatusChange}
          >
            <Text style={[styles.statusBtnText, { color: statusColor }]}>{statusLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [filter, setFilter] = useState<Task['status'] | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [t, p] = await Promise.all([taskStorage.getGeneral(), playerStorage.getAll()]);
    setTasks(t);
    setPlayers(p);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const handleStatusChange = async (task: Task) => {
    const next = STATUS_NEXT[task.status];
    await taskStorage.update(task.id, { status: next });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
  };

  const handleDelete = (task: Task) => {
    Alert.alert('Eliminar tarea', `¿Eliminar "${task.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          await taskStorage.delete(task.id);
          setTasks(prev => prev.filter(t => t.id !== task.id));
        },
      },
    ]);
  };

  const playerName = (id?: string) => id ? players.find(p => p.id === id)?.name : undefined;

  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProg = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: Colors.warning }]}>{pending}</Text>
          <Text style={styles.summaryLabel}>Pendiente</Text>
        </View>
        <View style={[styles.summaryDivider]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: Colors.info }]}>{inProg}</Text>
          <Text style={styles.summaryLabel}>En curso</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: Colors.success }]}>{done}</Text>
          <Text style={styles.summaryLabel}>Listo</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {STATUSES.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.filterChip, filter === s.key && styles.filterChipActive]}
            onPress={() => setFilter(s.key)}
          >
            <Text style={[styles.filterText, filter === s.key && styles.filterTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>
              {tasks.length === 0 ? 'Sin tareas' : 'No hay tareas aquí'}
            </Text>
            <Text style={styles.emptyText}>
              {tasks.length === 0 ? 'Agregá tu primera tarea' : 'Probá con otro filtro'}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            playerName={playerName(item.playerId)}
            onStatusChange={() => handleStatusChange(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/task/new')}>
        <Ionicons name="add" size={28} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  summary: {
    flexDirection: 'row', backgroundColor: Colors.card, margin: 16,
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: Colors.subtext, fontWeight: '600', marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterText: { color: Colors.subtext, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: Colors.text },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  card: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: 14, overflow: 'hidden',
  },
  priorityBar: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  taskTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
  taskDesc: { fontSize: 13, color: Colors.subtext, marginTop: 4 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  metaRow: { flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' },
  playerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  playerBadgeText: { color: Colors.accent, fontSize: 11, fontWeight: '600' },
  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.cardAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  dateBadgeText: { color: Colors.subtext, fontSize: 11 },
  statusBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  statusBtnText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.subtext },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56,
    borderRadius: 28, backgroundColor: Colors.accent, alignItems: 'center',
    justifyContent: 'center', elevation: 5,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
});
