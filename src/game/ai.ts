import * as THREE from 'three';
import { TrackSpline } from './physics';
import { RaceParticipant, WeatherCondition, TireCompound } from '../types/game';

export interface AIDriverConfig {
  id: string;
  name: string;
  number: number;
  team: string;
  color: string;
  paceFactor: number; // >1.0 means slightly faster than baseline
  aggression: number;
  tireCompound: TireCompound;
}

export const F1_GRID_DRIVERS: AIDriverConfig[] = [
  {
    id: 'ai_ver',
    name: 'M. Verstappen',
    number: 1,
    team: 'Red Bull Racing',
    color: '#1e40af', // Navy blue
    paceFactor: 1.055, // Slightly faster
    aggression: 0.95,
    tireCompound: 'medium',
  },
  {
    id: 'ai_ham',
    name: 'L. Hamilton',
    number: 44,
    team: 'Ferrari',
    color: '#dc2626', // Ferrari Rosso
    paceFactor: 1.048,
    aggression: 0.88,
    tireCompound: 'medium',
  },
  {
    id: 'ai_nor',
    name: 'L. Norris',
    number: 4,
    team: 'McLaren',
    color: '#ea580c', // Papaya orange
    paceFactor: 1.050,
    aggression: 0.89,
    tireCompound: 'soft',
  },
  {
    id: 'ai_lec',
    name: 'C. Leclerc',
    number: 16,
    team: 'Ferrari',
    color: '#b91c1c', // Crimson
    paceFactor: 1.045,
    aggression: 0.92,
    tireCompound: 'soft',
  },
  {
    id: 'ai_rus',
    name: 'G. Russell',
    number: 63,
    team: 'Mercedes-AMG',
    color: '#06b6d4', // Silver / Cyan
    paceFactor: 1.040,
    aggression: 0.85,
    tireCompound: 'medium',
  },
  {
    id: 'ai_pia',
    name: 'O. Piastri',
    number: 81,
    team: 'McLaren',
    color: '#f97316', // Orange
    paceFactor: 1.042,
    aggression: 0.82,
    tireCompound: 'medium',
  },
  {
    id: 'ai_alo',
    name: 'F. Alonso',
    number: 14,
    team: 'Aston Martin',
    color: '#047857', // British Racing Green
    paceFactor: 1.038,
    aggression: 0.96,
    tireCompound: 'hard',
  },
];

export interface AIState {
  id: string;
  config: AIDriverConfig;
  fraction: number;
  lateralOffset: number;
  targetLateralOffset: number;
  speedKmh: number;
  lap: number;
  lastLapMs: number;
  bestLapMs: number;
  lapStartTime: number;
  finished: boolean;
  finishTimeMs: number;
  drsActive: boolean;
  tireWear: number;
  tireCompound: TireCompound;
  worldPosition: THREE.Vector3;
  worldRotationY: number;
}

export function initializeAIGrid(
  track: TrackSpline,
  count: number = 7,
  weather: WeatherCondition = 'dry'
): AIState[] {
  const drivers = F1_GRID_DRIVERS.slice(0, count);

  return drivers.map((driver, index) => {
    // Grid slot fraction behind start line
    const gridSpacing = 0.012; // fraction along track
    const gridSlot = (index + 1) * gridSpacing;
    const initialFraction = (1.0 - gridSlot + 1.0) % 1.0;
    const lateralSide = index % 2 === 0 ? -2.5 : 2.5;

    // Appropriate tire choice for weather
    let tire: TireCompound = driver.tireCompound;
    if (weather === 'torrential' || weather === 'wet') {
      tire = 'wet';
    } else if (weather === 'drizzle') {
      tire = 'intermediate';
    }

    const transform = track.getPositionAndRotation(initialFraction, lateralSide);

    return {
      id: driver.id,
      config: driver,
      fraction: initialFraction,
      lateralOffset: lateralSide,
      targetLateralOffset: 0,
      speedKmh: 0,
      lap: 1,
      lastLapMs: 0,
      bestLapMs: 0,
      lapStartTime: Date.now(),
      finished: false,
      finishTimeMs: 0,
      drsActive: false,
      tireWear: 0,
      tireCompound: tire,
      worldPosition: transform.position,
      worldRotationY: transform.rotationY,
    };
  });
}

export function updateAISimulation(
  aiCars: AIState[],
  track: TrackSpline,
  weather: WeatherCondition,
  playerFraction: number,
  playerLateral: number,
  playerSpeedKmh: number,
  deltaSeconds: number,
  freezeAi: boolean
): AIState[] {
  if (freezeAi) return aiCars;

  const dt = Math.min(0.05, deltaSeconds);

  aiCars.forEach(ai => {
    if (ai.finished) return;

    // Track curvature estimation ahead
    const lookAheadFraction = (ai.fraction + 0.02) % 1.0;
    const tCurrent = track.getTangentAt(ai.fraction);
    const tAhead = track.getTangentAt(lookAheadFraction);

    // Angle delta between current and upcoming section
    const dot = Math.max(-1, Math.min(1, tCurrent.dot(tAhead)));
    const turnSeverity = 1.0 - dot; // 0 on straight, up to ~0.7 in hairpins

    // DRS zone check
    const drs = track.isInsideDRSZone(ai.fraction);
    ai.drsActive = drs.available && turnSeverity < 0.05;

    // Target racing line apex calculation
    // Curve normal indicates turn direction
    const crossY = tCurrent.x * tAhead.z - tCurrent.z * tAhead.x;
    let idealApex = 0;
    if (Math.abs(crossY) > 0.01) {
      // In right turns (crossY < 0), hit right apex (negative lateral offset)
      // In left turns (crossY > 0), hit left apex (positive lateral offset)
      idealApex = crossY > 0 ? -3.0 : 3.0;
    }

    // Slipstream and overtake avoidance logic
    const distToPlayer = ((playerFraction - ai.fraction + 1.0) % 1.0) * track.totalLength;
    if (distToPlayer > 0 && distToPlayer < 25) {
      // Behind player - try to pull out to overtake
      const offsetDiff = Math.abs(ai.lateralOffset - playerLateral);
      if (offsetDiff < 2.5) {
        idealApex = playerLateral > 0 ? -3.5 : 3.5;
      }
    }

    ai.targetLateralOffset = idealApex;
    ai.lateralOffset += (ai.targetLateralOffset - ai.lateralOffset) * Math.min(1.0, 2.5 * dt);

    // Calculate corner maximum speed
    let baseCornerSpeed = 340;
    if (turnSeverity > 0.35) baseCornerSpeed = 100; // Hairpin
    else if (turnSeverity > 0.20) baseCornerSpeed = 160; // Chicane
    else if (turnSeverity > 0.10) baseCornerSpeed = 220; // Medium curve
    else if (turnSeverity > 0.03) baseCornerSpeed = 280; // High speed kink

    // Weather impact on AI
    let weatherPenalty = 1.0;
    if (weather === 'torrential') weatherPenalty = 0.72;
    else if (weather === 'wet') weatherPenalty = 0.82;
    else if (weather === 'drizzle') weatherPenalty = 0.92;

    // AI pace is slightly faster than player baseline (challenging opponent!)
    let targetSpeedKmh = baseCornerSpeed * ai.config.paceFactor * weatherPenalty;
    if (ai.drsActive) targetSpeedKmh += 22;

    // Accelerate or brake toward target speed
    if (ai.speedKmh < targetSpeedKmh) {
      const accelRate = 42 * ai.config.paceFactor;
      ai.speedKmh = Math.min(targetSpeedKmh, ai.speedKmh + accelRate * dt);
    } else {
      const brakeRate = 85;
      ai.speedKmh = Math.max(targetSpeedKmh, ai.speedKmh - brakeRate * dt);
    }

    // Advance fraction
    const speedMs = (ai.speedKmh * 1000) / 3600;
    const distanceMeters = speedMs * dt;
    const fractionDelta = distanceMeters / track.totalLength;
    const oldFraction = ai.fraction;
    ai.fraction = (ai.fraction + fractionDelta) % 1.0;

    // Check lap completion
    if (oldFraction > 0.9 && ai.fraction < 0.1) {
      const now = Date.now();
      const lapTime = now - ai.lapStartTime;
      ai.lastLapMs = lapTime;
      if (ai.bestLapMs === 0 || lapTime < ai.bestLapMs) {
        ai.bestLapMs = lapTime;
      }
      ai.lapStartTime = now;
      ai.lap++;
    }

    // Transform 3D position
    const transform = track.getPositionAndRotation(ai.fraction, ai.lateralOffset);
    ai.worldPosition = transform.position;
    ai.worldRotationY = transform.rotationY;
  });

  return aiCars;
}
