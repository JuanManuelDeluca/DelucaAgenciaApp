import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { teamStorage, scoutedStorage, playerStorage } from '../../lib/storage';
import { Team, ScoutedPlayer } from '../../types';

const POSITIONS = ['Base', 'Escolta', 'Alero', 'Ala-Pivot', 'Pivot'];
const STATUS_COLORS: Record<ScoutedPlayer['status'], string> = {
  watching: Colors.info,
  contacted: Colors.warning,
  rejected: Colors.danger,
  signed: Colors.success,
};
const STATUS_LABELS: Record<ScoutedPlayer['status'], string> = {
  watching: 'Observando',
  contacted: 'Contactado',
  rejected: 'Descartado',
  signed: 'Fichado',
};

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<ScoutedPlayer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('Base');
  const [ageStr, setAgeStr] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    const [t, p] = await Promise.all([
      teamStorage.getById(id),
      scoutedStorage.getByTeam(id),
    ]);
    if (t) {
      setTeam(t);
      navigation.setOptions({ title: t.name });
    }
    setPlayers(p);
  };

  useFocusEffect(useCallback(() => { load(); }, [id]));

  const addPlayer = async () => {
    if (!name.trim()) return;
    const sp = await scoutedStorage.add({
      teamId: id,
      name: name.trim(),
      position: position || undefined,
      age: ageStr ? Number(ageStr) : undefined,
      notes: notes.trim() || undefined,
      status: 'watching',
    });
    setPlayers(prev => [...prev, sp]);
    setName('');
    setAgeStr('');
    setNotes('');
    setShowModal(false);
  };

  const cycleStatus = async (sp: ScoutedPlayer) => {
    const order: ScoutedPlayer['status'][] = ['watching', 'contacted', 'rejected', 'signed'];
    const idx = order.indexOf(sp.status);
    const next = order[(idx + 1) % order.length];
    await scoutedStorage.update(sp.id, { status: next });
    setPlayers(prev => prev.map(p => p.id === sp.id ? { ...p, status: next } : p));
  };

  const recruit = async (sp: ScoutedPlayer) => {
    Alert.alert(
      'Fichar jugador',
      `¿Querés agregar a ${sp.name} a tu agencia?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Fichar', onPress: async () => {
            await playerStorage.add({
              name: sp.name,
              position: sp.position || 'Base',
              club: team?.name || '',
              gender: 'M',
              description: sp.notes,
              availability: 'active',
            });
            await scoutedStorage.update(sp.id, { status: 'signed' });
            setPlayers(prev => prev.map(p => p.id === sp.id ? { ...p, status: 'signed' } : p));
            Alert.alert('Fichado', `${sp.name} fue agregado a tus jugadores.`);
          },
        },
      ]
    );
  };

  const deletePlayer = (sp: ScoutedPlayer) => {
    Alert.alert('Eliminar', `¿Eliminar a ${sp.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          await scoutedStorage.delete(sp.id);
          setPlayers(prev => prev.filter(p => p.id !== sp.id));
        },
      },
    ]);
  };

  if (!team) return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: Colors.subtext }}>Cargando...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {team.notes || team.league || team.category ? (
        <View style={styles.teamInfo}>
          {(team.league || team.category) && (
            <Text style={styles.teamMeta}>
              {[team.league, team.category].filter(Boolean).join(' · ')}
            </Text>
          )}
          {team.notes && <Text style={styles.teamNotes}>{team.notes}</Text>}
        </View>
      ) : null}

      <FlatList
        data={players}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="person-outline" size={40} color={Colors.border} />
            <Text style={styles.emptyTitle}>Sin jugadores</Text>
            <Text style={styles.emptyText}>Agregá jugadores para hacer seguimiento</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.statusBar, { backgroundColor: STATUS_COLORS[item.status] }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{item.name}</Text>
                  <Text style={styles.playerSub}>
                    {[item.position, item.age ? `${item.age} años` : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}
                  onPress={() => cycleStatus(item)}
                >
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                    {STATUS_LABELS[item.status]}
                  </Text>
                </TouchableOpacity>
              </View>
              {item.notes ? <Text style={styles.playerNotes} numberOfLines={2}>{item.notes}</Text> : null}
              <View style={styles.cardActions}>
                {item.status !== 'signed' && (
                  <TouchableOpacity style={styles.recruitBtn} onPress={() => recruit(item)}>
                    <Ionicons name="person-add" size={14} color={Colors.accent} />
                    <Text style={styles.recruitText}>Fichar</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'signed' && (
                  <View style={styles.signedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                    <Text style={{ color: Colors.success, fontSize: 12, fontWeight: '600' }}>En tu agencia</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => deletePlayer(item)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.subtext} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color={Colors.text} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar jugador observado</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Nombre del jugador"
              placeholderTextColor={Colors.subtext}
              autoFocus
            />

            <Text style={styles.label}>Posición</Text>
            <View style={styles.optionRow}>
              {POSITIONS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.option, position === p && styles.optionActive]}
                  onPress={() => setPosition(p)}
                >
                  <Text style={[styles.optionText, position === p && styles.optionTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Edad</Text>
            <TextInput
              style={styles.textInput}
              value={ageStr}
              onChangeText={setAgeStr}
              placeholder="Ej: 22"
              placeholderTextColor={Colors.subtext}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Notas</Text>
            <TextInput
              style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Características, observaciones..."
              placeholderTextColor={Colors.subtext}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveBtn, !name.trim() && { opacity: 0.5 }]}
              onPress={addPlayer}
              disabled={!name.trim()}
            >
              <Text style={styles.saveBtnText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  teamInfo: { backgroundColor: Colors.card, margin: 16, borderRadius: 12, padding: 14, gap: 4 },
  teamMeta: { color: Colors.accent, fontWeight: '700', fontSize: 13 },
  teamNotes: { color: Colors.subtext, fontSize: 13, lineHeight: 18 },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  card: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, overflow: 'hidden' },
  statusBar: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  playerName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  playerSub: { fontSize: 12, color: Colors.subtext, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  playerNotes: { color: Colors.subtext, fontSize: 13, marginTop: 6, lineHeight: 18 },
  cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  recruitBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent + '22', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  recruitText: { color: Colors.accent, fontWeight: '700', fontSize: 12 },
  signedBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.subtext },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56,
    borderRadius: 28, backgroundColor: Colors.accent, alignItems: 'center',
    justifyContent: 'center', elevation: 5,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  modalContainer: { flex: 1, backgroundColor: Colors.bg, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  label: { color: Colors.subtext, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  textInput: {
    backgroundColor: Colors.card, color: Colors.text, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  optionActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  optionText: { color: Colors.subtext, fontWeight: '600', fontSize: 12 },
  optionTextActive: { color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  saveBtnText: { color: Colors.text, fontWeight: '800', fontSize: 15 },
});
