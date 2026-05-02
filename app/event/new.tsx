import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { eventStorage, playerStorage } from '../../lib/storage';
import { AgencyEvent, Player } from '../../types';
import { scheduleEventNotification } from '../../lib/notifications';

const TYPES: { key: AgencyEvent['type']; label: string; emoji: string }[] = [
  { key: 'match', label: 'Partido', emoji: '🏀' },
  { key: 'reminder', label: 'Recordatorio', emoji: '📌' },
];

export default function NewEventScreen() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AgencyEvent['type']>('match');
  const [date, setDate] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    playerStorage.getAll().then(setPlayers);
  }, []);

  const parseDate = (str: string): Date | null => {
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return new Date(year, month - 1, day);
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio.');
      return;
    }
    const parsedDate = parseDate(date);
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      Alert.alert('Error', 'Ingresá una fecha válida en formato DD/MM/AAAA.');
      return;
    }
    setSaving(true);
    try {
      const event = await eventStorage.add({
        title: title.trim(),
        type,
        playerId: playerId || undefined,
        eventDate: parsedDate.toISOString(),
        notified: false,
      });
      await scheduleEventNotification(event);
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el evento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Partido vs Peñarol, Cumpleaños Juan..."
          placeholderTextColor={Colors.subtext}
          autoFocus
        />

        <Text style={styles.label}>Tipo</Text>
        <View style={styles.optionRow}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.option, type === t.key && styles.optionActive]}
              onPress={() => setType(t.key)}
            >
              <Text style={styles.emoji}>{t.emoji}</Text>
              <Text style={[styles.optionText, type === t.key && styles.optionTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Fecha (DD/MM/AAAA) *</Text>
        <TextInput
          style={styles.textInput}
          value={date}
          onChangeText={setDate}
          placeholder="Ej: 20/06/2025"
          placeholderTextColor={Colors.subtext}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Relacionar a un jugador (opcional)</Text>
        <View style={styles.playerList}>
          <TouchableOpacity
            style={[styles.playerOption, playerId === '' && styles.playerOptionActive]}
            onPress={() => setPlayerId('')}
          >
            <Text style={[styles.playerOptionText, playerId === '' && styles.optionTextActive]}>Ninguno</Text>
          </TouchableOpacity>
          {players.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.playerOption, playerId === p.id && styles.playerOptionActive]}
              onPress={() => setPlayerId(p.id)}
            >
              <Text style={[styles.playerOptionText, playerId === p.id && styles.optionTextActive]} numberOfLines={1}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="notifications" size={16} color={Colors.accent} />
          <Text style={styles.infoText}>
            Vas a recibir una notificación el día del evento a las 9:00 AM.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={save}
          disabled={saving}
        >
          <Ionicons name="calendar" size={20} color={Colors.text} />
          <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Crear evento'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  label: { color: Colors.subtext, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  textInput: {
    backgroundColor: Colors.card, color: Colors.text, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  optionRow: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  optionActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  optionText: { color: Colors.subtext, fontWeight: '700', fontSize: 14 },
  optionTextActive: { color: Colors.text },
  emoji: { fontSize: 18 },
  playerList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  playerOption: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  playerOptionActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  playerOptionText: { color: Colors.subtext, fontWeight: '600', fontSize: 13 },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent + '18', borderRadius: 12, padding: 12, marginTop: 20,
    borderWidth: 1, borderColor: Colors.accent + '33',
  },
  infoText: { flex: 1, color: Colors.subtext, fontSize: 13, lineHeight: 18 },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
    flexDirection: 'row', gap: 8,
  },
  saveBtnText: { color: Colors.text, fontWeight: '800', fontSize: 16 },
});
