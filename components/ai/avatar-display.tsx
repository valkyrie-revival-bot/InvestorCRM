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
    <div className="flex items-center gap-4 p-3">
      {/* Circular Avatar Bubble */}
      <div className="relative w-[200px] h-[200px] flex-shrink-0 bg-gradient-to-b from-zinc-900 to-black rounded-full overflow-hidden border-2 border-zinc-800 shadow-lg">
        {/* Static avatar image (default state) */}
        {!videoUrl && !isGenerating && (
          <Image
            src="/avatar-archon.png?v=2"
            alt="Valhros Archon"
            fill
            className="object-cover object-top"
            priority
            unoptimized
          />
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

        {/* Loading spinner overlay */}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <Loader2 className="size-5 animate-spin text-brand-gold" />
          </div>
        )}

        {/* Status indicator dot */}
        <div className="absolute -bottom-1 -right-1">
          <div
            className={`w-4 h-4 rounded-full border-2 border-zinc-900 ${
              isPlaying ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'
            }`}
          />
        </div>
      </div>

      {/* Archon Info */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-gold tracking-wider">
            ARCHON
          </span>
          <span className="text-xs text-zinc-500 font-mono uppercase">
            {isPlaying ? 'Speaking' : isGenerating ? 'Thinking' : 'Idle'}
          </span>
        </div>
        <p className="text-xs text-zinc-400 truncate">
          Capital Orchestration Intelligence
        </p>
      </div>
    </div>
  );
}
