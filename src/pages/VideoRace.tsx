import React, { useEffect, useRef } from 'react';
import { api } from '../services/api';

interface VideoRaceProps {
  currentRace: any;
  onVideoEnded: () => void;
}

export const VideoRace: React.FC<VideoRaceProps> = ({ currentRace, onVideoEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const archivo = currentRace?.video?.archivo;
    if (!archivo) { onVideoEnded(); return; }

    const video = videoRef.current;
    if (!video) { onVideoEnded(); return; }

    video.src = api.getVideoUrl(archivo);
    video.load();
    video.play().catch(() => onVideoEnded());
  }, [currentRace?.video?.archivo]);

  return (
    <div className="fixed inset-0 z-[950] bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        onEnded={onVideoEnded}
        onError={onVideoEnded}
      />
    </div>
  );
};
