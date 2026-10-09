import React, { useState } from 'react';
import { TrackData, WeatherCondition, TireCompound, WeekendSession, GhostData, CarCustomization } from '../types/game';
import { TRACKS } from '../game/tracks';
import { Flag, CloudRain, Sun, Cloud, Trophy, Wrench, Play, ShieldAlert, Award, Clock, Download } from 'lucide-react';
import { downloadStandaloneHtmlFile } from '../game/standaloneExport';

interface TrackSelectProps {
  onSelectTrack: (config: {
    track: TrackData;
    session: WeekendSession;
    weather: WeatherCondition;
    tireCompound: TireCompound;
  }) => void;
  ghostLaps: Record<string, GhostData>;
  userCredits: number;
  userPoints: number;
  customization: CarCustomization;
  onOpenGarage: () => void;
  onOpenStandings: () => void;
  onOpenGhostReplay: (trackId: string) => void;
  onLockOut: () => void;
}

export const TrackSelect: React.FC<TrackSelectProps> = ({
  onSelectTrack,
  ghostLaps,
  userCredits,
  userPoints,
  customization,
  onOpenGarage,
  onOpenStandings,
  onOpenGhostReplay,
  onLockOut,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>('monza');
  const [session, setSession] = useState<WeekendSession>('race');
  const [weather, setWeather] = useState<WeatherCondition>('dry');
  const [tireCompound, setTireCompound] = useState<TireCompound>('medium');

  const selectedTrack = TRACKS.find(t => t.id === selectedTrackId) || TRACKS[0];
  const ghostForTrack = ghostLaps[selectedTrack.id];

  const formatLapTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor(ms % 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  };

  const handleStartWeekend = () => {
    onSelectTrack({
      track: selectedTrack,
      session,
      weather,
      tireCompound,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Bar Navigation (Strict 3-zone Top Bar Contract) */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-base">
            24
          </div>
          <span className="text-lg font-bold tracking-tight text-white uppercase">
            Apex Formula 24
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <button
            onClick={() => {}}
            className="text-white border-b-2 border-red-500 pb-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            Championship Tracks
          </button>
          <button
            onClick={onOpenGarage}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Garage & R&D</span>
          </button>
          <button
            onClick={onOpenStandings}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>Standings</span>
          </button>
          {ghostForTrack && (
            <button
              onClick={() => onOpenGhostReplay(selectedTrack.id)}
              className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-cyan-400"
            >
              <Clock className="w-4 h-4" />
              <span>Ghost Telemetry</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action & Driver Status */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={downloadStandaloneHtmlFile}
            title="Download complete offline HTML file of this game"
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Download HTML Game</span>
          </button>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-zinc-400 font-mono">
              Credits: <span className="text-emerald-400 font-bold tabular-nums">{userCredits.toLocaleString()} Cr</span>
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              Points: <span className="text-amber-400 font-bold tabular-nums">{userPoints} PTS</span>
            </div>
          </div>
          <button
            onClick={onLockOut}
            title="Lock paddock session"
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900 rounded-lg transition-colors cursor-pointer"
          >
            Lock Out
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Track Grid Selector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-extrabold uppercase tracking-tight text-white">
                Formula 1 Circuits
              </h2>
              <p className="text-sm text-zinc-400">
                Select championship round to compete against AI opponents
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              6 OFFICIAL CIRCUITS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {TRACKS.map(track => {
              const isSelected = track.id === selectedTrackId;
              const trackGhost = ghostLaps[track.id];

              return (
                <div
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer text-left relative overflow-hidden ${
                    isSelected
                      ? 'bg-zinc-900 border-red-500/80 shadow-lg shadow-red-950/20'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  {/* Subtle red indicator on active */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
                      <div className="bg-red-600 text-[9px] font-black uppercase text-white py-0.5 px-3 transform rotate-45 translate-x-3 -translate-y-1 text-center shadow">
                        SELECTED
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl" role="img" aria-label={track.country}>
                      {track.flag}
                    </span>
                    <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">
                      {track.country}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {track.name}
                  </h3>

                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span>{track.lengthKm} km · {track.turnsCount} Turns</span>
                    <span>{track.lapsCount} Laps</span>
                  </div>

                  {/* Personal Best Ghost indicator */}
                  <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Personal Best:</span>
                    {trackGhost ? (
                      <span className="text-cyan-400 font-semibold tabular-nums">
                        {formatLapTime(trackGhost.lapTimeMs)}
                      </span>
                    ) : (
                      <span className="text-zinc-600">No Lap Yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Track Briefing & Race Configuration */}
        <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6">
          {/* Circuit Header */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-1">
              <span>CIRCUIT DETAILS</span>
              <span>RECORD: {selectedTrack.lapRecord} ({selectedTrack.lapRecordHolder})</span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              {selectedTrack.name}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {selectedTrack.description}
            </p>
          </div>

          {/* Key Turns & DRS Zones */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
              Key Sectors & DRS Zones
            </label>
            <div className="bg-zinc-950/70 rounded-xl p-3 border border-zinc-800 text-xs space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {selectedTrack.keyTurns.slice(0, 4).map((kt, i) => (
                  <span key={i} className="text-zinc-300 font-mono bg-zinc-800/60 px-2 py-0.5 rounded text-[11px]">
                    {kt.name}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 pt-1 border-t border-zinc-800">
                <Flag className="w-3.5 h-3.5" />
                <span>DRS Zones: {selectedTrack.drsZones.map(d => d.name).join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Weekend Session Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
              Race Weekend Session
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'practice', label: 'Practice', sub: 'Ghost Hot Laps' },
                { id: 'qualifying', label: 'Qualifying', sub: '1-Lap Shootout' },
                { id: 'race', label: 'Grand Prix', sub: `${selectedTrack.lapsCount} Laps Grid Start` },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSession(s.id as WeekendSession)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    session === s.id
                      ? 'bg-red-600/10 border-red-500 text-white'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-bold">{s.label}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{s.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Weather Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Weather Forecast
              </label>
              <span className="text-[11px] font-mono text-zinc-500">Dynamic system</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'dry', label: 'Sunny', icon: Sun, color: 'text-amber-400' },
                { id: 'overcast', label: 'Cloudy', icon: Cloud, color: 'text-zinc-400' },
                { id: 'drizzle', label: 'Drizzle', icon: CloudRain, color: 'text-blue-400' },
                { id: 'wet', label: 'Wet', icon: CloudRain, color: 'text-cyan-400' },
                { id: 'torrential', label: 'Storm', icon: CloudRain, color: 'text-indigo-400' },
              ].map(w => {
                const Icon = w.icon;
                const isW = weather === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => setWeather(w.id as WeatherCondition)}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isW
                        ? 'bg-zinc-800 border-zinc-500 text-white shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${w.color}`} />
                    <span className="text-[10px] font-medium">{w.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tire Choice */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Starting Tire Compound
              </label>
              <span className="text-[11px] font-mono text-zinc-400">
                {weather === 'wet' || weather === 'torrential' ? 'Wet compound recommended' : 'Slicks suitable'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'soft', label: 'Soft', color: 'border-red-500 text-red-400', grip: '100% Dry' },
                { id: 'medium', label: 'Medium', color: 'border-yellow-400 text-yellow-300', grip: 'Balanced' },
                { id: 'hard', label: 'Hard', color: 'border-zinc-300 text-zinc-200', grip: 'Durable' },
                { id: 'intermediate', label: 'Inters', color: 'border-emerald-500 text-emerald-400', grip: 'Damp' },
                { id: 'wet', label: 'Full Wet', color: 'border-blue-500 text-blue-400', grip: 'Heavy Rain' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTireCompound(t.id as TireCompound)}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    tireCompound === t.id
                      ? `bg-zinc-800 shadow-sm ${t.color}`
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-bold">{t.label}</span>
                  <span className="text-[9px] font-mono text-zinc-500 mt-0.5">{t.grip}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ghost Best Lap Notice */}
          {ghostForTrack ? (
            <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-cyan-400">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Ghost Lap Loaded ({formatLapTime(ghostForTrack.lapTimeMs)})</span>
              </div>
              <button
                onClick={() => onOpenGhostReplay(selectedTrack.id)}
                className="text-cyan-300 hover:underline font-mono text-[11px] cursor-pointer"
              >
                Inspect Telemetry
              </button>
            </div>
          ) : (
            <div className="p-3 bg-zinc-950/40 border border-zinc-800 rounded-xl text-xs text-zinc-400">
              Complete your first lap on this circuit to record your 3D Ghost Replay!
            </div>
          )}

          {/* Launch Weekend Button */}
          <button
            onClick={handleStartWeekend}
            className="w-full py-4 px-6 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold uppercase tracking-wider text-base rounded-xl shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Enter Cockpit · Driver #24</span>
          </button>
        </div>
      </main>
    </div>
  );
};
