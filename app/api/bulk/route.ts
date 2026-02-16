import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { getSupabaseClient, getSupabaseAdminClient } from '@/lib/supabase/dynamic';
import type {
  BulkOperationRequest,
  BulkOperationResponse,
  BulkUpdateTaskStatusData,
  BulkUpdateTaskPriorityData,
  BulkAssignDueDateData,
} from '@/types/preferences';

const MAX_ITEMS = 500;

/**
 * POST /api/bulk
 * Execute bulk operations on entities (investors, tasks, interactions)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: BulkOperationRequest = await request.json();
    const { entity_type, operation, item_ids, data } = body;

    // Validation
    if (!entity_type || !operation || !item_ids || !Array.isArray(item_ids)) {
      return NextResponse.json(
        { error: 'Invalid request: entity_type, operation, and item_ids are required' },
        { status: 400 }
      );
    }

    if (item_ids.length === 0) {
      return NextResponse.json(
        { error: 'No items selected' },
        { status: 400 }
      );
    }

    if (item_ids.length > MAX_ITEMS) {
      return NextResponse.json(
        { error: `Cannot process more than ${MAX_ITEMS} items at once` },
        { status: 400 }
      );
    }

    // Execute operation based on entity type and operation
    let result: BulkOperationResponse;

    switch (entity_type) {
      case 'tasks':
        result = await handleTaskBulkOperation(supabase, operation, item_ids, data, user.id);
        break;

      case 'investors':
        result = await handleInvestorBulkOperation(supabase, operation, item_ids, data, user.id);
        break;

      case 'interactions':
        result = await handleInteractionBulkOperation(supabase, operation, item_ids, data, user.id);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid entity_type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result, { status: result.success ? 200 : 207 });

  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle bulk operations on tasks
 */
async function handleTaskBulkOperation(
  supabase: any,
  operation: string,
  item_ids: string[],
  data: any,
  user_id: string
): Promise<BulkOperationResponse> {
  const errors: Array<{ item_id: string; error: string }> = [];
  let successful = 0;

  try {
    switch (operation) {
      case 'update_status': {
        const { status } = data as BulkUpdateTaskStatusData;
        if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
          return {
            success: false,
            total: item_ids.length,
            successful: 0,
            failed: item_ids.length,
            message: 'Invalid status value',
          };
        }

        const updateData: any = { status, updated_at: new Date().toISOString() };
        if (status === 'completed') {
          updateData.completed_at = new Date().toISOString();
          updateData.completed_by = user_id;
        }

        const { error } = await supabase
          .from('tasks')
          .update(updateData)
          .in('id', item_ids);

        if (error) throw error;
        successful = item_ids.length;
        break;
      }

      case 'update_priority': {
        const { priority } = data as BulkUpdateTaskPriorityData;
        if (!priority || !['low', 'medium', 'high'].includes(priority)) {
          return {
            success: false,
            total: item_ids.length,
            successful: 0,
            failed: item_ids.length,
            message: 'Invalid priority value',
          };
        }

        const { error } = await supabase
          .from('tasks')
          .update({ priority, updated_at: new Date().toISOString() })
          .in('id', item_ids);

        if (error) throw error;
        successful = item_ids.length;
        break;
      }

      case 'assign_due_date': {
        const { due_date } = data as BulkAssignDueDateData;
        if (!due_date || !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
          return {
            success: false,
            total: item_ids.length,
            successful: 0,
            failed: item_ids.length,
            message: 'Invalid due_date format (expected YYYY-MM-DD)',
          };
        }

        const { error } = await supabase
          .from('tasks')
          .update({ due_date, updated_at: new Date().toISOString() })
          .in('id', item_ids);

        if (error) throw error;
        successful = item_ids.length;
        break;
      }

      case 'delete': {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .in('id', item_ids);

        if (error) throw error;
        successful = item_ids.length;
        break;
      }

      default:
        return {
          success: false,
          total: item_ids.length,
          successful: 0,
          failed: item_ids.length,
          message: 'Invalid operation for tasks',
        };
    }

    return {
      success: true,
      total: item_ids.length,
      successful,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully ${operation.replace(/_/g, ' ')} ${successful} task${successful !== 1 ? 's' : ''}`,
    };

  } catch (error: any) {
    console.error('Task bulk operation error:', error);
    return {
      success: false,
      total: item_ids.length,
      successful: 0,
      failed: item_ids.length,
      message: error.message || 'Failed to execute bulk operation',
    };
  }
}

/**
 * Handle bulk operations on investors
 */
async function handleInvestorBulkOperation(
  supabase: any,
  operation: string,
  item_ids: string[],
  data: any,
  user_id: string
): Promise<BulkOperationResponse> {
  try {
    switch (operation) {
      case 'delete': {
        // Soft delete by setting deleted_at (use admin client to bypass RLS)
        const adminClient = await getSupabaseAdminClient();
        const { error } = await adminClient
          .from('investors')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', item_ids)
          .is('deleted_at', null);

        if (error) throw error;

        return {
          success: true,
          total: item_ids.length,
          successful: item_ids.length,
          failed: 0,
          message: `Successfully deleted ${item_ids.length} investor${item_ids.length !== 1 ? 's' : ''}`,
        };
      }

      case 'add_tag': {
        const { tag } = data;
        if (!tag) {
          return {
            success: false,
            total: item_ids.length,
            successful: 0,
            failed: item_ids.length,
            message: 'Tag is required',
          };
        }

        // Note: This assumes you have a tags field or table
        // Adjust based on your actual schema
        return {
          success: false,
          total: item_ids.length,
          successful: 0,
          failed: item_ids.length,
          message: 'Tag functionality not yet implemented',
        };
      }

      case 'export': {
        // Export is typically handled client-side
        // This is just a placeholder
        return {
          success: false,
          total: item_ids.length,
          successful: 0,
          failed: item_ids.length,
          message: 'Export should be handled client-side',
        };
      }

      default:
        return {
          success: false,
          total: item_ids.length,
          successful: 0,
          failed: item_ids.length,
          message: 'Invalid operation for investors',
        };
    }

  } catch (error: any) {
    console.error('Investor bulk operation error:', error);
    return {
      success: false,
      total: item_ids.length,
      successful: 0,
      failed: item_ids.length,
      message: error.message || 'Failed to execute bulk operation',
    };
  }
}

/**
 * Handle bulk operations on interactions
 */
async function handleInteractionBulkOperation(
  supabase: any,
  operation: string,
  item_ids: string[],
  data: any,
  user_id: string
): Promise<BulkOperationResponse> {
  try {
    switch (operation) {
      case 'delete': {
        const { error } = await supabase
          .from('activities')
          .delete()
          .in('id', item_ids);

        if (error) throw error;

        return {
          success: true,
          total: item_ids.length,
          successful: item_ids.length,
          failed: 0,
          message: `Successfully deleted ${item_ids.length} interaction${item_ids.length !== 1 ? 's' : ''}`,
        };
      }

      case 'change_interaction_type': {
        const { interaction_type } = data;
        if (!interaction_type) {
          return {
            success: false,
            total: item_ids.length,
            successful: 0,
            failed: item_ids.length,
            message: 'Interaction type is required',
          };
        }

        const validTypes = ['call', 'email', 'meeting', 'note', 'stage_change', 'field_update'];
        if (!validTypes.includes(interaction_type)) {
          return {
            success: false,
            total: item_ids.length,
            successful: 0,
            failed: item_ids.length,
            message: 'Invalid interaction type',
          };
        }

        const { error } = await supabase
          .from('activities')
          .update({ activity_type: interaction_type })
          .in('id', item_ids);

        if (error) throw error;

        return {
          success: true,
          total: item_ids.length,
          successful: item_ids.length,
          failed: 0,
          message: `Successfully changed type for ${item_ids.length} interaction${item_ids.length !== 1 ? 's' : ''}`,
        };
      }

      default:
        return {
          success: false,
          total: item_ids.length,
          successful: 0,
          failed: item_ids.length,
          message: 'Invalid operation for interactions',
        };
    }

  } catch (error: any) {
    console.error('Interaction bulk operation error:', error);
    return {
      success: false,
      total: item_ids.length,
      successful: 0,
      failed: item_ids.length,
      message: error.message || 'Failed to execute bulk operation',
    };
  }
}
