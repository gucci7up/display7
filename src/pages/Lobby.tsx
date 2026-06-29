import React from 'react';

export const DOGS_METADATA = [
  { id: 1, name: 'BRAVO',     color: '#dc2626', textColor: '#fff', isStripes: false, defaultOdds: { win: 2.5 } },
  { id: 2, name: 'RELAMPAGO', color: '#2563eb', textColor: '#fff', isStripes: false, defaultOdds: { win: 3.0 } },
  { id: 3, name: 'TIGRE',     color: '#e5e7eb', textColor: '#111', isStripes: false, defaultOdds: { win: 4.0 } },
  { id: 4, name: 'NEGRO',     color: '#18181b', textColor: '#fff', isStripes: false, defaultOdds: { win: 5.0 } },
  { id: 5, name: 'FURIA',     color: '#ea580c', textColor: '#fff', isStripes: false, defaultOdds: { win: 6.0 } },
  { id: 6, name: 'BANDIDO',   color: '#18181b', textColor: '#fff', isStripes: true,  defaultOdds: { win: 7.0 } },
];

interface LobbyProps {
  currentRace: any;
  jackpotAmount: number;
  bonusAmount: number;
  liveOdds: any[];
}

export const Lobby: React.FC<LobbyProps> = ({ currentRace, jackpotAmount, bonusAmount }) => {
  const [timeLeft, setTimeLeft] = React.useState(0);

  React.useEffect(() => {
    setTimeLeft(0);
    const endAt = currentRace?.saleEndAt || currentRace?.closeAt;
    if (!endAt) return;
    const tick = () => {
      const openAt = currentRace?.openAt || currentRace?.saleStartAt;
      if (openAt) {
        const elapsed = Math.floor((Date.now() - new Date(openAt).getTime()) / 1000);
        setTimeLeft(Math.max(0, 300 - elapsed));
      } else {
        const ms = new Date(endAt).getTime() - Date.now();
        setTimeLeft(Math.max(0, Math.floor(ms / 1000)));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [currentRace?.id, currentRace?.saleEndAt, currentRace?.closeAt]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const fmt = (n: number) => Math.round(n).toLocaleString('es-DO');

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* Imagen de fondo */}
      <img
        src="/Pantalla loby.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Número de carrera — arriba izquierda junto al ícono del reloj */}
      <div
        className="absolute"
        style={{ top: '9.5%', left: '11%' }}
      >
        <span style={{
          fontFamily: 'monospace',
          fontWeight: 900,
          fontSize: '4.2vw',
          color: '#f5c518',
          textShadow: '0 0 20px rgba(245,197,24,0.7)',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}>
          #{String(currentRace?.numero ?? '0').padStart(3, '0')}
        </span>
      </div>

      {/* Countdown — centro del cuadro izquierdo */}
      <div
        className="absolute"
        style={{ top: '37%', left: '3%', width: '46%', display: 'flex', justifyContent: 'center' }}
      >
        <span style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontWeight: 900,
          fontSize: '11vw',
          color: '#f5c518',
          textShadow: '0 0 40px rgba(245,197,24,0.8), 0 0 80px rgba(245,197,24,0.4)',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}>
          {mins}:{secs}
        </span>
      </div>

      {/* Jackpot — cuadro superior derecho */}
      <div
        className="absolute"
        style={{ top: '35%', right: '10%', width: '45%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: '2%' }}
      >
        <span style={{
          fontFamily: 'monospace',
          fontWeight: 900,
          fontSize: '6vw',
          color: '#f5c518',
          textShadow: '0 0 30px rgba(245,197,24,0.7)',
          letterSpacing: '0.03em',
          lineHeight: 1,
        }}>
          {fmt(jackpotAmount)}
        </span>
      </div>

      {/* Bonus — cuadro inferior derecho */}
      <div
        className="absolute"
        style={{ top: '53.5%', right: '10%', width: '45%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: '2%' }}
      >
        <span style={{
          fontFamily: 'monospace',
          fontWeight: 900,
          fontSize: '6vw',
          color: '#00ff44',
          textShadow: '0 0 30px rgba(0,255,68,0.9)',
          letterSpacing: '0.03em',
          lineHeight: 1,
        }}>
          {fmt(bonusAmount)}
        </span>
      </div>
    </div>
  );
};
