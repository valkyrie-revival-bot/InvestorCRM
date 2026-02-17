/**
 * D-ID API Client
 * Creates animated talking avatars with lip-sync
 */

const DID_API_URL = 'https://api.d-id.com';

export interface CreateTalkParams {
  sourceUrl: string; // URL to the avatar image
  script: {
    type: 'text' | 'audio';
    input: string; // Text to speak or audio URL
    provider?: {
      type: 'microsoft' | 'amazon' | 'elevenlabs';
      voice_id: string;
    };
  };
  config?: {
    stitch?: boolean;
    result_format?: 'mp4' | 'gif' | 'mov';
  };
}

export interface TalkResponse {
  id: string;
  status: 'created' | 'processing' | 'done' | 'error';
  result_url?: string;
  error?: {
    description: string;
  };
}

/**
 * Create a talking avatar video
 */
export async function createTalk(params: CreateTalkParams): Promise<TalkResponse> {
  const apiKey = process.env.DID_API_KEY;

  if (!apiKey) {
    throw new Error('DID_API_KEY not configured');
  }

  const response = await fetch(`${DID_API_URL}/talks`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Get status of a talking avatar video
 */
export async function getTalkStatus(talkId: string): Promise<TalkResponse> {
  const apiKey = process.env.DID_API_KEY;

  if (!apiKey) {
    throw new Error('DID_API_KEY not configured');
  }

  const response = await fetch(`${DID_API_URL}/talks/${talkId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Delete a talking avatar video
 */
export async function deleteTalk(talkId: string): Promise<void> {
  const apiKey = process.env.DID_API_KEY;

  if (!apiKey) {
    throw new Error('DID_API_KEY not configured');
  }

  const response = await fetch(`${DID_API_URL}/talks/${talkId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${response.status} ${error}`);
  }
}

/**
 * Create streaming talk session (real-time)
 */
export async function createStreamingSession(sourceUrl: string) {
  const apiKey = process.env.DID_API_KEY;

  if (!apiKey) {
    throw new Error('DID_API_KEY not configured');
  }

  const response = await fetch(`${DID_API_URL}/talks/streams`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: sourceUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${response.status} ${error}`);
  }

  return response.json();
}
