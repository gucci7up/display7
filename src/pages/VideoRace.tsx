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
    console.log('[VideoRace] archivo:', archivo);
    console.log('[VideoRace] currentRace:', JSON.stringify(currentRace?.video));
    if (!archivo) { console.log('[VideoRace] sin archivo, saliendo'); onVideoEnded(); return; }

    const video = videoRef.current;
    if (!video) { onVideoEnded(); return; }

    const url = api.getVideoUrl(archivo);
    console.log('[VideoRace] URL:', url);
    video.src = url;
    video.load();
    video.play().catch((e) => { console.log('[VideoRace] error play:', e); onVideoEnded(); });
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
