import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  TrackData,
  WeatherCondition,
  TireCompound,
  WeekendSession,
  CameraView,
  CarUpgrades,
  CarCustomization,
  GhostData,
  GhostSample,
  TelemetrySample,
  LapResult,
  DriverStanding,
  RaceParticipant,
  DevCheats,
  PostRaceReport,
} from './types/game';
import { TRACKS } from './game/tracks';
import { TrackSpline, FreeVehicleState, updateFreeCarPhysics } from './game/physics';
import { AIState, initializeAIGrid, updateAISimulation, F1_GRID_DRIVERS } from './game/ai';
import { SceneRenderer } from './game/SceneRenderer';
import { sound } from './game/audio';

import { LockScreen } from './components/LockScreen';
import { TrackSelect } from './components/TrackSelect';
import { RaceHUD } from './components/RaceHUD';
import { PauseModal } from './components/PauseModal';
import { DevMenuModal } from './components/DevMenuModal';
import { PostRaceAnalytics } from './components/PostRaceAnalytics';
import { GarageCustomizer } from './components/GarageCustomizer';
import { CareerStandings } from './components/CareerStandings';
import { GhostReplayModal } from './components/GhostReplayModal';

type AppScreen =
  | 'locked'
  | 'track_select'
  | 'in_race'
  | 'post_race'
  | 'garage'
  | 'standings'
  | 'ghost_replay';

const INITIAL_UPGRADES: CarUpgrades = {
  enginePower: 1,
  aeroDownforce: 1,
  ersEfficiency: 1,
  brakeSystem: 1,
  weightReduction: 1,
  gearboxTuning: 1,
};

const INITIAL_CUSTOMIZATION: CarCustomization = {
  primaryColor: '#18181b', // Stealth Carbon
  accentColor: '#dc2626',  // Scuderia Red
  wheelRimColor: '#b45309', // Forged Bronze
  glowColor: '#ef4444',
  driverNumber: 24,
  driverName: 'Driver 24',
};

const INITIAL_STANDINGS: DriverStanding[] = [
  { id: 'p24', name: 'Driver 24', number: 24, team: 'Apex Racing Team', points: 0, wins: 0, podiums: 0, isPlayer: true },
  { id: 'ai_ver', name: 'M. Verstappen', number: 1, team: 'Red Bull Racing', points: 25, wins: 1, podiums: 1 },
  { id: 'ai_nor', name: 'L. Norris', number: 4, team: 'McLaren', points: 18, wins: 0, podiums: 1 },
  { id: 'ai_ham', name: 'L. Hamilton', number: 44, team: 'Ferrari', points: 15, wins: 0, podiums: 1 },
  { id: 'ai_lec', name: 'C. Leclerc', number: 16, team: 'Ferrari', points: 12, wins: 0, podiums: 0 },
  { id: 'ai_rus', name: 'G. Russell', number: 63, team: 'Mercedes-AMG', points: 10, wins: 0, podiums: 0 },
  { id: 'ai_pia', name: 'O. Piastri', number: 81, team: 'McLaren', points: 8, wins: 0, podiums: 0 },
  { id: 'ai_alo', name: 'F. Alonso', number: 14, team: 'Aston Martin', points: 6, wins: 0, podiums: 0 },
];

export default function App() {
  // Navigation & Screen State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('locked');
  const [selectedTrack, setSelectedTrack] = useState<TrackData>(TRACKS[0]);
  const [session, setSession] = useState<WeekendSession>('race');
  const [weather, setWeather] = useState<WeatherCondition>('dry');
  const [tireCompound, setTireCompound] = useState<TireCompound>('medium');

  // Persistence / Economy
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('apex_credits');
    return saved ? parseInt(saved, 10) : 5000;
  });
  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem('apex_points');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [upgrades, setUpgrades] = useState<CarUpgrades>(() => {
    const saved = localStorage.getItem('apex_upgrades');
    return saved ? JSON.parse(saved) : INITIAL_UPGRADES;
  });
  const [customization, setCustomization] = useState<CarCustomization>(() => {
    const saved = localStorage.getItem('apex_customization');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMIZATION;
  });
  const [standings, setStandings] = useState<DriverStanding[]>(() => {
    const saved = localStorage.getItem('apex_standings');
    return saved ? JSON.parse(saved) : INITIAL_STANDINGS;
  });
  const [ghostLaps, setGhostLaps] = useState<Record<string, GhostData>>(() => {
    const saved = localStorage.getItem('apex_ghosts');
    return saved ? JSON.parse(saved) : {};
  });

  // Cheats State (Activated with secret code "2411")
  const [cheats, setCheats] = useState<DevCheats>({
    godGrip: false,
    supersonic: false,
    infiniteErs: false,
    alwaysDrs: false,
    freezeAi: false,
    slowMotion: false,
    wireframeMode: false,
    instantWinTrigger: false,
  });
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Audio & Camera
  const [isMuted, setIsMuted] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraView>('chase');

  // Race Runtime State
  const [startLightsCount, setStartLightsCount] = useState<number>(0);
  const [currentLap, setCurrentLap] = useState<number>(1);
  const [lapTimeMs, setLapTimeMs] = useState<number>(0);
  const [lastLapMs, setLastLapMs] = useState<number>(0);
  const [bestLapMs, setBestLapMs] = useState<number>(0);
  const [ghostDeltaMs, setGhostDeltaMs] = useState<number | null>(null);
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [drsAvailable, setDrsAvailable] = useState<boolean>(false);
  const [postRaceReport, setPostRaceReport] = useState<PostRaceReport | null>(null);

  // 3D Canvas Container Ref
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const sceneRendererRef = useRef<SceneRenderer | null>(null);
  const trackSplineRef = useRef<TrackSpline | null>(null);

  // Animation Loop & Simulation Refs
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lapStartTimeRef = useRef<number>(0);
  const raceStartTimeRef = useRef<number>(0);

  // Secret Dev Menu Code Buffer Ref
  const keySequenceRef = useRef<string>('');

  // Keyboard Inputs Ref
  const keysPressedRef = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    ers: boolean;
    drsTogglePending: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    ers: false,
    drsTogglePending: false,
  });

  // Current Physics & AI States Ref (Free WASD/Arrow steering)
  const playerPhysicsRef = useRef<FreeVehicleState>({
    x: 0,
    z: 0,
    y: 0,
    yaw: 0,
    speedMs: 0,
    speedKmh: 0,
    steerAngle: 0,
    angularVelocity: 0,
    throttle: 0,
    brake: 0,
    gear: 1,
    rpm: 4200,
    drsActive: false,
    ersCharge: 100,
    ersBoosting: false,
    tireWear: 0,
    tireTemp: 85,
    slipAmount: 0,
    isOnTarmac: true,
    isOnKerb: false,
    isOffTrack: false,
    lapValid: true,
    trackFraction: 0,
    distanceFromCenter: 0,
    sector: 1,
    checkpointsPassed: 0,
  });

  const aiCarsRef = useRef<AIState[]>([]);
  const currentLapSamplesRef = useRef<GhostSample[]>([]);
  const telemetryHistoryRef = useRef<TelemetrySample[]>([]);
  const lapResultsHistoryRef = useRef<LapResult[]>([]);
  const overtakesCounterRef = useRef<number>(0);
  const topSpeedCounterRef = useRef<number>(0);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('apex_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('apex_points', points.toString());
  }, [points]);

  useEffect(() => {
    localStorage.setItem('apex_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  useEffect(() => {
    localStorage.setItem('apex_customization', JSON.stringify(customization));
  }, [customization]);

  useEffect(() => {
    localStorage.setItem('apex_standings', JSON.stringify(standings));
  }, [standings]);

  useEffect(() => {
    localStorage.setItem('apex_ghosts', JSON.stringify(ghostLaps));
  }, [ghostLaps]);

  // Global Keydown Listeners (Controls, Spacebar Pause, Secret 2411 Dev Menu)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Secret dev menu code buffer tracking ("2411")
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        keySequenceRef.current += e.key;
        if (keySequenceRef.current.length > 4) {
          keySequenceRef.current = keySequenceRef.current.slice(-4);
        }
        if (keySequenceRef.current === '2411') {
          sound.playDevCheatSound();
          setShowDevMenu(true);
          setIsPaused(true);
          keySequenceRef.current = '';
        }
      }

      // 2. Spacebar Pause Toggle (Prompt requirement: "make it so it pauses when you click space bar")
      if (e.code === 'Space' && currentScreen === 'in_race') {
        e.preventDefault();
        setIsPaused(prev => !prev);
        return;
      }

      // In-game driving controls
      if (currentScreen === 'in_race' && !isPaused) {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') keysPressedRef.current.forward = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') keysPressedRef.current.backward = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysPressedRef.current.left = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keysPressedRef.current.right = true;
        if (e.code === 'KeyE') keysPressedRef.current.ers = true;
        if (e.code === 'KeyF') keysPressedRef.current.drsTogglePending = true;

        if (e.code === 'KeyC') {
          // Cycle camera
          setCameraMode(prev => {
            const views: CameraView[] = ['chase', 'cockpit', 'nose', 'tv', 'topdown'];
            const nextIdx = (views.indexOf(prev) + 1) % views.length;
            const nextMode = views[nextIdx];
            if (sceneRendererRef.current) sceneRendererRef.current.setCameraMode(nextMode);
            return nextMode;
          });
        }

        if (e.code === 'KeyR') {
          // Quick track reset if spun out
          if (trackSplineRef.current) {
            const trackPt = trackSplineRef.current.getPointAt(playerPhysicsRef.current.trackFraction);
            const tangent = trackSplineRef.current.getTangentAt(playerPhysicsRef.current.trackFraction);
            playerPhysicsRef.current.x = trackPt.x;
            playerPhysicsRef.current.z = trackPt.z;
            playerPhysicsRef.current.yaw = Math.atan2(tangent.x, tangent.z);
            playerPhysicsRef.current.speedMs = 15;
            playerPhysicsRef.current.speedKmh = 54;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keysPressedRef.current.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keysPressedRef.current.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysPressedRef.current.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keysPressedRef.current.right = false;
      if (e.code === 'KeyE') keysPressedRef.current.ers = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentScreen, isPaused]);

  // Start Race Session
  const handleStartSession = (config: {
    track: TrackData;
    session: WeekendSession;
    weather: WeatherCondition;
    tireCompound: TireCompound;
  }) => {
    setSelectedTrack(config.track);
    setSession(config.session);
    setWeather(config.weather);
    setTireCompound(config.tireCompound);
    setCurrentScreen('in_race');
    setIsPaused(false);

    // Reset runtime states
    setCurrentLap(1);
    setLapTimeMs(0);
    setLastLapMs(0);
    setGhostDeltaMs(null);
    currentLapSamplesRef.current = [];
    telemetryHistoryRef.current = [];
    lapResultsHistoryRef.current = [];
    overtakesCounterRef.current = 0;
    topSpeedCounterRef.current = 0;

    const existingGhost = ghostLaps[config.track.id];
    setBestLapMs(existingGhost ? existingGhost.lapTimeMs : 0);

    // Initial starting grid positions
    const spline = new TrackSpline(config.track);
    trackSplineRef.current = spline;

    // Player starts on pole or grid slot facing forward along track
    const playerGridFraction = config.session === 'race' ? 0.985 : 0.0;
    const startPoint = spline.getPointAt(playerGridFraction);
    const startTangent = spline.getTangentAt(playerGridFraction);
    const startYaw = Math.atan2(startTangent.x, startTangent.z);

    playerPhysicsRef.current = {
      x: startPoint.x,
      z: startPoint.z,
      y: startPoint.y,
      yaw: startYaw,
      speedMs: 0,
      speedKmh: 0,
      steerAngle: 0,
      angularVelocity: 0,
      throttle: 0,
      brake: 0,
      gear: 1,
      rpm: 4200,
      drsActive: false,
      ersCharge: 100,
      ersBoosting: false,
      tireWear: 0,
      tireTemp: 85,
      slipAmount: 0,
      isOnTarmac: true,
      isOnKerb: false,
      isOffTrack: false,
      lapValid: true,
      trackFraction: playerGridFraction,
      distanceFromCenter: 0,
      sector: 1,
      checkpointsPassed: 0,
    };

    // AI Grid
    aiCarsRef.current = initializeAIGrid(spline, 7, config.weather);

    // Starting lights countdown (5 lights then lights out!)
    if (config.session === 'race') {
      setStartLightsCount(0);
      let count = 0;
      const lightInterval = setInterval(() => {
        count++;
        if (count <= 5) {
          setStartLightsCount(count);
          sound.playStartLightBeep(false);
        } else {
          clearInterval(lightInterval);
          setTimeout(() => {
            setStartLightsCount(-1);
            sound.playStartLightBeep(true);
            raceStartTimeRef.current = Date.now();
            lapStartTimeRef.current = Date.now();
          }, 800 + Math.random() * 800);
        }
      }, 750);
    } else {
      setStartLightsCount(-1);
      raceStartTimeRef.current = Date.now();
      lapStartTimeRef.current = Date.now();
    }

    sound.startEngine();
  };

  // Initialize 3D Scene when Entering Race
  useEffect(() => {
    if (currentScreen !== 'in_race' || !canvasContainerRef.current || !trackSplineRef.current) return;

    const renderer = new SceneRenderer(
      canvasContainerRef.current,
      trackSplineRef.current,
      customization
    );
    sceneRendererRef.current = renderer;
    renderer.setWeather(weather);
    renderer.setCameraMode(cameraMode);
    renderer.setWireframe(cheats.wireframeMode);

    lastTimeRef.current = performance.now();

    // Main Game Loop
    const gameLoop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const trackSpline = trackSplineRef.current;
      if (!isPaused && trackSpline) {
        const lightsHolding = startLightsCount >= 0;

        // Player Controls Input (Free WASD and Arrow Keys, NO AUTO-STEERING)
        const inputs = {
          throttle: lightsHolding ? 0 : keysPressedRef.current.forward ? 1.0 : 0,
          brake: keysPressedRef.current.backward ? 1.0 : 0,
          steerLeft: keysPressedRef.current.left,
          steerRight: keysPressedRef.current.right,
          ersBoost: keysPressedRef.current.ers,
          drsToggle: keysPressedRef.current.drsTogglePending,
        };
        keysPressedRef.current.drsTogglePending = false;

        // Instant Win Cheat check
        if (cheats.instantWinTrigger) {
          setCheats(c => ({ ...c, instantWinTrigger: false }));
          playerPhysicsRef.current.trackFraction = 0.999;
          handleFinishRace();
          return;
        }

        // Update Vehicle Physics
        const oldFraction = playerPhysicsRef.current.trackFraction;

        const physResult = updateFreeCarPhysics(
          playerPhysicsRef.current,
          inputs,
          trackSpline,
          tireCompound,
          weather,
          upgrades,
          cheats,
          dt
        );
        playerPhysicsRef.current = physResult.state;

        // Sound triggers
        if (physResult.shiftSound) sound.playGearShift();
        if (physResult.kerbSound) sound.playKerbClack();
        if (physResult.drsChirp !== null) sound.playDrsChirp(physResult.drsChirp);

        sound.updateTelemetry({
          rpm: physResult.state.rpm,
          speedKmh: physResult.state.speedKmh,
          throttle: inputs.throttle,
          brake: inputs.brake,
          tireSlip: physResult.state.slipAmount,
          onKerb: physResult.state.isOnKerb,
          rainIntensity: weather === 'torrential' ? 1.0 : weather === 'wet' ? 0.7 : weather === 'drizzle' ? 0.3 : 0,
        });

        // Top speed tracking
        if (physResult.state.speedKmh > topSpeedCounterRef.current) {
          topSpeedCounterRef.current = physResult.state.speedKmh;
        }

        // DRS status in HUD
        const drsInfo = trackSpline.isInsideDRSZone(physResult.state.trackFraction);
        setDrsAvailable(drsInfo.available || cheats.alwaysDrs);

        // Update AI Simulation
        aiCarsRef.current = updateAISimulation(
          aiCarsRef.current,
          trackSpline,
          weather,
          physResult.state.trackFraction,
          physResult.state.distanceFromCenter,
          physResult.state.speedKmh,
          dt,
          cheats.freezeAi
        );

        // Lap Times & Lap Transition Check
        const now = Date.now();
        if (!lightsHolding) {
          const currentLapDuration = now - lapStartTimeRef.current;
          setLapTimeMs(currentLapDuration);

          // Track checkpoints passed during lap to prevent cheating / driving backward
          if (physResult.state.trackFraction > 0.45 && physResult.state.trackFraction < 0.6) {
            playerPhysicsRef.current.checkpointsPassed |= 1;
          }

          // Sample Ghost Data
          const ghostSample: GhostSample = {
            timeMs: currentLapDuration,
            fraction: physResult.state.trackFraction,
            x: physResult.state.x,
            y: physResult.state.y,
            z: physResult.state.z,
            rotY: physResult.state.yaw,
            speedKmh: physResult.state.speedKmh,
            drs: physResult.state.drsActive,
            throttle: inputs.throttle,
            brake: inputs.brake,
            gear: physResult.state.gear,
          };
          currentLapSamplesRef.current.push(ghostSample);
          telemetryHistoryRef.current.push(physResult.telemetry);

          // Lap completed check (wrapped across start/finish line after completing circuit)
          const passedHalfway = (playerPhysicsRef.current.checkpointsPassed & 1) === 1;
          if (oldFraction > 0.88 && physResult.state.trackFraction < 0.12 && passedHalfway) {
            const completedLapTime = currentLapDuration;
            setLastLapMs(completedLapTime);

            const isNewPb = bestLapMs === 0 || completedLapTime < bestLapMs;
            if (isNewPb && playerPhysicsRef.current.lapValid) {
              setBestLapMs(completedLapTime);
              // Save New Personal Best Ghost!
              const newGhost: GhostData = {
                trackId: selectedTrack.id,
                lapTimeMs: completedLapTime,
                date: new Date().toISOString(),
                compound: tireCompound,
                samples: [...currentLapSamplesRef.current],
              };
              setGhostLaps(prev => ({ ...prev, [selectedTrack.id]: newGhost }));
            }

            lapResultsHistoryRef.current.push({
              lapNumber: currentLap,
              totalTimeMs: completedLapTime,
              s1TimeMs: Math.round(completedLapTime * selectedTrack.sectors.s1),
              s2TimeMs: Math.round(completedLapTime * (selectedTrack.sectors.s2 - selectedTrack.sectors.s1)),
              s3TimeMs: Math.round(completedLapTime * (1.0 - selectedTrack.sectors.s2)),
              valid: playerPhysicsRef.current.lapValid,
              isPersonalBest: isNewPb,
            });

            // Advance lap
            currentLapSamplesRef.current = [];
            playerPhysicsRef.current.lapValid = true;
            playerPhysicsRef.current.checkpointsPassed = 0;
            lapStartTimeRef.current = now;

            if (session === 'race' && currentLap >= selectedTrack.lapsCount) {
              handleFinishRace();
              return;
            } else {
              setCurrentLap(prev => prev + 1);
            }
          }

          // Ghost Delta Comparison
          const currentGhost = ghostLaps[selectedTrack.id];
          if (currentGhost && currentGhost.samples.length > 0) {
            const closestSample = currentGhost.samples.find(
              s => Math.abs(s.fraction - physResult.state.trackFraction) < 0.015
            );
            if (closestSample) {
              const delta = currentLapDuration - closestSample.timeMs;
              setGhostDeltaMs(delta);
            }
          }
        }

        // Build Live Classification
        const allParticipants: RaceParticipant[] = [
          {
            id: 'p24',
            name: `${customization.driverName} (#24)`,
            number: 24,
            team: 'Apex Racing Team',
            color: customization.accentColor,
            isPlayer: true,
            gridPosition: 1,
            currentPosition: 1,
            fraction: physResult.state.trackFraction,
            lateralOffset: physResult.state.distanceFromCenter,
            speedKmh: physResult.state.speedKmh,
            currentLap,
            lastLapMs,
            bestLapMs,
            gapToLeaderMs: 0,
            gapToAheadMs: 0,
            tireCompound,
            tireWear: physResult.state.tireWear,
            ersCharge: physResult.state.ersCharge,
            drsActive: physResult.state.drsActive,
            finished: false,
            finishTimeMs: 0,
            laps: lapResultsHistoryRef.current,
          },
          ...aiCarsRef.current.map((ai, index) => ({
            id: ai.id,
            name: ai.config.name,
            number: ai.config.number,
            team: ai.config.team,
            color: ai.config.color,
            isPlayer: false,
            gridPosition: index + 2,
            currentPosition: index + 2,
            fraction: ai.fraction,
            lateralOffset: ai.lateralOffset,
            speedKmh: ai.speedKmh,
            currentLap: ai.lap,
            lastLapMs: ai.lastLapMs,
            bestLapMs: ai.bestLapMs,
            gapToLeaderMs: 0,
            gapToAheadMs: 0,
            tireCompound: ai.tireCompound,
            tireWear: ai.tireWear,
            ersCharge: 80,
            drsActive: ai.drsActive,
            finished: ai.finished,
            finishTimeMs: ai.finishTimeMs,
            laps: [],
          })),
        ];

        setParticipants(allParticipants);

        // Find current ghost position to render in 3D
        const ghostRecord = ghostLaps[selectedTrack.id];
        let ghostSampleToRender: GhostSample | null = null;
        if (ghostRecord && ghostRecord.samples.length > 0) {
          const currentLapTime = Date.now() - lapStartTimeRef.current;
          ghostSampleToRender =
            ghostRecord.samples.find(s => s.timeMs >= currentLapTime) ||
            ghostRecord.samples[ghostRecord.samples.length - 1];
        }

        // Render 3D Scene
        renderer.update(
          physResult.state,
          aiCarsRef.current,
          ghostSampleToRender,
          weather,
          dt
        );
      }

      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      sound.stopEngine();
      renderer.dispose();
      sceneRendererRef.current = null;
    };
  }, [currentScreen, selectedTrack, session, weather, tireCompound, isPaused, startLightsCount]);

  // Race Finish Handler
  const handleFinishRace = useCallback(() => {
    sound.stopEngine();

    // Sort final participants by laps and fraction
    const sorted = [
      {
        id: 'p24',
        name: customization.driverName,
        number: 24,
        team: 'Apex Racing Team',
        color: customization.accentColor,
        isPlayer: true,
        fraction: playerPhysicsRef.current.trackFraction,
        currentLap,
        bestLapMs,
      },
      ...aiCarsRef.current.map(ai => ({
        id: ai.id,
        name: ai.config.name,
        number: ai.config.number,
        team: ai.config.team,
        color: ai.config.color,
        isPlayer: false,
        fraction: ai.fraction,
        currentLap: ai.lap,
        bestLapMs: ai.bestLapMs,
      })),
    ].sort((a, b) => {
      if (a.currentLap !== b.currentLap) return b.currentLap - a.currentLap;
      return b.fraction - a.fraction;
    });

    const playerPos = sorted.findIndex(p => p.isPlayer) + 1;

    // F1 Points: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1
    const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    const pointsAwarded = session === 'race' ? pointsTable[playerPos - 1] || 0 : 0;

    // Credits reward: Winning gives big purse!
    let creditsAwarded = 2000;
    if (session === 'race') {
      if (playerPos === 1) creditsAwarded = 15000;
      else if (playerPos === 2) creditsAwarded = 10000;
      else if (playerPos === 3) creditsAwarded = 7500;
      else if (playerPos <= 6) creditsAwarded = 4500;
    } else if (session === 'qualifying') {
      creditsAwarded = playerPos === 1 ? 5000 : 2500;
    }

    setCredits(c => c + creditsAwarded);
    setPoints(p => p + pointsAwarded);

    // Update Championship Standings
    if (session === 'race') {
      setStandings(prev =>
        prev.map(driver => {
          const finishedIndex = sorted.findIndex(p => p.id === driver.id);
          const pts = finishedIndex >= 0 ? pointsTable[finishedIndex] || 0 : 0;
          return {
            ...driver,
            points: driver.points + pts,
            wins: driver.wins + (finishedIndex === 0 ? 1 : 0),
            podiums: driver.podiums + (finishedIndex >= 0 && finishedIndex < 3 ? 1 : 0),
          };
        })
      );
    }

    const report: PostRaceReport = {
      trackId: selectedTrack.id,
      session,
      finalPosition: playerPos,
      totalParticipants: sorted.length,
      bestLapMs: bestLapMs || 84200,
      totalRaceTimeMs: Date.now() - raceStartTimeRef.current,
      lapsCompleted: currentLap,
      overtakes: overtakesCounterRef.current,
      topSpeedKmh: topSpeedCounterRef.current || 312,
      pointsEarned: pointsAwarded,
      creditsEarned: creditsAwarded,
      telemetryHistory: [...telemetryHistoryRef.current],
      lapHistory: [...lapResultsHistoryRef.current],
      participants: participants.length > 0 ? participants : (sorted as unknown as RaceParticipant[]),
      weather,
      startingGridPos: session === 'race' ? 1 : 1,
    };

    setPostRaceReport(report);
    setCurrentScreen('post_race');
  }, [
    session,
    currentLap,
    bestLapMs,
    selectedTrack,
    customization,
    participants,
    weather,
  ]);

  // Cheats Trigger Handler
  const handleToggleCheat = <K extends keyof DevCheats>(key: K) => {
    setCheats(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      if (key === 'wireframeMode' && sceneRendererRef.current) {
        sceneRendererRef.current.setWireframe(updated.wireframeMode);
      }
      return updated;
    });
  };

  const handleTriggerInstantWin = () => {
    setShowDevMenu(false);
    setIsPaused(false);
    setCheats(c => ({ ...c, instantWinTrigger: true }));
  };

  const handleAddCredits = (amount: number) => {
    setCredits(c => c + amount);
    sound.playDevCheatSound();
  };

  const handleChangeWeatherCheat = (newWeather: WeatherCondition) => {
    setWeather(newWeather);
    if (sceneRendererRef.current) {
      sceneRendererRef.current.setWeather(newWeather);
    }
  };

  // Garage Upgrades Purchase Handler
  const handlePurchaseUpgrade = (key: keyof CarUpgrades, cost: number) => {
    if (credits < cost) return;
    setCredits(c => c - cost);
    setUpgrades(u => ({ ...u, [key]: Math.min(5, u[key] + 1) }));
    sound.playDevCheatSound();
  };

  return (
    <div className="relative w-screen h-screen bg-zinc-950 overflow-hidden font-sans select-none">
      {/* 1. PASSWORD LOCK SCREEN */}
      {currentScreen === 'locked' && (
        <LockScreen
          onUnlock={() => {
            sound.playDevCheatSound();
            setCurrentScreen('track_select');
          }}
        />
      )}

      {/* 2. TRACK SELECTOR / CHAMPIONSHIP HUB */}
      {currentScreen === 'track_select' && (
        <TrackSelect
          onSelectTrack={handleStartSession}
          ghostLaps={ghostLaps}
          userCredits={credits}
          userPoints={points}
          customization={customization}
          onOpenGarage={() => setCurrentScreen('garage')}
          onOpenStandings={() => setCurrentScreen('standings')}
          onOpenGhostReplay={(trackId) => setCurrentScreen('ghost_replay')}
          onLockOut={() => setCurrentScreen('locked')}
        />
      )}

      {/* 3. IN-RACE 3D CANVAS & BROADCAST HUD */}
      {currentScreen === 'in_race' && (
        <div className="relative w-full h-full">
          {/* 3D WebGL Canvas Container */}
          <div ref={canvasContainerRef} className="w-full h-full" />

          {/* Broadcast TV Telemetry HUD */}
          <RaceHUD
            playerState={playerPhysicsRef.current}
            track={selectedTrack}
            session={session}
            weather={weather}
            tireCompound={tireCompound}
            currentLap={currentLap}
            totalLaps={selectedTrack.lapsCount}
            lapTimeMs={lapTimeMs}
            lastLapMs={lastLapMs}
            bestLapMs={bestLapMs}
            ghostDeltaMs={ghostDeltaMs}
            participants={participants}
            cameraMode={cameraMode}
            onToggleCamera={() => {
              setCameraMode(prev => {
                const views: CameraView[] = ['chase', 'cockpit', 'nose', 'tv', 'topdown'];
                const nextIdx = (views.indexOf(prev) + 1) % views.length;
                const nextMode = views[nextIdx];
                if (sceneRendererRef.current) sceneRendererRef.current.setCameraMode(nextMode);
                return nextMode;
              });
            }}
            onToggleMute={() => {
              const muted = sound.toggleMute();
              setIsMuted(muted);
            }}
            isMuted={isMuted}
            startLightsCount={startLightsCount}
            onOpenPause={() => setIsPaused(true)}
            drsZoneAvailable={drsAvailable}
          />

          {/* Spacebar Pause Modal */}
          {isPaused && !showDevMenu && (
            <PauseModal
              onResume={() => setIsPaused(false)}
              onRestart={() => {
                setIsPaused(false);
                handleStartSession({
                  track: selectedTrack,
                  session,
                  weather,
                  tireCompound,
                });
              }}
              onExitToMenu={() => {
                sound.stopEngine();
                setCurrentScreen('track_select');
              }}
              session={session}
              trackName={selectedTrack.name}
              isMuted={isMuted}
              onToggleMute={() => {
                const muted = sound.toggleMute();
                setIsMuted(muted);
              }}
              cameraMode={cameraMode}
              onCycleCamera={() => {
                setCameraMode(prev => {
                  const views: CameraView[] = ['chase', 'cockpit', 'nose', 'tv', 'topdown'];
                  const nextIdx = (views.indexOf(prev) + 1) % views.length;
                  const nextMode = views[nextIdx];
                  if (sceneRendererRef.current) sceneRendererRef.current.setCameraMode(nextMode);
                  return nextMode;
                });
              }}
              onOpenDevMenu={() => setShowDevMenu(true)}
            />
          )}

          {/* Secret Dev Cheat Menu (Activated with code 2411) */}
          {showDevMenu && (
            <DevMenuModal
              cheats={cheats}
              onToggleCheat={handleToggleCheat}
              onTriggerInstantWin={handleTriggerInstantWin}
              onAddCredits={handleAddCredits}
              onChangeWeather={handleChangeWeatherCheat}
              onClose={() => {
                setShowDevMenu(false);
                setIsPaused(false);
              }}
            />
          )}
        </div>
      )}

      {/* 4. POST-RACE COMPREHENSIVE ANALYTICS */}
      {currentScreen === 'post_race' && postRaceReport && (
        <PostRaceAnalytics
          report={postRaceReport}
          track={selectedTrack}
          onNextRace={() => setCurrentScreen('track_select')}
          onRestart={() =>
            handleStartSession({
              track: selectedTrack,
              session,
              weather,
              tireCompound,
            })
          }
          onOpenGarage={() => setCurrentScreen('garage')}
          onOpenGhostReplay={() => setCurrentScreen('ghost_replay')}
        />
      )}

      {/* 5. GARAGE & R&D CUSTOMIZER */}
      {currentScreen === 'garage' && (
        <GarageCustomizer
          customization={customization}
          upgrades={upgrades}
          userCredits={credits}
          onUpdateCustomization={setCustomization}
          onPurchaseUpgrade={handlePurchaseUpgrade}
          onBack={() => setCurrentScreen('track_select')}
        />
      )}

      {/* 6. CAREER DRIVERS CHAMPIONSHIP STANDINGS */}
      {currentScreen === 'standings' && (
        <CareerStandings
          standings={standings}
          onBack={() => setCurrentScreen('track_select')}
        />
      )}

      {/* 7. GHOST REPLAY VIEWER & EXPORTER */}
      {currentScreen === 'ghost_replay' && (
        <GhostReplayModal
          ghostLaps={ghostLaps}
          initialTrackId={selectedTrack.id}
          onBack={() => setCurrentScreen('track_select')}
          onClearGhost={(trackId) => {
            setGhostLaps(prev => {
              const updated = { ...prev };
              delete updated[trackId];
              return updated;
            });
          }}
        />
      )}
    </div>
  );
}
