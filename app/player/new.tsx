import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { playerStorage, eventStorage } from '../../lib/storage';
import { Player } from '../../types';

const POSITIONS = ['Base', 'Escolta', 'Alero', 'Ala-Pivot', 'Pivot'];

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function OptionRow({
  options, selected, onSelect,
}: { options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <View style={styles.optionRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.option, selected === opt && styles.optionActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.optionText, selected === opt && styles.optionTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function NewPlayerScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEdit = !!editId;

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [position, setPosition] = useState('Base');
  const [club, setClub] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [birthday, setBirthday] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [availability, setAvailability] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      playerStorage.getById(editId).then(p => {
        if (p) {
          setName(p.name);
          setPhoto(p.photo || '');
          setPosition(p.position);
          setClub(p.club);
          setGender(p.gender);
          setBirthday(p.birthday || '');
          setDescription(p.description || '');
          setVideoUrl(p.videoUrl || '');
          setAvailability(p.availability);
        }
      });
    }
  }, [editId]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    const data: Omit<Player, 'id' | 'createdAt'> = {
      name: name.trim(),
      photo: photo || undefined,
      position,
      club: club.trim(),
      gender,
      birthday: birthday || undefined,
      description: description.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      availability,
    };
    try {
      if (isEdit && editId) {
        await playerStorage.update(editId, data);
      } else {
        await playerStorage.add(data);
      }
      const all = await playerStorage.getAll();
      await eventStorage.syncBirthdays(all);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el jugador.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.photoBox} onPress={pickPhoto}>
          {photo ? (
            <View style={{ position: 'relative' }}>
              <View style={[styles.photoCircle, { overflow: 'hidden' }]}>
                <View style={{ width: 90, height: 90 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
                  {photo && <View style={{ flex: 1, backgroundColor: Colors.accent + '33' }} />}
                </View>
              </View>
              <View style={styles.photoBadge}>
                <Ionicons name="camera" size={14} color={Colors.text} />
              </View>
            </View>
          ) : (
            <View style={[styles.photoCircle, { backgroundColor: Colors.card }]}>
              <Ionicons name="camera" size={28} color={Colors.accent} />
              <Text style={styles.photoText}>Agregar foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <FieldLabel text="Nombre completo *" />
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Juan García"
          placeholderTextColor={Colors.subtext}
        />

        <FieldLabel text="Club actual" />
        <TextInput
          style={styles.textInput}
          value={club}
          onChangeText={setClub}
          placeholder="Ej: Club Atlético Buenos Aires"
          placeholderTextColor={Colors.subtext}
        />

        <FieldLabel text="Posición" />
        <OptionRow options={POSITIONS} selected={position} onSelect={setPosition} />

        <FieldLabel text="Género" />
        <OptionRow options={['M', 'F']} selected={gender} onSelect={v => setGender(v as 'M' | 'F')} />

        <FieldLabel text="Estado" />
        <OptionRow options={['active', 'inactive']} selected={availability} onSelect={v => setAvailability(v as 'active' | 'inactive')} />

        <FieldLabel text="Fecha de nacimiento (DD/MM/AAAA)" />
        <TextInput
          style={styles.textInput}
          value={birthday}
          onChangeText={setBirthday}
          placeholder="Ej: 15/03/1998"
          placeholderTextColor={Colors.subtext}
          keyboardType="numbers-and-punctuation"
        />

        <FieldLabel text="Descripción / Perfil" />
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Descripción del jugador, características, logros..."
          placeholderTextColor={Colors.subtext}
          multiline
          numberOfLines={4}
        />

        <FieldLabel text="URL de video" />
        <TextInput
          style={styles.textInput}
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="https://youtube.com/..."
          placeholderTextColor={Colors.subtext}
          keyboardType="url"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={save}
          disabled={saving}
        >
          <Ionicons name={isEdit ? 'checkmark' : 'add'} size={20} color={Colors.text} />
          <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar jugador'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  photoBox: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  photoCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.accent, borderStyle: 'dashed',
  },
  photoText: { color: Colors.accent, fontSize: 11, marginTop: 4, fontWeight: '600' },
  photoBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.accent,
    borderRadius: 10, padding: 4,
  },
  label: { color: Colors.subtext, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  textInput: {
    backgroundColor: Colors.card, color: Colors.text, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  optionActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  optionText: { color: Colors.subtext, fontWeight: '600', fontSize: 13 },
  optionTextActive: { color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 28,
    flexDirection: 'row', gap: 8,
  },
  saveBtnText: { color: Colors.text, fontWeight: '800', fontSize: 16 },
});
