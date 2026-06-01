import React, { useState } from 'react';
import { Task } from '../../types/database';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, AlertCircle, CheckCircle2, User, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { parseTaskDescription, getTaskProgress } from '../../lib/taskUtils';

interface CalendarAgendaViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onUpdateStatus: (id: string, status: any) => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({ tasks, onEdit, onUpdateStatus }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return isSameDay(new Date(task.due_date), day);
    });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activeDayTasks = getTasksForDay(selectedDay);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* LEFT: Mini Month Grid */}
      <div className="lg:col-span-7 bg-bg-elevated border border-brand-border rounded-xl p-4 shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalIcon className="w-4 h-4 text-brand-gold" />
            <span className="text-xs font-black uppercase tracking-widest text-text-primary">Calendar</span>
          </div>
          <div className="flex items-center gap-1 bg-bg-base border border-brand-border rounded-lg p-0.5">
            <button 
              onClick={prevMonth} 
              className="p-1.5 hover:bg-bg-elevated text-text-secondary hover:text-text-primary rounded-md transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[10px] font-black uppercase tracking-widest text-text-primary min-w-[90px] text-center">
              {format(currentMonth, 'MMM yyyy')}
            </span>
            <button 
              onClick={nextMonth} 
              className="p-1.5 hover:bg-bg-elevated text-text-secondary hover:text-text-primary rounded-md transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {dayNames.map(day => (
            <div key={day} className="py-1">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-secondary">{day}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDay);
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "min-h-[56px] p-1.5 border border-brand-border/30 rounded-lg flex flex-col justify-between transition-all",
                  !isCurrentMonth && "bg-bg-elevated/10 text-text-secondary/20 border-transparent",
                  isCurrentMonth && "bg-bg-base/60 hover:bg-bg-base/90 text-text-primary",
                  isSelected && "bg-brand-gold/10 border-brand-gold/50 text-brand-gold"
                )}
              >
                <span className={cn(
                  "text-[10px] font-black flex items-center justify-center w-5 h-5 rounded-full transition-all",
                  isToday && "bg-brand-gold text-white shadow-sm shadow-brand-gold/20",
                  isSelected && !isToday && "text-brand-gold bg-brand-gold/5"
                )}>
                  {format(day, 'd')}
                </span>

                <div className="flex gap-0.5 mt-1 flex-wrap max-w-full">
                  {dayTasks.slice(0, 3).map(task => (
                    <div 
                      key={task.id}
                      className={cn(
                        "w-1 h-1 rounded-full",
                        task.priority === 'high' ? "bg-red-500" :
                        task.priority === 'medium' ? "bg-blue-500" :
                        "bg-green-500"
                      )} 
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[6px] font-bold text-brand-gold leading-none">+</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Daily Agenda */}
      <div className="lg:col-span-5 bg-bg-elevated border border-brand-border rounded-xl p-4 shadow-xl flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border mb-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary">Agenda</h4>
            <span className="text-xs font-bold text-text-primary mt-1 block">
              {format(selectedDay, 'EEEE, d MMMM yyyy')}
            </span>
          </div>
          <div className="px-2 py-1 bg-bg-base rounded-lg border border-brand-border text-[9px] font-black uppercase text-brand-gold">
            {activeDayTasks.length} Tasks
          </div>
        </div>

        <div className="flex-grow space-y-3 overflow-y-auto max-h-[380px] pr-1">
          {activeDayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-brand-border/40 rounded-xl bg-bg-base/20">
              <CalIcon className="w-8 h-8 text-text-secondary/20 mb-3" />
              <p className="text-[10px] uppercase font-black tracking-widest text-text-secondary">No Tasks Today</p>
              <p className="text-[9px] text-text-secondary/60 mt-1 max-w-[200px]">There are no tasks scheduled on this date.</p>
            </div>
          ) : (
            activeDayTasks.map(task => {
              const parsed = parseTaskDescription(task.description);
              const progress = getTaskProgress(parsed.subtasks);

              return (
                <div 
                  key={task.id}
                  onClick={() => onEdit(task)}
                  className="p-3 bg-bg-base border border-brand-border hover:border-brand-gold/30 rounded-xl transition-all cursor-pointer group flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {task.status === 'pending' && <Clock className="w-3.5 h-3.5 text-neutral-400" />}
                        {task.status === 'in_progress' && <AlertCircle className="w-3.5 h-3.5 text-brand-gold animate-pulse" />}
                        {task.status === 'resolved' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary group-hover:text-brand-gold transition-colors">{task.title}</h4>
                        <p className="text-[10px] text-text-secondary mt-1 line-clamp-2 leading-relaxed">{parsed.text || 'No parameter description.'}</p>
                      </div>
                    </div>
                    
                    <span className={cn(
                      'text-[7px] font-black uppercase px-1.5 py-0.5 rounded border flex-shrink-0',
                      task.priority === 'high' ? 'text-red-500 border-red-500/10 bg-red-500/5' :
                      task.priority === 'medium' ? 'text-blue-500 border-blue-500/10 bg-blue-500/5' :
                      'text-green-500 border-green-500/10 bg-green-500/5'
                    )}>
                      {task.priority}
                    </span>
                  </div>

                  {/* Subtask progress bar */}
                  {parsed.subtasks.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[8px] font-bold text-text-secondary mt-1">
                        <span className="uppercase tracking-widest">Protocol Progress</span>
                        <span>{progress.completed}/{progress.total} Completed ({progress.percentage}%)</span>
                      </div>
                      <div className="w-full h-1 bg-bg-elevated border border-brand-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-gold transition-all duration-300 rounded-full"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-brand-border/10 flex items-center justify-between text-[8px] text-text-secondary font-semibold uppercase tracking-widest">
                    <div className="flex items-center gap-1">
                      <User className="w-2.5 h-2.5" />
                      <span>{task.collaborators && task.collaborators.length > 0 ? `${task.collaborators.length + 1} Cleared` : 'Solo Duty'}</span>
                    </div>

                    <select
                      value={task.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(task.id, e.target.value);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="bg-bg-elevated border border-brand-border text-[8px] uppercase font-black px-1.5 py-0.5 rounded outline-none cursor-pointer hover:border-brand-gold text-text-primary"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">Active</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
