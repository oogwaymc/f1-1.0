import * as THREE from 'three';
import { TrackData, TireCompound, WeatherCondition, CarUpgrades, DevCheats, TelemetrySample } from '../types/game';

export interface FreeVehicleState {
  // World space coordinates (FREE MOVEMENT, NO AUTO-STEERING)
  x: number;
  z: number;
  y: number;
  yaw: number;             // Heading angle in radians (0 = along +Z, PI/2 = along +X)
  speedMs: number;         // Forward speed in meters per second (can be negative for reverse)
  speedKmh: number;        // Speed in km/h
  steerAngle: number;      // Current wheel steer angle in radians (-max to +max)
  angularVelocity: number; // Current rotational yaw rate

  // Controls & engine state
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
  drsActive: boolean;
  ersCharge: number;
  ersBoosting: boolean;

  // Tires & track limits
  tireWear: number;
  tireTemp: number;
  slipAmount: number;
  isOnTarmac: boolean;
  isOnKerb: boolean;
  isOffTrack: boolean;
  lapValid: boolean;

  // Track progress (projected from world coordinates)
  trackFraction: number;   // 0.0 to 1.0 along track loop
  distanceFromCenter: number; // Signed distance in meters from centerline
  sector: number;          // 1, 2, or 3
  checkpointsPassed: number; // Bitmask to prevent cutting the track
}

const GEAR_RATIOS = [0, 3.4, 2.7, 2.2, 1.8, 1.5, 1.3, 1.15, 1.02];
const MAX_RPM = 15000;
const IDLE_RPM = 4200;
const WHEELBASE = 3.6; // Meters (modern F1 car length between axles)
const MAX_STEER_ANGLE = 0.58; // ~33 degrees max steering lock

export class TrackSpline {
  public curve: THREE.CatmullRomCurve3;
  public totalLength: number;
  public data: TrackData;
  public samplePoints: { point: THREE.Vector3; tangent: THREE.Vector3; fraction: number }[] = [];

  constructor(trackData: TrackData) {
    this.data = trackData;
    const vectors = trackData.basePoints.map(p => new THREE.Vector3(p.x, p.y, p.z));
    this.curve = new THREE.CatmullRomCurve3(vectors, true, 'centripetal', 0.5);
    this.totalLength = this.curve.getLength();

    // Precompute 600 dense sample points for fast closest-point projection
    const samplesCount = 600;
    for (let i = 0; i < samplesCount; i++) {
      const frac = i / samplesCount;
      const point = this.curve.getPointAt(frac);
      const tangent = this.curve.getTangentAt(frac).normalize();
      this.samplePoints.push({ point, tangent, fraction: frac });
    }
  }

  public getPointAt(fraction: number): THREE.Vector3 {
    const wrapped = ((fraction % 1) + 1) % 1;
    return this.curve.getPointAt(wrapped);
  }

  public getTangentAt(fraction: number): THREE.Vector3 {
    const wrapped = ((fraction % 1) + 1) % 1;
    return this.curve.getTangentAt(wrapped).normalize();
  }

  /**
   * Project a world (x, z) point onto the track spline
   * Returns track fraction (0 to 1), signed distance from centerline, and track normal
   */
  public projectPoint(x: number, z: number): {
    fraction: number;
    distanceFromCenter: number;
    trackPoint: THREE.Vector3;
    tangent: THREE.Vector3;
    normal: THREE.Vector3;
  } {
    let closestIndex = 0;
    let minSqDist = Infinity;

    for (let i = 0; i < this.samplePoints.length; i++) {
      const p = this.samplePoints[i].point;
      const dx = x - p.x;
      const dz = z - p.z;
      const sqDist = dx * dx + dz * dz;
      if (sqDist < minSqDist) {
        minSqDist = sqDist;
        closestIndex = i;
      }
    }

    const sample = this.samplePoints[closestIndex];
    const tangent = sample.tangent;
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Vector from track center to car
    const dx = x - sample.point.x;
    const dz = z - sample.point.z;
    const signedDist = dx * normal.x + dz * normal.z;

    return {
      fraction: sample.fraction,
      distanceFromCenter: signedDist,
      trackPoint: sample.point,
      tangent,
      normal,
    };
  }

  public getPositionAndRotation(fraction: number, lateralOffset: number): {
    position: THREE.Vector3;
    rotationY: number;
    bankAngle: number;
    tangent: THREE.Vector3;
  } {
    const wrapped = ((fraction % 1) + 1) % 1;
    const centerPos = this.curve.getPointAt(wrapped);
    const tangent = this.curve.getTangentAt(wrapped).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const worldPos = centerPos.clone().add(normal.clone().multiplyScalar(lateralOffset));
    const rotationY = Math.atan2(tangent.x, tangent.z);
    return {
      position: worldPos,
      rotationY,
      bankAngle: 0,
      tangent,
    };
  }

  public isInsideDRSZone(fraction: number): { available: boolean; zoneName: string | null } {
    const wrapped = ((fraction % 1) + 1) % 1;
    for (const zone of this.data.drsZones) {
      if (zone.startFraction <= zone.endFraction) {
        if (wrapped >= zone.startFraction && wrapped <= zone.endFraction) {
          return { available: true, zoneName: zone.name };
        }
      } else {
        if (wrapped >= zone.startFraction || wrapped <= zone.endFraction) {
          return { available: true, zoneName: zone.name };
        }
      }
    }
    return { available: false, zoneName: null };
  }
}

export function calculateCompoundGrip(
  compound: TireCompound,
  weather: WeatherCondition,
  wear: number
): number {
  let baseGrip = 1.0;
  switch (compound) {
    case 'soft': baseGrip = 1.15; break;
    case 'medium': baseGrip = 1.05; break;
    case 'hard': baseGrip = 0.98; break;
    case 'intermediate': baseGrip = 0.92; break;
    case 'wet': baseGrip = 0.85; break;
  }

  let weatherFactor = 1.0;
  if (weather === 'dry') {
    if (compound === 'intermediate') weatherFactor = 0.75;
    if (compound === 'wet') weatherFactor = 0.60;
  } else if (weather === 'overcast') {
    if (compound === 'intermediate') weatherFactor = 0.80;
    if (compound === 'wet') weatherFactor = 0.65;
  } else if (weather === 'drizzle') {
    if (compound === 'intermediate') weatherFactor = 1.12;
    else if (compound === 'soft' || compound === 'medium') weatherFactor = 0.70;
    else if (compound === 'hard') weatherFactor = 0.60;
    else if (compound === 'wet') weatherFactor = 0.95;
  } else if (weather === 'wet' || weather === 'torrential') {
    if (compound === 'wet') weatherFactor = weather === 'torrential' ? 1.25 : 1.15;
    else if (compound === 'intermediate') weatherFactor = weather === 'torrential' ? 0.75 : 1.0;
    else {
      weatherFactor = weather === 'torrential' ? 0.28 : 0.45;
    }
  }

  const wearFactor = Math.max(0.45, 1.0 - Math.pow(wear / 100, 1.8) * 0.55);
  return baseGrip * weatherFactor * wearFactor;
}

/**
 * Update Vehicle Physics with TRUE FREE WASD/ARROW STEERING
 * No auto-steering. The car moves purely based on driver input and physical momentum!
 */
export function updateFreeCarPhysics(
  state: FreeVehicleState,
  inputs: {
    throttle: number; // 0 to 1 (W / Up Arrow)
    brake: number;    // 0 to 1 (S / Down Arrow)
    steerLeft: boolean;  // A / Left Arrow
    steerRight: boolean; // D / Right Arrow
    ersBoost: boolean;
    drsToggle: boolean;
  },
  track: TrackSpline,
  compound: TireCompound,
  weather: WeatherCondition,
  upgrades: CarUpgrades,
  cheats: DevCheats,
  deltaSeconds: number
): {
  state: FreeVehicleState;
  telemetry: TelemetrySample;
  shiftSound: boolean;
  kerbSound: boolean;
  drsChirp: boolean | null;
  wallHit: boolean;
} {
  let shiftSound = false;
  let kerbSound = false;
  let drsChirp: boolean | null = null;
  let wallHit = false;

  const dt = Math.min(0.05, Math.max(0.001, deltaSeconds * (cheats.slowMotion ? 0.3 : 1.0)));

  // Performance upgrades
  const powerMult = 1.0 + (upgrades.enginePower - 1) * 0.05;
  const aeroMult = 1.0 + (upgrades.aeroDownforce - 1) * 0.06;
  const ersMult = 1.0 + (upgrades.ersEfficiency - 1) * 0.12;
  const brakeMult = 1.0 + (upgrades.brakeSystem - 1) * 0.08;
  const weightMult = 1.0 - (upgrades.weightReduction - 1) * 0.025;

  // Project car onto track spline to determine track limits
  const projection = track.projectPoint(state.x, state.z);
  state.trackFraction = projection.fraction;
  state.distanceFromCenter = projection.distanceFromCenter;
  state.y = projection.trackPoint.y; // Ride track elevation smoothly

  // Track limits boundaries
  const halfWidth = track.data.width / 2;
  const curbBoundary = halfWidth + 1.8;
  const barrierBoundary = halfWidth + 14.0;
  const absDist = Math.abs(state.distanceFromCenter);

  const wasOnKerb = state.isOnKerb;
  state.isOnTarmac = absDist <= halfWidth;
  state.isOnKerb = absDist > halfWidth && absDist <= curbBoundary;
  state.isOffTrack = absDist > curbBoundary;

  if (state.isOnKerb && !wasOnKerb && state.speedKmh > 60) {
    kerbSound = true;
  }
  if (state.isOffTrack) {
    state.lapValid = false;
  }

  // 1. FREE KEYBOARD STEERING LOGIC (NO AUTO-STEER)
  // Steer left when pressing A / Left, steer right when pressing D / Right
  let targetSteer = 0;
  if (inputs.steerLeft && !inputs.steerRight) {
    targetSteer = MAX_STEER_ANGLE; // Positive = turn left
  } else if (inputs.steerRight && !inputs.steerLeft) {
    targetSteer = -MAX_STEER_ANGLE; // Negative = turn right
  }

  // Speed-sensitive steering damping (at 300 km/h, steering sensitivity decreases to maintain stability)
  const currentSpeedAbs = Math.abs(state.speedMs);
  const steerRate = 6.0; // Responsive turning response
  const speedSteerDamp = Math.max(0.28, 1.0 - (state.speedKmh / 360) * 0.65);
  const effectiveTargetSteer = targetSteer * speedSteerDamp;

  state.steerAngle += (effectiveTargetSteer - state.steerAngle) * Math.min(1.0, steerRate * dt);

  // DRS Logic
  const drsInfo = track.isInsideDRSZone(state.trackFraction);
  const drsAllowed = cheats.alwaysDrs || drsInfo.available;
  if (inputs.drsToggle) {
    if (drsAllowed && !state.drsActive) {
      state.drsActive = true;
      drsChirp = true;
    } else if (state.drsActive) {
      state.drsActive = false;
      drsChirp = false;
    }
  }
  if (inputs.brake > 0.1 && state.drsActive) {
    state.drsActive = false;
    drsChirp = false;
  }
  if (!drsAllowed && !cheats.alwaysDrs && state.drsActive) {
    state.drsActive = false;
    drsChirp = false;
  }

  // ERS Battery
  const isErsActive = (inputs.ersBoost || cheats.infiniteErs) && (state.ersCharge > 0 || cheats.infiniteErs);
  state.ersBoosting = isErsActive;
  if (isErsActive && !cheats.infiniteErs) {
    state.ersCharge = Math.max(0, state.ersCharge - (16.0 / ersMult) * dt);
  } else if (!isErsActive && inputs.brake > 0.3) {
    state.ersCharge = Math.min(100, state.ersCharge + (14.0 * ersMult) * dt);
  }

  // Tire Grip Calculation
  let gripFactor = cheats.godGrip
    ? 99.0
    : calculateCompoundGrip(compound, weather, state.tireWear) * aeroMult;

  // Off-track grass/gravel severe grip penalty
  if (state.isOffTrack) {
    gripFactor *= 0.35;
  } else if (state.isOnKerb) {
    gripFactor *= 0.85;
  }

  // Aerodynamics
  const aeroDownforceN = 0.5 * 1.225 * (2.8 * aeroMult) * (state.speedMs * state.speedMs);
  const aeroDragN = 0.5 * 1.225 * (0.85 * (state.drsActive ? 0.66 : 1.0)) * (state.speedMs * state.speedMs);

  // Engine Drive Force
  let engineKW = 730 * powerMult;
  if (isErsActive) engineKW += 140 * ersMult;
  if (cheats.supersonic) engineKW = 3500;

  let driveForceN = 0;
  if (inputs.throttle > 0) {
    const effSpeedMs = Math.max(10, currentSpeedAbs);
    driveForceN = ((engineKW * 1000) / effSpeedMs) * inputs.throttle;
    const maxTractionForce = (800 * 9.81 + aeroDownforceN) * gripFactor * 1.35;
    driveForceN = Math.min(driveForceN, maxTractionForce);
  }

  // Braking Force / Reverse
  let brakeForceN = 0;
  let reverseForceN = 0;
  if (inputs.brake > 0) {
    if (state.speedMs > 0.5) {
      brakeForceN = 18500 * brakeMult * inputs.brake;
      const maxBrakingForce = (800 * 9.81 + aeroDownforceN) * gripFactor * 1.45;
      brakeForceN = Math.min(brakeForceN, maxBrakingForce);
    } else {
      // S / Down Arrow in reverse when stopped
      reverseForceN = 4500 * inputs.brake;
    }
  }

  // Rolling Resistance & Off-track grass drag
  const rollingResistN = (state.isOffTrack ? 8500 : 260) + (state.isOnKerb ? 400 : 0);

  // Net Longitudinal Acceleration
  const carMassKg = 798 * weightMult;
  let netForwardForceN = driveForceN - (state.speedMs >= 0 ? brakeForceN : -brakeForceN) - aeroDragN - (Math.sign(state.speedMs) * rollingResistN);
  if (inputs.brake > 0 && state.speedMs <= 0.5 && inputs.throttle === 0) {
    netForwardForceN = -reverseForceN;
  }

  const forwardAccelMs2 = netForwardForceN / carMassKg;
  state.speedMs += forwardAccelMs2 * dt;

  // Max reverse speed limit
  if (state.speedMs < -15) state.speedMs = -15;

  const topSpeedCapMs = cheats.supersonic ? (520 * 1000) / 3600 : (365 * 1000) / 3600;
  if (state.speedMs > topSpeedCapMs) state.speedMs = topSpeedCapMs;
  state.speedKmh = (state.speedMs * 3600) / 1000;

  // 2. YAW ROTATION FROM STEERING (BICYCLE / ACKERMANN MODEL)
  // yaw rate = (v / L) * tan(steerAngle)
  // If stopped, yaw rate is 0. If moving forward, turning steers the car freely in world space!
  if (currentSpeedAbs > 0.2) {
    const idealYawRate = (state.speedMs / WHEELBASE) * Math.tan(state.steerAngle);
    // Lateral tire traction limit prevents instant 180 spins
    const maxLatAccel = 9.81 * 4.2 * gripFactor;
    const maxTurnRate = maxLatAccel / Math.max(5, currentSpeedAbs);
    const clampedYawRate = Math.max(-maxTurnRate, Math.min(maxTurnRate, idealYawRate));

    state.angularVelocity = clampedYawRate;
    state.yaw += state.angularVelocity * dt;

    // Lateral slip measurement
    state.slipAmount = Math.max(0, Math.min(1.0, (Math.abs(idealYawRate) - maxTurnRate * 0.8) / (maxTurnRate * 0.4)));
  } else {
    state.angularVelocity = 0;
    state.slipAmount = 0;
  }

  // 3. FREE TRANSLATION IN WORLD COORDINATES
  // The car moves strictly along its current yaw heading:
  // Forward vector: dx = sin(yaw) * speed * dt, dz = cos(yaw) * speed * dt
  const moveDist = state.speedMs * dt;
  state.x += Math.sin(state.yaw) * moveDist;
  state.z += Math.cos(state.yaw) * moveDist;

  // 4. TRACK BARRIER COLLISION
  // If car runs too far off track, it strikes the outer tyre barriers/concrete wall
  if (absDist > barrierBoundary) {
    wallHit = true;
    // Push back inside barrier
    const pushDir = -Math.sign(state.distanceFromCenter);
    state.x += projection.normal.x * pushDir * 1.5;
    state.z += projection.normal.z * pushDir * 1.5;
    // Speed reduction and bounce
    state.speedMs *= -0.25;
    state.speedKmh = (state.speedMs * 3600) / 1000;
    // Deflect yaw slightly away from wall
    state.yaw += pushDir * 0.35;
  }

  // 5. GEARBOX SIMULATION
  const absSpeedKmh = Math.abs(state.speedKmh);
  let targetGear = 1;
  if (state.speedMs < -0.5) targetGear = 0; // Reverse
  else if (absSpeedKmh > 310) targetGear = 8;
  else if (absSpeedKmh > 270) targetGear = 7;
  else if (absSpeedKmh > 230) targetGear = 6;
  else if (absSpeedKmh > 185) targetGear = 5;
  else if (absSpeedKmh > 140) targetGear = 4;
  else if (absSpeedKmh > 100) targetGear = 3;
  else if (absSpeedKmh > 60) targetGear = 2;
  else targetGear = 1;

  if (targetGear !== state.gear) {
    state.gear = targetGear;
    shiftSound = true;
  }

  const gearRatio = GEAR_RATIOS[state.gear] || 1.0;
  const speedRatioInGear = (absSpeedKmh * gearRatio) / 45;
  state.rpm = Math.min(
    MAX_RPM,
    Math.max(IDLE_RPM, IDLE_RPM + speedRatioInGear * 1350 + inputs.throttle * 900)
  );

  // Tire wear and heat
  const wearRate = (0.28 / 100) * (absSpeedKmh / 200) * (1 + state.slipAmount * 2.0);
  state.tireWear = Math.min(100, state.tireWear + wearRate * dt);
  state.tireTemp = 85 + (state.slipAmount * 35) + (inputs.brake * 20);

  state.throttle = inputs.throttle;
  state.brake = inputs.brake;

  const telemetry: TelemetrySample = {
    timeMs: Date.now(),
    speedKmh: Math.round(state.speedKmh),
    throttle: Math.round(inputs.throttle * 100) / 100,
    brake: Math.round(inputs.brake * 100) / 100,
    gear: state.gear,
    rpm: Math.round(state.rpm),
    ersCharge: Math.round(state.ersCharge),
    drsActive: state.drsActive,
    fraction: state.trackFraction,
    steer: Math.round((state.steerAngle / MAX_STEER_ANGLE) * 100) / 100,
  };

  return {
    state,
    telemetry,
    shiftSound,
    kerbSound,
    drsChirp,
    wallHit,
  };
}
