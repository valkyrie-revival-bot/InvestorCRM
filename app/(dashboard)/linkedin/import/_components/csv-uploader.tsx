'use client';

/**
 * CSV Upload Form Component
 * Client component for uploading LinkedIn CSV files
 * Part of Phase 04.5 (Contact Intelligence)
 */

import { useState, useTransition } from 'react';
import { importLinkedInCSV } from '@/app/actions/linkedin';
import { TEAM_MEMBERS } from '@/types/linkedin';
import { Button } from '@/components/ui/button';
import { ImportResults } from './import-results';
import type { ImportResult } from '@/types/linkedin';

export function CSVUploader() {
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teamMember, setTeamMember] = useState<string>('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile || !teamMember) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('csv_file', selectedFile);
      formData.append('team_member_name', teamMember);

      const importResult = await importLinkedInCSV(formData);
      setResult(importResult);

      // Reset file input on success
      if (importResult.success) {
        setSelectedFile(null);
        const fileInput = document.getElementById('csv_file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Team member selection */}
        <div className="space-y-2">
          <label
            htmlFor="team_member"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Team Member
          </label>
          <select
            id="team_member"
            value={teamMember}
            onChange={(e) => setTeamMember(e.target.value)}
            required
            disabled={isPending}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select team member</option>
            {TEAM_MEMBERS.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
        </div>

        {/* File input */}
        <div className="space-y-2">
          <label
            htmlFor="csv_file"
            className="text-sm font-medium leading-none"
          >
            LinkedIn CSV File
          </label>
          {/* Hidden native input — label acts as the visible trigger */}
          <input
            id="csv_file"
            type="file"
            accept=".csv"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            required
            disabled={isPending}
            className="sr-only"
          />
          <label
            htmlFor="csv_file"
            className={`flex items-center gap-3 w-full rounded-md border border-dashed border-input bg-background px-4 py-3 text-sm cursor-pointer hover:bg-accent/50 transition-colors ${isPending ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            <span className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              Browse
            </span>
            <span className="text-muted-foreground">
              {selectedFile ? selectedFile.name : 'Choose a CSV file or drag and drop'}
            </span>
          </label>
          {selectedFile && (
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" disabled={isPending || !selectedFile || !teamMember}>
          {isPending ? 'Importing...' : 'Import Contacts'}
        </Button>
      </form>

      {/* Import results */}
      {result && <ImportResults result={result} />}
    </div>
  );
}
