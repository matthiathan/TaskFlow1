import React from 'react';
import { Edit2, Archive, Trash2 } from 'lucide-react';
import { Task, TaskStatus } from '../../types/database';
import { PriorityBadge, StatusBadge } from './TaskUI';

interface ListViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onArchive: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({ tasks, onEdit, onStatusChange, onArchive, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 bg-bg-elevated border border-dashed border-brand-border rounded-sm shadow-sm transition-colors duration-300">
        <p className="text-sm font-serif italic text-text-muted">No operational records found in this vector.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-elevated border border-brand-border shadow-sm overflow-hidden rounded-sm transition-colors duration-300">
      <table className="enterprise-table">
        <thead>
          <tr>
            <th>Identifier / Title</th>
            <th>Strategic Priority</th>
            <th>Scheduled Due Date</th>
            <th>Operational Status</th>
            <th className="text-right">Action Protocol</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id} className="group">
              <td>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-text-primary">{task.title}</span>
                  <span className="text-[10px] text-text-secondary italic line-clamp-1">{task.description}</span>
                </div>
              </td>
              <td>
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="font-mono text-[11px] text-text-secondary">
                {task.due_date}
              </td>
              <td>
                <select 
                  value={task.status}
                  onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                  className="bg-bg-surface border border-brand-border px-2 py-1 text-[10px] font-bold uppercase tracking-tighter rounded-sm focus:outline-none focus:border-brand-gold transition-all shadow-sm text-text-primary"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="meeting">Meeting</option>
                  <option value="completed">Completed</option>
                </select>
              </td>
              <td className="text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-brand-gold rounded-sm shadow-sm cursor-pointer">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => onArchive(task.id, task.is_archived)} className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-text-primary rounded-sm shadow-sm cursor-pointer">
                    <Archive size={13} />
                  </button>
                  <button onClick={() => onDelete(task.id)} className="p-1.5 hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-sm shadow-sm cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
