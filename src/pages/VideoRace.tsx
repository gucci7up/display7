import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { api } from '../services/api';

interface VideoRaceProps {
  currentRace: any;
  onVideoEnded: () => void;
}

type Phase = 'loading' | 'playing' | 'fallback';

export const VideoRace: React.FC<VideoRaceProps> = ({ currentRace, onVideoEnded }) => {
  const [phase, setPhase] = useState<Phase>('loading');
  const [fallbackCountdown, setFallbackCountdown] = useState(currentRace?.video?.durationSeconds || 45);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef   = useRef<Hls | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'loading') return;

    const hlsReady = currentRace?.video?.hlsReady;
    const archivo  = currentRace?.video?.archivo;

    if (!hlsReady || !archivo) {
      setPhase('fallback');
      return;
    }

    const video = videoRef.current;
    if (!video) { onVideoEnded(); return; }

    const hlsUrl = api.getHlsUrl(archivo);

    const tryHls = () => {
      if (!isMounted.current) return;

      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 30 * 1000 * 1000,
          enableWorker: true,
          lowLatencyMode: false,
        });
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play()
            .then(() => { if (isMounted.current) setPhase('playing'); })
            .catch(() => { setPhase('fallback'); });
        });

        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal && isMounted.current) {
            hls.destroy();
            hlsRef.current = null;
            setPhase('fallback');
          }
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.play()
          .then(() => { if (isMounted.current) setPhase('playing'); })
          .catch(() => setPhase('fallback'));
      } else {
        onVideoEnded();
      }
    };

    tryHls();
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fallback') return;
    const d = currentRace?.video?.durationSeconds || 45;
    let remaining = d;
    const id = setInterval(() => {
      remaining--;
      setFallbackCountdown(remaining);
      if (remaining <= 0) { clearInterval(id); onVideoEnded(); }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, onVideoEnded]);

  return (
    <>
      <div className="fixed inset-0 bg-black z-[950]"
        style={{ visibility: phase === 'playing' ? 'visible' : 'hidden' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          onEnded={onVideoEnded}
        />
      </div>
      {phase === 'fallback' && (
        <div className="fixed inset-0 z-[940] flex items-end justify-center pb-12">
          <div className="bg-black/60 px-8 py-4 rounded-full border border-white/20">
            <span className="text-white font-mono text-lg tracking-widest">
              {String(Math.floor(fallbackCountdown / 60)).padStart(2, '0')}:
              {String(fallbackCountdown % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}
    </>
  );
};
