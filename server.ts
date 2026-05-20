import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from '@supabase/supabase-js';
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors()); // Enable CORS for external access
app.use(express.json());

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

// Admin Middleware: Verify requesting user is an admin
const adminAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No credentials" });

  try {
    const token = authHeader.replace('Bearer ', '');
    // We check the role of the user associated with this token via Supabase
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

// External API Middleware: Verify API Key
const externalAuth = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.EXTERNAL_TASK_API_KEY;

  if (!validKey) {
    return res.status(500).json({ error: "External API not configured" });
  }

  if (apiKey !== validKey) {
    return res.status(401).json({ error: "Invalid API Key" });
  }

  next();
};

// --- EXTERNAL API ENDPOINTS ---

// Expose tasks for external applications
app.get("/api/external/tasks", externalAuth, async (req, res) => {
  try {
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        id,
        created_at,
        title,
        description,
        priority,
        status,
        due_date,
        user_id,
        profiles (
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN API ENDPOINTS ---

// List all users (Auth + Profiles)
app.get("/api/admin/users", adminAuth, async (req, res) => {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user
app.post("/api/admin/users", adminAuth, async (req, res) => {
  const { email, password, full_name, role } = req.body;
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });
    if (error) throw error;

    // Supabase trigger should handle profile creation, but we can verify/update if needed
    if (role || full_name) {
      await supabaseAdmin
        .from('profiles')
        .update({ full_name, role })
        .eq('id', user?.id);
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user password or metadata
app.patch("/api/admin/users/:id", adminAuth, async (req, res) => {
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
      
      await supabaseAdmin
        .from('profiles')
        .update(pUpdate)
        .eq('id', id);
    }

    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete("/api/admin/users/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- VITE MIDDLEWARE ---

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
