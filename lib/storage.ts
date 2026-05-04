import { supabase } from './supabase';
import { Player, PlayerNote, Task, Team, ScoutedPlayer, AgencyEvent } from '../types';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1TWntlnHPG7ogpIjC2J06-WGtRlji4oKdXoiLMHFSmE8/export?format=csv';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function convertDriveUrl(url: string): string | undefined {
  if (!url) return undefined;
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  return url || undefined;
}

async function resolveGoogleDocText(value: string | undefined): Promise<string | undefined> {
  if (!value) return undefined;
  const match = value.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return value;
  try {
    const res = await fetch(`https://docs.google.com/document/d/${match[1]}/export?format=txt`);
    if (!res.ok) return value;
    return (await res.text()).trim() || undefined;
  } catch {
    return value;
  }
}

function splitCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of row) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

function parseSheetCSV(text: string) {
  const [headerLine, ...rows] = text.trim().split('\n');
  const headers = splitCSVRow(headerLine).map(h => h.toLowerCase().trim());
  return rows
    .filter(r => r.trim())
    .map(row => {
      const cols = splitCSVRow(row);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
      const genderRaw = (obj['sexo'] || '').trim().toLowerCase();
      const gender: 'M' | 'F' = (genderRaw === 'f' || genderRaw === 'femenino' || genderRaw === 'jugadora') ? 'F' : 'M';
      const availRaw = (obj['disponibilidad'] || '').trim().toLowerCase();
      const availability: 'active' | 'inactive' = availRaw === 'inactivo' ? 'inactive' : 'active';
      const bdRaw = (obj['fecha de nacimiento'] || obj['fecha_de_nacimiento'] || obj['birthday'] || '').trim();
      let birthday: string | undefined;
      if (bdRaw) {
        // acepta DD/MM/YYYY o YYYY-MM-DD
        const dmyMatch = bdRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dmyMatch) {
          birthday = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(bdRaw)) {
          birthday = bdRaw;
        }
      }
      return {
        name: (obj['nombre'] || '').trim(),
        photo: convertDriveUrl(obj['foto'] || ''),
        position: (obj['posicion'] || 'Base').trim(),
        club: (obj['club'] || '').trim(),
        description: (obj['descripcion'] || '').trim() || undefined,
        videoUrl: (obj['video'] || '').trim() || undefined,
        gender,
        availability,
        birthday,
      };
    })
    .filter(p => p.name);
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function toPlayer(row: any): Player {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo ?? undefined,
    position: row.position,
    club: row.club,
    gender: row.gender,
    birthday: row.birthday ?? undefined,
    description: row.description ?? undefined,
    videoUrl: row.video_url ?? undefined,
    availability: row.availability,
    createdAt: row.created_at,
  };
}

function fromPlayer(data: Partial<Omit<Player, 'id' | 'createdAt'>>): any {
  const row: any = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.photo !== undefined) row.photo = data.photo ?? null;
  if (data.position !== undefined) row.position = data.position;
  if (data.club !== undefined) row.club = data.club;
  if (data.gender !== undefined) row.gender = data.gender;
  if (data.birthday !== undefined) row.birthday = data.birthday ?? null;
  if (data.description !== undefined) row.description = data.description ?? null;
  if (data.videoUrl !== undefined) row.video_url = data.videoUrl ?? null;
  if (data.availability !== undefined) row.availability = data.availability;
  return row;
}

function toNote(row: any): PlayerNote {
  return {
    id: row.id,
    playerId: row.player_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    category: row.category ?? undefined,
    playerId: row.player_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    createdAt: row.created_at,
  };
}

function toTeam(row: any): Team {
  return {
    id: row.id,
    name: row.name,
    league: row.league ?? undefined,
    category: row.category ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function toScouted(row: any): ScoutedPlayer {
  return {
    id: row.id,
    teamId: row.team_id,
    name: row.name,
    position: row.position ?? undefined,
    age: row.age ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

function toEvent(row: any): AgencyEvent {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    playerId: row.player_id ?? undefined,
    eventDate: row.event_date,
    notified: row.notified,
    createdAt: row.created_at,
  };
}

// ─── Players ────────────────────────────────────────────────────────────────

function sheetPlayerId(name: string): string {
  return 'sheet_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function sheetToPlayer(sp: ReturnType<typeof parseSheetCSV>[number], description?: string): Player {
  return {
    id: sheetPlayerId(sp.name),
    name: sp.name,
    photo: sp.photo,
    position: sp.position,
    club: sp.club,
    gender: sp.gender,
    birthday: sp.birthday,
    description,
    videoUrl: sp.videoUrl,
    availability: sp.availability,
    createdAt: new Date().toISOString(),
  };
}

async function fetchSheetPlayers(): Promise<ReturnType<typeof parseSheetCSV>> {
  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseSheetCSV(await res.text());
}

export const playerStorage = {
  async getAll(): Promise<Player[]> {
    const raw = await fetchSheetPlayers();
    return raw.map(sp => sheetToPlayer(sp));
  },
  async getById(id: string): Promise<Player | undefined> {
    const raw = await fetchSheetPlayers();
    const sp = raw.find(p => sheetPlayerId(p.name) === id);
    if (!sp) return undefined;
    const description = await resolveGoogleDocText(sp.description);
    return sheetToPlayer(sp, description);
  },
  async add(data: Omit<Player, 'id' | 'createdAt'>): Promise<Player> {
    const row = { id: uid(), ...fromPlayer(data), created_at: new Date().toISOString() };
    const { data: inserted, error } = await supabase.from('players').insert(row).select().single();
    if (error) throw error;
    return toPlayer(inserted);
  },
  async update(id: string, data: Partial<Player>): Promise<void> {
    const { error } = await supabase.from('players').update(fromPlayer(data)).eq('id', id);
    if (error) throw error;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── Notes ──────────────────────────────────────────────────────────────────

export const noteStorage = {
  async getByPlayer(playerId: string): Promise<PlayerNote[]> {
    const { data, error } = await supabase
      .from('player_notes')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toNote);
  },
  async add(playerId: string, content: string): Promise<PlayerNote> {
    const now = new Date().toISOString();
    const row = { id: uid(), player_id: playerId, content, created_at: now, updated_at: now };
    const { data, error } = await supabase.from('player_notes').insert(row).select().single();
    if (error) throw error;
    return toNote(data);
  },
  async update(id: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('player_notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('player_notes').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── Tasks ──────────────────────────────────────────────────────────────────

export const taskStorage = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toTask);
  },
  async getGeneral(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .is('player_id', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toTask);
  },
  async getByPlayer(playerId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toTask);
  },
  async add(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const row = {
      id: uid(),
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      priority: data.priority,
      category: data.category ?? null,
      player_id: data.playerId ?? null,
      due_date: data.dueDate ?? null,
      created_at: new Date().toISOString(),
    };
    const { data: inserted, error } = await supabase.from('tasks').insert(row).select().single();
    if (error) throw error;
    return toTask(inserted);
  },
  async update(id: string, data: Partial<Task>): Promise<void> {
    const updates: any = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description ?? null;
    if (data.status !== undefined) updates.status = data.status;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.category !== undefined) updates.category = data.category ?? null;
    if (data.playerId !== undefined) updates.player_id = data.playerId ?? null;
    if (data.dueDate !== undefined) updates.due_date = data.dueDate ?? null;
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) throw error;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── Teams ──────────────────────────────────────────────────────────────────

export const teamStorage = {
  async getAll(): Promise<Team[]> {
    const { data, error } = await supabase.from('teams').select('*').order('name');
    if (error) throw error;
    return (data ?? []).map(toTeam);
  },
  async add(data: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    const row = {
      id: uid(),
      name: data.name,
      league: data.league ?? null,
      category: data.category ?? null,
      notes: data.notes ?? null,
      created_at: new Date().toISOString(),
    };
    const { data: inserted, error } = await supabase.from('teams').insert(row).select().single();
    if (error) throw error;
    return toTeam(inserted);
  },
  async update(id: string, data: Partial<Team>): Promise<void> {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.league !== undefined) updates.league = data.league ?? null;
    if (data.category !== undefined) updates.category = data.category ?? null;
    if (data.notes !== undefined) updates.notes = data.notes ?? null;
    const { error } = await supabase.from('teams').update(updates).eq('id', id);
    if (error) throw error;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) throw error;
  },
  async getById(id: string): Promise<Team | undefined> {
    const { data, error } = await supabase.from('teams').select('*').eq('id', id).single();
    if (error) return undefined;
    return toTeam(data);
  },
};

// ─── Scouted Players ────────────────────────────────────────────────────────

export const scoutedStorage = {
  async getByTeam(teamId: string): Promise<ScoutedPlayer[]> {
    const { data, error } = await supabase
      .from('scouted_players')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toScouted);
  },
  async add(data: Omit<ScoutedPlayer, 'id' | 'createdAt'>): Promise<ScoutedPlayer> {
    const row = {
      id: uid(),
      team_id: data.teamId,
      name: data.name,
      position: data.position ?? null,
      age: data.age ?? null,
      notes: data.notes ?? null,
      status: data.status,
      created_at: new Date().toISOString(),
    };
    const { data: inserted, error } = await supabase.from('scouted_players').insert(row).select().single();
    if (error) throw error;
    return toScouted(inserted);
  },
  async update(id: string, data: Partial<ScoutedPlayer>): Promise<void> {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.position !== undefined) updates.position = data.position ?? null;
    if (data.age !== undefined) updates.age = data.age ?? null;
    if (data.notes !== undefined) updates.notes = data.notes ?? null;
    if (data.status !== undefined) updates.status = data.status;
    const { error } = await supabase.from('scouted_players').update(updates).eq('id', id);
    if (error) throw error;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('scouted_players').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── Events ─────────────────────────────────────────────────────────────────

export const eventStorage = {
  async getAll(): Promise<AgencyEvent[]> {
    const { data, error } = await supabase.from('agency_events').select('*');
    if (error) throw error;
    return (data ?? []).map(toEvent);
  },
  async getUpcoming(days = 30): Promise<AgencyEvent[]> {
    const now = new Date().toISOString();
    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    const { data, error } = await supabase
      .from('agency_events')
      .select('*')
      .gte('event_date', now)
      .lte('event_date', limit.toISOString())
      .order('event_date');
    if (error) throw error;
    return (data ?? []).map(toEvent);
  },
  async add(data: Omit<AgencyEvent, 'id' | 'createdAt'>): Promise<AgencyEvent> {
    const row = {
      id: uid(),
      title: data.title,
      type: data.type,
      player_id: data.playerId ?? null,
      event_date: data.eventDate,
      notified: data.notified,
      created_at: new Date().toISOString(),
    };
    const { data: inserted, error } = await supabase.from('agency_events').insert(row).select().single();
    if (error) throw error;
    return toEvent(inserted);
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('agency_events').delete().eq('id', id);
    if (error) throw error;
  },
  async syncBirthdays(players: Player[]): Promise<void> {
    await supabase.from('agency_events').delete().eq('type', 'birthday');
    const now = new Date();
    const birthdays = players
      .filter(p => p.birthday)
      .map(p => {
        const [by, bm, bd] = p.birthday!.split('-').map(Number);
        const next = new Date(now.getFullYear(), bm - 1, bd);
        if (next < now) next.setFullYear(now.getFullYear() + 1);
        return {
          id: `birthday_${p.id}`,
          title: `Cumpleaños de ${p.name}`,
          type: 'birthday' as const,
          player_id: p.id,
          event_date: next.toISOString(),
          notified: false,
          created_at: new Date().toISOString(),
        };
      });
    if (birthdays.length > 0) {
      await supabase.from('agency_events').upsert(birthdays);
    }
  },
};
