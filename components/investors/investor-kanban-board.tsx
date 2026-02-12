'use client';

/**
 * Investor kanban board with drag-and-drop stage transitions
 * Uses @hello-pangea/dnd for drag-and-drop, optimistic UI updates with error rollback
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { InvestorWithContacts } from '@/types/investors';
import { updateInvestorField } from '@/app/actions/investors';
import { toast } from 'sonner';
import { KanbanCard } from './kanban-card';

interface KanbanBoardProps {
  investors: InvestorWithContacts[];
  onStageChange?: (investorId: string, newStage: string) => void;
}

// All 12 stages in pipeline order
const STAGES = [
  'Not Yet Approached',
  'Initial Contact',
  'First Conversation Held',
  'Materials Shared',
  'NDA / Data Room',
  'Active Due Diligence',
  'LPA / Legal',
  'Won',
  'Committed',
  'Lost',
  'Passed',
  'Delayed',
];

export function InvestorKanbanBoard({ investors, onStageChange }: KanbanBoardProps) {
  const router = useRouter();
  const [columns, setColumns] = useState<Record<string, InvestorWithContacts[]>>({});

  // Re-sync columns when investors prop changes
  useEffect(() => {
    const grouped: Record<string, InvestorWithContacts[]> = {};
    STAGES.forEach(stage => {
      grouped[stage] = investors.filter(inv => inv.stage === stage);
    });
    setColumns(grouped);
  }, [investors]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Early return if no destination or same position
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Save previous state for rollback
    const previousColumns = { ...columns };

    // Find the investor being moved
    const sourceColumn = [...columns[source.droppableId]];
    const [movedInvestor] = sourceColumn.splice(source.index, 1);

    // Create updated columns
    const newColumns = { ...columns };

    if (source.droppableId === destination.droppableId) {
      // Same column - just reordering
      sourceColumn.splice(destination.index, 0, movedInvestor);
      newColumns[source.droppableId] = sourceColumn;
    } else {
      // Different column - moving between stages
      const destColumn = [...columns[destination.droppableId]];
      destColumn.splice(destination.index, 0, movedInvestor);

      newColumns[source.droppableId] = sourceColumn;
      newColumns[destination.droppableId] = destColumn;
    }

    // Optimistic update
    setColumns(newColumns);

    // If stage changed, update database
    if (source.droppableId !== destination.droppableId) {
      const newStage = destination.droppableId;

      try {
        // Call server action to update stage
        const result = await updateInvestorField(draggableId, 'stage', newStage);

        if (result.error) {
          // Revert on error
          setColumns(previousColumns);
          toast.error('Failed to update stage');
        } else {
          // Success - show toast and refresh to sync server state
          toast.success(`Moved to ${newStage}`);
          router.refresh();

          // Call optional callback
          if (onStageChange) {
            onStageChange(draggableId, newStage);
          }
        }
      } catch (error) {
        // Revert on error
        setColumns(previousColumns);
        toast.error('Failed to update stage');
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
        {STAGES.map(stage => (
          <div key={stage} className="min-w-[260px] max-w-[260px] flex-shrink-0">
            {/* Stage header - sticky */}
            <div className="sticky top-0 mb-2 flex items-center justify-between bg-background/95 backdrop-blur px-1 z-10">
              <h3 className="text-sm font-semibold truncate">{stage}</h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {columns[stage]?.length || 0}
              </span>
            </div>

            {/* Droppable column */}
            <Droppable droppableId={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 rounded-lg border p-2 min-h-[200px] transition-colors ${
                    snapshot.isDraggingOver
                      ? 'bg-accent/50 border-accent'
                      : 'bg-muted/10'
                  }`}
                >
                  {/* Investor cards */}
                  {columns[stage]?.map((investor, index) => (
                    <Draggable
                      key={investor.id}
                      draggableId={investor.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={snapshot.isDragging ? 'opacity-90 rotate-1' : ''}
                        >
                          <KanbanCard investor={investor} />
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {/* Empty state */}
                  {(columns[stage]?.length === 0) && !snapshot.isDraggingOver && (
                    <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
                      No investors in this stage
                    </div>
                  )}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
