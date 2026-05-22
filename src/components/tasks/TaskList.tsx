import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../../types/database';
import { cn } from '../../lib/utils';
import { AlertCircle, Clock, CheckCircle2, Trash2, Edit2, Users, ClipboardCheck, FlaskConical, Calendar as CalIcon } from 'lucide-react';
import { Button } from '../ui/Base';
import { parseTaskDescription, getTaskProgress } from '../../lib/taskUtils';

interface TaskListProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const styles = {
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
    medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider', styles[priority])}>
      {priority}
    </span>
  );
};

export const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdateStatus, onDelete, onEdit }) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 border border-dashed border-brand-border rounded-xl bg-bg-elevated/30">
        <p className="text-text-secondary text-sm font-medium uppercase tracking-widest text-[10px]">No operational directives identified in current sector.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-elevated border border-brand-border rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-brand-border bg-bg-base/60 text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary">
              <th className="py-4 px-6">Directive Briefing</th>
              <th className="py-4 px-4 w-32">Threat Status</th>
              <th className="py-4 px-4 w-44">Subtasks Progress</th>
              <th className="py-4 px-4 w-36">Personnel Clear</th>
              <th className="py-4 px-4 w-44">Target Timeline</th>
              <th className="py-4 px-4 w-36 text-center">Protocol Action</th>
              <th className="py-4 px-6 w-28 text-right">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {tasks.map((task) => {
              const parsed = parseTaskDescription(task.description);
              const progress = getTaskProgress(parsed.subtasks);

              // Render custom icon
              let statusIcon = <Clock className="w-4 h-4 text-neutral-400" />;
              if (task.status === 'resolved') {
                statusIcon = <CheckCircle2 className="w-4 h-4 text-green-500 animate-pulse" />;
              } else if (parsed.is_testing) {
                statusIcon = <FlaskConical className="w-4 h-4 text-purple-500" />;
              } else if (task.status === 'in_progress') {
                statusIcon = <AlertCircle className="w-4 h-4 text-brand-gold animate-bounce" />;
              }

              return (
                <tr 
                  key={task.id}
                  className="hover:bg-bg-base/30 transition-colors group"
                >
                  {/* Directive Briefing */}
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {statusIcon}
                      </div>
                      <div className="min-w-0">
                        <span 
                          onClick={() => onEdit(task)}
                          className="text-xs font-black text-text-primary hover:text-brand-gold cursor-pointer transition-colors block uppercase tracking-wide"
                        >
                          {task.title}
                        </span>
                        <p className="text-[10px] text-text-secondary mt-1 max-w-sm line-clamp-1">
                          {parsed.text || 'No parameter briefing.'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Threat status */}
                  <td className="py-4 px-4">
                    <PriorityBadge priority={task.priority} />
                  </td>

                  {/* Subtask progress */}
                  <td className="py-4 px-4">
                    {parsed.subtasks.length > 0 ? (
                      <div className="space-y-1 max-w-[140px]">
                        <div className="flex justify-between items-center text-[8px] font-black text-text-secondary uppercase tracking-widest leading-none">
                          <span>{progress.completed}/{progress.total} Done</span>
                          <span>{progress.percentage}%</span>
                        </div>
                        <div className="w-full h-1 bg-bg-base border border-brand-border rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-300 rounded-full",
                              progress.percentage === 100 ? "bg-green-500" : "bg-brand-gold"
                            )}
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] text-text-secondary/50 uppercase font-bold">No checklists</span>
                    )}
                  </td>

                  {/* Personnel cleared */}
                  <td className="py-4 px-4">
                    {task.collaborators && task.collaborators.length > 0 ? (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-gold/10 rounded-md border border-brand-gold/20 text-brand-gold text-[8px] font-black uppercase max-w-max">
                        <Users className="w-3 h-3" />
                        <span>{task.collaborators.length + 1} cleared</span>
                      </div>
                    ) : (
                      <div className="text-[8px] uppercase tracking-widest text-text-secondary font-semibold">
                        Solo directive
                      </div>
                    )}
                  </td>

                  {/* Target timeline */}
                  <td className="py-4 px-4">
                    {task.due_date ? (
                      <div className="flex items-center gap-1.5 text-[9px] text-text-primary font-bold uppercase tracking-wider">
                        <CalIcon className="w-3 h-3 text-brand-gold" />
                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
                        <span className="text-text-secondary font-medium lowercase">@</span>
                        <span className="text-[8px] font-mono text-text-secondary">{new Date(task.due_date).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-text-secondary/50 uppercase font-black">Asynchronous</span>
                    )}
                  </td>

                  {/* Protocol Action */}
                  <td className="py-4 px-4 text-center">
                    <select
                      value={task.status}
                      onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                      className="bg-bg-base border border-brand-border text-[9px] uppercase font-black px-2 py-1.5 rounded-lg outline-none cursor-pointer hover:border-brand-gold text-text-primary"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">Active</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>

                  {/* Controls */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onEdit(task)}
                        className="hover:text-brand-gold h-7 w-7 rounded-md"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onDelete(task.id)}
                        className="hover:text-red-500 h-7 w-7 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
