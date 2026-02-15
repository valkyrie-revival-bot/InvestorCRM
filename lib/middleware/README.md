# Middleware Documentation

## Request Logger

The request logger middleware provides automatic logging for API routes.

### Usage

To add logging to an API route, wrap your handler with `loggedRoute`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { loggedRoute } from '@/lib/middleware/request-logger';

export const GET = loggedRoute(async (request: NextRequest) => {
  // Your handler code
  return NextResponse.json({ data: 'example' });
});

export const POST = loggedRoute(async (request: NextRequest) => {
  const body = await request.json();

  // Your handler code
  return NextResponse.json({ success: true });
});
```

### What it logs

The middleware automatically logs:
- Incoming requests with method, path, and user agent
- Request completion with status code and duration
- Errors with full stack traces
- Unique request ID for tracing

### Log Format

Logs are written to:
- `logs/app.log` - All log levels
- `logs/error.log` - Errors only

Each log entry includes:
- `timestamp` - ISO 8601 format
- `level` - Log level (http, error, etc.)
- `message` - Human-readable message
- `requestId` - UUID for request tracing
- `method` - HTTP method
- `path` - Request path
- `duration` - Request duration in milliseconds
- `status` - HTTP status code (on completion)

### Example Log Entry

```json
{
  "timestamp": "2026-02-15 04:22:58",
  "level": "http",
  "message": "Request completed",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/api/health",
  "status": 200,
  "duration": 45,
  "service": "sales-crm"
}
```
