import React, { useState } from 'react';
import { api } from '../services/api';

interface AgencySetupProps {
  onComplete: () => void;
}

export const AgencySetup: React.FC<AgencySetupProps> = ({ onComplete }) => {
  const [agencyId, setAgencyId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const id = agencyId.trim();
    if (!id) { setError('Ingresa el ID de la agencia.'); return; }
    setLoading(true);
    setError(null);
    try {
      const agencies = await api.getAgencies();
      const found = agencies.find((a: any) => a.id === id);
      if (!found) { setError('No se encontró ninguna agencia con ese ID.'); setLoading(false); return; }
      api.setDisplayAgencyId(id);
      onComplete();
    } catch {
      setError('No se pudo conectar al servidor. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Fondo con gradiente */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, #1a1200 0%, #000000 70%)'
      }} />

      {/* Línea dorada superior */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #f5c518, transparent)' }} />

      {/* Logo */}
      <div className="z-10 flex flex-col items-center mb-10">
        <img src="/logo.png" alt="MBSport" className="h-20 object-contain drop-shadow-[0_0_20px_rgba(245,197,24,0.4)]" />
        <div className="flex items-center gap-2 mt-3">
          <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, #f5c518)' }} />
          <span className="text-[11px] font-bold tracking-[0.4em] uppercase" style={{ color: '#f5c518aa' }}>
            Racing Dogs · Display
          </span>
          <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, #f5c518, transparent)' }} />
        </div>
      </div>

      {/* Card */}
      <div className="z-10 flex flex-col gap-5 px-10 py-8 max-w-md w-full mx-4" style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(245,197,24,0.2)',
        borderRadius: 16,
        boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 40px rgba(245,197,24,0.05)',
        backdropFilter: 'blur(10px)',
      }}>
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-1" style={{ color: '#f5c518' }}>
            Configuración de Agencia
          </p>
          <p className="text-xs tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Ingresa el ID de la agencia que deseas mostrar
          </p>
        </div>

        <input
          type="text" value={agencyId}
          onChange={(e) => { setAgencyId(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          autoFocus spellCheck={false}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(245,197,24,0.3)',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#fff',
            fontSize: 13,
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            outline: 'none',
            width: '100%',
          }}
        />

        {error && (
          <p className="text-xs font-bold text-center" style={{ color: '#f87171' }}>{error}</p>
        )}

        <button onClick={handleConfirm} disabled={loading || !agencyId.trim()}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 10,
            border: 'none',
            background: loading || !agencyId.trim()
              ? 'rgba(245,197,24,0.3)'
              : 'linear-gradient(135deg, #f5c518, #e0a800)',
            color: '#000',
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            cursor: loading || !agencyId.trim() ? 'not-allowed' : 'pointer',
            boxShadow: loading || !agencyId.trim() ? 'none' : '0 4px 20px rgba(245,197,24,0.3)',
          }}>
          {loading ? 'Verificando...' : 'Confirmar'}
        </button>
      </div>

      {/* Línea dorada inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #f5c518, transparent)' }} />
    </div>
  );
};
