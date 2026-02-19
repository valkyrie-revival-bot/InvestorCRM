'use client';

/**
 * Investor kanban board with drag-and-drop stage transitions
 * Uses @hello-pangea/dnd for drag-and-drop, optimistic UI updates with error rollback
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { InvestorWithContacts } from '@/types/investors';
import { STAGE_ORDER, isValidTransition, getExitCriteria } from '@/lib/stage-definitions';
import { updateInvestorStage } from '@/app/actions/stage-transitions';
import type { ExitCriterion } from '@/lib/stage-definitions';
import { StageValidationDialog } from './stage-validation-dialog';
import { StageOverrideDialog } from './stage-override-dialog';
import { toast } from 'sonner';
import { KanbanCard } from './kanban-card';

interface KanbanBoardProps {
  investors: InvestorWithContacts[];
  onStageChange?: (investorId: string, newStage: string) => void;
}

interface PendingTransition {
  investorId: string;
  investorName: string;
  fromStage: string;
  toStage: string;
  exitCriteria: ExitCriterion[];
}

export function InvestorKanbanBoard({ investors, onStageChange }: KanbanBoardProps) {
  const router = useRouter();
  const [columns, setColumns] = useState<Record<string, InvestorWithContacts[]>>({});
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);

  // Re-sync columns when investors prop changes
  useEffect(() => {
    const grouped: Record<string, InvestorWithContacts[]> = {};
    STAGE_ORDER.forEach(stage => {
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
      // Same column - just reordering (no stage change, no validation needed)
      sourceColumn.splice(destination.index, 0, movedInvestor);
      newColumns[source.droppableId] = sourceColumn;
      setColumns(newColumns);
      return; // No server call for reordering
    }

    // Different column - moving between stages
    const fromStage = source.droppableId;
    const toStage = destination.droppableId;

    // Check if transition is valid
    if (!isValidTransition(fromStage as any, toStage as any)) {
      toast.error(`Cannot move from ${fromStage} to ${toStage}`);
      return; // Do not apply optimistic update
    }

    // Move card to new column (optimistic update)
    const destColumn = [...columns[destination.droppableId]];
    destColumn.splice(destination.index, 0, movedInvestor);
    newColumns[source.droppableId] = sourceColumn;
    newColumns[destination.droppableId] = destColumn;
    setColumns(newColumns);

    // Get exit criteria for source stage
    const exitCriteria = getExitCriteria(fromStage as any);

    if (exitCriteria.length > 0) {
      // Stage has exit criteria - show validation dialog
      setPendingTransition({
        investorId: draggableId,
        investorName: movedInvestor.firm_name,
        fromStage,
        toStage,
        exitCriteria,
      });
      setShowValidationDialog(true);
    } else {
      // No exit criteria (terminal stages or stages without criteria) - update directly
      try {
        const result = await updateInvestorStage(draggableId, toStage);

        if (result.success) {
          toast.success(`Moved to ${toStage}`);
          router.refresh();

          // Call optional callback
          if (onStageChange) {
            onStageChange(draggableId, toStage);
          }
        } else {
          // Revert on error
          setColumns(previousColumns);
          toast.error(result.error || 'Failed to update stage');
        }
      } catch (error) {
        // Revert on error
        setColumns(previousColumns);
        toast.error('Failed to update stage');
      }
    }
  };

  const handleValidationSuccess = () => {
    setPendingTransition(null);
    setShowValidationDialog(false);
    router.refresh();
  };

  const handleValidationCancel = () => {
    // Revert the optimistic update
    const grouped: Record<string, InvestorWithContacts[]> = {};
    STAGE_ORDER.forEach(stage => {
      grouped[stage] = investors.filter(inv => inv.stage === stage);
    });
    setColumns(grouped);
    setPendingTransition(null);
    setShowValidationDialog(false);
  };

  const handleOverrideClick = () => {
    setShowValidationDialog(false);
    setShowOverrideDialog(true);
  };

  const handleOverrideSuccess = () => {
    setPendingTransition(null);
    setShowOverrideDialog(false);
    router.refresh();
  };

  const handleOverrideCancel = () => {
    // Revert the optimistic update
    const grouped: Record<string, InvestorWithContacts[]> = {};
    STAGE_ORDER.forEach(stage => {
      grouped[stage] = investors.filter(inv => inv.stage === stage);
    });
    setColumns(grouped);
    setPendingTransition(null);
    setShowOverrideDialog(false);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {STAGE_ORDER.map(stage => (
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

      {/* Stage Validation Dialog */}
      {pendingTransition && (
        <StageValidationDialog
          open={showValidationDialog}
          onOpenChange={(open) => {
            if (!open) handleValidationCancel();
          }}
          investorId={pendingTransition.investorId}
          investorName={pendingTransition.investorName}
          fromStage={pendingTransition.fromStage}
          toStage={pendingTransition.toStage}
          exitCriteria={pendingTransition.exitCriteria}
          onSuccess={handleValidationSuccess}
          onOverride={handleOverrideClick}
        />
      )}

      {/* Stage Override Dialog */}
      {pendingTransition && (
        <StageOverrideDialog
          open={showOverrideDialog}
          onOpenChange={(open) => {
            if (!open) handleOverrideCancel();
          }}
          investorId={pendingTransition.investorId}
          investorName={pendingTransition.investorName}
          fromStage={pendingTransition.fromStage}
          toStage={pendingTransition.toStage}
          onSuccess={handleOverrideSuccess}
        />
      )}
    </>
  );
}
