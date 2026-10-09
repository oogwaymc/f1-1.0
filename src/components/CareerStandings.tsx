import React from 'react';
import { DriverStanding } from '../types/game';
import { Trophy, ArrowLeft, Award, Flag } from 'lucide-react';

interface CareerStandingsProps {
  standings: DriverStanding[];
  onBack: () => void;
}

export const CareerStandings: React.FC<CareerStandingsProps> = ({ standings, onBack }) => {
  const sorted = [...standings].sort((a, b) => b.points - a.points);

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
              <span>FIA Formula 1 World Championship</span>
              <span aria-hidden="true">·</span>
              <span>Season Standings</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Drivers Championship
            </h1>
          </div>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
          <Trophy className="w-6 h-6" />
        </div>
      </div>

      {/* Standings Table */}
      <div className="mt-8 bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-12 px-6 py-3 bg-zinc-950/60 border-b border-zinc-800 text-xs font-mono uppercase text-zinc-400 font-semibold">
          <span className="col-span-1">Pos</span>
          <span className="col-span-6">Driver & Team</span>
          <span className="col-span-2 text-center">Wins</span>
          <span className="col-span-3 text-right">Points</span>
        </div>

        <div className="divide-y divide-zinc-800/60 font-mono text-sm">
          {sorted.map((driver, index) => {
            const pos = index + 1;
            const isPlayer = driver.isPlayer;

            return (
              <div
                key={driver.id}
                className={`grid grid-cols-12 px-6 py-4 items-center transition-colors ${
                  isPlayer
                    ? 'bg-red-950/40 text-white font-bold border-l-4 border-red-500'
                    : 'text-zinc-300 hover:bg-zinc-800/40'
                }`}
              >
                <div className="col-span-1 flex items-center gap-2 font-bold text-zinc-400">
                  {pos === 1 ? (
                    <Trophy className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <span>{pos}</span>
                  )}
                </div>

                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-black text-white shrink-0">
                    {driver.number}
                  </div>
                  <div className="truncate">
                    <span className="text-white font-bold text-base block truncate">
                      {driver.name} {isPlayer && <span className="text-xs text-red-400 ml-1">(YOU)</span>}
                    </span>
                    <span className="text-xs text-zinc-400 font-sans block">{driver.team}</span>
                  </div>
                </div>

                <div className="col-span-2 text-center text-zinc-400 tabular-nums">
                  {driver.wins}
                </div>

                <div className="col-span-3 text-right font-black text-lg text-white tabular-nums">
                  {driver.points} <span className="text-xs font-normal text-zinc-500">PTS</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
