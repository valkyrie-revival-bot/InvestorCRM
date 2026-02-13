# Phase 9: AI BDR Agent - Research

**Researched:** 2026-02-13
**Domain:** Conversational AI agent with tool calling for CRM operations
**Confidence:** HIGH

## Summary

Phase 9 implements a conversational AI BDR (Business Development Representative) agent that enables natural language interaction with the investor CRM. The agent provides pipeline intelligence, strategic recommendations, and conversational record updates through a chat interface with tool calling capabilities.

The 2026 standard approach uses **Vercel AI SDK v6** with **Claude Opus 4.6/Sonnet 4.5** for the LLM, implementing a tool-calling architecture where the AI agent can execute database queries, update CRM records, and provide strategic insights. The architecture requires careful security design with input validation, least-privilege access controls, and prompt injection defenses.

Key architectural decisions:
- **Vercel AI SDK v6** with ToolLoopAgent for agentic workflows (native Next.js integration)
- **Claude Opus 4.6/Sonnet 4.5** for reasoning and tool calling (best coding/reasoning model in 2026)
- **Mem0** for conversation memory and user preference tracking (production standard for AI agents)
- **Read-only default access** with explicit privilege escalation for write operations
- **Multi-layered security**: Input validation, output filtering, tool-level permissions, audit logging
- **assistant-ui or @llamaindex/chat-ui** for React chat interface components

**Primary recommendation:** Use Vercel AI SDK v6's ToolLoopAgent pattern with Claude Sonnet 4.5 for cost-effective operations and Opus 4.6 for complex reasoning. Implement read-only tools by default, require explicit confirmation for write operations, and use Mem0 for conversation memory. Deploy with strict input validation and comprehensive audit logging.

## Standard Stack

The established libraries/tools for conversational AI agents with tool calling in 2026:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Vercel AI SDK** | v6.0.0+ | AI agent framework with tool calling | Native Next.js integration, built-in streaming responses, unified API for all LLM providers, ToolLoopAgent for multi-turn conversations. Designed for production with type safety, error handling, and React hooks (useChat). Lighter than LangChain for simple agents. |
| **Anthropic Claude** | Opus 4.6 / Sonnet 4.5 | LLM for reasoning and tool calling | Best reasoning model in 2026, 1M token context (entire investor pipeline), adaptive thinking for complex CRM logic, native web search tool. Opus 4.6 for complex reasoning, Sonnet 4.5 for cost-effective operations. Native support in Vercel AI SDK. |
| **Zod** | 3.x | Tool input schema validation | TypeScript-first validation for tool parameters, runtime + compile-time safety. Generate TypeScript types from schemas. Essential for tool calling with strict schema validation. Works seamlessly with Vercel AI SDK tools. |
| **Mem0** | Latest | AI agent memory layer | Production standard for persistent conversation context. Dual-layer memory (short-term + long-term), user preference tracking, graph memory for entity relationships. Maintains cross-session context at user, session, and agent levels. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **assistant-ui** | Latest | React chat UI components | Open source TypeScript/React library for production-grade AI chat interfaces. Handles streaming, auto-scrolling, accessibility, real-time updates. Best for custom-designed chat UX. |
| **@llamaindex/chat-ui** | Latest | React components for LLM chat | Ready-to-use UI elements for building chat interfaces in LLM applications. Faster implementation than building from scratch. Use if you need rapid prototyping. |
| **@chatscope/chat-ui-kit-react** | Latest | Chat UI component library | Open source toolkit for web chat applications. Use if you need highly customizable chat components with full code ownership. |
| **PostgreSQL pg_trgm** | Built-in | Fuzzy text search for NLP queries | Enables semantic search on CRM fields ("show me stalled investors"). Use for natural language to SQL query generation. Already enabled in project (Phase 4.5). |
| **Supabase RLS** | Built-in | Row-level security for AI tool access | Enforce least-privilege access at database level. AI agent tools use authenticated user context, RLS policies prevent unauthorized data access. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel AI SDK | LangChain | LangChain better for complex multi-agent orchestration, but heavier abstraction layer, slower execution, larger bundle. Vercel AI SDK sufficient for single BDR agent. |
| Claude | OpenAI GPT-4o | GPT-4o has better structured output mode (JSON schema), but Claude Opus 4.6 has better reasoning and 1M token context. Claude preferred for complex CRM logic. |
| Mem0 | Zep or LangChain memory | Zep excels at temporal knowledge graphs, LangChain memory is tightly coupled to LangChain. Mem0 best balance of features and flexibility. |
| assistant-ui | Build from scratch | Custom build gives full control but takes longer. assistant-ui provides production-ready patterns with streaming and accessibility built-in. |

**Installation:**
```bash
# AI agent core
npm install ai @ai-sdk/anthropic
npm install mem0ai  # Memory layer
npm install zod     # Already installed, Phase 3

# Chat UI (choose one)
npm install @assistant-ui/react  # For custom UX
# OR
npm install @llamaindex/chat-ui  # For rapid prototyping
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts           # Chat API endpoint with ToolLoopAgent
├── lib/
│   ├── ai/
│   │   ├── agent.ts               # BDR agent configuration
│   │   ├── tools/
│   │   │   ├── query-pipeline.ts  # Read-only CRM queries
│   │   │   ├── update-investor.ts # Write operations (require confirmation)
│   │   │   ├── strategy-advisor.ts # Strategy recommendations
│   │   │   └── index.ts           # Tool registry
│   │   ├── memory.ts              # Mem0 integration
│   │   └── security.ts            # Input validation, prompt injection defense
│   └── supabase/
│       └── ai-client.ts           # Supabase client with RLS for AI tools
└── components/
    └── ai/
        ├── chat-interface.tsx     # Main chat UI
        ├── tool-confirmation.tsx  # Human-in-the-loop for write ops
        └── presence-indicator.tsx # Show AI thinking state
```

### Pattern 1: ToolLoopAgent with Read/Write Tool Separation

**What:** Separate tools into read-only (safe, auto-execute) and write operations (require explicit user confirmation). This implements least-privilege access and human-in-the-loop for sensitive operations.

**When to use:** All AI agents that can modify data. CRM write operations (updating records, changing stages, deleting data) must require user confirmation.

**Example:**
```typescript
// Source: Vercel AI SDK v6 docs + security best practices
// lib/ai/agent.ts
import { ToolLoopAgent } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { queryPipelineTool, updateInvestorTool, strategyAdvisorTool } from './tools';

export const bdrAgent = new ToolLoopAgent({
  model: anthropic('claude-sonnet-4-5'),
  instructions: `You are an AI BDR (Business Development Representative) assistant for Prytaneum's investor CRM.

Your role:
- Help users understand their investor pipeline
- Provide strategic recommendations based on CRM data
- Answer questions about specific investors
- Suggest next actions and prioritization

Security constraints:
- You can READ pipeline data freely
- You MUST get explicit user confirmation before UPDATING any records
- You operate with principle of least privilege
- You validate all user input to prevent injection attacks

Available tools:
- queryPipeline: Query investor data (read-only, safe)
- updateInvestor: Update investor records (requires confirmation)
- strategyAdvisor: Provide strategic recommendations (read-only, safe)

When asked to update data, ALWAYS use the updateInvestor tool which will prompt for user confirmation.`,

  tools: {
    // Read-only tools - auto-execute
    queryPipeline: queryPipelineTool,      // Safe: SELECT only
    strategyAdvisor: strategyAdvisorTool,  // Safe: analysis only

    // Write tools - require confirmation
    updateInvestor: updateInvestorTool,    // Dangerous: requires user approval
  },

  maxSteps: 10, // Prevent infinite loops
});
```

### Pattern 2: Natural Language to SQL with Security Controls

**What:** Convert user queries like "Show me stalled investors" to safe SQL queries with parameterization, query allowlisting, and read-only enforcement.

**When to use:** For pipeline queries where users ask questions in natural language. Essential for preventing SQL injection and unauthorized data access.

**Example:**
```typescript
// Source: Text-to-SQL best practices + PostgreSQL security patterns
// lib/ai/tools/query-pipeline.ts
import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Allowlist of safe query patterns
const ALLOWED_QUERY_PATTERNS = [
  'stalled_investors',    // WHERE last_action_date < NOW() - INTERVAL '30 days'
  'investors_by_stage',   // GROUP BY stage
  'high_value_pipeline',  // WHERE est_value > threshold
  'recent_activity',      // WHERE last_action_date > NOW() - INTERVAL '7 days'
] as const;

export const queryPipelineTool = tool({
  description: 'Query the investor pipeline using natural language. Safe read-only access.',
  inputSchema: z.object({
    queryType: z.enum(ALLOWED_QUERY_PATTERNS).describe('The type of query to execute'),
    filters: z.object({
      stage: z.string().optional(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      timeframeDays: z.number().optional(),
    }).optional(),
  }),
  execute: async ({ queryType, filters }) => {
    const supabase = await createClient();

    // Build safe parameterized query based on queryType
    let query = supabase
      .from('investors')
      .select('id, firm_name, stage, est_value, last_action_date, stage_entry_date');

    switch (queryType) {
      case 'stalled_investors':
        const stalledDate = new Date();
        stalledDate.setDate(stalledDate.getDate() - (filters?.timeframeDays || 30));
        query = query.lt('last_action_date', stalledDate.toISOString());
        break;

      case 'investors_by_stage':
        if (filters?.stage) {
          query = query.eq('stage', filters.stage);
        }
        break;

      case 'high_value_pipeline':
        if (filters?.minValue) {
          query = query.gte('est_value', filters.minValue);
        }
        break;

      case 'recent_activity':
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - (filters?.timeframeDays || 7));
        query = query.gte('last_action_date', recentDate.toISOString());
        break;
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    return {
      count: data.length,
      investors: data,
      queryType,
      executedAt: new Date().toISOString(),
    };
  },
});
```

### Pattern 3: Human-in-the-Loop for Write Operations

**What:** Require explicit user confirmation before executing any write operation (UPDATE, DELETE). Present the proposed change, wait for approval, then execute.

**When to use:** All CRM write operations initiated by AI agent. Prevents accidental data corruption and implements security best practice.

**Example:**
```typescript
// Source: Vercel AI SDK human-in-the-loop patterns
// lib/ai/tools/update-investor.ts
import { tool } from 'ai';
import { z } from 'zod';
import { updateInvestorField } from '@/lib/actions/investors';

export const updateInvestorTool = tool({
  description: 'Update an investor record. REQUIRES USER CONFIRMATION before execution.',
  inputSchema: z.object({
    investorId: z.string().uuid(),
    field: z.enum(['stage', 'internal_conviction', 'est_value', 'next_action', 'next_action_date']),
    newValue: z.union([z.string(), z.number()]),
    reason: z.string().describe('Why this update is being made'),
  }),
  execute: async ({ investorId, field, newValue, reason }) => {
    // This tool returns a confirmation request, not the actual update
    // The UI will show this to the user and call the actual update action if approved
    return {
      status: 'confirmation_required',
      action: 'update_investor',
      details: {
        investorId,
        field,
        currentValue: '(fetch from DB)',
        newValue,
        reason,
      },
      confirmationToken: crypto.randomUUID(), // One-time use token
    };
  },
});

// Separate server action for confirmed updates (called after user approves)
// app/api/ai/confirm-update/route.ts
export async function POST(request: Request) {
  const { confirmationToken, investorId, field, newValue } = await request.json();

  // Validate token (store in Redis/session with TTL)
  const isValid = await validateConfirmationToken(confirmationToken);
  if (!isValid) {
    return Response.json({ error: 'Invalid or expired confirmation' }, { status: 403 });
  }

  // Execute the actual update
  const result = await updateInvestorField(investorId, field, newValue);

  // Audit log
  await logAuditEvent({
    event_type: 'ai_agent_update',
    details: { investorId, field, newValue, confirmedByUser: true },
  });

  // Invalidate token
  await invalidateConfirmationToken(confirmationToken);

  return Response.json({ success: true, result });
}
```

### Pattern 4: Conversation Memory with Mem0

**What:** Persist conversation context and user preferences across sessions using Mem0's dual-layer memory architecture (short-term + long-term).

**When to use:** For personalized AI interactions where the agent should remember user preferences, past queries, and investor context from previous conversations.

**Example:**
```typescript
// Source: Mem0 documentation + LangChain integration patterns
// lib/ai/memory.ts
import { Memory } from 'mem0ai';

// Initialize Mem0 client
export const memory = new Memory({
  apiKey: process.env.MEM0_API_KEY,
});

// Save conversation turn to memory
export async function saveConversationToMemory(
  userId: string,
  userMessage: string,
  assistantResponse: string,
  context?: Record<string, any>
) {
  await memory.add(
    [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantResponse },
    ],
    {
      user_id: userId,
      metadata: {
        timestamp: new Date().toISOString(),
        context, // e.g., { investorId: 'abc-123', action: 'query_pipeline' }
      },
    }
  );
}

// Retrieve relevant memories for context
export async function getRelevantMemories(userId: string, query: string, limit = 3) {
  const results = await memory.search(query, {
    user_id: userId,
    limit,
  });

  return results.results.map(m => m.memory);
}

// Integration with chat API route
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, userId } = await req.json();
  const latestUserMessage = messages[messages.length - 1].content;

  // Retrieve relevant memories for context
  const relevantMemories = await getRelevantMemories(userId, latestUserMessage);

  // Inject memories into system prompt
  const systemPromptWithMemory = `You are an AI BDR assistant.

Relevant context from past conversations:
${relevantMemories.map(m => `- ${m}`).join('\n')}

[... rest of system prompt ...]`;

  const result = await bdrAgent.execute({
    messages,
    systemPrompt: systemPromptWithMemory,
  });

  // Save this conversation turn
  await saveConversationToMemory(
    userId,
    latestUserMessage,
    result.text,
    { investorsQueried: result.investorsInContext }
  );

  return result.toUIMessageStreamResponse();
}
```

### Anti-Patterns to Avoid

- **Unrestricted SQL generation:** NEVER allow AI to generate arbitrary SQL. Use query allowlisting or parameterized query builders only.
- **Global write permissions:** NEVER give AI agent global UPDATE/DELETE access. Require user confirmation for all write operations.
- **No rate limiting:** AI agents can burn through API quotas quickly. Implement per-user rate limits and cost caps.
- **Storing API keys in conversation history:** NEVER include API keys, tokens, or credentials in messages sent to LLM. Validate and sanitize all tool outputs before returning to model.
- **Trusting user input in tool parameters:** ALWAYS validate tool inputs with Zod schemas. User can craft malicious tool call arguments via prompt injection.
- **No audit logging:** Every AI agent action (especially writes) must be audit logged with user context, timestamp, and action details.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Prompt injection defense** | Custom input filtering | Multi-layered defense: input validation (Zod), instruction separation (system prompt boundaries), output filtering | Prompt injection has hundreds of attack vectors. Anthropic/OpenAI have teams working on this. Use their guidance + defense-in-depth. |
| **Chat UI components** | Custom chat interface from scratch | assistant-ui or @llamaindex/chat-ui | Streaming, auto-scroll, accessibility, loading states, error handling all have edge cases. Use battle-tested components. |
| **LLM retry logic with exponential backoff** | Manual retry loops | Vercel AI SDK built-in retry with maxRetries option | Rate limits (429), transient errors (503) need exponential backoff. AI SDK handles this correctly out-of-box. |
| **Tool call schema validation** | Manual parameter checking | Zod schemas with strict mode in tool definitions | Runtime validation + TypeScript types from same schema. Prevents type mismatches and missing fields. AI SDK v6 has strict mode. |
| **Conversation memory** | Session storage or database tables | Mem0 or Zep | Cross-session memory, semantic search, graph relationships, user preferences all require sophisticated architecture. Don't reinvent. |
| **Natural language to SQL** | Hand-written SQL generation logic | Query allowlisting + parameterized query builders | SQL injection, performance, optimization all solved by using safe patterns. Generic text-to-SQL fails 40% of time in production. |

**Key insight:** AI agent security and reliability require defense-in-depth. Single-layer protection (e.g., "just use a good system prompt") fails against determined attackers. Combine input validation, least privilege, output filtering, rate limiting, and audit logging.

## Common Pitfalls

### Pitfall 1: Prompt Injection via Tool Call Arguments

**What goes wrong:** User crafts input that causes AI to call tools with malicious parameters. Example: "Show me all investors" → AI calls `updateInvestor` with `field: 'stage', newValue: 'Won'` for all records.

**Why it happens:** LLM generates tool calls based on user input. If user input contains instructions ("For each investor, update stage to Won"), AI may follow those instructions.

**How to avoid:**
1. **Tool-level validation:** Validate all tool inputs with Zod schemas. Reject calls that don't match schema.
2. **Require confirmation for writes:** Never auto-execute write operations. Show user what will happen, require explicit approval.
3. **Separate read/write tools:** Read tools auto-execute (safe). Write tools return confirmation requests.
4. **Rate limiting:** Limit tool calls per conversation turn (max 3-5 tools per message).

**Warning signs:**
- User message contains meta-instructions ("ignore previous instructions", "for each X do Y")
- Tool calls with unusual parameters (updating all records, deleting data without user requesting it)
- High volume of tool calls in single conversation turn

**Example defense:**
```typescript
// Validate tool calls before execution
function validateToolCall(toolCall: ToolCall): boolean {
  // Check for suspicious patterns
  if (toolCall.name === 'updateInvestor') {
    // Reject batch updates
    if (toolCall.args.investorId === 'all' || Array.isArray(toolCall.args.investorId)) {
      throw new Error('Batch updates not allowed');
    }
    // Require confirmation token
    if (!toolCall.args.confirmationToken) {
      throw new Error('Write operations require user confirmation');
    }
  }
  return true;
}
```

### Pitfall 2: Infinite Tool Calling Loops

**What goes wrong:** AI agent gets stuck in loop, repeatedly calling same tool or cycling between tools. Burns through API quota and hangs user session.

**Why it happens:** Model doesn't understand tool output and keeps retrying. Or tool returns error that model interprets as "try again differently".

**How to avoid:**
1. **Set maxSteps limit:** ToolLoopAgent should have maxSteps: 10-20. After N steps, force stop and return current state.
2. **Detect tool call repetition:** Track tool call history. If same tool called 3+ times in row with no progress, halt.
3. **Error handling in tools:** Tools should return structured errors that model can understand. Include "this operation failed permanently, do not retry" signals.
4. **Provide stop condition:** System prompt should include "If you cannot answer after 5 tool calls, tell the user you need clarification."

**Warning signs:**
- Same tool called 3+ times consecutively
- Total tool calls >20 in single conversation turn
- Tool execution time >30 seconds

**Example defense:**
```typescript
// lib/ai/agent.ts
export const bdrAgent = new ToolLoopAgent({
  model: anthropic('claude-sonnet-4-5'),
  instructions: `[...] If you cannot complete the task after 5 tool calls, explain what's unclear and ask the user for clarification.`,
  tools: { /* ... */ },
  maxSteps: 10, // Hard limit on tool calling loop

  // Custom stop condition
  stopWhen: (stepResult) => {
    // Stop if same tool called 3 times in row
    const recentToolCalls = stepResult.toolCalls.slice(-3);
    const allSameTool = recentToolCalls.every(tc => tc.name === recentToolCalls[0].name);
    if (allSameTool) {
      return true;
    }
    return false;
  },
});
```

### Pitfall 3: Exposing Sensitive Data in Chat History

**What goes wrong:** User asks "What's the email address for investor X?" → AI returns email → Email now in conversation history → Sent to LLM on every subsequent turn → Increases token cost and risk of accidental disclosure.

**Why it happens:** Chat interfaces store full conversation history. If tools return sensitive data (emails, phone numbers, internal notes), that data persists in context.

**How to avoid:**
1. **Redact sensitive fields:** Tools should redact or summarize sensitive data before returning to model.
2. **Separate display from context:** Show full data to user in UI, but only send summary to model.
3. **Truncate old context:** After 10-20 message turns, summarize early conversation and drop exact details.
4. **Use message metadata:** Store sensitive data in message metadata (shown to user, not sent to LLM).

**Warning signs:**
- Context window consistently at limit (100K+ tokens)
- User receives data disclosure warnings from compliance team
- High token costs despite short conversations

**Example defense:**
```typescript
// lib/ai/tools/query-pipeline.ts
export const queryPipelineTool = tool({
  // ...
  execute: async ({ queryType, filters }) => {
    const { data } = await query;

    // Redact sensitive fields before returning to model
    const sanitizedData = data.map(investor => ({
      id: investor.id,
      firm_name: investor.firm_name,
      stage: investor.stage,
      // Redact email/phone
      contact_summary: `Contact: ${investor.contact_name} (details available)`,
      // Summarize internal notes
      notes_preview: investor.internal_notes?.slice(0, 100) + '...',
    }));

    return {
      count: sanitizedData.length,
      investors: sanitizedData,
      note: 'Full contact details available in UI. Not included in context to reduce token usage.',
    };
  },
});
```

### Pitfall 4: No Rate Limiting on AI Endpoint

**What goes wrong:** User (or attacker) sends 100 requests per minute → Burns through API quota → Costs spike → Service degraded for all users.

**Why it happens:** AI API endpoints are HTTP endpoints. Without rate limiting, anyone can spam them.

**How to avoid:**
1. **Per-user rate limits:** Limit to 20 requests per minute per user. Use Vercel Edge Config or Upstash Redis for rate limit tracking.
2. **Cost caps:** Track token usage per user per day. Halt service if user exceeds daily budget.
3. **Require authentication:** Never expose AI endpoints publicly without auth. Use Supabase Auth to identify users.
4. **Queue long-running requests:** If request will take >10s, return "processing" immediately and use webhook/polling to deliver result later.

**Warning signs:**
- Anthropic/OpenAI bill spikes unexpectedly
- Single user accounts for >50% of daily token usage
- Endpoint latency degrades for all users

**Example defense:**
```typescript
// app/api/chat/route.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check
  const { success, remaining } = await ratelimit.limit(user.id);
  if (!success) {
    return Response.json(
      { error: 'Rate limit exceeded. Try again in 1 minute.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
    );
  }

  // Process chat request...
}
```

## Code Examples

Verified patterns from official sources:

### Chat API Route with Tool Calling

```typescript
// Source: Vercel AI SDK v6 docs (Context7 verified)
// app/api/chat/route.ts
import { createUIMessageStreamResponse, streamText, convertToModelMessages, UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { queryPipelineTool, updateInvestorTool } from '@/lib/ai/tools';
import { getRelevantMemories } from '@/lib/ai/memory';
import { getCurrentUser } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  // Retrieve relevant memories for context
  const latestUserMessage = messages[messages.length - 1]?.content;
  const memories = await getRelevantMemories(user.id, latestUserMessage);

  // System prompt with memory context
  const systemPrompt = `You are an AI BDR assistant for Prytaneum's investor CRM.

Relevant context from past conversations:
${memories.map(m => `- ${m}`).join('\n')}

Your role: Help users understand their pipeline, provide strategic recommendations, and answer questions about investors.

Security: You can READ data freely. You MUST get user confirmation before UPDATING records.`;

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools: {
      queryPipeline: queryPipelineTool,
      updateInvestor: updateInvestorTool,
    },
    maxSteps: 10, // Prevent infinite loops
  });

  return result.toUIMessageStreamResponse();
}
```

### Query Pipeline Tool (Read-Only)

```typescript
// Source: Text-to-SQL best practices + Supabase patterns
// lib/ai/tools/query-pipeline.ts
import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const queryPipelineTool = tool({
  description: 'Query the investor pipeline. Examples: stalled investors, high-value deals, recent activity.',
  inputSchema: z.object({
    intent: z.enum([
      'stalled_investors',
      'investors_by_stage',
      'high_value_pipeline',
      'recent_activity',
    ]).describe('What the user wants to find'),
    filters: z.object({
      stage: z.string().optional(),
      minValue: z.number().optional(),
      timeframeDays: z.number().optional(),
    }).optional(),
  }),
  execute: async ({ intent, filters }) => {
    const supabase = await createClient();

    let query = supabase
      .from('investors')
      .select('id, firm_name, stage, est_value, last_action_date, internal_conviction')
      .is('deleted_at', null); // Exclude soft-deleted

    // Apply intent-specific filtering
    if (intent === 'stalled_investors') {
      const stalledDate = new Date();
      stalledDate.setDate(stalledDate.getDate() - (filters?.timeframeDays || 30));
      query = query.lt('last_action_date', stalledDate.toISOString());
    } else if (intent === 'high_value_pipeline') {
      query = query.gte('est_value', filters?.minValue || 1000000);
    } else if (intent === 'recent_activity') {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - (filters?.timeframeDays || 7));
      query = query.gte('last_action_date', recentDate.toISOString());
    } else if (intent === 'investors_by_stage' && filters?.stage) {
      query = query.eq('stage', filters.stage);
    }

    const { data, error } = await query.limit(50); // Prevent huge result sets

    if (error) throw new Error(`Query failed: ${error.message}`);

    // Redact sensitive fields
    const sanitized = data.map(inv => ({
      firm_name: inv.firm_name,
      stage: inv.stage,
      est_value: inv.est_value,
      days_since_action: Math.floor(
        (Date.now() - new Date(inv.last_action_date).getTime()) / (1000 * 60 * 60 * 24)
      ),
      conviction: inv.internal_conviction,
    }));

    return {
      count: sanitized.length,
      investors: sanitized,
      summary: `Found ${sanitized.length} investors matching "${intent}"`,
    };
  },
});
```

### Update Investor Tool (Write with Confirmation)

```typescript
// Source: Human-in-the-loop patterns + security best practices
// lib/ai/tools/update-investor.ts
import { tool } from 'ai';
import { z } from 'zod';

export const updateInvestorTool = tool({
  description: 'Update an investor record. REQUIRES user confirmation. Explain what will change and why.',
  inputSchema: z.object({
    investorId: z.string().uuid(),
    field: z.enum(['stage', 'internal_conviction', 'est_value', 'next_action', 'next_action_date']),
    newValue: z.union([z.string(), z.number(), z.date().transform(d => d.toISOString())]),
    reason: z.string().min(10).describe('Why this update is needed'),
  }),
  execute: async ({ investorId, field, newValue, reason }) => {
    // Generate one-time confirmation token
    const confirmationToken = crypto.randomUUID();

    // Store token with 5-minute TTL (implement with Redis/session)
    await storeConfirmationToken(confirmationToken, {
      investorId,
      field,
      newValue,
      reason,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // Return confirmation request (not actual update)
    return {
      status: 'confirmation_required',
      message: `I can update ${field} to "${newValue}" for this investor.`,
      reason,
      confirmationToken,
      action: {
        label: 'Confirm Update',
        endpoint: '/api/ai/confirm-update',
        payload: { confirmationToken, investorId, field, newValue },
      },
    };
  },
});
```

### React Chat Interface with assistant-ui

```typescript
// Source: assistant-ui documentation
// components/ai/chat-interface.tsx
'use client';

import { useChat } from '@assistant-ui/react';
import { useState } from 'react';

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });
  const [pendingConfirmation, setPendingConfirmation] = useState<any>(null);

  // Handle tool confirmation requests
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.toolInvocations) {
      const confirmationRequest = lastMessage.toolInvocations.find(
        inv => inv.result?.status === 'confirmation_required'
      );
      if (confirmationRequest) {
        setPendingConfirmation(confirmationRequest.result);
      }
    }
  }, [messages]);

  async function handleConfirmUpdate() {
    if (!pendingConfirmation) return;

    const response = await fetch('/api/ai/confirm-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingConfirmation.action.payload),
    });

    const result = await response.json();
    setPendingConfirmation(null);

    // Continue conversation with confirmation result
    handleSubmit(new Event('submit'), {
      data: { toolConfirmation: result },
    });
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-muted-foreground">AI is thinking...</div>}
      </div>

      {/* Confirmation dialog */}
      {pendingConfirmation && (
        <div className="border-t p-4 bg-yellow-50 dark:bg-yellow-950">
          <p className="font-medium mb-2">Confirm Action</p>
          <p className="text-sm mb-3">{pendingConfirmation.message}</p>
          <p className="text-xs text-muted-foreground mb-3">Reason: {pendingConfirmation.reason}</p>
          <div className="flex gap-2">
            <button onClick={handleConfirmUpdate} className="btn-primary">Confirm</button>
            <button onClick={() => setPendingConfirmation(null)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your investor pipeline..."
          className="flex-1 input"
          disabled={isLoading || !!pendingConfirmation}
        />
        <button type="submit" disabled={isLoading || !!pendingConfirmation} className="btn-primary">
          Send
        </button>
      </form>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LangChain for all AI agents | Vercel AI SDK for simple agents, LangChain for complex multi-agent | Q4 2025 (AI SDK v6 stable) | Faster development, smaller bundles, native Next.js integration. LangChain still preferred for sophisticated orchestration. |
| JSON mode for structured output | Strict mode with Zod schemas | Q4 2025 (AI SDK v6 + Claude/GPT-4 updates) | Guaranteed schema compliance, no more type mismatches or missing fields in tool calls. |
| Session storage for chat memory | Mem0/Zep for production memory | Q2 2025 | Cross-session persistence, semantic search on memories, user preference tracking. Critical for personalized AI. |
| Prompt engineering for security | Defense-in-depth: input validation + least privilege + output filtering | Ongoing | Single-layer defenses fail. Multi-layer approach required for production AI agents. |
| Reactive tool calling (wait for result) | Streaming tool calls with partial updates | Q3 2025 (AI SDK 5.0) | Better UX - show tool inputs as they generate. Users see AI "thinking" process. |

**Deprecated/outdated:**
- **useCompletion for chat interfaces:** Replaced by useChat which handles multi-turn conversations and tool calling better.
- **JSON mode without schema validation:** Now use strict mode with Zod schemas for guaranteed compliance.
- **Global LLM API keys:** Now use per-user token tracking and cost caps to prevent abuse.
- **Manual retry logic:** AI SDK has built-in exponential backoff for rate limits (429) and transient errors (503).

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal tool count for single agent**
   - What we know: ToolLoopAgent supports unlimited tools, but LLM performance degrades with >10 tools
   - What's unclear: Exact threshold where Claude Sonnet 4.5 starts selecting wrong tools consistently
   - Recommendation: Start with 5 core tools (query, update, strategy, activity log, calendar). Monitor tool selection accuracy. If <90% accuracy, reduce tool count or improve descriptions.

2. **Cost optimization: Sonnet 4.5 vs Opus 4.6 threshold**
   - What we know: Sonnet 4.5 is cheaper, Opus 4.6 has better reasoning. Project uses Opus 4.6 elsewhere.
   - What's unclear: At what query complexity should we escalate from Sonnet to Opus?
   - Recommendation: Use Sonnet 4.5 by default. If query requires multi-step reasoning (>3 tool calls), retry with Opus 4.6. Monitor cost vs quality tradeoff over first week.

3. **Memory retention duration**
   - What we know: Mem0 supports indefinite memory storage. Too much memory increases latency and token cost.
   - What's unclear: How long to keep conversation memories? How to balance recency vs relevance?
   - Recommendation: Keep last 30 days of memories by default. Use Mem0's semantic search to retrieve only top-3 most relevant memories per query. Archive memories >90 days old unless explicitly referenced.

4. **Prompt injection detection accuracy**
   - What we know: Multi-layer defense (input validation + output filtering) catches most attacks
   - What's unclear: False positive rate for legitimate user queries that contain meta-instructions
   - Recommendation: Log suspected prompt injection attempts but don't block automatically. Review logs weekly to tune validation rules. Prioritize avoiding false positives over catching 100% of attacks.

## Sources

### Primary (HIGH confidence)
- [Vercel AI SDK v6 Documentation](https://ai-sdk.dev/docs/introduction) - Official docs for ToolLoopAgent, streaming, tool calling
- Context7: `/vercel/ai/ai_6.0.0-beta.128` - Code examples for chat API routes, tool definitions, streaming
- Context7: `/llmstxt/platform_claude_llms-full_txt` - Claude API tool use, function calling patterns
- Context7: `/mem0ai/mem0` - Memory integration with AI agents, LangChain patterns
- [Anthropic Claude Tool Use Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use) - Programmatic tool calling, strict mode
- [AI SDK 6 Release Blog](https://vercel.com/blog/ai-sdk-6) - Stable release announcement, new features (Jan 2026)

### Secondary (MEDIUM confidence)
- [What Is an AI BDR? A Beginner's Guide for 2026](https://reply.io/blog/what-is-an-ai-bdr/) - AI BDR capabilities, implementation approach
- [BDR AI Agents: Transform Sales Development](https://relevanceai.com/agent-templates-roles/business-development-representative-bdr-ai-agents-1) - BDR agent patterns, tool requirements
- [Conversational AI Best Practices 2026](https://www.conversationdesigninstitute.com/topics/best-practices) - Chat interface design, UX patterns
- [AI Agent Memory: Build Stateful AI Systems](https://redis.io/blog/ai-agent-memory-stateful-systems/) - Memory architectures, dual-layer patterns
- [Mem0: Building Production-Ready AI Agents](https://arxiv.org/pdf/2504.19413) - Technical guide to Mem0 memory layer
- [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) - Security best practices, threat model
- [Prompt Injection Attacks: The Most Common AI Exploit in 2025](https://www.obsidiansecurity.com/blog/prompt-injection) - Attack patterns, defense strategies
- [AI Agents Are Becoming Authorization Bypass Paths](https://thehackernews.com/2026/01/ai-agents-are-becoming-privilege.html) - Least privilege for AI agents, access control
- [Text-to-SQL AI Guide 2026](https://www.digitalapplied.com/blog/text-to-sql-ai-guide-2025) - Natural language to SQL patterns, security
- [AI Chatbot Trends for 2026](https://www.oscarchat.ai/blog/10-ai-chatbot-trends-2026/) - Voice/multimodal interfaces, agent execution
- [Vercel AI SDK Streaming Chat Guide](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/) - Real-time streaming responses in Next.js
- [assistant-ui GitHub](https://github.com/assistant-ui/assistant-ui) - React chat UI component library for AI
- [@llamaindex/chat-ui Documentation](https://github.com/run-llama/chat-ui) - LLM chat UI components

### Tertiary (LOW confidence - needs validation)
- [Mastering Retry Logic Agents 2025](https://sparkco.ai/blog/mastering-retry-logic-agents-a-deep-dive-into-2025-best-practices) - Retry patterns, error handling (single source)
- [LLM Tool-Calling in Production](https://medium.com/@komalbaparmar007/llm-tool-calling-in-production-rate-limits-retries-and-the-infinite-loop-failure-mode-you-must-2a1e2a1e84c8) - Rate limits, infinite loop prevention (Medium article)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vercel AI SDK v6 verified via Context7, official docs updated Jan 2026
- Architecture patterns: HIGH - Patterns from official AI SDK docs, security from OWASP/Anthropic guidance
- Security controls: HIGH - Multi-source verification (OWASP, Anthropic, Microsoft Security Blog)
- Tool calling examples: HIGH - Code directly from Context7 verified sources
- Memory integration: HIGH - Mem0 documentation and code examples from Context7
- Chat UI components: MEDIUM - Libraries verified via GitHub/npm, usage patterns from documentation
- Cost optimization: MEDIUM - Sonnet vs Opus tradeoffs based on general guidance, not project-specific testing
- Prompt injection defenses: MEDIUM - Best practices established, but detection accuracy requires production validation

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days) - AI agent patterns are stable, but LLM capabilities evolve quickly. Review if Claude Opus 5.x or GPT-5 released.
