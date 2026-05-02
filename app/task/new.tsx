import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { taskStorage, playerStorage } from '../../lib/storage';
import { Player, Task } from '../../types';

const PRIORITIES: { key: Task['priority']; label: string; color: string }[] = [
  { key: 'low', label: 'Baja', color: Colors.success },
  { key: 'medium', label: 'Media', color: Colors.warning },
  { key: 'high', label: 'Alta', color: Colors.danger },
];

const CATEGORIES = ['Jugador', 'Entrenador', 'Administrativo', 'Contrato', 'Viaje', 'Otro'];

export default function NewTaskScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    playerStorage.getAll().then(setPlayers);
  }, []);

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      await taskStorage.add({
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'pending',
        priority,
        category: category || undefined,
        playerId: playerId || undefined,
        dueDate: dueDate || undefined,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la tarea.');
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
          placeholder="¿Qué tenés que hacer?"
          placeholderTextColor={Colors.subtext}
          autoFocus
        />

        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Más detalles..."
          placeholderTextColor={Colors.subtext}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Prioridad</Text>
        <View style={styles.optionRow}>
          {PRIORITIES.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.option, priority === p.key && { backgroundColor: p.color, borderColor: p.color }]}
              onPress={() => setPriority(p.key)}
            >
              <View style={[styles.priorityDot, { backgroundColor: priority === p.key ? Colors.text : p.color }]} />
              <Text style={[styles.optionText, priority === p.key && styles.optionTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.optionRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.option, category === c && styles.optionActive]}
              onPress={() => setCategory(prev => prev === c ? '' : c)}
            >
              <Text style={[styles.optionText, category === c && styles.optionTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Fecha límite (DD/MM/AAAA)</Text>
        <TextInput
          style={styles.textInput}
          value={dueDate}
          onChangeText={setDueDate}
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

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={save}
          disabled={saving}
        >
          <Ionicons name="add" size={20} color={Colors.text} />
          <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Crear tarea'}</Text>
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
  textArea: { height: 90, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  optionActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  optionText: { color: Colors.subtext, fontWeight: '600', fontSize: 13 },
  optionTextActive: { color: Colors.text },
  priorityDot: { width: 7, height: 7, borderRadius: 4 },
  playerList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  playerOption: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    maxWidth: '48%',
  },
  playerOptionActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  playerOptionText: { color: Colors.subtext, fontWeight: '600', fontSize: 13 },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 28,
    flexDirection: 'row', gap: 8,
  },
  saveBtnText: { color: Colors.text, fontWeight: '800', fontSize: 16 },
});
