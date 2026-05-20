import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '../../types/database';
import { cn } from '../../lib/utils';
import { GripVertical, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'pending', title: 'Pending' },
  { id: 'in_progress', title: 'Active Ops' },
  { id: 'resolved', title: 'Resolved' },
];

const SortableTaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-3 bg-bg-base border border-brand-border rounded-lg shadow-sm group relative',
        isDragging && 'opacity-30'
      )}
    >
      <div {...attributes} {...listeners} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1">
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
        <div className={cn(
          'text-[8px] font-black uppercase px-1.5 py-0.5 rounded border',
          task.priority === 'high' ? 'text-red-500 border-red-500/20 bg-red-500/5' :
          task.priority === 'medium' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' :
          'text-neutral-500 border-neutral-500/20 bg-neutral-500/5'
        )}>
          {task.priority}
        </div>
        {task.due_date && (
          <div className="text-[8px] text-text-secondary font-medium">
            {new Date(task.due_date).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onUpdateStatus }) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getColTasks = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = active.data.current?.task as Task;
    const overId = over.id as string;

    // Check if we dropped over a column or a task in a column
    let newStatus: TaskStatus | null = null;
    if (COLUMNS.find(c => c.id === overId)) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus && activeTask.status !== newStatus) {
      onUpdateStatus(activeTask.id, newStatus);
    }
    
    setActiveId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map(col => (
          <div key={col.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                {col.title} <span className="ml-2 py-0.5 px-1.5 bg-bg-elevated rounded border border-brand-border">{getColTasks(col.id).length}</span>
              </h3>
            </div>
            
            <SortableContext
              id={col.id}
              items={getColTasks(col.id).map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div 
                className={cn(
                  'flex-grow bg-bg-elevated/50 border border-brand-border rounded-xl p-3 space-y-3 min-h-[200px] transition-colors',
                )}
              >
                {getColTasks(col.id).map(task => (
                  <SortableTaskCard key={task.id} task={task} />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
        
        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeId ? (
            <div className="p-3 bg-bg-base border border-brand-gold rounded-lg shadow-xl cursor-grabbing rotate-2">
              <h4 className="text-xs font-bold text-text-primary truncate">
                {tasks.find(t => t.id === activeId)?.title}
              </h4>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
