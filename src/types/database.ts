export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'resolved';

export interface Task {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  user_id: string;
  collaborators: string[];
  deleted_at?: string | null;
}

export type Role = 'user' | 'tech' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  created_at: string;
}

export interface Message {
  id: string;
  created_at: string;
  content: string;
  sender_id: string;
  recipient_id: string | null;
  sender_profile?: Profile;
}

export interface Conversation {
  id: string;
  user_a: string;
  user_b: string;
  last_message_at: string;
  is_deleted_a: boolean;
  is_deleted_b: boolean;
  participant?: Profile;
}

export type TicketStatus = 'awaiting_tech' | 'diagnostic' | 'repaired' | 'closed';

export interface Ticket {
  id: string;
  created_at: string;
  title: string;
  issue_description: string;
  status: TicketStatus;
  priority: TaskPriority;
  qr_code: string | null;
  serial_number: string | null;
  occurrence_time: string | null;
  machine_images: string[];
  user_id: string;
  deleted_at?: string | null;
}

export interface Asset {
  id: string;
  name: string;
  serial_number: string;
  category: string;
  status: 'functional' | 'degraded' | 'offline';
  last_maintenance: string;
}
