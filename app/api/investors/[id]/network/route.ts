/**
 * Network Graph API Route
 * GET /api/investors/[id]/network
 *
 * Returns network graph data for visualizing warm intro paths
 * to a specific investor through LinkedIn connections
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNetworkGraph } from '@/app/actions/network';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 16: params is a Promise
    const { id } = await context.params;

    // Validate investor ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid investor ID' },
        { status: 400 }
      );
    }

    // Fetch network graph data
    const result = await getNetworkGraph(id);

    if (result.error) {
      const status = result.error === 'Unauthorized' ? 401 :
                     result.error === 'Investor not found' ? 404 : 500;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Network API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
