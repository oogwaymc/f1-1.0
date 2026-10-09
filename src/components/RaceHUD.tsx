import React from 'react';
import {
  TrackData,
  RaceParticipant,
  WeekendSession,
  WeatherCondition,
  TireCompound,
  CameraView,
} from '../types/game';
import { FreeVehicleState } from '../game/physics';
import { Zap, CloudRain, Sun, Camera, Volume2, VolumeX, Eye, AlertTriangle } from 'lucide-react';

interface RaceHUDProps {
  playerState: FreeVehicleState;
  track: TrackData;
  session: WeekendSession;
  weather: WeatherCondition;
  tireCompound: TireCompound;
  currentLap: number;
  totalLaps: number;
  lapTimeMs: number;
  lastLapMs: number;
  bestLapMs: number;
  ghostDeltaMs: number | null;
  participants: RaceParticipant[];
  cameraMode: CameraView;
  onToggleCamera: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  startLightsCount: number; // 0 to 5, -1 when lights out
  onOpenPause: () => void;
  drsZoneAvailable: boolean;
}

export const RaceHUD: React.FC<RaceHUDProps> = ({
  playerState,
  track,
  session,
  weather,
  tireCompound,
  currentLap,
  totalLaps,
  lapTimeMs,
  lastLapMs,
  bestLapMs,
  ghostDeltaMs,
  participants,
  cameraMode,
  onToggleCamera,
  onToggleMute,
  isMuted,
  startLightsCount,
  onOpenPause,
  drsZoneAvailable,
}) => {
  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  // RPM percentage for shift lights
  const rpmRatio = Math.max(0, Math.min(1, (playerState.rpm - 6000) / (15000 - 6000)));
  const shiftLightCount = Math.floor(rpmRatio * 15);

  // Sorted classification leaderboard
  const sortedDrivers = [...participants].sort((a, b) => {
    if (a.currentLap !== b.currentLap) return b.currentLap - a.currentLap;
    return b.fraction - a.fraction;
  });

  const playerRank = sortedDrivers.findIndex(p => p.isPlayer) + 1;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* ================= TOP SECTION ================= */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Broadcast F1 Leaderboard Tower */}
        <div className="w-56 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/90 rounded-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-red-600 px-3 py-1.5 flex items-center justify-between text-white font-bold text-xs uppercase tracking-wider">
            <span className="font-mono">
              {session === 'race' ? `LAP ${Math.min(currentLap, totalLaps)} / ${totalLaps}` : session.toUpperCase()}
            </span>
            <span className="text-[11px] font-mono opacity-90">{track.country}</span>
          </div>

          {/* Drivers List */}
          <div className="divide-y divide-zinc-800/60 text-xs">
            {sortedDrivers.slice(0, 8).map((driver, index) => {
              const pos = index + 1;
              const isP = driver.isPlayer;

              return (
                <div
                  key={driver.id}
                  className={`flex items-center justify-between px-3 py-1 font-mono transition-colors ${
                    isP ? 'bg-red-950/50 text-white font-bold' : 'text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-4 text-center font-bold text-zinc-400">{pos}</span>
                    <span
                      className="w-1.5 h-3 rounded-xs shrink-0"
                      style={{ backgroundColor: driver.color }}
                    />
                    <span className="truncate">{driver.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[11px]">
                    {pos === 1 ? (
                      <span className="text-zinc-400">LEADER</span>
                    ) : (
                      <span className="text-zinc-400">
                        {driver.gapToAheadMs > 0 ? `+${(driver.gapToAheadMs / 1000).toFixed(1)}s` : `+${(index * 0.4).toFixed(1)}s`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Track Limits Warning & Start Lights */}
        <div className="flex flex-col items-center gap-2">
          {startLightsCount >= 0 && (
            <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl shadow-2xl flex flex-col items-center">
              <span className="text-[11px] uppercase font-mono tracking-widest text-zinc-400 mb-2">
                STARTING GRID COUNTDOWN
              </span>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((lightNum) => {
                  const isActive = startLightsCount >= lightNum;
                  return (
                    <div
                      key={lightNum}
                      className="w-7 h-12 bg-zinc-900 border border-zinc-800 rounded-md p-1 flex flex-col justify-between items-center"
                    >
                      <div
                        className={`w-5 h-5 rounded-full transition-all duration-100 ${
                          isActive
                            ? 'bg-red-600 shadow-[0_0_14px_rgba(239,68,68,1)]'
                            : 'bg-zinc-800'
                        }`}
                      />
                      <div className="w-5 h-5 rounded-full bg-zinc-900" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {playerState.isOffTrack && (
            <div className="px-4 py-2 bg-amber-500 text-black font-mono font-black text-xs uppercase tracking-wider rounded-xl shadow-2xl flex items-center gap-2 border-2 border-amber-300 animate-bounce">
              <AlertTriangle className="w-4 h-4" />
              <span>TRACK LIMITS VIOLATION · OFF TARMAC</span>
            </div>
          )}
        </div>

        {/* Right: Weather & Session Lap Times */}
        <div className="flex flex-col items-end gap-2.5">
          {/* Top Control Bar (Pointer events enabled for buttons) */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onToggleCamera}
              title={`Switch Camera (Currently: ${cameraMode})`}
              className="p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            >
              <Camera className="w-4 h-4 text-zinc-400" />
              <span className="uppercase text-[11px]">{cameraMode}</span>
            </button>

            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-200 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
            </button>

            <button
              onClick={onOpenPause}
              className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-200 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
            >
              Pause [Space]
            </button>
          </div>

          {/* Lap Time Card */}
          <div className="w-56 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/90 rounded-xl p-3 shadow-2xl font-mono text-right">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center justify-between mb-0.5">
              <span>CURRENT LAP</span>
              <span className="text-zinc-500">POS: P{playerRank}</span>
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {formatTime(lapTimeMs)}
            </div>

            {/* Ghost Delta Tracker */}
            {ghostDeltaMs !== null && (
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[10px]">GHOST DELTA:</span>
                <span
                  className={`font-bold tabular-nums ${
                    ghostDeltaMs <= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {ghostDeltaMs <= 0 ? '-' : '+'}
                  {(Math.abs(ghostDeltaMs) / 1000).toFixed(3)}s
                </span>
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span>BEST:</span>
              <span className="text-cyan-400 font-semibold tabular-nums">
                {bestLapMs > 0 ? formatTime(bestLapMs) : '--:--.---'}
              </span>
            </div>
          </div>

          {/* Dynamic Weather & Tire Box */}
          <div className="w-56 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/90 rounded-xl px-3 py-2 shadow-2xl flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5">
              {weather === 'dry' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <CloudRain className="w-4 h-4 text-cyan-400" />
              )}
              <span className="uppercase text-zinc-300">{weather}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">TIRE:</span>
              <span className="font-bold uppercase text-yellow-400">{tireCompound}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SECTION: F1 COCKPIT HUD ================= */}
      <div className="w-full flex items-end justify-between">
        {/* Left: Track Mini Info & Key Shortcuts */}
        <div className="hidden sm:block w-64 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/90 rounded-xl p-3 text-[11px] font-mono text-zinc-400 space-y-1 shadow-2xl">
          <div className="text-white font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>DRIVER CONTROLS</span>
            <span className="text-red-500 font-black">#24</span>
          </div>
          <div><span className="text-zinc-200">W / S</span> : Throttle / Brake</div>
          <div><span className="text-zinc-200">A / D</span> : Steering</div>
          <div><span className="text-zinc-200">E</span> : ERS Boost ({Math.round(playerState.ersCharge)}%)</div>
          <div><span className="text-zinc-200">F</span> : DRS Toggle</div>
          <div><span className="text-zinc-200">Space</span> : Pause / Menu</div>
          <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
            Secret telemetry console: type <span className="text-red-400 font-bold">2411</span>
          </div>
        </div>

        {/* Center: Authentic F1 Broadcast Steering Display */}
        <div className="mx-auto bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 shadow-2xl flex flex-col items-center w-full max-w-md">
          {/* Shift Light RPM LEDs */}
          <div className="flex items-center gap-1 w-full justify-center mb-2 px-2">
            {Array.from({ length: 15 }).map((_, idx) => {
              const lit = idx < shiftLightCount;
              let ledColor = 'bg-zinc-800';
              if (lit) {
                if (idx < 5) ledColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]';
                else if (idx < 10) ledColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
                else ledColor = 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,1)]';
              }
              return (
                <div
                  key={idx}
                  className={`h-2.5 flex-1 rounded-xs transition-colors duration-75 ${ledColor}`}
                />
              );
            })}
          </div>

          {/* Main Speed & Gear Display */}
          <div className="grid grid-cols-3 w-full items-center text-center font-mono py-1">
            {/* Gear Indicator */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-zinc-400 tracking-wider">GEAR</span>
              <span className="text-5xl font-black text-white leading-none">
                {playerState.gear}
              </span>
            </div>

            {/* Speedometer */}
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black text-white tabular-nums leading-none tracking-tight">
                {Math.round(playerState.speedKmh)}
              </span>
              <span className="text-[10px] uppercase text-zinc-400 tracking-widest mt-0.5">
                KM / H
              </span>
            </div>

            {/* DRS & ERS Status */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                  playerState.drsActive
                    ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse'
                    : drsZoneAvailable
                    ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-400'
                    : 'bg-zinc-800/80 text-zinc-500'
                }`}
              >
                DRS {playerState.drsActive ? 'OPEN' : drsZoneAvailable ? 'READY' : 'OFF'}
              </div>

              <div
                className={`flex items-center gap-1 text-[11px] font-bold ${
                  playerState.ersBoosting ? 'text-cyan-400 animate-pulse' : 'text-zinc-400'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>ERS {Math.round(playerState.ersCharge)}%</span>
              </div>
            </div>
          </div>

          {/* ERS Battery Gauge */}
          <div className="w-full mt-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
              <span>ENERGY HARVEST / DEPLOY</span>
              <span className="text-cyan-400 font-bold tabular-nums">{Math.round(playerState.ersCharge)}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-100 ${
                  playerState.ersBoosting ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]' : 'bg-emerald-500'
                }`}
                style={{ width: `${playerState.ersCharge}%` }}
              />
            </div>
          </div>

          {/* Throttle & Brake Pedals Trace */}
          <div className="grid grid-cols-2 gap-3 w-full mt-2 font-mono text-[10px]">
            <div>
              <div className="flex justify-between text-zinc-400 mb-0.5">
                <span>BRAKE</span>
                <span>{Math.round(playerState.brake * 100)}%</span>
              </div>
              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all duration-75"
                  style={{ width: `${playerState.brake * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-0.5">
                <span>THROTTLE</span>
                <span>{Math.round(playerState.throttle * 100)}%</span>
              </div>
              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${playerState.throttle * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tire Temperature & Wear telemetry */}
        <div className="hidden sm:block w-64 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/90 rounded-xl p-3 text-[11px] font-mono text-zinc-400 shadow-2xl">
          <div className="flex items-center justify-between text-white font-bold uppercase tracking-wider mb-2">
            <span>TIRE TELEMETRY</span>
            <span className="text-yellow-400">{tireCompound.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
            <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800">
              <span className="block text-zinc-500">FL</span>
              <span className="text-zinc-200 font-bold">{Math.round(playerState.tireTemp)}°C</span>
              <span className="text-zinc-400 block">{Math.round(100 - playerState.tireWear)}%</span>
            </div>
            <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800">
              <span className="block text-zinc-500">FR</span>
              <span className="text-zinc-200 font-bold">{Math.round(playerState.tireTemp)}°C</span>
              <span className="text-zinc-400 block">{Math.round(100 - playerState.tireWear)}%</span>
            </div>
            <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800">
              <span className="block text-zinc-500">RL</span>
              <span className="text-zinc-200 font-bold">{Math.round(playerState.tireTemp + 2)}°C</span>
              <span className="text-zinc-400 block">{Math.round(100 - playerState.tireWear)}%</span>
            </div>
            <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800">
              <span className="block text-zinc-500">RR</span>
              <span className="text-zinc-200 font-bold">{Math.round(playerState.tireTemp + 2)}°C</span>
              <span className="text-zinc-400 block">{Math.round(100 - playerState.tireWear)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
