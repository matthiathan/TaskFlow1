import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea, Button } from '../ui/Base';
import { Task, TaskPriority, TaskStatus, Profile } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { UserPlus, X, Users, ClipboardCheck, ArrowUpRight, CheckSquare, MessageSquare, AtSign, Send, Trash, ArrowRight, CornerDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { parseTaskDescription, encodeTaskDescription, getTaskProgress, Subtask, TaskComment, scanMentions } from '../../lib/taskUtils';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: any) => Promise<any>;
  onDelete?: (id: string) => Promise<any>;
  initialData?: Task | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSubmit, onDelete, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // Modular States for Subtasks and Comments loaded from JSON packed descriptions
  const [taskText, setTaskText] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  
  // Interactive inputs
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    due_date: '',
    collaborators: [] as string[]
  });

  const getCurrentDateTime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  // Fetch profiles and user session
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setCurrentUser(data);
      }
    };

    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*').limit(50);
      if (data) setProfiles(data);
    };

    if (isOpen) {
      fetchSession();
      fetchProfiles();
    }
  }, [isOpen]);

  // Load and decode Task details
  useEffect(() => {
    if (initialData) {
      const decoded = parseTaskDescription(initialData.description);
      let formattedDate = '';
      if (initialData.due_date) {
        const date = new Date(initialData.due_date);
        const tzOffset = date.getTimezoneOffset() * 60000;
        formattedDate = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      }

      setTaskText(decoded.text);
      setSubtasks(decoded.subtasks || []);
      setComments(decoded.comments || []);

      setFormData({
        title: initialData.title,
        priority: initialData.priority,
        status: initialData.status,
        due_date: formattedDate,
        collaborators: initialData.collaborators || []
      });
    } else {
      setTaskText('');
      setSubtasks([]);
      setComments([]);
      setNewSubtaskTitle('');
      setNewCommentText('');

      setFormData({
        title: '',
        priority: 'medium',
        status: 'pending',
        due_date: getCurrentDateTime(),
        collaborators: []
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Pack text, subtasks, and comments back to text description
      const hasTestingVal = initialData ? !!parseTaskDescription(initialData.description).is_testing : false;
      const packedDescription = encodeTaskDescription({
        text: taskText,
        subtasks: subtasks,
        is_testing: hasTestingVal,
        comments: comments
      });

      await onSubmit({
        title: formData.title,
        status: formData.status,
        priority: formData.priority,
        collaborators: formData.collaborators,
        due_date: formData.due_date || null,
        description: packedDescription
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const toggleCollaborator = (profileId: string) => {
    setFormData(prev => {
      const exists = prev.collaborators.includes(profileId);
      if (exists) {
        return { ...prev, collaborators: prev.collaborators.filter(id => id !== profileId) };
      } else {
        return { ...prev, collaborators: [...prev.collaborators, profileId] };
      }
    });
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialData.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  // --- Automated Subtask Tree Handlers ---
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false,
      parentId: null // start as top-level (main task level)
    };
    setSubtasks(prev => [...prev, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(prev => prev.map(sub => 
      sub.id === id ? { ...sub, completed: !sub.completed } : sub
    ));
  };

  const handleToggleIndent = (id: string) => {
    // Indent converts root level to nested level, parentId references previous item's ID
    setSubtasks(prev => {
      return prev.map((sub, index) => {
        if (sub.id !== id) return sub;
        
        // If already nested, bring back to root
        if (sub.parentId) {
          return { ...sub, parentId: null };
        } else {
          // Nest inside previous item if exists
          const prevItem = prev[index - 1];
          return { ...sub, parentId: prevItem ? prevItem.id : 'nested' };
        }
      });
    });
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(sub => sub.id !== id));
  };

  // --- Secure Mention / Comment Handlers ---
  const handlePostComment = async () => {
    if (!newCommentText.trim() || !currentUser) return;
    
    const textComments = newCommentText.trim();
    const matchedMentions = scanMentions(textComments);
    let updatedCollaborators = [...formData.collaborators];

    // Search matched profiles
    for (const mention of matchedMentions) {
      const matchedProfile = profiles.find(p => {
        const emailPrefix = p.email.split('@')[0].toLowerCase();
        const fullName = p.full_name ? p.full_name.replace(/\s+/g, '').toLowerCase() : '';
        return emailPrefix === mention || fullName === mention;
      });

      if (matchedProfile) {
        // 1. Add clearance access (Collaborators) automatically
        if (!updatedCollaborators.includes(matchedProfile.id)) {
          updatedCollaborators.push(matchedProfile.id);
          toast.success(`Access Cleared: Assigned @${mention}`);
        }

        // 2. Transmit Secure Message to Secure Comms inbox
        try {
          await supabase.from('messages').insert({
            content: `🔔 [Task Alert] You were assigned and mentioned in task "${formData.title || 'Task'}": "${textComments}"`,
            sender_id: currentUser.id,
            recipient_id: matchedProfile.id
          });
          toast.success(`Secure comms notification sent to @${mention}`);
        } catch (e) {
          console.error("Comms notify fallback:", e);
        }
      }
    }

    const newComment: TaskComment = {
      id: crypto.randomUUID(),
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || currentUser.email.split('@')[0],
      content: textComments,
      created_at: new Date().toISOString()
    };

    const nextComments = [...comments, newComment];
    setComments(nextComments);
    setNewCommentText('');

    // Trigger form state updates
    setFormData(prev => ({ ...prev, collaborators: updatedCollaborators }));

    // If writing in active edit mode, sync changes directly and let instant listener retrieve it!
    if (initialData) {
      const livePackedDescription = encodeTaskDescription({
        text: taskText,
        subtasks: subtasks,
        is_testing: parseTaskDescription(initialData.description).is_testing,
        comments: nextComments
      });

      await onSubmit({
        title: formData.title,
        status: formData.status,
        priority: formData.priority,
        collaborators: updatedCollaborators,
        due_date: formData.due_date || null,
        description: livePackedDescription
      });
    }
  };

  const subtasksProgress = getTaskProgress(subtasks);

  return (
    <Modal 
      id="task-form" 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? "Edit Task" : "Create Task"}
      className="max-w-[1165px]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin">
        
        {/* LEFT COMPONENT: Primary Parameters Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5 lg:pr-6 lg:border-r lg:border-brand-border/30">
          <Input 
            label="Task Title"
            value={formData.title}
            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
            placeholder="Prepare quarterly report..."
            required
          />
          
          <Textarea 
            label="Description"
            value={taskText}
            onChange={e => setTaskText(e.target.value)}
            placeholder="Task description and details..."
            className="min-h-[100px]"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Priority</label>
              <select 
                className="w-full bg-bg-base border border-brand-border rounded-lg px-3 py-2 text-xs font-semibold uppercase outline-none focus:border-brand-gold input-recessed text-text-primary"
                value={formData.priority}
                onChange={e => setFormData(p => ({ ...p, priority: e.target.value as TaskPriority }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Status</label>
              <select 
                className="w-full bg-bg-base border border-brand-border rounded-lg px-3 py-2 text-xs font-semibold uppercase outline-none focus:border-brand-gold input-recessed text-text-primary"
                value={formData.status}
                onChange={e => setFormData(p => ({ ...p, status: e.target.value as TaskStatus }))}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <Input 
            label="Target Deadline"
            type="datetime-local"
            value={formData.due_date}
            onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))}
          />

          {/* Personnel access credentials */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Assign Collaborators</label>
              <span className="text-[8px] font-black uppercase text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 border border-brand-gold/20 rounded">
                {formData.collaborators.length + 1} Assigned
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto p-2 border border-brand-border rounded-lg bg-bg-elevated/30">
              {profiles.map(profile => {
                const isCleared = formData.collaborators.includes(profile.id);
                const isSelf = currentUser && currentUser.id === profile.id;

                if (isSelf) return null; // Creator of task is assigned by default

                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => toggleCollaborator(profile.id)}
                    className={cn(
                      "px-2 py-1 rounded text-[9px] font-black uppercase transition-all border",
                      isCleared
                        ? "bg-brand-gold text-white border-brand-gold shadow-sm"
                        : "bg-bg-base text-text-secondary border-brand-border hover:border-brand-gold/40"
                    )}
                  >
                    {profile.full_name || profile.email.split('@')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            {initialData && onDelete && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDelete}
                isLoading={deleting}
                className="px-4 border-red-500/30 text-red-500 hover:bg-red-500/10 uppercase font-bold text-[10px] tracking-widest"
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 uppercase font-bold text-[10px] tracking-widest text-text-secondary">Cancel</Button>
            <Button type="submit" isLoading={loading} className="flex-1 uppercase font-black text-[10px] tracking-widest">
              {initialData ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>

        {/* RIGHT COMPONENT: Automated Checklist + Secure Activity comments */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Automated Subtask checklist Tree */}
          <div className="space-y-3 bg-bg-base/30 border border-brand-border/60 p-4 rounded-xl">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/30">
              <div className="flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-brand-gold" />
                <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">Task Checklist</span>
              </div>
              <span className="text-[9px] font-mono text-brand-gold font-bold">{subtasksProgress.percentage}%</span>
            </div>

            {/* Checklist progress bar */}
            {subtasks.length > 0 && (
              <div className="w-full h-1 bg-bg-elevated border border-brand-border/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-gold rounded-full transition-all duration-300"
                  style={{ width: `${subtasksProgress.percentage}%` }}
                />
              </div>
            )}

            {/* Subtasks tree lists */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
              {subtasks.length === 0 ? (
                <p className="text-[9px] text-text-secondary italic">No checklist items yet.</p>
              ) : (
                subtasks.map((sub) => (
                  <div 
                    key={sub.id} 
                    className={cn(
                      "flex items-center justify-between group/sub transition-all",
                      sub.parentId ? "ml-4 border-l border-brand-gold/20 pl-2 bg-bg-elevated/10" : "ml-0"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-grow">
                      <input 
                        type="checkbox" 
                        checked={sub.completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="rounded border-brand-border text-brand-gold focus:ring-brand-gold w-3 h-3 cursor-pointer"
                      />
                      <span className={cn(
                        "text-[10px] truncate leading-none text-text-primary",
                        sub.completed && "line-through text-text-secondary/40"
                      )}>
                        {sub.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleToggleIndent(sub.id)}
                        title={sub.parentId ? "Outdent Level" : "Indent Level"}
                        className="text-[9px] text-text-secondary hover:text-brand-gold p-0.5 rounded"
                      >
                        {sub.parentId ? <ArrowUpRight className="w-2.5 h-2.5 rotate-180" /> : <CornerDownRight className="w-2.5 h-2.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="text-[9px] text-text-secondary hover:text-red-500 p-0.5 rounded"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Subtask addition input */}
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Add checklist item..."
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                className="flex-grow bg-bg-base border border-brand-border rounded px-2.5 py-1.5 text-[10px] font-medium outline-none text-text-primary placeholder:text-text-secondary/35 focus:border-brand-gold shadow-inner"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="bg-brand-gold text-white px-2 py-1 rounded hover:bg-brand-gold/80 flex items-center justify-center transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Secure Directive Logs / Comments with @username Mention support */}
          <div className="space-y-3 bg-bg-base/30 border border-brand-border/60 p-4 rounded-xl flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/30">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-brand-gold" />
                <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">Task Comments</span>
              </div>
                <span className="text-[7px] font-black uppercase bg-brand-gold/10 px-1.5 py-0.5 border border-brand-gold/25 text-brand-gold rounded">
                INTERNAL
              </span>
            </div>

            {/* List historic comments */}
            <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1 scrollbar-thin">
              {comments.length === 0 ? (
                <p className="text-[9px] text-text-secondary italic py-2">No comments logged.</p>
              ) : (
                comments.map((comm) => (
                  <div key={comm.id} className="p-2 bg-bg-elevated/40 border border-brand-border/30 rounded-lg space-y-1">
                    <div className="flex justify-between text-[8px] font-bold text-text-secondary uppercase">
                      <span className="text-brand-gold flex items-center gap-0.5">
                        <AtSign className="w-2 h-2" />
                        {comm.sender_name}
                      </span>
                      <span>{new Date(comm.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[10px] text-text-primary leading-normal break-words whitespace-pre-wrap">
                      {comm.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Comment posting input */}
            <div className="space-y-2 mt-2">
              <div className="relative">
                <textarea 
                  rows={2}
                  placeholder="Add comment... (Type @username to mention a person)"
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  className="w-full bg-bg-base border border-brand-border rounded-lg p-2 text-[10px] font-medium leading-normal text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-gold transition-colors resize-none shadow-inner"
                />
              </div>
              <button
                type="button"
                onClick={handlePostComment}
                className="w-full bg-bg-elevated border border-brand-border text-[9px] font-black uppercase tracking-widest text-text-primary hover:text-brand-gold hover:border-brand-gold p-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Send className="w-3 h-3 text-brand-gold" />
                <span>Post Comment</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </Modal>
  );
};
