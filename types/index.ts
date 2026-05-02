export interface Player {
  id: string;
  name: string;
  photo?: string;
  position: string;
  club: string;
  gender: 'M' | 'F';
  birthday?: string;
  description?: string;
  videoUrl?: string;
  availability: 'active' | 'inactive';
  createdAt: string;
}

export interface PlayerNote {
  id: string;
  playerId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  playerId?: string;
  dueDate?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  league?: string;
  category?: string;
  notes?: string;
  createdAt: string;
}

export interface ScoutedPlayer {
  id: string;
  teamId: string;
  name: string;
  position?: string;
  age?: number;
  notes?: string;
  status: 'watching' | 'contacted' | 'rejected' | 'signed';
  createdAt: string;
}

export interface AgencyEvent {
  id: string;
  title: string;
  type: 'birthday' | 'match' | 'reminder';
  playerId?: string;
  eventDate: string;
  notified: boolean;
  createdAt: string;
}
