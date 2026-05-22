import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'motion/react';
import { Task, TaskStatus } from '../../types/database';
import { cn } from '../../lib/utils';
import { GripVertical, AlertCircle, Clock, CheckCircle2, Users, ClipboardCheck, FlaskConical } from 'lucide-react';
import { parseTaskDescription, encodeTaskDescription, getTaskProgress } from '../../lib/taskUtils';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus, customDesc?: string) => void;
  onEdit: (task: Task) => void;
}

const COLUMNS = [
  { id: 'pending', title: 'To-Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'testing', title: 'Testing' },
  { id: 'resolved', title: 'Done' },
];

const TaskCard: React.FC<{ task: Task; index: number; onEdit: (task: Task) => void }> = ({ task, index, onEdit }) => {
  const parsed = parseTaskDescription(task.description);
  const progress = getTaskProgress(parsed.subtasks);
  
  // Custom Icon/Color according to column status
  let StatusIcon = Clock;
  let statusIconColor = 'text-neutral-400';
  
  if (task.status === 'resolved') {
    StatusIcon = CheckCircle2;
    statusIconColor = 'text-green-500';
  } else if (parsed.is_testing) {
    StatusIcon = FlaskConical;
    statusIconColor = 'text-purple-500';
  } else if (task.status === 'in_progress') {
    StatusIcon = AlertCircle;
    statusIconColor = 'text-brand-gold';
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={() => onEdit(task)}
          className={cn(
            'p-3 bg-bg-base border border-brand-border rounded-lg shadow-sm group relative transition-all cursor-pointer select-none',
            snapshot.isDragging && 'shadow-2xl border-brand-gold ring-1 ring-brand-gold/20 scale-105 z-50 bg-bg-elevated',
            !snapshot.isDragging && 'hover:border-brand-gold/50 hover:shadow-md'
          )}
        >
          <div 
            {...provided.dragHandleProps} 
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3 h-3 text-text-secondary" />
          </div>
          <div className="flex items-start gap-2 pr-6">
            <div className="mt-0.5">
              <StatusIcon className={cn("w-3.5 h-3.5", statusIconColor)} />
            </div>
            <div className="min-w-0 flex-grow">
              <h4 className="text-xs font-bold text-text-primary truncate">{task.title}</h4>
              <p className="text-[10px] text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                {parsed.text || 'No parameters.'}
              </p>
            </div>
          </div>

          {/* Subtask progress bar */}
          {parsed.subtasks.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-brand-border/20 space-y-1">
              <div className="flex justify-between items-center text-[8px] font-black text-text-secondary uppercase tracking-wider leading-none">
                <span className="flex items-center gap-1">
                  <ClipboardCheck className="w-2.5 h-2.5 text-brand-gold" />
                  Protocol Progress
                </span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="w-full h-1 bg-bg-elevated border border-brand-border/50 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    progress.percentage === 100 ? "bg-green-500" : "bg-brand-gold"
                  )}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-brand-border/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                'text-[8px] font-black uppercase px-1.5 py-0.5 rounded border',
                task.priority === 'high' ? 'text-red-500 border-red-500/25 bg-red-500/5' :
                task.priority === 'medium' ? 'text-blue-500 border-blue-500/25 bg-blue-500/5' :
                'text-green-500 border-green-500/25 bg-green-500/5'
              )}>
                {task.priority}
              </div>
              {task.collaborators && task.collaborators.length > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-gold/10 rounded border border-brand-gold/20 text-brand-gold text-[7px] font-black uppercase">
                  <Users className="w-2.5 h-2.5" />
                  {task.collaborators.length + 1} Cleared
                </div>
              )}
            </div>
            {task.due_date && (
              <div className="text-[8px] text-text-secondary font-semibold uppercase tracking-wider font-mono">
                {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onUpdateStatus, onEdit }) => {
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const targetColId = destination.droppableId;
    const taskToUpdate = tasks.find(t => t.id === draggableId);
    if (!taskToUpdate) return;

    const parsed = parseTaskDescription(taskToUpdate.description);
    
    let dbStatus: TaskStatus = 'in_progress';
    let isTesting = false;

    if (targetColId === 'pending') {
      dbStatus = 'pending';
      isTesting = false;
    } else if (targetColId === 'in_progress') {
      dbStatus = 'in_progress';
      isTesting = false;
    } else if (targetColId === 'testing') {
      dbStatus = 'in_progress';
      isTesting = true;
    } else if (targetColId === 'resolved') {
      dbStatus = 'resolved';
      isTesting = false;
    }

    parsed.is_testing = isTesting;
    const newDescription = encodeTaskDescription(parsed);

    // Communicate status and metadata update
    onUpdateStatus(draggableId, dbStatus, newDescription);
  };

  const getColTasks = (colId: string) => {
    return tasks.filter(task => {
      const parsed = parseTaskDescription(task.description);
      if (colId === 'pending') return task.status === 'pending';
      if (colId === 'in_progress') return task.status === 'in_progress' && !parsed.is_testing;
      if (colId === 'testing') return task.status === 'in_progress' && parsed.is_testing;
      if (colId === 'resolved') return task.status === 'resolved';
      return false;
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full min-h-[550px]">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary flex items-center gap-1.5">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  col.id === 'pending' ? "bg-neutral-500" :
                  col.id === 'in_progress' ? "bg-brand-gold animate-pulse" :
                  col.id === 'testing' ? "bg-purple-500" :
                  "bg-green-500"
                )} />
                {col.title} 
                <span className="ml-1.5 py-0.5 px-2 bg-bg-elevated rounded-full border border-brand-border text-[9px]">
                  {getColTasks(col.id).length}
                </span>
              </h3>
            </div>
            
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    'flex-grow bg-bg-elevated/40 border border-brand-border rounded-xl p-3 space-y-3 min-h-[400px] transition-all duration-200',
                    snapshot.isDraggingOver && (
                      col.id === 'pending' ? 'bg-neutral-500/5 border-neutral-500/30' :
                      col.id === 'in_progress' ? 'bg-brand-gold/5 border-brand-gold/30' :
                      col.id === 'testing' ? 'bg-purple-500/5 border-purple-500/30' :
                      'bg-green-500/5 border-green-500/30'
                    )
                  )}
                >
                  <AnimatePresence initial={false}>
                    {getColTasks(col.id).map((task, index) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TaskCard task={task} index={index} onEdit={onEdit} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};
