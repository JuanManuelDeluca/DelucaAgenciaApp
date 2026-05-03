import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Image, RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { playerStorage } from '../../lib/storage';
import { Player } from '../../types';

const POSITIONS = ['Todas', 'Base', 'Escolta', 'Alero', 'Ala-Pivot', 'Pivot'];
const GENDERS = [
  { label: 'Todos', value: '' },
  { label: 'Hombres', value: 'M' },
  { label: 'Mujeres', value: 'F' },
];

function PlayerCard({ player, onPress }: { player: Player; onPress: () => void }) {
  const initials = player.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {player.photo ? (
        <Image source={{ uri: player.photo }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
        <Text style={styles.playerSub}>{player.position} · {player.club}</Text>
      </View>
      {player.availability === 'inactive' && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveText}>Inactivo</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={Colors.subtext} />
    </TouchableOpacity>
  );
}

export default function PlayersScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('Todas');
  const [gender, setGender] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await playerStorage.getAll();
    setPlayers(data);
  };

  const syncAndLoad = async () => {
    try { await playerStorage.syncFromSheets(); } catch { /* silencioso */ }
    await load();
  };

  useFocusEffect(useCallback(() => { syncAndLoad(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await syncAndLoad();
    setRefreshing(false);
  };

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.club.toLowerCase().includes(search.toLowerCase());
    const matchPos = position === 'Todas' || p.position === position;
    const matchGender = gender === '' || p.gender === gender;
    return matchSearch && matchPos && matchGender;
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={Colors.subtext} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar jugador o club..."
            placeholderTextColor={Colors.subtext}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.subtext} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/player/new')}>
          <Ionicons name="add" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <FlatList
          data={POSITIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, position === item && styles.filterChipActive]}
              onPress={() => setPosition(item)}
            >
              <Text style={[styles.filterText, position === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        />
      </View>

      <View style={styles.genderRow}>
        {GENDERS.map(g => (
          <TouchableOpacity
            key={g.value}
            style={[styles.genderChip, gender === g.value && styles.genderChipActive]}
            onPress={() => setGender(g.value)}
          >
            <Text style={[styles.genderText, gender === g.value && styles.genderTextActive]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>
              {players.length === 0 ? 'Todavía no hay jugadores' : 'Sin resultados'}
            </Text>
            <Text style={styles.emptyText}>
              {players.length === 0 ? 'Agregá tu primer jugador' : 'Probá con otro filtro'}
            </Text>
            {players.length === 0 && (
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/player/new')}>
                <Text style={styles.emptyBtnText}>Agregar jugador</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <PlayerCard player={item} onPress={() => router.push(`/player/${item.id}`)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  searchRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  addBtn: {
    backgroundColor: Colors.accent, width: 44, height: 44,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  filters: { marginBottom: 10 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterText: { color: Colors.subtext, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: Colors.text },
  genderRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  genderChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  genderChipActive: { backgroundColor: Colors.cardAlt, borderColor: Colors.accent },
  genderText: { color: Colors.subtext, fontSize: 13, fontWeight: '600' },
  genderTextActive: { color: Colors.text },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: 14, padding: 12, gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { backgroundColor: Colors.accent + '33', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.accent, fontWeight: '700', fontSize: 16 },
  cardInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  playerSub: { fontSize: 12, color: Colors.subtext, marginTop: 2 },
  inactiveBadge: {
    backgroundColor: Colors.danger + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  inactiveText: { color: Colors.danger, fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.subtext },
  emptyBtn: {
    marginTop: 8, backgroundColor: Colors.accent, paddingHorizontal: 20,
    paddingVertical: 12, borderRadius: 12,
  },
  emptyBtnText: { color: Colors.text, fontWeight: '700', fontSize: 15 },
});
