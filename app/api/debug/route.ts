/**
 * Debug endpoint to verify environment configuration
 * DELETE THIS FILE after debugging is complete
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  return Response.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiKeyConfigured: !!apiKey,
    apiKeyPrefix: apiKey?.substring(0, 10),
    apiKeyLength: apiKey?.length,
    allEnvVars: Object.keys(process.env).filter(key =>
      key.includes('ANTHROPIC') || key.includes('SUPABASE')
    ),
  });
}
