import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from '@supabase/supabase-js';
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";

dotenv.config();

const PORT = 3000;
const app = express();

// Initialize Supabase Admin Client (Service Role)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("ADMIN SECURITY WARNING: SUPABASE_SERVICE_ROLE_KEY not configured. Admin Hub user management will be restricted.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Base Auth Middleware: Verify token and attach user
const auth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No credentials" });

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) throw new Error("Invalid token");

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

// Admin Middleware: Verify requesting user is an admin
const adminAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No credentials" });

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) throw new Error("Invalid token");

    // Check custom roles in public.profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return res.status(403).json({ error: "Access Denied: Admin Clearance Required" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

// External API Middleware: Verify API Key from DB
const externalAuth = async (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: "API Key required" });
  }

  try {
    // Check if any profile has this API key
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('api_key', apiKey)
      .single();

    if (error || !profile) {
      return res.status(401).json({ error: "Invalid API Key" });
    }

    req.user = profile;
    next();
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// --- VITE MIDDLEWARE & SERVER START ---

// Logging Middleware
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API REQUEST] ${new Date().toISOString()} ${req.method} ${req.url}`);
  }
  next();
});

// Security & Parsing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
})); 
app.use(express.json());

// --- API ROUTES ---

// Health Check
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Auth Key Management
app.get("/api/api-key", auth, async (req: any, res: any) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('api_key')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json({ apiKey: data.api_key });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/api-key", auth, async (req: any, res: any) => {
  try {
    const newKey = `ops_${crypto.randomUUID().replace(/-/g, '')}`;
    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: req.user.id, 
        api_key: newKey,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;
    res.json({ apiKey: newKey });
  } catch (error: any) {
    console.error('API Key Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// External Tasks
app.get("/api/external/tasks", externalAuth, async (req: any, res: any) => {
  try {
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        id, created_at, title, description, priority, status, due_date, user_id,
        profiles (full_name, role)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Endpoints
app.get("/api/admin/users", adminAuth, async (req, res) => {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/users", adminAuth, async (req, res) => {
  const { email, password, full_name, role } = req.body;
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name, role }
    });
    if (error) throw error;
    if (role || full_name) {
      await supabaseAdmin.from('profiles').update({ full_name, role }).eq('id', user?.id);
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/admin/users/:id", adminAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const { password, full_name, role } = req.body;
  try {
    const updateData: any = {};
    if (password) updateData.password = password;
    if (full_name || role) updateData.user_metadata = { full_name, role };

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
    if (error) throw error;

    if (full_name || role) {
      const pUpdate: any = {};
      if (full_name) pUpdate.full_name = full_name;
      if (role) pUpdate.role = role;
      await supabaseAdmin.from('profiles').update(pUpdate).eq('id', id);
    }
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/users/:id", adminAuth, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- VITE MIDDLEWARE & SERVER START ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[${new Date().toISOString()}] Server listening on port ${PORT}`);
  });
}

startServer();
