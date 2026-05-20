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
  sender_profile?: Profile;
}

export interface Ticket {
  id: string;
  created_at: string;
  title: string;
  description_encrypted: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  priority: TaskPriority;
  attachment_urls: string[];
  user_id: string;
}

export interface Asset {
  id: string;
  name: string;
  serial_number: string;
  category: string;
  status: 'functional' | 'degraded' | 'offline';
  last_maintenance: string;
}
