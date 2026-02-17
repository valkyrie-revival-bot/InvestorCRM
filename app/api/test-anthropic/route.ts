/**
 * Test endpoint to verify Anthropic API connectivity
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim().replace(/\s+/g, '');

    if (!apiKey) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY not set' },
        { status: 500 }
      );
    }

    console.log('Testing Anthropic API...');
    console.log('API Key present:', !!apiKey);
    console.log('API Key length:', apiKey.length);
    console.log('API Key starts with:', apiKey.substring(0, 10));

    // Simple test request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, API test successful!"'
          }
        ]
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);

      return Response.json(
        {
          success: false,
          status: response.status,
          error: errorText,
        },
        { status: 200 } // Return 200 so we can see the error
      );
    }

    const data = await response.json();
    console.log('Success! Response:', data);

    return Response.json({
      success: true,
      status: response.status,
      message: 'Anthropic API is working!',
      response: data,
    });

  } catch (error) {
    console.error('Test error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 200 } // Return 200 so we can see the error
    );
  }
}
