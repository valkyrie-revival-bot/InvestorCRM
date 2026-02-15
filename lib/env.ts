/**
 * Environment Variable Validation
 * Uses Zod to validate and type-check all environment variables
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase - Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // Google OAuth - Required for Google integrations
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  NEXT_PUBLIC_GOOGLE_API_KEY: z.string().min(1, 'Google API Key is required'),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID (public) is required'),

  // Anthropic AI - Required for AI features
  ANTHROPIC_API_KEY: z.string().min(1, 'Anthropic API key is required'),

  // SMTP Configuration - Required for email notifications
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().email('Invalid SMTP user email'),
  SMTP_PASSWORD: z.string().min(1, 'SMTP password is required'),
  SMTP_FROM_EMAIL: z.string().email('Invalid from email'),
  SMTP_FROM_NAME: z.string().default('Sales Tracking CRM'),

  // Sentry - Optional for error monitoring
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Rate Limiting - Optional
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 minutes

  // Logging - Optional
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Database - Optional (Supabase handles this)
  DATABASE_URL: z.string().url().optional(),

  // Test mode - Optional
  E2E_TEST_MODE: z.coerce.boolean().default(false),

  // Email testing - Optional (for development)
  EMAIL_TEST_MODE: z.coerce.boolean().default(false),
  EMAIL_TEST_RECIPIENT: z.string().email().optional(),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    return { success: true as const, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      console.error('❌ Environment validation failed:');
      errors.forEach((err) => {
        console.error(`  - ${err.path}: ${err.message}`);
      });

      return { success: false as const, errors };
    }
    throw error;
  }
}

// Export validated environment variables
const result = validateEnv();

if (!result.success) {
  if (process.env.NODE_ENV === 'production') {
    // In production, fail hard
    throw new Error('Invalid environment variables. Check logs above.');
  } else {
    // In development, just warn
    console.warn('⚠️  Some environment variables are invalid. Some features may not work.');
  }
}

// Export the validated env object with proper typing
export const env = result.success ? result.data : ({} as z.infer<typeof envSchema>);

// Export the schema for testing purposes
export { envSchema };

// Type for the environment variables
export type Env = z.infer<typeof envSchema>;
