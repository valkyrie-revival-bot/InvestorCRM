'use client';

/**
 * Task list with bulk operations
 * Displays tasks with filtering, multi-select, and bulk actions
 */

import { useState, useCallback } from 'react';
import type { TaskWithInvestor, TaskStatus, TaskPriority } from '@/types/tasks';
import type { BulkOperationRequest } from '@/types/preferences';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Calendar, Flag } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface TaskListWithBulkProps {
  tasks: TaskWithInvestor[];
  onTaskToggle: (taskId: string) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onAddTask: () => void;
  onBulkComplete?: () => void;
}

export function TaskListWithBulk({
  tasks,
  onTaskToggle,
  onTaskDelete,
  onAddTask,
  onBulkComplete,
}: TaskListWithBulkProps) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showDueDateDialog, setShowDueDateDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Bulk operation state
  const [bulkStatus, setBulkStatus] = useState<TaskStatus>('pending');
  const [bulkPriority, setBulkPriority] = useState<TaskPriority>('medium');
  const [bulkDueDate, setBulkDueDate] = useState('');

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });

  // Group tasks
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const overdueTasks = filteredTasks.filter(t =>
    t.status === 'pending' && t.due_date && t.due_date < today
  );

  const dueTodayTasks = filteredTasks.filter(t =>
    t.status === 'pending' && t.due_date === today
  );

  const upcomingTasks = filteredTasks.filter(t =>
    t.status === 'pending' && (!t.due_date || t.due_date > today)
  );

  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map(task => task.id)));
    }
  }, [filteredTasks, selectedIds.size]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Bulk operations
  const executeBulkOperation = async (operation: string, data?: any) => {
    if (selectedIds.size === 0) return;

    setIsProcessing(true);
    try {
      const request: BulkOperationRequest = {
        entity_type: 'tasks',
        operation: operation as any,
        item_ids: Array.from(selectedIds),
        data,
      };

      const response = await fetch('/api/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setSelectedIds(new Set());
        onBulkComplete?.();
      } else {
        toast.error(result.message || 'Bulk operation failed');
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast.error('Failed to execute bulk operation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    await executeBulkOperation('delete');
    setShowDeleteDialog(false);
  };

  const handleBulkStatusChange = async () => {
    await executeBulkOperation('update_status', { status: bulkStatus });
    setShowStatusDialog(false);
  };

  const handleBulkPriorityChange = async () => {
    await executeBulkOperation('update_priority', { priority: bulkPriority });
    setShowPriorityDialog(false);
  };

  const handleBulkDueDateAssign = async () => {
    if (!bulkDueDate) {
      toast.error('Please select a due date');
      return;
    }
    await executeBulkOperation('assign_due_date', { due_date: bulkDueDate });
    setShowDueDateDialog(false);
    setBulkDueDate('');
  };

  const isAllSelected = filteredTasks.length > 0 && selectedIds.size === filteredTasks.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredTasks.length;

  // Render task group with checkboxes
  const renderTaskGroup = (groupTasks: TaskWithInvestor[]) => (
    <div className="space-y-2">
      {groupTasks.map(task => {
        const isSelected = selectedIds.has(task.id);
        return (
          <div key={task.id} className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleSelect(task.id)}
              className="mt-3"
              aria-label={`Select ${task.title}`}
            />
            <div className="flex-1">
              <TaskCard
                task={task}
                onToggle={onTaskToggle}
                onDelete={onTaskDelete}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 items-center">
          {filteredTasks.length > 0 && (
            <Checkbox
              checked={isAllSelected || (isSomeSelected ? 'indeterminate' : false)}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all"
            />
          )}

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | 'all')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onAddTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-3">
          <Badge variant="secondary" className="text-sm">
            {selectedIds.size} selected
          </Badge>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowStatusDialog(true)}
            disabled={isProcessing}
          >
            Change Status
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPriorityDialog(true)}
            disabled={isProcessing}
          >
            <Flag className="h-4 w-4 mr-2" />
            Change Priority
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDueDateDialog(true)}
            disabled={isProcessing}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Set Due Date
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      )}

      {/* Task groups */}
      {overdueTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide">
            Overdue ({overdueTasks.length})
          </h3>
          {renderTaskGroup(overdueTasks)}
        </div>
      )}

      {dueTodayTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-orange-600 uppercase tracking-wide">
            Due Today ({dueTodayTasks.length})
          </h3>
          {renderTaskGroup(dueTodayTasks)}
        </div>
      )}

      {upcomingTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Upcoming ({upcomingTasks.length})
          </h3>
          {renderTaskGroup(upcomingTasks)}
        </div>
      )}

      {completedTasks.length > 0 && statusFilter !== 'pending' && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wide">
            Completed ({completedTasks.length})
          </h3>
          {renderTaskGroup(completedTasks)}
        </div>
      )}

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tasks found</p>
          <Button onClick={onAddTask} variant="link" className="mt-2">
            Create your first task
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} task{selectedIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected tasks will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status change dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedIds.size} selected task{selectedIds.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-status">New Status</Label>
            <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as TaskStatus)}>
              <SelectTrigger id="bulk-status" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkStatusChange} disabled={isProcessing}>
              {isProcessing ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority change dialog */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Priority</DialogTitle>
            <DialogDescription>
              Update the priority for {selectedIds.size} selected task{selectedIds.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-priority">New Priority</Label>
            <Select value={bulkPriority} onValueChange={(v) => setBulkPriority(v as TaskPriority)}>
              <SelectTrigger id="bulk-priority" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriorityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkPriorityChange} disabled={isProcessing}>
              {isProcessing ? 'Updating...' : 'Update Priority'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Due date assign dialog */}
      <Dialog open={showDueDateDialog} onOpenChange={setShowDueDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Due Date</DialogTitle>
            <DialogDescription>
              Set a due date for {selectedIds.size} selected task{selectedIds.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-due-date">Due Date</Label>
            <Input
              id="bulk-due-date"
              type="date"
              value={bulkDueDate}
              onChange={(e) => setBulkDueDate(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDueDateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkDueDateAssign} disabled={isProcessing}>
              {isProcessing ? 'Assigning...' : 'Assign Due Date'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
