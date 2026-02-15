'use client';

/**
 * Filter Builder Component
 * Dynamic filter UI for building complex queries
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Plus, Save, Filter as FilterIcon } from 'lucide-react';

// Filter operators
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

// Field types
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

// Filter condition
export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // For 'between' operator
}

// Field definition
export interface FilterField {
  name: string;
  label: string;
  type: FieldType;
  operators?: FilterOperator[];
  options?: Array<{ label: string; value: string }>; // For select fields
}

// Props
interface FilterBuilderProps {
  fields: FilterField[];
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
  onApply?: () => void;
  onSave?: (name: string) => void;
  onClear?: () => void;
  showSaveButton?: boolean;
}

// Default operators by field type
const DEFAULT_OPERATORS: Record<FieldType, FilterOperator[]> = {
  text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_null', 'is_not_null'],
  number: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'between', 'is_null', 'is_not_null'],
  date: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'between', 'is_null', 'is_not_null'],
  select: ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'],
  boolean: ['equals'],
};

// Operator labels
const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Equals',
  not_equals: 'Not Equals',
  contains: 'Contains',
  not_contains: 'Does Not Contain',
  starts_with: 'Starts With',
  ends_with: 'Ends With',
  greater_than: 'Greater Than',
  less_than: 'Less Than',
  greater_or_equal: 'Greater or Equal',
  less_or_equal: 'Less or Equal',
  between: 'Between',
  in: 'In',
  not_in: 'Not In',
  is_null: 'Is Empty',
  is_not_null: 'Is Not Empty',
};

export function FilterBuilder({
  fields,
  conditions,
  onChange,
  onApply,
  onSave,
  onClear,
  showSaveButton = true,
}: FilterBuilderProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

  // Add new condition
  const addCondition = () => {
    const firstField = fields[0];
    const defaultOperator = firstField.operators?.[0] || DEFAULT_OPERATORS[firstField.type][0];

    const newCondition: FilterCondition = {
      id: `condition-${Date.now()}`,
      field: firstField.name,
      operator: defaultOperator,
      value: '',
    };

    onChange([...conditions, newCondition]);
  };

  // Remove condition
  const removeCondition = (id: string) => {
    onChange(conditions.filter(c => c.id !== id));
  };

  // Update condition
  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    onChange(
      conditions.map(c => {
        if (c.id === id) {
          // If field changed, reset operator and value
          if (updates.field && updates.field !== c.field) {
            const field = fields.find(f => f.name === updates.field);
            const defaultOperator = field?.operators?.[0] || DEFAULT_OPERATORS[field?.type || 'text'][0];
            return {
              ...c,
              ...updates,
              operator: defaultOperator,
              value: '',
              value2: undefined,
            };
          }
          return { ...c, ...updates };
        }
        return c;
      })
    );
  };

  // Get field by name
  const getField = (fieldName: string) => {
    return fields.find(f => f.name === fieldName);
  };

  // Get operators for field
  const getOperators = (fieldName: string): FilterOperator[] => {
    const field = getField(fieldName);
    if (!field) return [];
    return field.operators || DEFAULT_OPERATORS[field.type];
  };

  // Render value input based on field type and operator
  const renderValueInput = (condition: FilterCondition) => {
    const field = getField(condition.field);
    if (!field) return null;

    // No value input for is_null and is_not_null
    if (condition.operator === 'is_null' || condition.operator === 'is_not_null') {
      return null;
    }

    // Select field
    if (field.type === 'select') {
      if (condition.operator === 'in' || condition.operator === 'not_in') {
        return (
          <Input
            type="text"
            placeholder="Value1, Value2, ..."
            value={condition.value || ''}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            className="flex-1"
          />
        );
      }

      return (
        <select
          value={condition.value || ''}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select...</option>
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // Boolean field
    if (field.type === 'boolean') {
      return (
        <select
          value={condition.value || ''}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select...</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    // Between operator needs two inputs
    if (condition.operator === 'between') {
      return (
        <div className="flex gap-2 flex-1">
          <Input
            type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
            placeholder="From"
            value={condition.value || ''}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            className="flex-1"
          />
          <span className="self-center">to</span>
          <Input
            type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
            placeholder="To"
            value={condition.value2 || ''}
            onChange={(e) => updateCondition(condition.id, { value2: e.target.value })}
            className="flex-1"
          />
        </div>
      );
    }

    // Default input
    return (
      <Input
        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
        placeholder="Value"
        value={condition.value || ''}
        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
        className="flex-1"
      />
    );
  };

  // Handle save
  const handleSave = () => {
    if (filterName.trim() && onSave) {
      onSave(filterName.trim());
      setFilterName('');
      setSaveDialogOpen(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            <h3 className="font-semibold">Filters</h3>
            {conditions.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({conditions.length} active)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {conditions.length > 0 && onClear && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Conditions */}
        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <div key={condition.id} className="flex items-start gap-2">
              <div className="flex-1 flex flex-wrap items-start gap-2">
                {/* Field selector */}
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[150px]"
                >
                  {fields.map(field => (
                    <option key={field.name} value={field.name}>
                      {field.label}
                    </option>
                  ))}
                </select>

                {/* Operator selector */}
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(condition.id, { operator: e.target.value as FilterOperator })}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[150px]"
                >
                  {getOperators(condition.field).map(op => (
                    <option key={op} value={op}>
                      {OPERATOR_LABELS[op]}
                    </option>
                  ))}
                </select>

                {/* Value input */}
                {renderValueInput(condition)}
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCondition(condition.id)}
                className="h-10 w-10 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {conditions.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No filters applied. Click "Add Filter" to get started.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button variant="outline" size="sm" onClick={addCondition}>
            <Plus className="h-4 w-4 mr-2" />
            Add Filter
          </Button>

          <div className="flex gap-2">
            {showSaveButton && conditions.length > 0 && (
              <>
                {!saveDialogOpen ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSaveDialogOpen(true)}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Filter
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Filter name..."
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      className="h-9 w-40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') setSaveDialogOpen(false);
                      }}
                    />
                    <Button size="sm" onClick={handleSave}>
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSaveDialogOpen(false);
                        setFilterName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}

            {onApply && (
              <Button size="sm" onClick={onApply}>
                Apply Filters
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
