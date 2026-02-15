'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches React errors and reports them to Sentry
 * Displays a friendly error UI to users
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-[400px] w-full items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mb-4 flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold">Something went wrong</h2>
            <p className="mb-6 text-muted-foreground">
              We&apos;re sorry, but something unexpected happened. The error has been
              logged and we&apos;ll look into it.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 rounded-md bg-destructive/10 p-4 text-left">
                <p className="mb-2 font-mono text-sm text-destructive">
                  {this.state.error.message}
                </p>
                <pre className="overflow-auto text-xs text-muted-foreground">
                  {this.state.error.stack}
                </pre>
              </div>
            )}
            <Button onClick={this.resetError}>Try again</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for easier usage
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
