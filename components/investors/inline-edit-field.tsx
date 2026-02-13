'use client';

/**
 * InlineEditField - Notion/Linear-style inline editing component
 *
 * Behavior:
 * - Display mode: Shows field value with hover effect
 * - Edit mode: Transforms to input on click
 * - Auto-save: Saves on blur or Enter, cancels on Escape
 * - Loading states: Shows saving indicator during save
 * - Error handling: Shows inline error message on failure
 */

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { updateInvestorField } from '@/app/actions/investors';
import { useOptimisticUpdate } from '@/lib/hooks/use-optimistic-update';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface InlineEditFieldProps {
  label: string;
  field: string; // Database column name
  value: string | number | boolean | null;
  investorId: string;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean';
  options?: { value: string; label: string }[]; // For select type
  placeholder?: string;
  formatDisplay?: (value: unknown) => string; // Custom display formatting
  required?: boolean; // Show required indicator
  version?: number; // Optional version for optimistic locking
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InlineEditField({
  label,
  field,
  value: initialValue,
  investorId,
  type = 'text',
  options = [],
  placeholder = 'Click to edit',
  formatDisplay,
  required = false,
  version,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [displayValue, setDisplayValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const selectRef = useRef<HTMLButtonElement>(null);

  // Use optimistic update hook when version is provided
  const { updateInvestor, isUpdating } = useOptimisticUpdate();

  // Format display value
  const getDisplayText = () => {
    if (formatDisplay) {
      return formatDisplay(displayValue);
    }

    if (displayValue === null || displayValue === '' || displayValue === undefined) {
      return placeholder;
    }

    // Currency formatting for est_value
    if (field === 'est_value' && typeof displayValue === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(displayValue);
    }

    // Date formatting
    if (type === 'date' && typeof displayValue === 'string') {
      try {
        const date = new Date(displayValue);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return String(displayValue);
      }
    }

    // Boolean formatting
    if (type === 'boolean') {
      return displayValue ? 'Yes' : 'No';
    }

    return String(displayValue);
  };

  const isEmpty = displayValue === null || displayValue === '' || displayValue === undefined;

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && type !== 'select' && type !== 'boolean') {
      inputRef.current?.focus();
      // Select all text for easy replacement
      if (type === 'text' || type === 'number') {
        inputRef.current?.select();
      }
    }
  }, [isEditing, type]);

  // Handle save
  const handleSave = async () => {
    // Don't save if value hasn't changed
    if (value === displayValue) {
      setIsEditing(false);
      setError(null);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Use optimistic update with version check if version is provided
      if (version !== undefined) {
        const result = await updateInvestor(investorId, version, field, value);

        if (!result.success) {
          if (result.conflict) {
            // Version conflict - show toast notification
            toast.error('This record was modified by another user. Please refresh.');
            setError('Conflict detected');
          } else {
            // Other error
            setError(result.error || 'Failed to save');
          }
          setIsSaving(false);
          return;
        }

        // Success - update display value and exit edit mode
        setDisplayValue(value);
        setIsEditing(false);
      } else {
        // Fall back to original updateInvestorField if no version
        const result = await updateInvestorField(investorId, field, value);

        if (result.error) {
          setError(result.error);
          setIsSaving(false);
          return;
        }

        // Success - update display value and exit edit mode
        setDisplayValue(value);
        setIsEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setValue(displayValue); // Revert to previous value
    setError(null);
    setIsEditing(false);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Handle blur
  const handleBlur = () => {
    // Small delay to allow select dropdown click to register
    setTimeout(() => {
      if (!isSaving) {
        handleSave();
      }
    }, 150);
  };

  // Boolean type uses immediate save on toggle
  const handleBooleanChange = async (checked: boolean) => {
    setValue(checked);
    setIsSaving(true);
    setError(null);

    try {
      // Use optimistic update with version check if version is provided
      if (version !== undefined) {
        const result = await updateInvestor(investorId, version, field, checked);

        if (!result.success) {
          if (result.conflict) {
            toast.error('This record was modified by another user. Please refresh.');
          }
          setError(result.error || 'Failed to save');
          setValue(displayValue); // Revert on error
        } else {
          setDisplayValue(checked);
        }
      } else {
        // Fall back to original updateInvestorField
        const result = await updateInvestorField(investorId, field, checked);

        if (result.error) {
          setError(result.error);
          setValue(displayValue); // Revert on error
        } else {
          setDisplayValue(checked);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setValue(displayValue); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  // Select type uses immediate save on change
  const handleSelectChange = async (newValue: string) => {
    setValue(newValue);
    setIsSaving(true);
    setError(null);

    try {
      // Use optimistic update with version check if version is provided
      if (version !== undefined) {
        const result = await updateInvestor(investorId, version, field, newValue);

        if (!result.success) {
          if (result.conflict) {
            toast.error('This record was modified by another user. Please refresh.');
          }
          setError(result.error || 'Failed to save');
          setValue(displayValue); // Revert on error
        } else {
          setDisplayValue(newValue);
          setIsEditing(false);
        }
      } else {
        // Fall back to original updateInvestorField
        const result = await updateInvestorField(investorId, field, newValue);

        if (result.error) {
          setError(result.error);
          setValue(displayValue); // Revert on error
        } else {
          setDisplayValue(newValue);
          setIsEditing(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setValue(displayValue); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="group relative">
      {/* Label */}
      <label className="text-xs text-muted-foreground mb-1 block tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Display Mode */}
      {!isEditing && type !== 'boolean' && (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-md transition-colors',
            'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring',
            isEmpty && 'text-muted-foreground italic'
          )}
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            getDisplayText()
          )}
        </button>
      )}

      {/* Boolean Type - Always visible, no edit mode */}
      {type === 'boolean' && (
        <div className="flex items-center gap-2 px-3 py-2">
          <Switch
            checked={Boolean(value)}
            onCheckedChange={handleBooleanChange}
            disabled={isSaving}
          />
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      )}

      {/* Edit Mode - Text */}
      {isEditing && type === 'text' && (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={String(value || '')}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className={cn(isSaving && 'opacity-50')}
        />
      )}

      {/* Edit Mode - Number */}
      {isEditing && type === 'number' && (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          value={value === null ? '' : String(value)}
          onChange={(e) => setValue(e.target.value === '' ? null : Number(e.target.value))}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className={cn(isSaving && 'opacity-50')}
        />
      )}

      {/* Edit Mode - Date */}
      {isEditing && type === 'date' && (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          value={value ? String(value) : ''}
          onChange={(e) => setValue(e.target.value || null)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className={cn(isSaving && 'opacity-50')}
        />
      )}

      {/* Edit Mode - Textarea */}
      {isEditing && type === 'textarea' && (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={String(value || '')}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          rows={3}
          className={cn('resize-y', isSaving && 'opacity-50')}
        />
      )}

      {/* Edit Mode - Select */}
      {isEditing && type === 'select' && (
        <Select
          value={String(value || '')}
          onValueChange={handleSelectChange}
          disabled={isSaving}
        >
          <SelectTrigger ref={selectRef} className={cn(isSaving && 'opacity-50')}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Error State */}
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}

      {/* Saving Indicator (for edit mode) */}
      {isEditing && isSaving && (
        <div className="absolute right-2 top-8 text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
