import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, Key, ArrowRight, Gauge } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Joeisabitch') {
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setAttempts(prev => prev + 1);
      setErrorMessage(
        password.trim() === ''
          ? 'Enter authorization passcode to proceed'
          : 'Access denied: Invalid paddock telemetry key'
      );
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-100 overflow-hidden px-4">
      {/* Background carbon weave & red subtle lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.18),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Lock Card Container */}
      <div className="relative z-10 w-full max-w-md bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl p-8 sm:p-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-500 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="flex items-center gap-2 text-xs tracking-wider uppercase text-zinc-400 font-mono mb-1">
            <span>FIA Formula 1 World Championship</span>
            <span aria-hidden="true">·</span>
            <span>Car #24</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase font-sans">
            Apex Formula 24
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Telemetry & Grand Prix paddock security authorization
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Paddock Security Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Enter password to enter..."
                autoFocus
                className={`w-full pl-10 pr-4 py-3 bg-zinc-950/80 border rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none transition-all duration-200 ${
                  error
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                    : 'border-zinc-700/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                }`}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 mt-2.5 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-950/50 transition-all duration-150 cursor-pointer"
          >
            <span>Authorize & Access Tracks</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security badge and hint */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted Telemetry</span>
          </div>
          <span className="text-zinc-600">v24.1 F1 Hybrid</span>
        </div>

        {attempts >= 2 && (
          <div className="mt-4 p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-center">
            <p className="text-xs text-zinc-400 font-mono">
              Key: <span className="text-red-400 font-bold select-all">Joeisabitch</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
