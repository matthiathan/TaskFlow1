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
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'tech', 'admin', 'ops_manager', 'road_tech')),
  api_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. OPERATIONAL MODULES
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'active')),
  due_date TIMESTAMPTZ,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  collaborators UUID[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  client_name TEXT,
  issue_description TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT DEFAULT 'awaiting_tech' CHECK (status IN ('awaiting_tech', 'diagnostic', 'repaired', 'closed')),
  qr_code TEXT,
  serial_number TEXT,
  occurrence_time TIMESTAMPTZ,
  machine_images TEXT[] DEFAULT '{}',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'functional' CHECK (status IN ('functional', 'degraded', 'offline', 'INHOUSE_NOT_READY', 'INHOUSE_READY', 'AT_CLIENT')),
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

-- 10. FIELD OPERATIONS & SERVICE ROUTES
CREATE TABLE IF NOT EXISTS public.field_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  road_tech_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_location TEXT NOT NULL,
  task_description TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'late', 'arrived_on_time', 'arrived_late', 'no_arrival')),
  check_in_time TIMESTAMPTZ,
  check_in_lat DOUBLE PRECISION,
  check_in_lng DOUBLE PRECISION
);

-- Realtime for live dispatch and tracking updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.field_routes;

-- Enable RLS
ALTER TABLE public.field_routes ENABLE ROW LEVEL SECURITY;

-- Grants for field_routes
GRANT ALL ON public.field_routes TO postgres, service_role;
GRANT SELECT ON public.field_routes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.field_routes TO authenticated;

-- Policies for field_routes
CREATE POLICY "Field routes visibility" ON public.field_routes 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Ops and Admin can insert routes" ON public.field_routes 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ops_manager', 'admin'))
  );

CREATE POLICY "Allowed updates to field routes" ON public.field_routes 
  FOR UPDATE USING (
    auth.uid() = road_tech_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ops_manager', 'admin'))
  );

  );

CREATE TABLE IF NOT EXISTS public.driver_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL
);

-- Ensure only these columns exist (if table exists, add them if missing or ignore extra)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_telemetry' AND column_name='speed_kmh') THEN
        ALTER TABLE public.driver_telemetry DROP COLUMN speed_kmh;
    END IF;
END $$;


-- Telemetry Alerts Table
CREATE TABLE IF NOT EXISTS public.telemetry_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  speed_kmh DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

-- Trigger Function for Speeding Violations
CREATE OR REPLACE FUNCTION public.check_telemetry_speed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.speed_kmh > 125 THEN
    INSERT INTO public.telemetry_alerts (driver_id, speed_kmh, recorded_at, latitude, longitude)
    VALUES (NEW.driver_id, NEW.speed_kmh, NEW.recorded_at, NEW.latitude, NEW.longitude);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_telemetry_insert
  AFTER INSERT ON public.driver_telemetry
  FOR EACH ROW EXECUTE PROCEDURE public.check_telemetry_speed();

-- Route Reconstruction View with Gap Handling
-- Note: Requires PostGIS extension enabled in Supabase
CREATE OR REPLACE VIEW public.v_driver_route_history AS
SELECT 
  driver_id,
  recorded_at::date as route_date,
  ST_MakeLine(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) ORDER BY recorded_at) as route_line
FROM public.driver_telemetry
GROUP BY driver_id, recorded_at::date;
-- 12. PUSH NOTIFICATION ENGINE (OneSignal)
-- (lines omitted for brevity, adding ERP POLICIES here)

-- 13. ERP MODULE POLICIES
-- Enable RLS and add policies for ERP tables
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.erp_assets ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.erp_qr_mapping ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.erp_service_logs ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.erp_contracts_cpt ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.erp_contracts_jhb ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.erp_contracts_kzn ENABLE ROW LEVEL SECURITY';
END $$;

-- Policies
CREATE OR REPLACE FUNCTION public.is_erp_privileged() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tech', 'admin', 'ops_manager'));
$$ LANGUAGE sql SECURITY DEFINER;

-- Assets
CREATE POLICY "ERP Assets Select" ON public.erp_assets FOR SELECT USING (true);
CREATE POLICY "ERP Assets Modify" ON public.erp_assets FOR ALL USING (public.is_erp_privileged());

-- QR Mapping
CREATE POLICY "ERP QR Select" ON public.erp_qr_mapping FOR SELECT USING (true);
CREATE POLICY "ERP QR Modify" ON public.erp_qr_mapping FOR ALL USING (public.is_erp_privileged());

-- Service Logs
CREATE POLICY "ERP Logs Select" ON public.erp_service_logs FOR SELECT USING (true);
CREATE POLICY "ERP Logs Modify" ON public.erp_service_logs FOR ALL USING (public.is_erp_privileged());

-- Contracts
CREATE POLICY "ERP CPT Select" ON public.erp_contracts_cpt FOR SELECT USING (true);
CREATE POLICY "ERP CPT Modify" ON public.erp_contracts_cpt FOR ALL USING (public.is_erp_privileged());

CREATE POLICY "ERP JHB Select" ON public.erp_contracts_jhb FOR SELECT USING (true);
CREATE POLICY "ERP JHB Modify" ON public.erp_contracts_jhb FOR ALL USING (public.is_erp_privileged());

CREATE POLICY "ERP KZN Select" ON public.erp_contracts_kzn FOR SELECT USING (true);
CREATE POLICY "ERP KZN Modify" ON public.erp_contracts_kzn FOR ALL USING (public.is_erp_privileged());

CREATE OR REPLACE FUNCTION public.trigger_role_notification(target_role TEXT, message TEXT)
RETURNS void AS $$
DECLARE
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'app_id', 'YOUR_ONESIGNAL_APP_ID',
    'contents', jsonb_build_object('en', message),
    'filters', jsonb_build_array(
      jsonb_build_object('field', 'tag', 'key', 'role', 'relation', '=', 'value', target_role)
    )
  );

  PERFORM net.http_post(
    url := 'https://onesignal.com/api/v1/notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Basic ' || current_setting('app.settings.onesignal_rest_api_key')
    ),
    body := payload
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_user_via_onesignal()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload JSONB;
BEGIN
  -- We assume NEW.user_id is the recipient. 
  -- Ensure you have set ONESIGNAL_REST_API_KEY in Supabase Vault/Secrets.
  notification_payload := jsonb_build_object(
    'app_id', 'YOUR_ONESIGNAL_APP_ID',
    'include_aliases', jsonb_build_object('external_id', jsonb_build_array(NEW.user_id::text)),
    'contents', jsonb_build_object('en', 'New record assigned: ' || COALESCE(NEW.title, 'System Update')),
    'headings', jsonb_build_object('en', 'Dallmayr FSM Alert')
  );

  PERFORM net.http_post(
    url := 'https://onesignal.com/api/v1/notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Basic ' || current_setting('app.settings.onesignal_rest_api_key')
    ),
    body := notification_payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for tasks
CREATE TRIGGER on_task_created
  AFTER INSERT ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.notify_user_via_onesignal();

-- Trigger for tickets
CREATE TRIGGER on_ticket_created
  AFTER INSERT ON public.tickets
  FOR EACH ROW EXECUTE PROCEDURE public.notify_user_via_onesignal();

CREATE OR REPLACE FUNCTION public.process_machine_scan(asset_serial TEXT, scanned_by_user_id UUID, user_role TEXT)
RETURNS JSONB AS $$
DECLARE
  v_asset RECORD;
  v_result JSONB;
BEGIN
  -- 1. Get Asset
  SELECT * INTO v_asset FROM public.assets WHERE serial_number = asset_serial;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Asset not found');
  END IF;

  -- 3. State Machine
  IF user_role = 'warehouse' THEN
    UPDATE public.assets SET status = 'INHOUSE_NOT_READY' WHERE id = v_asset.id;
    PERFORM public.trigger_role_notification('tech', 'Machine ' || asset_serial || ' ready for intake');
    v_result := jsonb_build_object('status', 'updated', 'new_status', 'INHOUSE_NOT_READY');

  ELSIF user_role = 'tech' THEN
    UPDATE public.assets SET status = 'INHOUSE_READY' WHERE id = v_asset.id;
    PERFORM public.trigger_role_notification('ops_manager', 'Machine ' || asset_serial || ' ready for routing');
    v_result := jsonb_build_object('status', 'updated', 'new_status', 'INHOUSE_READY');

  ELSIF user_role = 'ops_manager' THEN
    INSERT INTO public.tasks (title, user_id, priority, status)
    VALUES ('Route Machine ' || asset_serial, scanned_by_user_id, 'urgent', 'active');
    PERFORM public.trigger_role_notification('driver', 'New priority route assigned');
    v_result := jsonb_build_object('status', 'task_created');

  ELSIF user_role = 'driver' THEN
    UPDATE public.assets SET status = 'AT_CLIENT' WHERE id = v_asset.id;
    UPDATE public.tasks SET status = 'resolved' WHERE user_id = scanned_by_user_id AND status = 'active';
    v_result := jsonb_build_object('status', 'updated', 'new_status', 'AT_CLIENT');
  ELSE
    RETURN jsonb_build_object('error', 'Unauthorized role');
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


