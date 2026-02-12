'use client';

/**
 * Import Results Display Component
 * Shows success/error feedback with counts and validation errors
 * Part of Phase 04.5 (Contact Intelligence)
 */

import { useState } from 'react';
import type { ImportResult } from '@/types/linkedin';

interface ImportResultsProps {
  result: ImportResult;
}

export function ImportResults({ result }: ImportResultsProps) {
  const [showErrors, setShowErrors] = useState(false);

  // Success state
  if (result.success && result.errors.length === 0) {
    return (
      <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 text-green-500 mt-0.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-green-500">Import Successful</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Imported {result.imported.toLocaleString()} contacts
              {result.skipped > 0 &&
                `, skipped ${result.skipped.toLocaleString()} duplicates`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Partial success state (some validation errors but still imported)
  if (result.success && result.errors.length > 0) {
    return (
      <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 text-yellow-500 mt-0.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-500">
              Import Completed with Warnings
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Imported {result.imported.toLocaleString()} contacts,{' '}
              {result.skipped > 0 &&
                `skipped ${result.skipped.toLocaleString()} duplicates, `}
              {result.errors.length} validation errors
            </p>

            {/* Show/hide validation errors */}
            {result.errors.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="text-sm text-yellow-500 hover:underline"
                >
                  {showErrors ? 'Hide' : 'Show'} validation errors
                </button>

                {showErrors && (
                  <div className="mt-2 space-y-1 rounded-md bg-background/50 p-3 max-h-64 overflow-y-auto">
                    {result.errors.slice(0, 20).map((error, idx) => (
                      <div key={idx} className="text-xs font-mono">
                        <span className="text-yellow-500">Row {error.row}:</span>{' '}
                        {error.message}
                      </div>
                    ))}
                    {result.errors.length > 20 && (
                      <p className="text-xs text-muted-foreground italic">
                        ... and {result.errors.length - 20} more errors
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-red-500 mt-0.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold text-red-500">Import Failed</h3>
          {result.errors.length > 0 ? (
            <div className="mt-2 space-y-1">
              {result.errors.slice(0, 5).map((error, idx) => (
                <p key={idx} className="text-sm text-muted-foreground">
                  {error.row > 0 && `Row ${error.row}: `}
                  {error.message}
                </p>
              ))}
              {result.errors.length > 5 && (
                <p className="text-xs text-muted-foreground italic">
                  ... and {result.errors.length - 5} more errors
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              An unknown error occurred during import
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
