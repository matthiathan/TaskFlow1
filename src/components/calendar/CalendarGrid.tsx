import React, { useState } from 'react';
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
  addDays, 
  eachDayOfInterval,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Task } from '../../types/database';
import { Card } from '../ui/Base';

interface CalendarGridProps {
  tasks: Task[];
  onDateClick: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ tasks, onDateClick, onTaskClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8 bg-white p-4 border border-brand-border shadow-sm rounded-sm">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-serif text-brand-charcoal uppercase tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1 bg-brand-light p-1 rounded-sm border border-brand-border">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-white hover:text-brand-gold transition-all rounded-sm text-brand-charcoal/40"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-brand-charcoal/60 hover:text-brand-charcoal transition-colors"
            >
              Today
            </button>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-white hover:text-brand-gold transition-all rounded-sm text-brand-charcoal/40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span className="text-brand-charcoal/40">Critical</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-500 rounded-full"></div><span className="text-brand-charcoal/40">Medium</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-brand-charcoal/40">Low</span></div>
           </div>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return (
      <div className="grid grid-cols-7 border-t border-l border-brand-border mb-px">
        {days.map((day) => (
          <div key={day} className="bg-brand-charcoal text-white/40 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-center border-r border-brand-border">
            {day.substring(0, 3)}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        
        // Find tasks for this day
        const dayTasks = tasks.filter(task => {
          try {
            const start = parseISO(task.start_date);
            const end = parseISO(task.due_date);
            return isWithinInterval(cloneDay, { start, end }) || isSameDay(cloneDay, start) || isSameDay(cloneDay, end);
          } catch {
            return false;
          }
        });

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[140px] bg-white border-r border-b border-brand-border p-2 transition-all duration-200 group relative
              ${!isSameMonth(day, monthStart) ? 'bg-brand-light/40' : ''}
              ${isSameDay(day, new Date()) ? 'bg-brand-gold-muted/30' : ''}
            `}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[11px] font-mono font-bold ${
                isSameDay(day, new Date()) ? 'text-brand-gold bg-brand-charcoal px-1.5 py-0.5 rounded-sm' : 
                !isSameMonth(day, monthStart) ? 'text-brand-charcoal/20' : 'text-brand-charcoal/60'
              }`}>
                {formattedDate}
              </span>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[100px] scrollbar-hide">
              {dayTasks.map(task => (
                <div
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task);
                  }}
                  className={`px-2 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-tighter cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md border-l-2
                    ${task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-500' : 
                      task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-500' : 
                      'bg-green-50 text-green-700 border-green-500'}
                  `}
                >
                  <div className="flex items-center justify-between gap-1 overflow-hidden">
                    <span className="truncate">{task.title}</span>
                    <div className={`w-1 h-1 rounded-full shrink-0 ${
                      task.status === 'completed' ? 'bg-green-500' : 
                      task.status === 'in_progress' ? 'bg-brand-gold animate-pulse' : 'bg-gray-400'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-[9px] font-bold text-brand-gold uppercase tracking-widest hover:underline">+ Init</button>
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return <div className="border-t border-l border-brand-border bg-white shadow-xl">{rows}</div>;
  };

  return (
    <div className="w-full">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};
