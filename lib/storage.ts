import { supabase } from './supabase';
import { Player, PlayerNote, Task, Team, ScoutedPlayer, AgencyEvent } from '../types';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
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

export const playerStorage = {
  async getAll(): Promise<Player[]> {
    const { data, error } = await supabase.from('players').select('*').order('name');
    if (error) throw error;
    return (data ?? []).map(toPlayer);
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
  async getById(id: string): Promise<Player | undefined> {
    const { data, error } = await supabase.from('players').select('*').eq('id', id).single();
    if (error) return undefined;
    return toPlayer(data);
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
        const bday = new Date(p.birthday!);
        const next = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
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
