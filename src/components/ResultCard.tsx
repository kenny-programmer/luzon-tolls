import { useState } from 'react';
import { Share2, ChevronRight, Copy, Check } from 'lucide-react';
import { TripSummary } from '../lib/toll-calculator';

interface ResultCardProps {
  tripSummary: TripSummary;
  origin: string;
  destination: string;
  vehicleClass: 1 | 2 | 3;
}

const VEHICLE_LABELS: Record<number, string> = {
  1: 'Class 1 (Cars, SUVs, Vans)',
  2: 'Class 2 (Buses, Medium Trucks)',
  3: 'Class 3 (Large Trucks, Trailers)',
};

export default function ResultCard({ tripSummary, origin, destination, vehicleClass }: ResultCardProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShare = async () => {
    const text = `Toll from ${origin} to ${destination}: ₱${tripSummary.totalCost.toFixed(0)}\n` +
      tripSummary.legs.map(leg => `${leg.expressway}: ₱${leg.cost.toFixed(0)}`).join('\n');
    if (navigator.share) {
      await navigator.share({ title: 'Toll Calculator Result', text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleCopyLink = async () => {
    const params = new URLSearchParams({
      origin,
      destination,
      vehicleClass: vehicleClass.toString(),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const routeLabel = tripSummary.legs.map(leg => leg.expressway).join(' → ');

  return (
    <div className="space-y-3">
      <div
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/40"
      >
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-1">
            <span>LUZON TOLL CALCULATOR</span>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <span className="text-cyan-400 break-words">{VEHICLE_LABELS[vehicleClass]}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-slate-300 flex-wrap">
            <span className="font-semibold text-white break-words">{origin}</span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold text-white break-words">{destination}</span>
          </div>
          <div className="mt-2 text-[10px] sm:text-xs text-slate-500 flex items-center gap-1 flex-wrap">
            {tripSummary.legs.map((leg, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600 shrink-0" />}
                <span className={leg.rfid === 'Autosweep' ? 'text-cyan-400/80' : 'text-blue-400/80'}>
                  {leg.expressway}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="mb-4 sm:mb-6">
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest mb-1">Total Toll Fee</p>
            <p className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight break-words">
              ₱{tripSummary.totalCost.toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-cyan-500 rounded-full flex items-center justify-center shrink-0" style={{ fontSize: '10px', lineHeight: '1', fontWeight: '900', color: 'white', padding: 0, margin: 0 }}>
                  <span style={{ display: 'block', transform: 'translateY(0.5px)' }}>A</span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-cyan-400 uppercase tracking-wider">AutoSweep</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-cyan-400 break-words">₱{tripSummary.autosweepTotal.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">SMC Expressways</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center shrink-0" style={{ fontSize: '10px', lineHeight: '1', fontWeight: '900', color: 'white', padding: 0, margin: 0 }}>
                  <span style={{ display: 'block', transform: 'translateY(0.5px)' }}>E</span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-wider">EasyTrip</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-blue-400 break-words">₱{tripSummary.easytripTotal.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">MPTC Expressways</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cost Breakdown</p>
            {tripSummary.legs.map((leg, i) => (
              <div
                key={i}
                className="flex items-start sm:items-center justify-between py-2.5 sm:py-3 border-b border-slate-800 last:border-b-0 gap-2"
              >
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                      leg.rfid === 'Autosweep' ? 'bg-cyan-500' : 'bg-blue-500'
                    }`}
                    style={{ fontSize: '10px', lineHeight: '1', fontWeight: '900', color: 'white', padding: 0, margin: 0 }}
                  >
                    <span style={{ display: 'block', transform: 'translateY(0.5px)' }}>
                      {leg.rfid === 'Autosweep' ? 'A' : 'E'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <p className="text-xs sm:text-sm font-bold text-white leading-tight break-words">{leg.expressway}</p>
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 w-fit ${
                          leg.rfid === 'Autosweep'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {leg.rfid}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-500 break-words sm:truncate mt-0.5">{leg.entry} → {leg.exit}</p>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black text-white shrink-0 ml-2 sm:ml-3">₱{leg.cost.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-3 sm:pb-4 pt-0">
          <p className="text-[9px] sm:text-xs text-center text-slate-600 leading-relaxed">
            toll.ph · Rates as of February 2026 · Source: Toll Regulatory Board
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          onClick={handleCopyLink}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 font-semibold rounded-xl transition-all active:scale-[0.98] border text-sm sm:text-base min-h-[48px] ${
            linkCopied
              ? 'bg-green-600 hover:bg-green-700 text-white border-green-700'
              : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
          }`}
        >
          {linkCopied ? (
            <>
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Copy Link</span>
            </>
          )}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98] shadow-lg text-sm sm:text-base min-h-[48px]"
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
