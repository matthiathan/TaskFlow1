import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'motion/react';
import { Task, TaskStatus } from '../../types/database';
import { cn } from '../../lib/utils';
import { GripVertical, AlertCircle, Clock, CheckCircle2, Users } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'pending', title: 'Pending' },
  { id: 'in_progress', title: 'Active Ops' },
  { id: 'resolved', title: 'Resolved' },
];

const TaskCard: React.FC<{ task: Task; index: number; onEdit: (task: Task) => void }> = ({ task, index, onEdit }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={() => onEdit(task)}
          className={cn(
            'p-3 bg-bg-base border border-brand-border rounded-lg shadow-sm group relative transition-all cursor-pointer',
            snapshot.isDragging && 'shadow-2xl border-brand-gold ring-1 ring-brand-gold/20 scale-105 z-50',
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
              {task.status === 'pending' && <Clock className="w-3 h-3 text-neutral-400" />}
              {task.status === 'in_progress' && <AlertCircle className="w-3 h-3 text-brand-gold" />}
              {task.status === 'resolved' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-text-primary truncate">{task.title}</h4>
              <p className="text-[10px] text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                {task.description || 'No parameters.'}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                'text-[8px] font-black uppercase px-1.5 py-0.5 rounded border',
                task.priority === 'high' ? 'text-red-500 border-red-500/20 bg-red-500/5' :
                task.priority === 'medium' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' :
                'text-neutral-500 border-neutral-500/20 bg-neutral-500/5'
              )}>
                {task.priority}
              </div>
              {task.collaborators && task.collaborators.length > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-gold/10 rounded border border-brand-gold/20 text-brand-gold text-[7px] font-black uppercase">
                  <Users className="w-2 h-2" />
                  Shared
                </div>
              )}
            </div>
            {task.due_date && (
              <div className="text-[8px] text-text-secondary font-medium">
                {new Date(task.due_date).toLocaleDateString()}
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

    const newStatus = destination.droppableId as TaskStatus;
    if (newStatus) {
      onUpdateStatus(draggableId, newStatus);
    }
  };

  const getColTasks = (status: TaskStatus) => tasks.filter(t => t.status === status);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                {col.title} <span className="ml-2 py-0.5 px-1.5 bg-bg-elevated rounded border border-brand-border">{getColTasks(col.id).length}</span>
              </h3>
            </div>
            
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    'flex-grow bg-bg-elevated/50 border border-brand-border rounded-xl p-3 space-y-3 min-h-[200px] transition-all duration-200',
                    snapshot.isDraggingOver && 'bg-brand-gold/5 border-brand-gold/30'
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
