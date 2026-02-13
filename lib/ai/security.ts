/**
 * AI agent security utilities
 * Provides input validation and output sanitization to prevent prompt injection
 * and sensitive data exposure
 */

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Patterns that indicate potential prompt injection attempts
 * These are meta-instructions that try to override system behavior
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|all|prior|earlier)\s+(instructions|prompts|directions)/i,
  /forget\s+(previous|all|prior|earlier)/i,
  /disregard\s+(previous|all|prior|earlier)/i,
  /for\s+each\s+\w+\s+do\s+/i, // "for each X do Y" - batch operations
  /repeat\s+after\s+me/i,
  /system\s*:/i, // Trying to inject system messages
  /assistant\s*:/i, // Trying to inject assistant messages
  /\<\|.*?\|\>/g, // Special tokens that might be model-specific
  /\[SYSTEM\]/i,
  /\[INST\]/i,
];

/**
 * Maximum allowed input length
 * Prevents token exhaustion attacks
 */
const MAX_INPUT_LENGTH = 2000;

/**
 * Control characters to strip (except newlines and tabs)
 * Prevents encoding attacks
 */
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Validate and sanitize user input
 * Checks for prompt injection patterns and excessive length
 *
 * @param input User message text
 * @returns Validation result with sanitized input
 */
export function validateUserInput(input: string): {
  valid: boolean;
  sanitized: string;
  reason?: string;
} {
  // Check length
  if (input.length > MAX_INPUT_LENGTH) {
    return {
      valid: false,
      sanitized: input.slice(0, MAX_INPUT_LENGTH),
      reason: `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`,
    };
  }

  // Check for prompt injection patterns
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        valid: false,
        sanitized: input,
        reason: 'Input contains potentially malicious patterns',
      };
    }
  }

  // Sanitize by stripping control characters
  const sanitized = input.replace(CONTROL_CHAR_REGEX, '');

  return {
    valid: true,
    sanitized,
  };
}

// ============================================================================
// OUTPUT SANITIZATION
// ============================================================================

/**
 * Fields that should always be redacted from tool output
 * Prevents sensitive data from being sent to LLM context
 */
const DEFAULT_REDACTED_FIELDS = ['email', 'phone', 'created_by'];

/**
 * Recursively sanitize an object by removing sensitive fields
 *
 * @param data Data to sanitize (can be object, array, or primitive)
 * @param redactFields Additional fields to redact beyond defaults
 * @returns Sanitized data with sensitive fields removed
 */
export function sanitizeToolOutput(
  data: any,
  redactFields: string[] = []
): any {
  const fieldsToRedact = new Set([
    ...DEFAULT_REDACTED_FIELDS,
    ...redactFields,
  ]);

  // Handle null/undefined
  if (data == null) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeToolOutput(item, redactFields));
  }

  // Handle objects
  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip redacted fields
      if (fieldsToRedact.has(key)) {
        continue;
      }

      // Recursively sanitize nested objects/arrays
      sanitized[key] = sanitizeToolOutput(value, redactFields);
    }

    return sanitized;
  }

  // Return primitives as-is
  return data;
}
