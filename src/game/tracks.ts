import { TrackData } from '../types/game';

export const TRACKS: TrackData[] = [
  {
    id: 'monza',
    name: 'Autodromo Nazionale Monza',
    country: 'Italy',
    flag: '🇮🇹',
    lengthKm: 5.793,
    lapsCount: 3,
    lapRecord: '1:21.046',
    lapRecordHolder: 'Rubens Barrichello',
    turnsCount: 11,
    description: 'The Temple of Speed. Long blistering straights leading into brutal heavy braking chicanes.',
    width: 14,
    elevationVariation: 6,
    sectors: { s1: 0.31, s2: 0.68 },
    drsZones: [
      {
        id: 'monza_main',
        name: 'Main Straight',
        detectionFraction: 0.88,
        startFraction: 0.94,
        endFraction: 0.12,
      },
      {
        id: 'monza_serraglio',
        name: 'Curva Grande to Roggia',
        detectionFraction: 0.22,
        startFraction: 0.28,
        endFraction: 0.42,
      },
    ],
    keyTurns: [
      { name: 'Variante del Rettifilo', fraction: 0.13 },
      { name: 'Curva Grande', fraction: 0.24 },
      { name: 'Variante della Roggia', fraction: 0.44 },
      { name: 'Curve di Lesmo', fraction: 0.56 },
      { name: 'Variante Ascari', fraction: 0.76 },
      { name: 'Curva Parabolica', fraction: 0.91 },
    ],
    basePoints: [
      // Main straight
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 450 },
      { x: 0, y: 0, z: 750 },
      // Turn 1 & 2 Rettifilo Chicane
      { x: 25, y: 0, z: 820 },
      { x: -10, y: 0, z: 860 },
      { x: 10, y: 0, z: 910 },
      // Curva Grande sweeping right
      { x: 80, y: 1, z: 1050 },
      { x: 180, y: 2, z: 1200 },
      { x: 260, y: 2, z: 1350 },
      // Straight to Variante della Roggia
      { x: 270, y: 2, z: 1550 },
      // Roggia Chicane
      { x: 230, y: 1, z: 1620 },
      { x: 260, y: 1, z: 1670 },
      // Lesmo 1 & 2
      { x: 330, y: 0, z: 1720 },
      { x: 420, y: -2, z: 1700 },
      { x: 470, y: -3, z: 1620 },
      { x: 460, y: -4, z: 1510 },
      // Serraglio curve & under old banking bridge
      { x: 410, y: -2, z: 1300 },
      { x: 360, y: -1, z: 1050 },
      { x: 340, y: 0, z: 800 },
      // Variante Ascari
      { x: 310, y: 1, z: 680 },
      { x: 370, y: 1, z: 610 },
      { x: 320, y: 1, z: 530 },
      // Back straight
      { x: 310, y: 0, z: 350 },
      { x: 310, y: 0, z: 120 },
      // Parabolica (Curva Alboreto) sweeping left then right to finish
      { x: 280, y: 0, z: -30 },
      { x: 180, y: 0, z: -100 },
      { x: 70, y: 0, z: -60 },
    ],
  },
  {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    country: 'United Kingdom',
    flag: '🇬🇧',
    lengthKm: 5.891,
    lapsCount: 3,
    lapRecord: '1:27.097',
    lapRecordHolder: 'Max Verstappen',
    turnsCount: 18,
    description: 'Home of British motorsport. Iconic high-speed flowing complexes: Copse, Maggotts, Becketts, and Chapel.',
    width: 14,
    elevationVariation: 5,
    sectors: { s1: 0.33, s2: 0.65 },
    drsZones: [
      {
        id: 'silv_wellington',
        name: 'Wellington Straight',
        detectionFraction: 0.18,
        startFraction: 0.22,
        endFraction: 0.34,
      },
      {
        id: 'silv_hangar',
        name: 'Hangar Straight',
        detectionFraction: 0.63,
        startFraction: 0.68,
        endFraction: 0.81,
      },
    ],
    keyTurns: [
      { name: 'Abbey & Farm', fraction: 0.08 },
      { name: 'Village & The Loop', fraction: 0.17 },
      { name: 'Brooklands & Luffield', fraction: 0.36 },
      { name: 'Copse Corner', fraction: 0.50 },
      { name: 'Maggotts & Becketts', fraction: 0.59 },
      { name: 'Stowe Corner', fraction: 0.83 },
      { name: 'Vale & Club', fraction: 0.94 },
    ],
    basePoints: [
      { x: 0, y: 0, z: 0 },
      // Abbey & Farm curve
      { x: 120, y: 1, z: 140 },
      { x: 230, y: 1, z: 190 },
      // Village & The Loop hairpin
      { x: 280, y: 0, z: 140 },
      { x: 220, y: 0, z: 70 },
      { x: 140, y: 0, z: 100 },
      // Wellington straight
      { x: 20, y: 0, z: 240 },
      { x: -140, y: 0, z: 420 },
      // Brooklands & Luffield sweeping loop
      { x: -240, y: 1, z: 500 },
      { x: -320, y: 1, z: 450 },
      { x: -280, y: 1, z: 350 },
      { x: -180, y: 0, z: 330 },
      // Woodcote to National Pit Straight
      { x: -110, y: 0, z: 230 },
      { x: -110, y: 0, z: 30 },
      // Copse corner (ultra high speed right hander)
      { x: -90, y: 0, z: -110 },
      { x: -20, y: 0, z: -190 },
      // Maggotts, Becketts & Chapel S-complex
      { x: 80, y: 1, z: -250 },
      { x: 150, y: 2, z: -320 },
      { x: 100, y: 2, z: -400 },
      { x: 170, y: 1, z: -480 },
      // Hangar straight
      { x: 270, y: 0, z: -580 },
      { x: 420, y: 0, z: -720 },
      // Stowe corner
      { x: 490, y: 0, z: -700 },
      { x: 470, y: 0, z: -590 },
      // Vale chicane & Club
      { x: 390, y: 0, z: -430 },
      { x: 330, y: 0, z: -360 },
      { x: 260, y: 0, z: -290 },
      { x: 140, y: 0, z: -160 },
    ],
  },
  {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    country: 'Belgium',
    flag: '🇧🇪',
    lengthKm: 7.004,
    lapsCount: 3,
    lapRecord: '1:46.286',
    lapRecordHolder: 'Valtteri Bottas',
    turnsCount: 19,
    description: 'Ardennes rollercoaster. Eau Rouge uphill compression, Kemmel Straight slipstreams, and the treacherous Pouhon double-apex.',
    width: 14,
    elevationVariation: 16,
    sectors: { s1: 0.32, s2: 0.69 },
    drsZones: [
      {
        id: 'spa_kemmel',
        name: 'Kemmel Straight',
        detectionFraction: 0.14,
        startFraction: 0.19,
        endFraction: 0.33,
      },
      {
        id: 'spa_finish',
        name: 'Blanchimont to Bus Stop',
        detectionFraction: 0.86,
        startFraction: 0.90,
        endFraction: 0.97,
      },
    ],
    keyTurns: [
      { name: 'La Source Hairpin', fraction: 0.08 },
      { name: 'Eau Rouge & Raidillon', fraction: 0.16 },
      { name: 'Les Combes Chicane', fraction: 0.35 },
      { name: 'Bruxelles Hairpin', fraction: 0.46 },
      { name: 'Double Gauche Pouhon', fraction: 0.58 },
      { name: 'Courbe Paul Frère', fraction: 0.72 },
      { name: 'Blanchimont Flat Out', fraction: 0.85 },
      { name: 'Bus Stop Chicane', fraction: 0.94 },
    ],
    basePoints: [
      { x: 0, y: 0, z: 0 },
      // La Source Hairpin
      { x: 50, y: 0, z: 80 },
      { x: 90, y: 0, z: 40 },
      { x: 60, y: 0, z: -10 },
      // Downhill run to Eau Rouge
      { x: 40, y: -5, z: -150 },
      { x: 30, y: -10, z: -320 },
      // Eau Rouge bottom dip & Raidillon steep uphill blind crest
      { x: 10, y: -12, z: -430 },
      { x: 35, y: -2, z: -530 },
      { x: 15, y: 14, z: -630 },
      // Kemmel Straight (high elevation plateau)
      { x: -30, y: 18, z: -850 },
      { x: -110, y: 19, z: -1200 },
      { x: -160, y: 18, z: -1450 },
      // Les Combes chicane & Malmedy
      { x: -190, y: 17, z: -1540 },
      { x: -240, y: 16, z: -1510 },
      { x: -220, y: 15, z: -1420 },
      // Bruxelles downhill hairpin
      { x: -160, y: 10, z: -1300 },
      { x: -110, y: 6, z: -1240 },
      { x: -140, y: 3, z: -1170 },
      // Speaker\'s Corner
      { x: -210, y: 0, z: -1110 },
      // Pouhon double-apex high speed left
      { x: -310, y: -4, z: -1020 },
      { x: -390, y: -6, z: -890 },
      { x: -360, y: -7, z: -760 },
      // Campus / Stavelot
      { x: -290, y: -8, z: -630 },
      { x: -210, y: -7, z: -550 },
      { x: -140, y: -6, z: -480 },
      // Blanchimont flat out sweepers
      { x: -80, y: -4, z: -360 },
      { x: -50, y: -2, z: -210 },
      // Bus Stop Chicane
      { x: -65, y: 0, z: -90 },
      { x: -25, y: 0, z: -50 },
    ],
  },
  {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monaco',
    flag: '🇲🇨',
    lengthKm: 3.337,
    lapsCount: 4,
    lapRecord: '1:12.909',
    lapRecordHolder: 'Lewis Hamilton',
    turnsCount: 19,
    description: 'Jewel in the crown. Razor-thin barriers, Grand Hotel hairpin, dark tunnel blast, and the Swimming Pool chicane.',
    width: 10,
    elevationVariation: 8,
    sectors: { s1: 0.30, s2: 0.67 },
    drsZones: [
      {
        id: 'monaco_pit',
        name: 'Pit Straight',
        detectionFraction: 0.90,
        startFraction: 0.96,
        endFraction: 0.08,
      },
    ],
    keyTurns: [
      { name: 'Sainte Dévote', fraction: 0.12 },
      { name: 'Beau Rivage & Massenet', fraction: 0.23 },
      { name: 'Casino Square', fraction: 0.31 },
      { name: 'Mirabeau Haute', fraction: 0.39 },
      { name: 'Grand Hotel Hairpin', fraction: 0.46 },
      { name: 'The Tunnel', fraction: 0.60 },
      { name: 'Nouvelle Chicane', fraction: 0.69 },
      { name: 'Tabac & Swimming Pool', fraction: 0.79 },
      { name: 'La Rascasse', fraction: 0.91 },
    ],
    basePoints: [
      { x: 0, y: 0, z: 0 },
      // Sainte Dévote right hander
      { x: 10, y: 0, z: 120 },
      { x: 60, y: 1, z: 170 },
      // Beau Rivage uphill run
      { x: 120, y: 5, z: 230 },
      { x: 190, y: 9, z: 310 },
      // Massenet left hander
      { x: 230, y: 11, z: 390 },
      { x: 210, y: 11, z: 450 },
      // Casino Square
      { x: 160, y: 10, z: 470 },
      { x: 120, y: 9, z: 440 },
      // Mirabeau Haute & downhill to hairpin
      { x: 80, y: 6, z: 410 },
      { x: 50, y: 4, z: 440 },
      // Grand Hotel Hairpin (slowest corner on calendar, 45 km/h)
      { x: 15, y: 2, z: 445 },
      { x: 20, y: 1, z: 415 },
      // Mirabeau Bas & Portier
      { x: 60, y: 0, z: 360 },
      { x: 100, y: -1, z: 320 },
      { x: 120, y: -2, z: 270 },
      // The Tunnel high-speed blast
      { x: 105, y: -2, z: 160 },
      { x: 75, y: -2, z: 40 },
      // Nouvelle Chicane exit from tunnel
      { x: 50, y: 0, z: -40 },
      { x: 25, y: 0, z: -60 },
      // Tabac
      { x: -20, y: 0, z: -120 },
      // Swimming Pool complex chicane 1 & 2
      { x: -50, y: 0, z: -170 },
      { x: -80, y: 0, z: -140 },
      { x: -110, y: 0, z: -80 },
      // La Rascasse & Antony Noghès
      { x: -90, y: 0, z: -10 },
      { x: -40, y: 0, z: 10 },
    ],
  },
  {
    id: 'suzuka',
    name: 'Suzuka International Racing Course',
    country: 'Japan',
    flag: '🇯🇵',
    lengthKm: 5.807,
    lapsCount: 3,
    lapRecord: '1:30.983',
    lapRecordHolder: 'Lewis Hamilton',
    turnsCount: 18,
    description: 'Figure-eight masterpiece. The technical rhythm S-Curves, tricky Degner corners, and the terrifying 130R flat-out kink.',
    width: 13,
    elevationVariation: 12,
    sectors: { s1: 0.35, s2: 0.70 },
    drsZones: [
      {
        id: 'suzuka_main',
        name: 'Main Straight',
        detectionFraction: 0.91,
        startFraction: 0.96,
        endFraction: 0.12,
      },
    ],
    keyTurns: [
      { name: 'First Curve & S-Curves', fraction: 0.15 },
      { name: 'Dunlop Curve', fraction: 0.28 },
      { name: 'Degner 1 & 2', fraction: 0.38 },
      { name: 'Hairpin', fraction: 0.52 },
      { name: 'Spoon Curve', fraction: 0.68 },
      { name: '130R Beast', fraction: 0.85 },
      { name: 'Casio Triangle Chicane', fraction: 0.93 },
    ],
    basePoints: [
      { x: 0, y: 0, z: 0 },
      // First curve
      { x: 40, y: 0, z: 160 },
      { x: 100, y: 1, z: 270 },
      // S-Curves series
      { x: 70, y: 3, z: 360 },
      { x: 120, y: 5, z: 450 },
      { x: 80, y: 7, z: 540 },
      { x: 130, y: 9, z: 620 },
      // Dunlop Curve uphill sweep
      { x: 80, y: 11, z: 720 },
      { x: 0, y: 12, z: 800 },
      // Degner 1 & Degner 2
      { x: -80, y: 11, z: 780 },
      { x: -130, y: 9, z: 730 },
      { x: -120, y: 7, z: 650 },
      // Under the crossover bridge to hairpin
      { x: -80, y: 4, z: 530 },
      { x: -120, y: 1, z: 420 },
      // Hairpin
      { x: -180, y: 0, z: 380 },
      { x: -210, y: 0, z: 430 },
      { x: -180, y: 1, z: 490 },
      // 200R sweep
      { x: -220, y: 3, z: 620 },
      { x: -280, y: 5, z: 740 },
      // Spoon Curve double left
      { x: -350, y: 6, z: 860 },
      { x: -410, y: 5, z: 820 },
      { x: -390, y: 4, z: 720 },
      // Back straight & Over the Crossover Bridge (y = 8 above ground track!)
      { x: -320, y: 5, z: 560 },
      { x: -200, y: 7, z: 380 },
      { x: -80, y: 8, z: 220 },
      // 130R high speed monster
      { x: -30, y: 5, z: 70 },
      // Casio Triangle Chicane
      { x: -45, y: 2, z: -40 },
      { x: -15, y: 0, z: -60 },
    ],
  },
  {
    id: 'interlagos',
    name: 'Autódromo José Carlos Pace (Interlagos)',
    country: 'Brazil',
    flag: '🇧🇷',
    lengthKm: 4.309,
    lapsCount: 4,
    lapRecord: '1:10.540',
    lapRecordHolder: 'Valtteri Bottas',
    turnsCount: 15,
    description: 'Atmospheric bowl of São Paulo. Anti-clockwise challenge: Senna S downhill plunge, Reta Oposta, and the long climbing drag to the line.',
    width: 14,
    elevationVariation: 14,
    sectors: { s1: 0.31, s2: 0.66 },
    drsZones: [
      {
        id: 'interlagos_main',
        name: 'Main Straight',
        detectionFraction: 0.88,
        startFraction: 0.94,
        endFraction: 0.10,
      },
      {
        id: 'interlagos_reta',
        name: 'Reta Oposta',
        detectionFraction: 0.18,
        startFraction: 0.22,
        endFraction: 0.36,
      },
    ],
    keyTurns: [
      { name: "Senna 'S' Turn 1 & 2", fraction: 0.12 },
      { name: 'Curva do Sol', fraction: 0.20 },
      { name: 'Descida do Lago', fraction: 0.38 },
      { name: 'Ferradura', fraction: 0.48 },
      { name: 'Pinheirinho', fraction: 0.60 },
      { name: 'Bico de Pato', fraction: 0.68 },
      { name: 'Mergulho & Junção', fraction: 0.81 },
      { name: 'Subida dos Boxes', fraction: 0.90 },
    ],
    basePoints: [
      { x: 0, y: 0, z: 0 },
      // Senna S Turn 1 & 2 steep downhill plunge
      { x: 10, y: -2, z: 120 },
      { x: 60, y: -8, z: 180 },
      { x: 110, y: -10, z: 140 },
      // Curva do Sol opening up
      { x: 140, y: -9, z: 60 },
      { x: 130, y: -8, z: -50 },
      // Reta Oposta back straight
      { x: 110, y: -7, z: -250 },
      { x: 90, y: -6, z: -480 },
      // Descida do Lago turns 4 & 5
      { x: 60, y: -5, z: -570 },
      { x: -10, y: -4, z: -540 },
      { x: -50, y: -3, z: -450 },
      // Ferradura high speed right hander
      { x: -90, y: -1, z: -350 },
      { x: -150, y: 1, z: -300 },
      { x: -180, y: 2, z: -210 },
      // Pinheirinho & Bico de Pato slow hairpins
      { x: -160, y: 3, z: -140 },
      { x: -195, y: 4, z: -80 },
      { x: -160, y: 5, z: -30 },
      // Mergulho downhill drop
      { x: -100, y: 2, z: -70 },
      // Junção left corner at the base of the hill
      { x: -80, y: 0, z: -150 },
      { x: -40, y: 2, z: -140 },
      // Subida dos Boxes long curving uphill full throttle blast
      { x: -20, y: 5, z: -90 },
      { x: -10, y: 8, z: -30 },
    ],
  },
];
