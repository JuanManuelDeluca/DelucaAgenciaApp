import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { teamStorage, scoutedStorage } from '../../lib/storage';
import { Team } from '../../types';

export default function ScoutingScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const t = await teamStorage.getAll();
    setTeams(t);
    const c: Record<string, number> = {};
    await Promise.all(t.map(async team => {
      const players = await scoutedStorage.getByTeam(team.id);
      c[team.id] = players.length;
    }));
    setCounts(c);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const deleteTeam = (team: Team) => {
    Alert.alert('Eliminar equipo', `¿Eliminar "${team.name}"? Se eliminarán todos sus jugadores observados.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          await teamStorage.delete(team.id);
          setTeams(prev => prev.filter(t => t.id !== team.id));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={teams}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerText}>
              Seguí equipos y sus jugadores. Con un toque podés fichar a cualquiera a tu agencia.
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="eye-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>Sin equipos en seguimiento</Text>
            <Text style={styles.emptyText}>Agregá equipos para hacer scouting</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/team/${item.id}`)}
            onLongPress={() => deleteTeam(item)}
            activeOpacity={0.8}
          >
            <View style={[styles.teamIcon, { backgroundColor: Colors.accent + '22' }]}>
              <Ionicons name="shield" size={24} color={Colors.accent} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.teamName}>{item.name}</Text>
              <Text style={styles.teamSub}>
                {[item.league, item.category].filter(Boolean).join(' · ') || 'Sin categoría'}
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countNum}>{counts[item.id] || 0}</Text>
              <Text style={styles.countLabel}>jugadores</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.subtext} />
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/team/new')}>
        <Ionicons name="add" size={28} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: 16, paddingBottom: 100, gap: 10 },
  header: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 6,
    borderLeftWidth: 3, borderLeftColor: Colors.accent,
  },
  headerText: { color: Colors.subtext, fontSize: 13, lineHeight: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: 14, padding: 14, gap: 12,
  },
  teamIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  teamName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  teamSub: { fontSize: 12, color: Colors.subtext, marginTop: 2 },
  countBadge: { alignItems: 'center' },
  countNum: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  countLabel: { fontSize: 10, color: Colors.subtext, fontWeight: '600' },
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
