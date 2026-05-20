-- Dallmayr OpsPortal - Enterprise SQL Architecture
-- Execute these commands in your Supabase SQL Editor

-- 1. CLEANUP (Optional - Use with caution)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. PROFILE & ROLE SYSTEM
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'tech', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. OPERATIONAL MODULES
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  due_date TIMESTAMPTZ,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  collaborators UUID[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT DEFAULT 'awaiting_tech' CHECK (status IN ('awaiting_tech', 'diagnostic', 'repaired', 'closed')),
  qr_code TEXT,
  serial_number TEXT,
  occurrence_time TIMESTAMPTZ,
  machine_images TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'functional' CHECK (status IN ('functional', 'degraded', 'offline')),
  last_maintenance DATE DEFAULT CURRENT_DATE,
  location TEXT
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  content TEXT NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL means global chat or system broadcast
  recipient_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE -- Added for easier relationship mapping if needed
);

-- 3.5 CONVERSATIONS TRACKING
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_b UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted_a BOOLEAN DEFAULT FALSE,
  is_deleted_b BOOLEAN DEFAULT FALSE,
  UNIQUE(user_a, user_b),
  CONSTRAINT sorted_users CHECK (user_a < user_b)
);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 5. ACCESS CONTROL POLICIES (RBAC Implementation)
-- GRANT permissions to the roles before defining policies
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- CONVERSATIONS: Only participants can see.
CREATE POLICY "Conversations visibility" ON public.conversations
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Conversations update" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- PROFILES: Everyone authenticated can see, only user/admin can update.
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- TASKS: Owners and collaborators or Tech/Admin can view.
DROP POLICY IF EXISTS "Tasks visibility" ON public.tasks;
DROP POLICY IF EXISTS "Tasks viewable by authenticated users" ON public.tasks;
CREATE POLICY "Tasks visibility" ON public.tasks FOR SELECT USING (
  auth.uid() = user_id OR 
  auth.uid() = ANY(collaborators) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tech', 'admin'))
);

DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners, collaborators, techs, and admins can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Owners, Techs, and Admins can update tasks" ON public.tasks;
CREATE POLICY "Owners, collaborators, techs, and admins can update tasks" ON public.tasks FOR UPDATE USING (
  auth.uid() = user_id OR 
  auth.uid() = ANY(collaborators) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tech', 'admin'))
);

DROP POLICY IF EXISTS "Owners and Admins can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
CREATE POLICY "Owners and Admins can delete tasks" ON public.tasks FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- TICKETS: Users see their own. Tech/Admin see all.
CREATE POLICY "Tickets visibility" ON public.tickets FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tech', 'admin'))
);
CREATE POLICY "Users can submit tickets" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ASSETS: Viewable by all, managed by Tech/Admin.
CREATE POLICY "Assets viewable by all staff" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Tech and Admin can manage assets" ON public.assets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tech', 'admin'))
);

-- MESSAGES: Auth users can read messages where they are sender or recipient, or public ones.
CREATE POLICY "Direct messaging visibility" ON public.messages FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    recipient_id IS NULL OR 
    sender_id = auth.uid() OR 
    recipient_id = auth.uid()
  )
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 6. AUTOMATED USER REGISTRATION TRIGGER
CREATE OR REPLACE FUNCTION public.sync_conversation()
RETURNS TRIGGER AS $$
DECLARE
  ua UUID;
  ub UUID;
BEGIN
  -- Only track direct messages
  IF NEW.recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  ua := LEAST(NEW.sender_id, NEW.recipient_id);
  ub := GREATEST(NEW.sender_id, NEW.recipient_id);

  INSERT INTO public.conversations (user_a, user_b, last_message_at, is_deleted_a, is_deleted_b)
  VALUES (ua, ub, NEW.created_at, FALSE, FALSE)
  ON CONFLICT (user_a, user_b) DO UPDATE SET 
    last_message_at = EXCLUDED.last_message_at,
    is_deleted_a = CASE WHEN public.conversations.user_a = EXCLUDED.user_a THEN FALSE ELSE public.conversations.is_deleted_a END,
    is_deleted_b = CASE WHEN public.conversations.user_b = EXCLUDED.user_b THEN FALSE ELSE public.conversations.is_deleted_b END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_sent
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.sync_conversation();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)), 
    'user' -- Default role assignment
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. REPAIR RELATIONSHIPS (Run these if you see "Could not find relationship" errors)
-- ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
-- ALTER TABLE public.tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;
-- ALTER TABLE public.tickets ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
-- ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id);

-- 8. CONVERSATION BACKFILL & CLEANUP
-- Run this to index existing messages into the conversations sidebar
INSERT INTO public.conversations (user_a, user_b, last_message_at, is_deleted_a, is_deleted_b)
SELECT 
    LEAST(sender_id, recipient_id) as ua, 
    GREATEST(sender_id, recipient_id) as ub,
    MAX(created_at) as last_msg,
    FALSE, 
    FALSE
FROM public.messages
WHERE recipient_id IS NOT NULL
GROUP BY ua, ub
ON CONFLICT (user_a, user_b) DO UPDATE SET 
    last_message_at = EXCLUDED.last_message_at;

-- 9. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
