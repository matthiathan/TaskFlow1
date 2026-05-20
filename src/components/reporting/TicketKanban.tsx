import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, TicketStatus } from '../../types/database';
import { cn } from '../../lib/utils';
import { GripVertical, AlertCircle, Clock, CheckCircle2, QrCode, Cpu, Hash, Camera } from 'lucide-react';

interface TicketKanbanProps {
  tickets: Ticket[];
  onUpdateStatus: (id: string, status: TicketStatus) => void;
}

const TICKET_COLUMNS: { id: TicketStatus; title: string }[] = [
  { id: 'awaiting_tech', title: 'Awaiting Tech' },
  { id: 'diagnostic', title: 'Diagnostic' },
  { id: 'repaired', title: 'Repaired' },
  { id: 'closed', title: 'Archive' },
];

const TicketCard: React.FC<{ ticket: Ticket; index: number }> = ({ ticket, index }) => {
  return (
    <Draggable draggableId={ticket.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            'p-4 bg-bg-base border border-brand-border rounded-xl shadow-sm group relative transition-all duration-200',
            snapshot.isDragging && 'shadow-2xl border-brand-gold ring-1 ring-brand-gold/20 scale-105 z-50'
          )}
        >
          <div 
            {...provided.dragHandleProps} 
            className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 transition-opacity"
          >
            <GripVertical className="w-4 h-4 text-text-secondary" />
          </div>

          <div className="flex flex-col gap-3">
            {/* Header: S/N and ID */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-bg-elevated border border-brand-border rounded-lg">
                <Hash className="w-2.5 h-2.5 text-brand-gold" />
                <span className="text-[10px] font-black uppercase text-brand-gold tracking-tight">
                  {ticket.serial_number || 'NO_SN'}
                </span>
              </div>
              <div className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">
                ID: {ticket.id.slice(0, 8)}
              </div>
            </div>

            {/* Thumbnail if exists */}
            {ticket.machine_images && ticket.machine_images.length > 0 && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-brand-border bg-bg-elevated">
                <img 
                  src={ticket.machine_images[0]} 
                  alt="Machine Status" 
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 right-2 p-1 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10">
                   <Camera className="w-3 h-3 text-white" />
                </div>
              </div>
            )}

            {/* Core Info */}
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wide text-text-primary leading-tight">
                {ticket.title}
              </h4>
              <p className="text-[11px] text-text-secondary line-clamp-3 leading-relaxed">
                {ticket.issue_description}
              </p>
            </div>

            {/* Footer: QR and Metadata */}
            <div className="pt-2 border-t border-brand-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {ticket.qr_code && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-text-secondary uppercase">
                    <QrCode className="w-3 h-3" />
                    {ticket.qr_code.slice(0, 10)}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[9px] font-bold text-text-secondary uppercase">
                  <Clock className="w-3 h-3" />
                  {new Date(ticket.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className={cn(
                'text-[8px] font-black uppercase px-2 py-0.5 rounded-full border',
                ticket.priority === 'high' ? 'text-red-500 border-red-500/20 bg-red-500/10' :
                ticket.priority === 'medium' ? 'text-brand-gold border-brand-gold/20 bg-brand-gold/10' :
                'text-neutral-500 border-neutral-500/20 bg-neutral-500/10'
              )}>
                {ticket.priority}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export const TicketKanban: React.FC<TicketKanbanProps> = ({ tickets, onUpdateStatus }) => {
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as TicketStatus;
    if (newStatus) {
      onUpdateStatus(draggableId, newStatus);
    }
  };

  const getColTickets = (status: TicketStatus) => tickets.filter(t => t.status === status);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full min-h-[600px]">
        {TICKET_COLUMNS.map(col => (
          <div key={col.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", 
                  col.id === 'awaiting_tech' ? 'bg-red-500' : 
                  col.id === 'diagnostic' ? 'bg-brand-gold' : 
                  col.id === 'repaired' ? 'bg-green-500' : 'bg-neutral-500'
                )} />
                {col.title}
                <span className="text-[10px] text-text-secondary opacity-50 ml-1">
                  ({getColTickets(col.id).length})
                </span>
              </h3>
            </div>
            
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    'flex-grow bg-bg-elevated/40 border border-brand-border rounded-2xl p-4 space-y-4 min-h-[300px] transition-all duration-300',
                    snapshot.isDraggingOver && 'bg-brand-gold/5 border-brand-gold/20 shadow-inner'
                  )}
                >
                  <AnimatePresence initial={false}>
                    {getColTickets(col.id).map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TicketCard ticket={ticket} index={index} />
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
