'use client';

/**
 * UploadRecordingModal component
 * Modal for uploading meeting recordings and triggering AI analysis
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, FileAudio, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// ============================================================================
// TYPES
// ============================================================================

interface UploadRecordingModalProps {
  meetingId: string;
  meetingTitle: string;
  disabled?: boolean;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

// ============================================================================
// COMPONENT
// ============================================================================

export function UploadRecordingModal({
  meetingId,
  meetingTitle,
  disabled = false,
}: UploadRecordingModalProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 50MB');
      setFile(null);
      return;
    }

    // Validate file type
    const validTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'audio/mp4',
      'audio/m4a',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload an audio or video file.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setStatus('uploading');
    setProgress('Uploading file...');
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('meeting_id', meetingId);
      formData.append('file', file);

      // Upload and process
      const response = await fetch('/api/meetings/process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process recording');
      }

      setStatus('success');
      setProgress('Processing complete!');

      toast.success('Meeting analyzed successfully!', {
        description: `Created ${result.action_items_created} tasks from action items`,
      });

      // Wait a moment then close and refresh
      setTimeout(() => {
        setOpen(false);
        router.refresh();
        // Reset state
        setStatus('idle');
        setFile(null);
        setProgress('');
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to process recording');
      toast.error('Failed to process recording');
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when closing
      setStatus('idle');
      setFile(null);
      setError(null);
      setProgress('');
    }
  };

  const isProcessing = status === 'uploading' || status === 'processing';
  const isSuccess = status === 'success';

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Recording
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Meeting Recording</DialogTitle>
          <DialogDescription>
            Upload an audio or video recording to automatically transcribe and analyze with AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meeting Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">{meetingTitle}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Meeting ID: {meetingId.substring(0, 8)}...
            </p>
          </div>

          {/* File Input */}
          {!isSuccess && (
            <div className="space-y-2">
              <Label htmlFor="recording-file">Recording File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="recording-file"
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: MP3, WAV, MP4, WebM, MOV (max 50MB)
              </p>
            </div>
          )}

          {/* Selected File Info */}
          {file && !isSuccess && (
            <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
              <FileAudio className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-500">{progress}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This may take a few minutes...
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-500">
                  Meeting analyzed successfully!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Transcript, insights, and tasks have been created.
                </p>
              </div>
            </div>
          )}

          {/* What happens next */}
          {!isSuccess && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                What happens next:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>AI transcribes and analyzes the recording</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Extracts summary, topics, and key insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Creates tasks from action items automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Adds summary to investor activity feed</span>
                </li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          {!isSuccess && (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Analyze
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
