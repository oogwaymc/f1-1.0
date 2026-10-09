export type WeatherCondition = 'dry' | 'overcast' | 'drizzle' | 'wet' | 'torrential';

export type TireCompound = 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';

export type WeekendSession = 'practice' | 'qualifying' | 'race';

export type CameraView = 'chase' | 'cockpit' | 'tv' | 'nose' | 'topdown';

export interface SectorSplit {
  s1: number; // 0.0 - 1.0 fraction of track
  s2: number;
}

export interface DRSZone {
  id: string;
  name: string;
  detectionFraction: number;
  startFraction: number;
  endFraction: number;
}

export interface TrackPoint {
  x: number;
  y: number;
  z: number;
}

export interface TrackData {
  id: string;
  name: string;
  country: string;
  flag: string;
  lengthKm: number;
  lapsCount: number;
  lapRecord: string;
  lapRecordHolder: string;
  turnsCount: number;
  description: string;
  basePoints: TrackPoint[];
  width: number;
  elevationVariation: number;
  sectors: SectorSplit;
  drsZones: DRSZone[];
  keyTurns: { name: string; fraction: number }[];
}

export interface CarUpgrades {
  enginePower: number;      // 1 to 5
  aeroDownforce: number;    // 1 to 5
  ersEfficiency: number;    // 1 to 5
  brakeSystem: number;      // 1 to 5
  weightReduction: number;  // 1 to 5
  gearboxTuning: number;    // 1 to 5
}

export interface CarCustomization {
  primaryColor: string;
  accentColor: string;
  wheelRimColor: string;
  glowColor: string;
  driverNumber: number; // Always 24
  driverName: string;
}

export interface GhostSample {
  timeMs: number;
  fraction: number;
  x: number;
  y: number;
  z: number;
  rotY: number;
  speedKmh: number;
  drs: boolean;
  throttle: number;
  brake: number;
  gear: number;
}

export interface GhostData {
  trackId: string;
  lapTimeMs: number;
  date: string;
  compound: TireCompound;
  samples: GhostSample[];
}

export interface TelemetrySample {
  timeMs: number;
  speedKmh: number;
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
  ersCharge: number;
  drsActive: boolean;
  fraction: number;
  steer: number;
}

export interface LapResult {
  lapNumber: number;
  totalTimeMs: number;
  s1TimeMs: number;
  s2TimeMs: number;
  s3TimeMs: number;
  valid: boolean;
  isPersonalBest?: boolean;
}

export interface DriverStanding {
  id: string;
  name: string;
  number: number;
  team: string;
  points: number;
  wins: number;
  podiums: number;
  isPlayer?: boolean;
}

export interface RaceParticipant {
  id: string;
  name: string;
  number: number;
  team: string;
  color: string;
  isPlayer: boolean;
  gridPosition: number;
  currentPosition: number;
  fraction: number;
  lateralOffset: number;
  speedKmh: number;
  currentLap: number;
  lastLapMs: number;
  bestLapMs: number;
  gapToLeaderMs: number;
  gapToAheadMs: number;
  tireCompound: TireCompound;
  tireWear: number;
  ersCharge: number;
  drsActive: boolean;
  finished: boolean;
  finishTimeMs: number;
  laps: LapResult[];
}

export interface DevCheats {
  godGrip: boolean;
  supersonic: boolean;
  infiniteErs: boolean;
  alwaysDrs: boolean;
  freezeAi: boolean;
  slowMotion: boolean;
  wireframeMode: boolean;
  instantWinTrigger: boolean;
}

export interface PostRaceReport {
  trackId: string;
  session: WeekendSession;
  finalPosition: number;
  totalParticipants: number;
  bestLapMs: number;
  totalRaceTimeMs: number;
  lapsCompleted: number;
  overtakes: number;
  topSpeedKmh: number;
  pointsEarned: number;
  creditsEarned: number;
  telemetryHistory: TelemetrySample[];
  lapHistory: LapResult[];
  participants: RaceParticipant[];
  weather: WeatherCondition;
  startingGridPos: number;
}
