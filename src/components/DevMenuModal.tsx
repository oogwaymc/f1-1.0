import React from 'react';
import { DevCheats, WeatherCondition } from '../types/game';
import {
  Zap,
  Gauge,
  Infinity,
  Flag,
  Snowflake,
  Clock,
  Coins,
  Sun,
  CloudRain,
  Eye,
  Check,
  X,
  Terminal,
} from 'lucide-react';

interface DevMenuModalProps {
  cheats: DevCheats;
  onToggleCheat: <K extends keyof DevCheats>(key: K) => void;
  onTriggerInstantWin: () => void;
  onAddCredits: (amount: number) => void;
  onChangeWeather: (weather: WeatherCondition) => void;
  onClose: () => void;
}

export const DevMenuModal: React.FC<DevMenuModalProps> = ({
  cheats,
  onToggleCheat,
  onTriggerInstantWin,
  onAddCredits,
  onChangeWeather,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-amber-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-zinc-100 font-mono">
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-amber-400 tracking-wide">
                FIA SECRET TELEMETRY CONSOLE
              </h2>
              <span className="text-[11px] text-zinc-400">AUTHORIZATION CODE: 2411 VERIFIED</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cheats Grid */}
        <div className="mt-5 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="text-xs uppercase text-zinc-400 tracking-wider">
            Vehicle & Physics Exploits
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* God Grip */}
            <button
              onClick={() => onToggleCheat('godGrip')}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                cheats.godGrip
                  ? 'bg-amber-950/40 border-amber-500 text-white'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold">God Grip</div>
                  <div className="text-[10px] text-zinc-400">Infinite cornering traction</div>
                </div>
              </div>
              {cheats.godGrip && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Supersonic 500 km/h */}
            <button
              onClick={() => onToggleCheat('supersonic')}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                cheats.supersonic
                  ? 'bg-amber-950/40 border-amber-500 text-white'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-red-400" />
                <div>
                  <div className="text-xs font-bold">Supersonic Speed</div>
                  <div className="text-[10px] text-zinc-400">520 km/h rocket top speed</div>
                </div>
              </div>
              {cheats.supersonic && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Infinite ERS Battery */}
            <button
              onClick={() => onToggleCheat('infiniteErs')}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                cheats.infiniteErs
                  ? 'bg-amber-950/40 border-amber-500 text-white'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Infinity className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold">Infinite ERS</div>
                  <div className="text-[10px] text-zinc-400">Never drain hybrid boost</div>
                </div>
              </div>
              {cheats.infiniteErs && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Unrestricted DRS */}
            <button
              onClick={() => onToggleCheat('alwaysDrs')}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                cheats.alwaysDrs
                  ? 'bg-amber-950/40 border-amber-500 text-white'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold">Always DRS</div>
                  <div className="text-[10px] text-zinc-400">Open DRS wing anywhere</div>
                </div>
              </div>
              {cheats.alwaysDrs && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Freeze AI */}
            <button
              onClick={() => onToggleCheat('freezeAi')}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                cheats.freezeAi
                  ? 'bg-amber-950/40 border-amber-500 text-white'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Snowflake className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs font-bold">Freeze AI Grid</div>
                  <div className="text-[10px] text-zinc-400">Stop AI cars immediately</div>
                </div>
              </div>
              {cheats.freezeAi && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Matrix Slow Motion */}
            <button
              onClick={() => onToggleCheat('slowMotion')}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                cheats.slowMotion
                  ? 'bg-amber-950/40 border-amber-500 text-white'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-xs font-bold">Slow Motion</div>
                  <div className="text-[10px] text-zinc-400">0.3x Matrix physics speed</div>
                </div>
              </div>
              {cheats.slowMotion && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Wireframe Mode */}
            <button
              onClick={() => onToggleCheat('wireframeMode')}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                cheats.wireframeMode
                  ? 'bg-amber-950/40 border-amber-500 text-white'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-zinc-400" />
                <div>
                  <div className="text-xs font-bold">Wireframe View</div>
                  <div className="text-[10px] text-zinc-400">3D polygon rendering</div>
                </div>
              </div>
              {cheats.wireframeMode && <Check className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {/* Quick Instant Triggers */}
          <div className="text-xs uppercase text-zinc-400 tracking-wider pt-2">
            Instant Race Events & Economy
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onTriggerInstantWin}
              className="p-3 bg-red-950/40 border border-red-500/80 hover:bg-red-900/40 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-red-400">Instant Win</div>
              <div className="text-[10px] text-zinc-400">Teleport to checkered flag</div>
            </button>

            <button
              onClick={() => onAddCredits(50000)}
              className="p-3 bg-emerald-950/40 border border-emerald-500/80 hover:bg-emerald-900/40 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>+50,000 Credits</span>
              </div>
              <div className="text-[10px] text-zinc-400">Unlock all performance R&D</div>
            </button>
          </div>

          {/* Weather Override */}
          <div className="text-xs uppercase text-zinc-400 tracking-wider pt-2">
            Weather Override
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onChangeWeather('dry')}
              className="flex-1 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs flex items-center justify-center gap-1.5 text-amber-400 cursor-pointer"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Dry Track</span>
            </button>
            <button
              onClick={() => onChangeWeather('torrential')}
              className="flex-1 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs flex items-center justify-center gap-1.5 text-cyan-400 cursor-pointer"
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Torrential Storm</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
          >
            Apply & Return to Cockpit
          </button>
        </div>
      </div>
    </div>
  );
};
