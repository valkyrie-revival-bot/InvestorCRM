'use client';

/**
 * Avatar Display Component
 * Shows Valhros Archon animated avatar when speaking
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface AvatarDisplayProps {
  videoUrl?: string | null;
  isGenerating?: boolean;
}

export function AvatarDisplay({ videoUrl, isGenerating }: AvatarDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      // Load and play the video
      videoRef.current.src = videoUrl;
      videoRef.current.load();
      videoRef.current.play().catch((error) => {
        console.error('Failed to play video:', error);
      });
      setIsPlaying(true);
    }
  }, [videoUrl]);

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-zinc-900 to-black rounded-lg overflow-hidden border border-zinc-800">
      {/* Static avatar image (default state) */}
      {!videoUrl && !isGenerating && (
        <div className="relative w-full h-full">
          <Image
            src="/avatar-archon.png?v=2"
            alt="Valhros Archon"
            fill
            className="object-cover object-top"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Animated video */}
      {videoUrl && (
        <video
          ref={videoRef}
          className="w-full h-full object-cover object-top"
          onEnded={handleVideoEnded}
          playsInline
          muted={false}
        />
      )}

      {/* Loading state */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-brand-gold" />
            <p className="text-sm text-zinc-400">Generating response...</p>
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isPlaying ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'
          }`}
        />
        <span className="text-xs text-zinc-400 font-mono">
          {isPlaying ? 'SPEAKING' : 'IDLE'}
        </span>
      </div>

      {/* Archon identifier */}
      <div className="absolute bottom-3 right-3">
        <span className="text-xs font-semibold text-brand-gold tracking-wider">
          ARCHON
        </span>
      </div>
    </div>
  );
}
