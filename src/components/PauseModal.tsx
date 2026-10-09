import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Camera, Sliders, Download } from 'lucide-react';
import { CameraView, WeekendSession } from '../types/game';
import { downloadStandaloneHtmlFile } from '../game/standaloneExport';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToMenu: () => void;
  session: WeekendSession;
  trackName: string;
  isMuted: boolean;
  onToggleMute: () => void;
  cameraMode: CameraView;
  onCycleCamera: () => void;
  onOpenDevMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExitToMenu,
  session,
  trackName,
  isMuted,
  onToggleMute,
  cameraMode,
  onCycleCamera,
  onOpenDevMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-zinc-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 bg-red-600/10 border border-red-500/30 text-red-500 rounded-md text-xs font-mono font-bold tracking-widest uppercase mb-2">
            RACE SESSION PAUSED
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {trackName}
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5 uppercase">
            Formula 1 {session} Weekend · Car #24
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Race [Space]</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl flex items-center justify-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Session</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCycleCamera}
              className="py-2.5 px-3 bg-zinc-950/70 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-zinc-400" />
              <span className="capitalize">Camera: {cameraMode}</span>
            </button>

            <button
              onClick={onToggleMute}
              className="py-2.5 px-3 bg-zinc-950/70 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{isMuted ? 'Muted' : 'Sound On'}</span>
            </button>
          </div>

          <button
            onClick={downloadStandaloneHtmlFile}
            className="w-full py-2.5 px-3 bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-cyan-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Standalone HTML Game (Offline)</span>
          </button>

          <button
            onClick={onOpenDevMenu}
            className="w-full py-2.5 px-3 bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-mono text-amber-400/90 hover:text-amber-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Dev Cheats Console [Code: 2411]</span>
          </button>

          <button
            onClick={onExitToMenu}
            className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-medium text-sm rounded-xl flex items-center justify-center gap-2 border border-zinc-800 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Circuit Paddock</span>
          </button>
        </div>

        {/* Quick controls review */}
        <div className="mt-6 pt-5 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
          <span>W/A/S/D Steering</span>
          <span>E = ERS Boost</span>
          <span>F = DRS</span>
        </div>
      </div>
    </div>
  );
};
