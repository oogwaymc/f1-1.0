import React from 'react';
import { PostRaceReport, TrackData } from '../types/game';
import { Trophy, Award, Gauge, Flag, Zap, ArrowRight, RotateCcw, Share2, Save, Check } from 'lucide-react';

interface PostRaceAnalyticsProps {
  report: PostRaceReport;
  track: TrackData;
  onNextRace: () => void;
  onRestart: () => void;
  onOpenGarage: () => void;
  onOpenGhostReplay: () => void;
}

export const PostRaceAnalytics: React.FC<PostRaceAnalyticsProps> = ({
  report,
  track,
  onNextRace,
  onRestart,
  onOpenGarage,
  onOpenGhostReplay,
}) => {
  const [ghostSaved, setGhostSaved] = React.useState(false);

  const formatLapTime = (ms: number) => {
    if (ms <= 0) return '--:--.---';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor(ms % 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  };

  const isPodium = report.finalPosition <= 3;

  // Simple telemetry SVG curve from telemetryHistory
  const telemetryData = report.telemetryHistory.slice(-80);
  const maxSpeed = Math.max(340, ...telemetryData.map(d => d.speedKmh));

  const speedPoints = telemetryData.map((d, i) => {
    const x = (i / Math.max(1, telemetryData.length - 1)) * 600;
    const y = 140 - (d.speedKmh / maxSpeed) * 120;
    return `${x},${y}`;
  }).join(' ');

  const throttlePoints = telemetryData.map((d, i) => {
    const x = (i / Math.max(1, telemetryData.length - 1)) * 600;
    const y = 140 - d.throttle * 50;
    return `${x},${y}`;
  }).join(' ');

  const brakePoints = telemetryData.map((d, i) => {
    const x = (i / Math.max(1, telemetryData.length - 1)) * 600;
    const y = 140 - d.brake * 50;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-6 md:p-10 max-w-7xl mx-auto">
      {/* Session Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase">
            <span>OFFICIAL FIA GRAND PRIX CLASSIFICATION</span>
            <span aria-hidden="true">·</span>
            <span>{track.name}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
            {report.session === 'race' ? 'Grand Prix Race Report' : `${report.session} Session Analytics`}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setGhostSaved(true);
              setTimeout(() => setGhostSaved(false), 2500);
            }}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-cyan-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {ghostSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{ghostSaved ? 'Ghost Saved!' : 'Save Ghost Lap'}</span>
          </button>

          <button
            onClick={onNextRace}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-950/50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Continue Season</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Banner: Position & Prize Rewards */}
      <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Finishing Position Card */}
        <div
          className={`p-6 rounded-2xl border flex items-center gap-5 ${
            isPodium
              ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
              : 'bg-zinc-900/60 border-zinc-800'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-3xl font-mono text-white">
            P{report.finalPosition}
          </div>
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-zinc-400">
              Final Classification
            </div>
            <div className="text-2xl font-black text-white uppercase tracking-tight">
              {report.finalPosition === 1
                ? 'Race Winner!'
                : report.finalPosition <= 3
                ? 'Podium Finish'
                : 'Points Finisher'}
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              Car #24 · Started P{report.startingGridPos}
            </div>
          </div>
        </div>

        {/* Championship Points Card */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-zinc-400">
              Championship Points
            </div>
            <div className="text-3xl font-black text-white font-mono tabular-nums">
              +{report.pointsEarned} <span className="text-sm text-zinc-500">PTS</span>
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              World Drivers Championship
            </div>
          </div>
        </div>

        {/* R&D Upgrade Prize Credits */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-zinc-400">
              Prize Purse Awarded
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono tabular-nums">
              +{report.creditsEarned.toLocaleString()} <span className="text-sm text-zinc-500">Cr</span>
            </div>
            <button
              onClick={onOpenGarage}
              className="text-xs text-emerald-300 hover:underline font-mono mt-0.5 cursor-pointer flex items-center gap-1"
            >
              <span>Spend in Garage R&D</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Performance KPIs Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 font-mono">
          <div className="text-xs text-zinc-400 uppercase">Personal Best Lap</div>
          <div className="text-xl font-bold text-cyan-400 tabular-nums mt-1">
            {formatLapTime(report.bestLapMs)}
          </div>
        </div>
        <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 font-mono">
          <div className="text-xs text-zinc-400 uppercase">Speed Trap Record</div>
          <div className="text-xl font-bold text-white tabular-nums mt-1">
            {Math.round(report.topSpeedKmh)} <span className="text-xs text-zinc-500">KM/H</span>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 font-mono">
          <div className="text-xs text-zinc-400 uppercase">Overtakes Completed</div>
          <div className="text-xl font-bold text-emerald-400 tabular-nums mt-1">
            +{report.overtakes}
          </div>
        </div>
        <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 font-mono">
          <div className="text-xs text-zinc-400 uppercase">Race Conditions</div>
          <div className="text-xl font-bold uppercase text-amber-400 mt-1">
            {report.weather}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Telemetry Trace Graph & Full Classification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Telemetry Trace Chart */}
        <div className="lg:col-span-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              High-Fidelity Telemetry Trace
            </h3>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" /> Speed (km/h)
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full" /> Throttle
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2.5 h-0.5 bg-red-400 rounded-full" /> Brake
              </span>
            </div>
          </div>

          {/* SVG Telemetry Visualizer */}
          <div className="relative bg-zinc-950/90 rounded-xl p-3 border border-zinc-800/80 overflow-hidden">
            <svg
              viewBox="0 0 600 150"
              className="w-full h-44 text-zinc-700 overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.5" />
              <line x1="0" y1="70" x2="600" y2="70" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.5" />
              <line x1="0" y1="110" x2="600" y2="110" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.5" />

              {/* Throttle trace */}
              {throttlePoints && (
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeOpacity="0.8"
                  points={throttlePoints}
                />
              )}

              {/* Brake trace */}
              {brakePoints && (
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeOpacity="0.8"
                  points={brakePoints}
                />
              )}

              {/* Speed trace */}
              {speedPoints && (
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  points={speedPoints}
                />
              )}
            </svg>

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-2 px-1">
              <span>Apex Entry</span>
              <span>Mid Corner Apex</span>
              <span>Straightaway Exit</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-400 font-mono">
              Compare this session against your fastest ghost replay:
            </span>
            <button
              onClick={onOpenGhostReplay}
              className="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/50 text-cyan-400 rounded-lg text-xs font-mono transition-colors cursor-pointer"
            >
              Open Ghost Analyzer
            </button>
          </div>
        </div>

        {/* Full Grid Classification Table */}
        <div className="lg:col-span-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              Full Grand Prix Classification
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              {report.totalParticipants} CARS CLASSIFIED
            </span>
          </div>

          <div className="divide-y divide-zinc-800 text-xs font-mono">
            {report.participants.map((p, idx) => {
              const pos = idx + 1;
              const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
              const pts = pointsTable[idx] || 0;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
                    p.isPlayer ? 'bg-red-950/40 font-bold text-white' : 'text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-zinc-400 font-bold">{pos}</span>
                    <span
                      className="w-1.5 h-3 rounded-xs shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <div>
                      <span className="text-white">{p.name}</span>
                      <span className="text-[10px] text-zinc-500 block">{p.team}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-zinc-300 tabular-nums">
                      {formatLapTime(p.bestLapMs)}
                    </span>
                    {pts > 0 && (
                      <span className="text-[10px] text-amber-400 block font-semibold">
                        +{pts} PTS
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
