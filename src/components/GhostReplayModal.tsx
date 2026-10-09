import React from 'react';
import { GhostData } from '../types/game';
import { TRACKS } from '../game/tracks';
import { Clock, ArrowLeft, Download, Trash2, Award, Zap, Check } from 'lucide-react';

interface GhostReplayModalProps {
  ghostLaps: Record<string, GhostData>;
  initialTrackId?: string;
  onBack: () => void;
  onClearGhost: (trackId: string) => void;
}

export const GhostReplayModal: React.FC<GhostReplayModalProps> = ({
  ghostLaps,
  initialTrackId,
  onBack,
  onClearGhost,
}) => {
  const [selectedTrackId, setSelectedTrackId] = React.useState<string>(initialTrackId || 'monza');
  const [copied, setCopied] = React.useState(false);

  const selectedTrack = TRACKS.find(t => t.id === selectedTrackId) || TRACKS[0];
  const ghost = ghostLaps[selectedTrack.id];

  const formatLapTime = (ms: number) => {
    if (!ms || ms <= 0) return '--:--.---';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor(ms % 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  };

  const handleExportJson = () => {
    if (!ghost) return;
    const blob = new Blob([JSON.stringify(ghost, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `f1_ghost_${selectedTrack.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase">
              <span>Apex Formula 24</span>
              <span aria-hidden="true">·</span>
              <span>Holographic Telemetry</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Ghost Lap Replays & Telemetry
            </h1>
          </div>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      {/* Track Selector Bar */}
      <div className="flex gap-2 overflow-x-auto py-6">
        {TRACKS.map(t => {
          const hasGhost = !!ghostLaps[t.id];
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTrackId(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-colors cursor-pointer border ${
                selectedTrackId === t.id
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>{t.flag} {t.name.split(' ')[0]}</span>
              {hasGhost && <span className="ml-1.5 text-cyan-400">●</span>}
            </button>
          );
        })}
      </div>

      {/* Main Ghost Viewer */}
      {ghost ? (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div>
              <div className="text-xs uppercase font-mono text-zinc-400">Circuit Best Replay</div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-0.5">
                {selectedTrack.name}
              </h2>
              <div className="text-xs text-zinc-400 font-mono mt-1">
                Recorded on {new Date(ghost.date).toLocaleDateString()} · Compound: <span className="uppercase text-yellow-400 font-bold">{ghost.compound}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase font-mono text-zinc-400 block">Personal Record</span>
              <span className="text-4xl font-black text-cyan-400 font-mono tabular-nums">
                {formatLapTime(ghost.lapTimeMs)}
              </span>
            </div>
          </div>

          {/* Telemetry Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl font-mono">
              <span className="text-[11px] text-zinc-400 uppercase block">Samples Logged</span>
              <span className="text-xl font-bold text-white tabular-nums mt-1 block">
                {ghost.samples.length.toLocaleString()} points
              </span>
            </div>
            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl font-mono">
              <span className="text-[11px] text-zinc-400 uppercase block">Max Speed Trap</span>
              <span className="text-xl font-bold text-white tabular-nums mt-1 block">
                {Math.round(Math.max(0, ...ghost.samples.map(s => s.speedKmh)))} km/h
              </span>
            </div>
            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl font-mono">
              <span className="text-[11px] text-zinc-400 uppercase block">DRS Activations</span>
              <span className="text-xl font-bold text-emerald-400 tabular-nums mt-1 block">
                {ghost.samples.filter(s => s.drs).length > 0 ? 'Active' : 'None'}
              </span>
            </div>
            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl font-mono">
              <span className="text-[11px] text-zinc-400 uppercase block">Circuit Delta Record</span>
              <span className="text-xl font-bold text-zinc-300 tabular-nums mt-1 block">
                {selectedTrack.lapRecord}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              onClick={() => onClearGhost(selectedTrack.id)}
              className="px-3.5 py-2 bg-red-950/30 hover:bg-red-900/40 border border-red-800/60 rounded-xl text-xs font-mono text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Ghost</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-4 py-2 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/60 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
              <span>{copied ? 'Exported!' : 'Export Replay JSON'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-center space-y-3">
          <Clock className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Ghost Lap Recorded Yet</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Take Car #24 out onto {selectedTrack.name} in Free Practice or Grand Prix to record your first holographic lap trace!
          </p>
        </div>
      )}
    </div>
  );
};
