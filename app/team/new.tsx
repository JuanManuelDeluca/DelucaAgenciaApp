import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { teamStorage } from '../../lib/storage';

export default function NewTeamScreen() {
  const [name, setName] = useState('');
  const [league, setLeague] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del equipo es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      await teamStorage.add({
        name: name.trim(),
        league: league.trim() || undefined,
        category: category.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el equipo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nombre del equipo *</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Club Atlético Belgrano"
          placeholderTextColor={Colors.subtext}
          autoFocus
        />

        <Text style={styles.label}>Liga / Torneo</Text>
        <TextInput
          style={styles.textInput}
          value={league}
          onChangeText={setLeague}
          placeholder="Ej: Liga Nacional de Básquet"
          placeholderTextColor={Colors.subtext}
        />

        <Text style={styles.label}>Categoría</Text>
        <TextInput
          style={styles.textInput}
          value={category}
          onChangeText={setCategory}
          placeholder="Ej: Primera División, Sub-21..."
          placeholderTextColor={Colors.subtext}
        />

        <Text style={styles.label}>Notas</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Contactos, información relevante del equipo..."
          placeholderTextColor={Colors.subtext}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={save}
          disabled={saving}
        >
          <Ionicons name="shield" size={20} color={Colors.text} />
          <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Agregar equipo'}</Text>
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
  textArea: { height: 100, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 28,
    flexDirection: 'row', gap: 8,
  },
  saveBtnText: { color: Colors.text, fontWeight: '800', fontSize: 16 },
});
