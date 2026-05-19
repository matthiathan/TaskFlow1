export type UserRole = 'admin' | 'road_tech' | 'user';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export type ERPRequestStatus = 'pending' | 'in_progress' | 'resolved' | 'archived';

export interface ERPRequest {
  id: string;
  task_number: string;
  serial_number: string;
  qr_code: string;
  title: string;
  issue: string; // Encrypted in DB
  requester_name: string;
  status: ERPRequestStatus;
  request_date: string;
  request_time: string;
  image_urls: string[];
  documents: string[];
  escalated_to: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface Verification {
  id: string;
  qr_code: string;
  serial_number: string;
  verification_date: string;
  verification_time: string;
  direction: 'Inbound' | 'Outbound';
  location: string;
  is_archived: boolean;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'meeting';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string;
  due_date: string;
  is_archived: boolean;
}

// Helper for Supabase Table Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
      erp_requests: {
        Row: ERPRequest;
        Insert: Omit<ERPRequest, 'id' | 'created_at'>;
        Update: Partial<Omit<ERPRequest, 'id' | 'created_at'>>;
      };
      verifications: {
        Row: Verification;
        Insert: Omit<Verification, 'id'>;
        Update: Partial<Omit<Verification, 'id'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id'>;
        Update: Partial<Omit<Task, 'id'>>;
      };
    };
  };
}
