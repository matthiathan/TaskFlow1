import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { Card, Button } from '../components/ui/Base';
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
  eachDayOfInterval 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export const CalendarPage: React.FC = () => {
  const { tasks } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif uppercase tracking-[0.1em]">Ops Schedule</h1>
          <p className="text-text-secondary text-sm mt-1">Chronological mapping of active system directives.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-bg-elevated border border-brand-border rounded-xl p-1 shadow-sm">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-lg h-9 w-9">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 text-sm font-black uppercase tracking-widest text-text-primary min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-lg h-9 w-9">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-brand-border">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-brand-border bg-bg-elevated/50">
          {dayNames.map(day => (
            <div key={day} className="py-3 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <div 
                key={day.toString()} 
                className={cn(
                  "min-h-[140px] p-2 border-b border-r border-brand-border transition-colors group",
                  !isCurrentMonth && "bg-bg-elevated/20 text-text-secondary/30",
                  isCurrentMonth && "bg-bg-base hover:bg-bg-elevated/40"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all",
                    isToday ? "bg-brand-gold text-white shadow-lg shadow-brand-gold/20" : "text-text-primary"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[90px] no-scrollbar">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id}
                      className={cn(
                        "px-1.5 py-1 rounded border text-[8px] font-bold uppercase tracking-tight truncate",
                        task.priority === 'high' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        task.priority === 'medium' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                        "bg-green-500/10 text-green-500 border-green-500/20"
                      )}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-6 px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">High Alert</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Standard Op</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Strategic</span>
        </div>
      </div>
    </div>
  );
};
