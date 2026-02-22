'use client';

/**
 * Voice Investor Button
 * Opens a dialog that lets users describe a new investor by voice.
 * Submits the transcript to ARCHON via a custom window event.
 */

import { useState, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VoiceRecorder } from '@/components/ai/voice-recorder';

export function VoiceInvestorButton() {
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleTranscript = useCallback((text: string) => {
    setTranscript(text);
  }, []);

  const handleSubmit = () => {
    if (!transcript.trim()) return;
    const message = `Create investor: ${transcript.trim()}`;
    setOpen(false);
    setTranscript('');
    // Signal DashboardChatWrapper to open ARCHON and send the message
    window.dispatchEvent(new CustomEvent('archon:send', { detail: { message } }));
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Mic className="size-4" />
        Voice
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Describe the new investor</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Hold the mic button and speak. Include the firm name, stage, and relationship owner.
            </p>

            <div className="flex items-center gap-3">
              <VoiceRecorder onTranscript={handleTranscript} />
              <span className="text-sm text-muted-foreground">Hold to record</span>
            </div>

            {transcript && (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Transcript will appear here…"
              />
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!transcript.trim()}
                className="flex-1"
              >
                Create with ARCHON
              </Button>
              <Button
                variant="outline"
                onClick={() => { setOpen(false); setTranscript(''); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
