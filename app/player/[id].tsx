import { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Image, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { playerStorage, noteStorage, taskStorage } from '../../lib/storage';
import { Player, PlayerNote, Task } from '../../types';

type Tab = 'notas' | 'pendientes' | 'info';

const STATUS_NEXT: Record<Task['status'], Task['status']> = {
  pending: 'in_progress', in_progress: 'done', done: 'pending',
};

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [player, setPlayer] = useState<Player | null>(null);
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tab, setTab] = useState<Tab>('notas');
  const [newNote, setNewNote] = useState('');
  const [newTask, setNewTask] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const load = async () => {
    const [p, n, t] = await Promise.all([
      playerStorage.getById(id),
      noteStorage.getByPlayer(id),
      taskStorage.getByPlayer(id),
    ]);
    if (p) {
      setPlayer(p);
      navigation.setOptions({ title: p.name });
    }
    setNotes(n);
    setTasks(t);
  };

  useFocusEffect(useCallback(() => { load(); }, [id]));

  const addNote = async () => {
    if (!newNote.trim()) return;
    const note = await noteStorage.add(id, newNote.trim());
    setNotes(prev => [note, ...prev]);
    setNewNote('');
  };

  const saveEdit = async () => {
    if (!editingNoteId || !editingContent.trim()) return;
    await noteStorage.update(editingNoteId, editingContent.trim());
    setNotes(prev => prev.map(n => n.id === editingNoteId ? { ...n, content: editingContent } : n));
    setEditingNoteId(null);
    setEditingContent('');
  };

  const deleteNote = (note: PlayerNote) => {
    Alert.alert('Eliminar nota', '¿Eliminar esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          await noteStorage.delete(note.id);
          setNotes(prev => prev.filter(n => n.id !== note.id));
        },
      },
    ]);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const task = await taskStorage.add({
      title: newTask.trim(),
      status: 'pending',
      priority: 'medium',
      playerId: id,
    });
    setTasks(prev => [task, ...prev]);
    setNewTask('');
  };

  const toggleTask = async (task: Task) => {
    const next = STATUS_NEXT[task.status];
    await taskStorage.update(task.id, { status: next });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
  };

  const deleteTask = (task: Task) => {
    Alert.alert('Eliminar', `¿Eliminar "${task.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          await taskStorage.delete(task.id);
          setTasks(prev => prev.filter(t => t.id !== task.id));
        },
      },
    ]);
  };

  const deletePlayer = () => {
    Alert.alert('Eliminar jugador', `¿Eliminar a ${player?.name}? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          await playerStorage.delete(id);
          router.back();
        },
      },
    ]);
  };

  if (!player) return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: Colors.subtext }}>Cargando...</Text>
    </View>
  );

  const initials = player.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const parseBirthdayLocal = (bd: string) => {
    const [y, m, d] = bd.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const age = player.birthday
    ? Math.floor((Date.now() - parseBirthdayLocal(player.birthday).getTime()) / 31557600000)
    : null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.profileHeader}>
          {player.photo ? (
            <Image source={{ uri: player.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerSub}>
            {player.position} · {player.club}
          </Text>
          {player.availability === 'inactive' && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveText}>Inactivo</Text>
            </View>
          )}
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Ionicons name={player.gender === 'M' ? 'male' : 'female'} size={13} color={Colors.subtext} />
              <Text style={styles.pillText}>{player.gender === 'M' ? 'Masculino' : 'Femenino'}</Text>
            </View>
            {age !== null && (
              <View style={styles.pill}>
                <Ionicons name="calendar" size={13} color={Colors.subtext} />
                <Text style={styles.pillText}>{age} años</Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push({ pathname: '/player/new', params: { editId: id } })}
            >
              <Ionicons name="pencil" size={16} color={Colors.accent} />
              <Text style={[styles.headerBtnText, { color: Colors.accent }]}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerBtn, { borderColor: Colors.danger + '44' }]} onPress={deletePlayer}>
              <Ionicons name="trash" size={16} color={Colors.danger} />
              <Text style={[styles.headerBtnText, { color: Colors.danger }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabRow}>
          {(['notas', 'pendientes', 'info'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'notas' ? 'Notas' : t === 'pendientes' ? 'Pendientes' : 'Info'}
              </Text>
              {t === 'pendientes' && tasks.filter(x => x.status !== 'done').length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tasks.filter(x => x.status !== 'done').length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {tab === 'notas' && (
            <>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Agregar nota..."
                  placeholderTextColor={Colors.subtext}
                  value={newNote}
                  onChangeText={setNewNote}
                  multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={addNote} disabled={!newNote.trim()}>
                  <Ionicons name="send" size={18} color={newNote.trim() ? Colors.accent : Colors.border} />
                </TouchableOpacity>
              </View>
              {notes.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="document-text-outline" size={36} color={Colors.border} />
                  <Text style={styles.emptyText}>Sin notas todavía</Text>
                </View>
              )}
              {notes.map(note => (
                <View key={note.id} style={styles.noteCard}>
                  {editingNoteId === note.id ? (
                    <>
                      <TextInput
                        style={[styles.input, { marginBottom: 8 }]}
                        value={editingContent}
                        onChangeText={setEditingContent}
                        multiline
                        autoFocus
                      />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                          <Text style={styles.saveBtnText}>Guardar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditingNoteId(null)}>
                          <Text style={{ color: Colors.subtext, fontSize: 13 }}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.noteContent}>{note.content}</Text>
                      <Text style={styles.noteDate}>
                        {new Date(note.updatedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <View style={styles.noteActions}>
                        <TouchableOpacity onPress={() => { setEditingNoteId(note.id); setEditingContent(note.content); }}>
                          <Ionicons name="pencil-outline" size={16} color={Colors.subtext} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteNote(note)}>
                          <Ionicons name="trash-outline" size={16} color={Colors.subtext} />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              ))}
            </>
          )}

          {tab === 'pendientes' && (
            <>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Nueva tarea para este jugador..."
                  placeholderTextColor={Colors.subtext}
                  value={newTask}
                  onChangeText={setNewTask}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={addTask} disabled={!newTask.trim()}>
                  <Ionicons name="send" size={18} color={newTask.trim() ? Colors.accent : Colors.border} />
                </TouchableOpacity>
              </View>
              {tasks.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="checkmark-circle-outline" size={36} color={Colors.border} />
                  <Text style={styles.emptyText}>Sin pendientes</Text>
                </View>
              )}
              {tasks.map(task => (
                <TouchableOpacity key={task.id} style={styles.taskRow} onPress={() => toggleTask(task)}>
                  <Ionicons
                    name={task.status === 'done' ? 'checkmark-circle' : task.status === 'in_progress' ? 'time' : 'ellipse-outline'}
                    size={22}
                    color={task.status === 'done' ? Colors.success : task.status === 'in_progress' ? Colors.info : Colors.border}
                  />
                  <Text style={[styles.taskText, task.status === 'done' && styles.taskDone]}>
                    {task.title}
                  </Text>
                  <TouchableOpacity onPress={() => deleteTask(task)}>
                    <Ionicons name="close-circle-outline" size={18} color={Colors.subtext} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          )}

          {tab === 'info' && (
            <View style={{ gap: 12 }}>
              {player.description ? (
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Descripción</Text>
                  <Text style={styles.infoValue}>{player.description}</Text>
                </View>
              ) : null}
              {player.birthday ? (
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
                  <Text style={styles.infoValue}>
                    {parseBirthdayLocal(player.birthday).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {age !== null ? ` (${age} años)` : ''}
                  </Text>
                </View>
              ) : null}
              {player.videoUrl ? (
                <TouchableOpacity style={styles.infoCard} onPress={() => Linking.openURL(player.videoUrl!)}>
                  <Text style={styles.infoLabel}>Video</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="play-circle" size={18} color={Colors.accent} />
                    <Text style={[styles.infoValue, { color: Colors.accent }]}>Ver video</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
              {!player.description && !player.birthday && !player.videoUrl && (
                <View style={styles.empty}>
                  <Ionicons name="information-circle-outline" size={36} color={Colors.border} />
                  <Text style={styles.emptyText}>Sin información adicional</Text>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => router.push({ pathname: '/player/new', params: { editId: id } })}
                  >
                    <Text style={styles.saveBtnText}>Completar perfil</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  profileHeader: { alignItems: 'center', padding: 24, paddingBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarFallback: { backgroundColor: Colors.accent + '33', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: Colors.accent },
  playerName: { fontSize: 24, fontWeight: '800', color: Colors.text },
  playerSub: { fontSize: 14, color: Colors.subtext, marginTop: 4 },
  inactiveBadge: {
    backgroundColor: Colors.danger + '22', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, marginTop: 8,
  },
  inactiveText: { color: Colors.danger, fontWeight: '700', fontSize: 12 },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.card, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  pillText: { fontSize: 12, color: Colors.subtext, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  headerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.accent + '44',
  },
  headerBtnText: { fontSize: 13, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 4,
    backgroundColor: Colors.card, borderRadius: 12, padding: 4,
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9,
    flexDirection: 'row', justifyContent: 'center', gap: 4,
  },
  tabBtnActive: { backgroundColor: Colors.cardAlt },
  tabText: { color: Colors.subtext, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: Colors.text },
  badge: {
    backgroundColor: Colors.accent, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
  },
  badgeText: { color: Colors.text, fontSize: 10, fontWeight: '700' },
  tabContent: { padding: 16 },
  inputRow: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
    backgroundColor: Colors.card, borderRadius: 12, padding: 4, paddingLeft: 12,
    alignItems: 'center',
  },
  input: { flex: 1, color: Colors.text, fontSize: 14, maxHeight: 100 },
  sendBtn: { padding: 10 },
  noteCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8,
    borderLeftWidth: 2, borderLeftColor: Colors.accent + '66',
  },
  noteContent: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  noteDate: { color: Colors.subtext, fontSize: 11, marginTop: 6 },
  noteActions: { flexDirection: 'row', gap: 14, marginTop: 8, justifyContent: 'flex-end' },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  taskText: { flex: 1, color: Colors.text, fontSize: 14, fontWeight: '600' },
  taskDone: { textDecorationLine: 'line-through', color: Colors.subtext },
  infoCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, gap: 4 },
  infoLabel: { color: Colors.subtext, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { color: Colors.subtext, fontSize: 14 },
  saveBtn: {
    backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, marginTop: 4,
  },
  saveBtnText: { color: Colors.text, fontWeight: '700', fontSize: 13 },
});
