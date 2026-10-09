import React from 'react';
import { CarCustomization, CarUpgrades } from '../types/game';
import { ArrowLeft, Wrench, Zap, Gauge, Disc, Shield, ShieldCheck, Check, Sparkles, Sliders } from 'lucide-react';

interface GarageCustomizerProps {
  customization: CarCustomization;
  upgrades: CarUpgrades;
  userCredits: number;
  onUpdateCustomization: (updated: CarCustomization) => void;
  onPurchaseUpgrade: (upgradeKey: keyof CarUpgrades, cost: number) => void;
  onBack: () => void;
}

const UPGRADE_CONFIGS: {
  key: keyof CarUpgrades;
  name: string;
  description: string;
  icon: React.ElementType;
  baseCost: number;
  multiplier: number;
  statName: string;
}[] = [
  {
    key: 'enginePower',
    name: 'Turbo-Hybrid V6 Power Unit',
    description: 'Increases internal combustion kW output and high-speed acceleration.',
    icon: Gauge,
    baseCost: 2500,
    multiplier: 1.8,
    statName: '+5% Top Speed & Acceleration per tier',
  },
  {
    key: 'aeroDownforce',
    name: 'High-Downforce Aero Package',
    description: 'Sculpted front wing, sidepod bargeboards, and rear diffuser for higher cornering Gs.',
    icon: Sparkles,
    baseCost: 2000,
    multiplier: 1.7,
    statName: '+6% Lateral Cornering Grip per tier',
  },
  {
    key: 'ersEfficiency',
    name: 'MGU-K Energy Recovery System',
    description: 'Enhances electric hybrid boost deployment strength and regenerative brake recharge.',
    icon: Zap,
    baseCost: 2200,
    multiplier: 1.75,
    statName: '+12% ERS Boost Power & Recharge per tier',
  },
  {
    key: 'brakeSystem',
    name: 'Carbon-Ceramic Braking Calipers',
    description: 'Reduces braking distances into heavy chicanes and improves thermal dissipation.',
    icon: Disc,
    baseCost: 1800,
    multiplier: 1.6,
    statName: '+8% Stopping Force per tier',
  },
  {
    key: 'weightReduction',
    name: 'Ultralight Carbon-Titanium Chassis',
    description: 'Lowers minimum vehicle kerb weight for razor-sharp direction changes.',
    icon: Shield,
    baseCost: 3000,
    multiplier: 1.9,
    statName: '-25 kg Mass Reduction per tier',
  },
  {
    key: 'gearboxTuning',
    name: 'Seamless-Shift Sequential Gearbox',
    description: 'Fine-tunes 8-speed gear spacing for instantaneous power transfer out of hairpins.',
    icon: Wrench,
    baseCost: 2100,
    multiplier: 1.65,
    statName: 'Faster Gear Engagement & Torque Curve',
  },
];

const PRESET_COLORS = [
  { label: 'Stealth Carbon', hex: '#18181b' },
  { label: 'Rosso Scuderia', hex: '#dc2626' },
  { label: 'Papaya Orange', hex: '#f97316' },
  { label: 'Racing Green', hex: '#059669' },
  { label: 'Cyan Electric', hex: '#06b6d4' },
  { label: 'Apex Gold', hex: '#eab308' },
  { label: 'Midnight Blue', hex: '#1e40af' },
  { label: 'Silver Arrow', hex: '#94a3b8' },
];

export const GarageCustomizer: React.FC<GarageCustomizerProps> = ({
  customization,
  upgrades,
  userCredits,
  onUpdateCustomization,
  onPurchaseUpgrade,
  onBack,
}) => {
  const [activeTab, setActiveTab] = React.useState<'upgrades' | 'customization'>('upgrades');

  const getUpgradeCost = (currentLevel: number, baseCost: number, mult: number) => {
    if (currentLevel >= 5) return 0;
    return Math.round(baseCost * Math.pow(mult, currentLevel - 1));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-6 md:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
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
              <span className="text-red-500 font-bold">Driver Car #24</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Paddock Garage & R&D Center
            </h1>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl px-5 py-3 text-right">
          <span className="text-xs uppercase font-mono text-zinc-400 block">Available Credits</span>
          <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
            {userCredits.toLocaleString()} <span className="text-sm text-zinc-500">Cr</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 my-6">
        <button
          onClick={() => setActiveTab('upgrades')}
          className={`py-2 px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'upgrades'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Performance R&D Upgrades
        </button>
        <button
          onClick={() => setActiveTab('customization')}
          className={`py-2 px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'customization'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Car #24 Livery & Customization
        </button>
      </div>

      {/* Tab 1: Performance Upgrades */}
      {activeTab === 'upgrades' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {UPGRADE_CONFIGS.map(cfg => {
            const Icon = cfg.icon;
            const currentLevel = upgrades[cfg.key];
            const cost = getUpgradeCost(currentLevel, cfg.baseCost, cfg.multiplier);
            const isMax = currentLevel >= 5;
            const canAfford = userCredits >= cost;

            return (
              <div
                key={cfg.key}
                className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-red-500">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3.5 h-2 rounded-xs ${
                            i < currentLevel ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]' : 'bg-zinc-800'
                          }`}
                        />
                      ))}
                      <span className="ml-1.5 text-zinc-300 font-bold">Tier {currentLevel}/5</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{cfg.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{cfg.description}</p>
                  <div className="text-[11px] font-mono text-emerald-400 mt-2">{cfg.statName}</div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  {isMax ? (
                    <div className="w-full py-2.5 bg-zinc-800/60 text-zinc-400 font-mono text-xs rounded-xl text-center font-bold flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>MAXIMUM SPECIFICATION</span>
                    </div>
                  ) : (
                    <>
                      <div className="font-mono text-xs">
                        <span className="text-zinc-500 block text-[10px]">UPGRADE COST</span>
                        <span className="text-white font-bold tabular-nums">{cost.toLocaleString()} Cr</span>
                      </div>
                      <button
                        onClick={() => onPurchaseUpgrade(cfg.key, cost)}
                        disabled={!canAfford}
                        className={`px-4 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Purchase' : 'Insufficient Credits'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Visual Customization */}
      {activeTab === 'customization' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls */}
          <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6">
            {/* Driver Number Card */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-mono text-zinc-400 block">Driver Identification</span>
                <span className="text-xl font-bold text-white uppercase">{customization.driverName}</span>
              </div>
              <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-red-950/50">
                #24
              </div>
            </div>

            {/* Primary Livery Paint */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                Primary Body Livery Color
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => onUpdateCustomization({ ...customization, primaryColor: c.hex })}
                    title={c.label}
                    className={`h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      customization.primaryColor === c.hex
                        ? 'border-white ring-2 ring-red-500 scale-105'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {customization.primaryColor === c.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Aero Trim Color */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                Aerodynamic Wing & Air Intake Accent
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => onUpdateCustomization({ ...customization, accentColor: c.hex })}
                    title={c.label}
                    className={`h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      customization.accentColor === c.hex
                        ? 'border-white ring-2 ring-red-500 scale-105'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {customization.accentColor === c.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Wheel Rim Alloys */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                Wheel Rim Alloy Color
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[
                  { label: 'Forged Bronze', hex: '#b45309' },
                  { label: 'Titanium Silver', hex: '#94a3b8' },
                  { label: 'Matte Jet Black', hex: '#18181b' },
                  { label: 'Racing Gold', hex: '#eab308' },
                  { label: 'Scuderia Red', hex: '#dc2626' },
                  { label: 'Cyan Electric', hex: '#06b6d4' },
                ].map(c => (
                  <button
                    key={c.hex}
                    onClick={() => onUpdateCustomization({ ...customization, wheelRimColor: c.hex })}
                    title={c.label}
                    className={`h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      customization.wheelRimColor === c.hex
                        ? 'border-white ring-2 ring-red-500 scale-105'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {customization.wheelRimColor === c.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Livery Spec Preview Card */}
          <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              Vehicle Spec Sheet · Car #24
            </h3>

            {/* Stylized Livery Preview Swatch */}
            <div className="h-48 rounded-xl border border-zinc-800 p-4 flex flex-col justify-between relative overflow-hidden shadow-inner" style={{ backgroundColor: customization.primaryColor }}>
              <div className="absolute top-0 right-0 w-32 h-full transform skew-x-12 opacity-85" style={{ backgroundColor: customization.accentColor }} />
              <div className="relative z-10 flex justify-between items-start">
                <span className="text-xs font-mono font-bold tracking-widest uppercase bg-black/60 px-2.5 py-1 rounded-md text-white backdrop-blur-sm">
                  FIA F1 HOMOLOGATED
                </span>
                <span className="text-5xl font-black font-mono text-white drop-shadow-md">
                  #24
                </span>
              </div>
              <div className="relative z-10 text-white drop-shadow font-mono text-xs">
                <div>CHASSIS: APEX-24 HYBRID SPEC</div>
                <div className="text-[11px] opacity-80">RIMS: {customization.wheelRimColor}</div>
              </div>
            </div>

            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400 space-y-2">
              <div className="flex justify-between">
                <span>Power Unit Tier:</span>
                <span className="text-white font-bold">Tier {upgrades.enginePower} / 5</span>
              </div>
              <div className="flex justify-between">
                <span>Aero Downforce Spec:</span>
                <span className="text-white font-bold">Tier {upgrades.aeroDownforce} / 5</span>
              </div>
              <div className="flex justify-between">
                <span>MGU-K ERS Battery:</span>
                <span className="text-white font-bold">Tier {upgrades.ersEfficiency} / 5</span>
              </div>
              <div className="flex justify-between">
                <span>Carbon Brake Package:</span>
                <span className="text-white font-bold">Tier {upgrades.brakeSystem} / 5</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
