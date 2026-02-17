'use client';

/**
 * Voice Recorder Component
 * Push-to-talk voice input with waveform visualization
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Send to transcription API
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Failed to start recording:', error);

      // Show specific error message
      let errorMessage = 'Failed to access microphone';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is in use by another application. Please close other apps using the microphone.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Microphone constraints not supported.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('Microphone error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      toast.error(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      console.log('Transcribing audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type,
      });

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const { text } = await response.json();
      console.log('Transcription result:', text);
      onTranscript(text);
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast.error(error.message || 'Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMouseDown = () => {
    if (!disabled && !isRecording) {
      startRecording();
    }
  };

  const handleMouseUp = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Stop if mouse leaves while held
        disabled={disabled || isProcessing}
        className={cn(
          'transition-all',
          isRecording && 'bg-red-500 text-white border-red-500 animate-pulse',
          isProcessing && 'opacity-50'
        )}
        title={isRecording ? 'Release to stop' : 'Hold to speak'}
      >
        {isRecording ? (
          <Mic className="size-4" />
        ) : (
          <MicOff className="size-4" />
        )}
      </Button>

      {isRecording && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Recording...
        </span>
      )}

      {isProcessing && (
        <span className="text-xs text-muted-foreground">
          Processing...
        </span>
      )}
    </div>
  );
}
