import { useEffect, useState, useRef } from 'react';
import { Lobby } from './pages/Lobby';
import { ExactaMatrix } from './pages/ExactaMatrix';
import { RaceHistory } from './pages/RaceHistory';
import { VideoRace } from './pages/VideoRace';
import { RaceStartingScreen } from './pages/RaceStartingScreen';
import { LoginScreen, isDisplayUnlocked, lockDisplay } from './pages/LoginScreen';
import { AgencySetup } from './pages/AgencySetup';
import { api } from './services/api';
import './index.css';

type ScreenType = 'LOBBY' | 'ODDS' | 'HISTORY' | 'RACE_STARTING' | 'VIDEO';

function App() {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    const urlAgencyId = new URLSearchParams(window.location.search).get('agencyId');
    if (urlAgencyId) return true;
    return isDisplayUnlocked();
  });

  const [agencyConfigured, setAgencyConfigured] = useState<boolean>(() => {
    const urlAgencyId = new URLSearchParams(window.location.search).get('agencyId');
    return urlAgencyId !== null;
  });

  const [currentScreen, setCurrentScreen] = useState<ScreenType>('LOBBY');
  const [currentRace, setCurrentRace] = useState<any>(null);
  const [liveOdds, setLiveOdds] = useState<any[]>([]);
  const [raceHistory, setRaceHistory] = useState<any[]>([]);
  const [jackpotAmount, setJackpotAmount] = useState<number>(0);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [playedVideoRaceId, setPlayedVideoRaceId] = useState<string | null>(null);

  const rotationTimerRef = useRef<number | null>(null);
  const openScreens: ScreenType[] = ['LOBBY', 'ODDS', 'HISTORY'];
  const openScreenIndexRef = useRef<number>(0);

  // Auto fullscreen
  useEffect(() => {
    const tryFs = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); };
    tryFs();
    const t = setTimeout(tryFs, 800);
    return () => clearTimeout(t);
  }, []);

  const fetchData = async () => {
    try {
      const [race, history, gameStatus] = await Promise.all([
        api.getCurrentRace(),
        api.getRaceHistory(8).catch(() => []),
        api.getGameStatus().catch(() => null),
      ]);
      if (gameStatus) {
        setJackpotAmount(Number(gameStatus.jackpotAmount ?? 0));
        setBonusAmount(Number(gameStatus.trifectaBonusPool ?? 0));
      }
      setCurrentRace(race);
      setRaceHistory(history);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const schedule = async () => {
      await fetchData();
      const status = (window as any).__raceStatus ?? 'IDLE';
      const interval = status === 'CLOSED' || status === 'RUNNING' ? 2000 : status === 'OPEN' ? 4000 : 8000;
      timeoutId = setTimeout(schedule, interval);
    };
    schedule();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    (window as any).__raceStatus = currentRace?.status ?? 'IDLE';
  }, [currentRace?.status]);

  useEffect(() => {
    if (!currentRace?.id) return;
    const fetch = async () => { try { setLiveOdds(await api.getLiveOdds(currentRace.id)); } catch {} };
    fetch();
    const id = setInterval(fetch, 4000);
    return () => clearInterval(id);
  }, [currentRace?.id]);

  useEffect(() => {
    if (rotationTimerRef.current) { clearTimeout(rotationTimerRef.current); rotationTimerRef.current = null; }
    if (!currentRace) return;
    const status = (currentRace.status ?? 'OPEN').toUpperCase();

    if (status === 'OPEN') {
      const durations: Record<string, number> = { LOBBY: 10000, ODDS: 30000, HISTORY: 10000 };
      const scheduleNext = (screen: string) => {
        rotationTimerRef.current = setTimeout(() => {
          openScreenIndexRef.current = (openScreenIndexRef.current + 1) % openScreens.length;
          const next = openScreens[openScreenIndexRef.current];
          setCurrentScreen(next);
          scheduleNext(next);
        }, durations[screen] ?? 10000) as unknown as number;
      };
      if (!openScreens.includes(currentScreen)) { openScreenIndexRef.current = 0; setCurrentScreen('LOBBY'); }
      scheduleNext(currentScreen);
    } else if (status === 'CLOSED') {
      setCurrentScreen('RACE_STARTING');
    } else if (status === 'RUNNING') {
      if (playedVideoRaceId !== currentRace.id) setCurrentScreen('VIDEO');
    }

    return () => { if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current); };
  }, [currentRace?.id, currentRace?.status, playedVideoRaceId]);

  useEffect(() => {
    if (!currentRace || currentRace.status !== 'OPEN') return;
    const endAt = currentRace.saleEndAt || currentRace.closeAt;
    if (!endAt) return;
    const ms = new Date(endAt).getTime() - Date.now() - 5000;
    if (ms <= 0) { setCurrentScreen('RACE_STARTING'); return; }
    const t = setTimeout(() => setCurrentScreen('RACE_STARTING'), ms);
    return () => clearTimeout(t);
  }, [currentRace?.id, currentRace?.saleEndAt, currentRace?.closeAt]);

  const handleVideoEnded = () => {
    setPlayedVideoRaceId(currentRace?.id ?? null);
    setCurrentScreen('LOBBY');
  };

  if (!unlocked) return <LoginScreen onUnlock={() => setUnlocked(true)} />;
  if (!agencyConfigured) return <AgencySetup onComplete={() => setAgencyConfigured(true)} />;

  if (loading && !currentRace) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      {currentScreen === 'LOBBY' && (
        <Lobby currentRace={currentRace} jackpotAmount={jackpotAmount} bonusAmount={bonusAmount} liveOdds={liveOdds} />
      )}
      {currentScreen === 'ODDS' && (
        <ExactaMatrix liveOdds={liveOdds} raceHistory={raceHistory} currentRace={currentRace} />
      )}
      {currentScreen === 'HISTORY' && (
        <RaceHistory raceHistory={raceHistory} />
      )}
      {currentScreen === 'RACE_STARTING' && currentRace && (
        <RaceStartingScreen raceNumber={currentRace.numero ?? '---'} />
      )}
      {currentScreen === 'VIDEO' && (
        <VideoRace currentRace={currentRace} onVideoEnded={handleVideoEnded} />
      )}
      <div
        className="absolute bottom-0 right-0 w-16 h-16 z-[99999] cursor-pointer opacity-0"
        onDoubleClick={() => { lockDisplay(); setUnlocked(false); }}
      />
    </div>
  );
}

export default App;
