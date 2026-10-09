import * as THREE from 'three';
import { TrackSpline, FreeVehicleState } from './physics';
import { AIState } from './ai';
import { CameraView, CarCustomization, GhostSample, WeatherCondition } from '../types/game';

export class SceneRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private trackSpline: TrackSpline;

  // Car 3D meshes
  private playerCarGroup: THREE.Group;
  private playerFrontLeftWheelGroup: THREE.Group | null = null;
  private playerFrontRightWheelGroup: THREE.Group | null = null;
  private playerWheels: THREE.Mesh[] = [];
  private playerDrsFlap: THREE.Mesh | null = null;

  // AI car groups mapped by driver ID
  private aiCarGroups: Map<string, { group: THREE.Group; wheels: THREE.Mesh[]; drsFlap: THREE.Mesh | null }> = new Map();

  // Ghost car
  private ghostGroup: THREE.Group | null = null;

  // Weather particles
  private rainParticles: THREE.Points | null = null;

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  // Camera settings
  private cameraMode: CameraView = 'chase';
  private smoothedCamPos = new THREE.Vector3();
  private smoothedCamLook = new THREE.Vector3();

  // Wireframe cheat mode
  private isWireframe: boolean = false;

  constructor(container: HTMLElement, trackSpline: TrackSpline, customization: CarCustomization) {
    this.container = container;
    this.trackSpline = trackSpline;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Sky blue baseline
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.0012);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.2, 2800);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // Dynamic Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
    this.dirLight.position.set(150, 300, 150);
    this.scene.add(this.dirLight);

    // Build Authentic Grand Prix Track Environment
    this.buildGrandPrixTrackEnvironment();

    // Build Player F1 Car
    this.playerCarGroup = this.buildF1CarMesh(
      customization.primaryColor,
      customization.accentColor,
      customization.wheelRimColor,
      24,
      false,
      true
    );
    this.scene.add(this.playerCarGroup);

    this.setupRainSystem();

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * Builds an authentic race track with tarmac racing surface,
   * painted white track limits, red/white rumblestrip curbs,
   * green runoff strips, gravel beds, tyre barriers, and perimeter walls!
   */
  private buildGrandPrixTrackEnvironment() {
    const numSteps = 550;
    const trackWidth = this.trackSpline.data.width; // 12-14 meters wide tarmac
    const lineWidth = 0.35; // Bright white track boundary line
    const curbWidth = 1.8;  // Red/white rumble strip
    const runoffWidth = 5.0; // Green painted runoff tarmac
    const gravelWidth = 12.0; // Gravel trap
    const barrierDist = trackWidth / 2 + curbWidth + runoffWidth + 4.0;

    // Track Surface Geometry
    const tarmacGeom = new THREE.BufferGeometry();
    const tarmacPos: number[] = [];
    const tarmacCols: number[] = [];

    // Track Limit White Lines Geometry
    const lineGeom = new THREE.BufferGeometry();
    const linePos: number[] = [];

    // Curbs Geometry (Raised 3D red/white rumble strips)
    const curbGeom = new THREE.BufferGeometry();
    const curbPos: number[] = [];
    const curbCols: number[] = [];

    // Runoff & Gravel Geometry
    const outerGeom = new THREE.BufferGeometry();
    const outerPos: number[] = [];
    const outerCols: number[] = [];

    // Concrete Walls & Tyre Barriers
    const wallGeom = new THREE.BufferGeometry();
    const wallPos: number[] = [];
    const wallCols: number[] = [];

    for (let i = 0; i <= numSteps; i++) {
      const frac = i / numSteps;
      const center = this.trackSpline.getPointAt(frac);
      const tangent = this.trackSpline.getTangentAt(frac);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Asphalt Tarmac inner & outer edges
      const leftTarmac = center.clone().add(normal.clone().multiplyScalar(trackWidth / 2));
      const rightTarmac = center.clone().add(normal.clone().multiplyScalar(-trackWidth / 2));

      // Tarmac vertices
      tarmacPos.push(leftTarmac.x, leftTarmac.y + 0.04, leftTarmac.z);
      tarmacPos.push(rightTarmac.x, rightTarmac.y + 0.04, rightTarmac.z);

      // Tarmac color: dark racing asphalt with start-finish grid markings
      const isStartFinish = frac < 0.015 || frac > 0.985;
      const asphaltR = isStartFinish ? 0.32 : 0.18;
      const asphaltG = isStartFinish ? 0.32 : 0.19;
      const asphaltB = isStartFinish ? 0.35 : 0.21;
      tarmacCols.push(asphaltR, asphaltG, asphaltB, asphaltR, asphaltG, asphaltB);

      // White Track Limit Line vertices (left & right painted boundary)
      const leftLineInner = center.clone().add(normal.clone().multiplyScalar(trackWidth / 2 - lineWidth));
      const rightLineInner = center.clone().add(normal.clone().multiplyScalar(-trackWidth / 2 + lineWidth));

      linePos.push(leftTarmac.x, leftTarmac.y + 0.06, leftTarmac.z);
      linePos.push(leftLineInner.x, leftLineInner.y + 0.06, leftLineInner.z);
      linePos.push(rightLineInner.x, rightLineInner.y + 0.06, rightLineInner.z);
      linePos.push(rightTarmac.x, rightTarmac.y + 0.06, rightTarmac.z);

      // 3D Kerbs: Alternating red/white curbs
      const leftCurbOuter = center.clone().add(normal.clone().multiplyScalar(trackWidth / 2 + curbWidth));
      const rightCurbOuter = center.clone().add(normal.clone().multiplyScalar(-trackWidth / 2 - curbWidth));

      const isRed = Math.floor(frac * 140) % 2 === 0;
      const cR = isRed ? 0.95 : 0.98;
      const cG = isRed ? 0.12 : 0.98;
      const cB = isRed ? 0.12 : 0.98;

      // Left curb
      curbPos.push(leftTarmac.x, leftTarmac.y + 0.06, leftTarmac.z);
      curbPos.push(leftCurbOuter.x, leftCurbOuter.y + 0.15, leftCurbOuter.z);
      curbCols.push(cR, cG, cB, cR, cG, cB);

      // Right curb
      curbPos.push(rightCurbOuter.x, rightCurbOuter.y + 0.15, rightCurbOuter.z);
      curbPos.push(rightTarmac.x, rightTarmac.y + 0.06, rightTarmac.z);
      curbCols.push(cR, cG, cB, cR, cG, cB);

      // Outer Runoff / Grass / Gravel
      const leftOuterEdge = center.clone().add(normal.clone().multiplyScalar(barrierDist));
      const rightOuterEdge = center.clone().add(normal.clone().multiplyScalar(-barrierDist));

      // Green grass runoff
      const gR = 0.14, gG = 0.32, gB = 0.16;
      outerPos.push(leftCurbOuter.x, leftCurbOuter.y, leftCurbOuter.z);
      outerPos.push(leftOuterEdge.x, leftOuterEdge.y - 0.1, leftOuterEdge.z);
      outerCols.push(gR, gG, gB, gR, gG, gB);

      outerPos.push(rightOuterEdge.x, rightOuterEdge.y - 0.1, rightOuterEdge.z);
      outerPos.push(rightCurbOuter.x, rightCurbOuter.y, rightCurbOuter.z);
      outerCols.push(gR, gG, gB, gR, gG, gB);

      // Perimeter Tyre Barrier / Concrete Safety Wall (1.6m high)
      const wallHeight = 1.6;
      const wR = isRed ? 0.9 : 0.75;
      const wG = isRed ? 0.15 : 0.75;
      const wB = isRed ? 0.15 : 0.75;

      // Left wall
      wallPos.push(leftOuterEdge.x, leftOuterEdge.y, leftOuterEdge.z);
      wallPos.push(leftOuterEdge.x, leftOuterEdge.y + wallHeight, leftOuterEdge.z);
      wallCols.push(wR, wG, wB, wR, wG, wB);

      // Right wall
      wallPos.push(rightOuterEdge.x, rightOuterEdge.y, rightOuterEdge.z);
      wallPos.push(rightOuterEdge.x, rightOuterEdge.y + wallHeight, rightOuterEdge.z);
      wallCols.push(wR, wG, wB, wR, wG, wB);
    }

    const makeStripIndices = (count: number) => {
      const indices: number[] = [];
      for (let i = 0; i < count; i++) {
        const i0 = i * 2;
        const i1 = i * 2 + 1;
        const i2 = (i + 1) * 2;
        const i3 = (i + 1) * 2 + 1;
        indices.push(i0, i1, i2);
        indices.push(i2, i1, i3);
      }
      return indices;
    };

    // 1. Tarmac Racing Surface Mesh
    tarmacGeom.setAttribute('position', new THREE.Float32BufferAttribute(tarmacPos, 3));
    tarmacGeom.setAttribute('color', new THREE.Float32BufferAttribute(tarmacCols, 3));
    tarmacGeom.setIndex(makeStripIndices(numSteps));
    tarmacGeom.computeVertexNormals();
    const tarmacMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.12,
    });
    this.scene.add(new THREE.Mesh(tarmacGeom, tarmacMat));

    // 2. White Track Limit Lines Mesh
    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    lineGeom.setIndex(makeStripIndices(numSteps * 2));
    lineGeom.computeVertexNormals();
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.scene.add(new THREE.Mesh(lineGeom, lineMat));

    // 3. 3D Kerbs Mesh
    curbGeom.setAttribute('position', new THREE.Float32BufferAttribute(curbPos, 3));
    curbGeom.setAttribute('color', new THREE.Float32BufferAttribute(curbCols, 3));
    curbGeom.setIndex(makeStripIndices(numSteps * 2));
    curbGeom.computeVertexNormals();
    const curbMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 });
    this.scene.add(new THREE.Mesh(curbGeom, curbMat));

    // 4. Runoff & Grass Mesh
    outerGeom.setAttribute('position', new THREE.Float32BufferAttribute(outerPos, 3));
    outerGeom.setAttribute('color', new THREE.Float32BufferAttribute(outerCols, 3));
    outerGeom.setIndex(makeStripIndices(numSteps * 2));
    outerGeom.computeVertexNormals();
    const outerMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
    this.scene.add(new THREE.Mesh(outerGeom, outerMat));

    // 5. Perimeter Barriers & Walls Mesh
    wallGeom.setAttribute('position', new THREE.Float32BufferAttribute(wallPos, 3));
    wallGeom.setAttribute('color', new THREE.Float32BufferAttribute(wallCols, 3));
    wallGeom.setIndex(makeStripIndices(numSteps * 2));
    wallGeom.computeVertexNormals();
    const wallMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.2 });
    this.scene.add(new THREE.Mesh(wallGeom, wallMat));

    // 6. Ground Horizon Plane
    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3500, 3500),
      new THREE.MeshStandardMaterial({ color: 0x112211, roughness: 1.0 })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.3;
    this.scene.add(groundPlane);

    // 7. Track Furniture (Brake marker boards & Start gantry)
    this.buildTrackDecorations();
  }

  private buildTrackDecorations() {
    const boardMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const postMat = new THREE.MeshBasicMaterial({ color: 0x333333 });

    // 150m, 100m, 50m Brake Marker Boards along key corners
    this.trackSpline.data.keyTurns.forEach(turn => {
      [0.03, 0.02, 0.01].forEach((offsetFrac, idx) => {
        const boardFrac = (turn.fraction - offsetFrac + 1.0) % 1.0;
        const center = this.trackSpline.getPointAt(boardFrac);
        const tangent = this.trackSpline.getTangentAt(boardFrac);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const boardPos = center.clone().add(normal.clone().multiplyScalar(this.trackSpline.data.width / 2 + 2.8));
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 2.5), boardMat);
        board.position.set(boardPos.x, boardPos.y + 1.2, boardPos.z);
        board.rotation.y = Math.atan2(tangent.x, tangent.z);

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2), postMat);
        post.position.set(boardPos.x, boardPos.y + 0.6, boardPos.z);

        this.scene.add(board);
        this.scene.add(post);
      });
    });

    // Start-Finish Gantry Overhead
    const startPos = this.trackSpline.getPointAt(0);
    const startTangent = this.trackSpline.getTangentAt(0);
    const startNormal = new THREE.Vector3(-startTangent.z, 0, startTangent.x).normalize();

    const gantry = new THREE.Group();
    const archWidth = this.trackSpline.data.width + 6;
    const archBar = new THREE.Mesh(
      new THREE.BoxGeometry(archWidth, 1.2, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.25 })
    );
    archBar.position.y = 7.5;
    gantry.add(archBar);

    // Pillars
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 7.5), new THREE.MeshStandardMaterial({ color: 0x444444 }));
    p1.position.set(-archWidth / 2 + 0.5, 3.75, 0);
    const p2 = p1.clone();
    p2.position.set(archWidth / 2 - 0.5, 3.75, 0);
    gantry.add(p1, p2);

    gantry.position.copy(startPos);
    gantry.rotation.y = Math.atan2(startNormal.x, startNormal.z);
    this.scene.add(gantry);
  }

  public buildF1CarMesh(
    primaryHex: string,
    accentHex: string,
    rimHex: string,
    driverNumber: number = 24,
    isGhost: boolean = false,
    isPlayerCar: boolean = false
  ): THREE.Group {
    const carGroup = new THREE.Group();

    const bodyMat = isGhost
      ? new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.45,
          wireframe: true,
          emissive: 0x06b6d4,
          emissiveIntensity: 0.8,
        })
      : new THREE.MeshStandardMaterial({
          color: new THREE.Color(primaryHex),
          roughness: 0.25,
          metalness: 0.65,
        });

    const accentMat = isGhost
      ? bodyMat
      : new THREE.MeshStandardMaterial({
          color: new THREE.Color(accentHex),
          roughness: 0.3,
          metalness: 0.8,
        });

    const tireMat = isGhost
      ? bodyMat
      : new THREE.MeshStandardMaterial({
          color: 0x111111,
          roughness: 0.9,
          metalness: 0.05,
        });

    const rimMat = isGhost
      ? bodyMat
      : new THREE.MeshStandardMaterial({
          color: new THREE.Color(rimHex),
          roughness: 0.2,
          metalness: 0.9,
        });

    // 1. Nose Cone
    const noseGeom = new THREE.ConeGeometry(0.42, 2.6, 6);
    noseGeom.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeom, bodyMat);
    nose.position.set(0, 0.35, 1.6);
    carGroup.add(nose);

    // 2. Cockpit Fuselage
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 2.5), bodyMat);
    fuselage.position.set(0, 0.45, -0.2);
    carGroup.add(fuselage);

    // 3. Sidepods
    const leftPod = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 1.8), bodyMat);
    leftPod.position.set(-0.62, 0.38, -0.2);
    const rightPod = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 1.8), bodyMat);
    rightPod.position.set(0.62, 0.38, -0.2);
    carGroup.add(leftPod, rightPod);

    // Shark Fin Air Intake
    const airIntake = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 1.4), accentMat);
    airIntake.position.set(0, 0.82, -0.6);
    carGroup.add(airIntake);

    // 4. Front Wing Assembly
    const frontWingMain = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 0.45), accentMat);
    frontWingMain.position.set(0, 0.16, 2.7);
    const leftEndplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.55), accentMat);
    leftEndplate.position.set(-0.92, 0.25, 2.7);
    const rightEndplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.55), accentMat);
    rightEndplate.position.set(0.92, 0.25, 2.7);
    carGroup.add(frontWingMain, leftEndplate, rightEndplate);

    // 5. Rear Wing & DRS Flap
    const rearWingSupport = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.3), accentMat);
    rearWingSupport.position.set(0, 0.65, -1.8);
    const rearWingLower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.35), accentMat);
    rearWingLower.position.set(0, 0.8, -1.8);

    const drsFlap = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.04, 0.28), accentMat);
    drsFlap.position.set(0, 0.98, -1.75);
    carGroup.add(rearWingSupport, rearWingLower, drsFlap);

    // 6. Halo Safety Ring
    const haloLoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.04, 8, 16, Math.PI),
      isGhost ? bodyMat : new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 })
    );
    haloLoop.rotation.x = Math.PI / 2;
    haloLoop.position.set(0, 0.72, 0.25);
    carGroup.add(haloLoop);

    // 7. Driver Helmet
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      isGhost ? bodyMat : new THREE.MeshStandardMaterial({ color: 0xffdd00, roughness: 0.3 })
    );
    helmet.position.set(0, 0.64, 0.1);
    carGroup.add(helmet);

    // 8. Open Wheels with VISUAL STEERING PIVOT on front wheels
    const wheels: THREE.Mesh[] = [];

    // Front Left Wheel Pivot
    const flGroup = new THREE.Group();
    flGroup.position.set(-0.92, 0.36, 1.6);
    const flTire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.38, 16), tireMat);
    flTire.rotation.z = Math.PI / 2;
    const flRim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.39, 12), rimMat);
    flRim.rotation.z = Math.PI / 2;
    flGroup.add(flTire, flRim);
    carGroup.add(flGroup);
    wheels.push(flTire);

    // Front Right Wheel Pivot
    const frGroup = new THREE.Group();
    frGroup.position.set(0.92, 0.36, 1.6);
    const frTire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.38, 16), tireMat);
    frTire.rotation.z = Math.PI / 2;
    const frRim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.39, 12), rimMat);
    frRim.rotation.z = Math.PI / 2;
    frGroup.add(frTire, frRim);
    carGroup.add(frGroup);
    wheels.push(frTire);

    // Rear Left Wheel
    const rlGroup = new THREE.Group();
    rlGroup.position.set(-0.96, 0.42, -1.3);
    const rlTire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.45, 16), tireMat);
    rlTire.rotation.z = Math.PI / 2;
    const rlRim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.46, 12), rimMat);
    rlRim.rotation.z = Math.PI / 2;
    rlGroup.add(rlTire, rlRim);
    carGroup.add(rlGroup);
    wheels.push(rlTire);

    // Rear Right Wheel
    const rrGroup = new THREE.Group();
    rrGroup.position.set(0.96, 0.42, -1.3);
    const rrTire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.45, 16), tireMat);
    rrTire.rotation.z = Math.PI / 2;
    const rrRim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.46, 12), rimMat);
    rrRim.rotation.z = Math.PI / 2;
    rrGroup.add(rrTire, rrRim);
    carGroup.add(rrGroup);
    wheels.push(rrTire);

    if (isPlayerCar) {
      this.playerWheels = wheels;
      this.playerFrontLeftWheelGroup = flGroup;
      this.playerFrontRightWheelGroup = frGroup;
      this.playerDrsFlap = drsFlap;
    }

    return carGroup;
  }

  private setupRainSystem() {
    const rainCount = 1800;
    const rainGeom = new THREE.BufferGeometry();
    const rainPositions: number[] = [];

    for (let i = 0; i < rainCount; i++) {
      rainPositions.push(
        (Math.random() - 0.5) * 120,
        Math.random() * 50,
        (Math.random() - 0.5) * 120
      );
    }

    rainGeom.setAttribute('position', new THREE.Float32BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.4,
      transparent: true,
      opacity: 0.65,
    });

    this.rainParticles = new THREE.Points(rainGeom, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  public setWeather(weather: WeatherCondition) {
    if (weather === 'dry') {
      this.scene.background = new THREE.Color(0x38bdf8);
      this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.0012);
      this.ambientLight.intensity = 0.85;
      this.dirLight.intensity = 1.5;
      if (this.rainParticles) this.rainParticles.visible = false;
    } else if (weather === 'overcast') {
      this.scene.background = new THREE.Color(0x64748b);
      this.scene.fog = new THREE.FogExp2(0x64748b, 0.002);
      this.ambientLight.intensity = 0.65;
      this.dirLight.intensity = 0.9;
      if (this.rainParticles) this.rainParticles.visible = false;
    } else if (weather === 'drizzle') {
      this.scene.background = new THREE.Color(0x475569);
      this.scene.fog = new THREE.FogExp2(0x475569, 0.0035);
      this.ambientLight.intensity = 0.55;
      this.dirLight.intensity = 0.6;
      if (this.rainParticles) this.rainParticles.visible = true;
    } else {
      this.scene.background = new THREE.Color(0x1e293b);
      this.scene.fog = new THREE.FogExp2(0x1e293b, 0.0055);
      this.ambientLight.intensity = 0.45;
      this.dirLight.intensity = 0.4;
      if (this.rainParticles) this.rainParticles.visible = true;
    }
  }

  public setCameraMode(mode: CameraView) {
    this.cameraMode = mode;
  }

  public getCameraMode(): CameraView {
    return this.cameraMode;
  }

  public setWireframe(enabled: boolean) {
    this.isWireframe = enabled;
    this.scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material as THREE.Material;
        if (mat && 'wireframe' in mat) {
          (mat as { wireframe: boolean }).wireframe = enabled;
        }
      }
    });
  }

  public updateGhost(ghostSample: GhostSample | null) {
    if (!ghostSample) {
      if (this.ghostGroup) this.ghostGroup.visible = false;
      return;
    }

    if (!this.ghostGroup) {
      this.ghostGroup = this.buildF1CarMesh('#06b6d4', '#ffffff', '#06b6d4', 24, true, false);
      this.scene.add(this.ghostGroup);
    }

    this.ghostGroup.visible = true;
    this.ghostGroup.position.set(ghostSample.x, ghostSample.y, ghostSample.z);
    this.ghostGroup.rotation.y = ghostSample.rotY;
  }

  /**
   * Main Render Update Loop
   * Uses real car world coordinates (x, y, z) and yaw heading!
   */
  public update(
    playerState: FreeVehicleState,
    aiCars: AIState[],
    ghostSample: GhostSample | null,
    weather: WeatherCondition,
    delta: number
  ) {
    // 1. Update Player Car 3D Transform
    this.playerCarGroup.position.set(playerState.x, playerState.y, playerState.z);
    this.playerCarGroup.rotation.y = playerState.yaw;

    // Visual Steering: Turn front wheels when driver presses A/D or arrows!
    if (this.playerFrontLeftWheelGroup && this.playerFrontRightWheelGroup) {
      this.playerFrontLeftWheelGroup.rotation.y = playerState.steerAngle;
      this.playerFrontRightWheelGroup.rotation.y = playerState.steerAngle;
    }

    // DRS Flap animation
    if (this.playerDrsFlap) {
      const targetFlapAngle = playerState.drsActive ? -0.38 : 0;
      this.playerDrsFlap.rotation.x += (targetFlapAngle - this.playerDrsFlap.rotation.x) * 0.3;
    }

    // Rolling Wheel Rotation based on forward speed
    const wheelRot = playerState.speedMs * delta * 2.5;
    this.playerWheels.forEach(w => {
      w.rotation.x += wheelRot;
    });

    // 2. Update AI Cars
    aiCars.forEach(ai => {
      let aiMesh = this.aiCarGroups.get(ai.id);
      if (!aiMesh) {
        const group = this.buildF1CarMesh(ai.config.color, '#ffffff', '#222222', ai.config.number, false, false);
        this.scene.add(group);
        const wheels: THREE.Mesh[] = [];
        group.traverse(o => {
          if ((o as THREE.Mesh).isMesh && (o as THREE.Mesh).geometry.type === 'CylinderGeometry') {
            wheels.push(o as THREE.Mesh);
          }
        });
        aiMesh = { group, wheels, drsFlap: null };
        this.aiCarGroups.set(ai.id, aiMesh);
      }

      aiMesh.group.position.copy(ai.worldPosition);
      aiMesh.group.rotation.y = ai.worldRotationY;
    });

    // 3. Update Ghost Car
    this.updateGhost(ghostSample);

    // 4. Update Rain Particles
    if (this.rainParticles && this.rainParticles.visible) {
      this.rainParticles.position.x = playerState.x;
      this.rainParticles.position.z = playerState.z;
      const posAttr = this.rainParticles.geometry.attributes.position;
      for (let i = 1; i < posAttr.count * 3; i += 3) {
        posAttr.array[i] -= 45 * delta;
        if (posAttr.array[i] < 0) {
          posAttr.array[i] = 40 + Math.random() * 10;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 5. Update Camera
    this.updateCamera(playerState, delta);

    // 6. Render WebGL Frame
    this.renderer.render(this.scene, this.camera);
  }

  private updateCamera(player: FreeVehicleState, delta: number) {
    const heading = player.yaw;
    const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
    const right = new THREE.Vector3(Math.cos(heading), 0, -Math.sin(heading));
    const playerPos = new THREE.Vector3(player.x, player.y, player.z);

    const targetPos = new THREE.Vector3();
    const targetLook = new THREE.Vector3();

    const speedRatio = Math.abs(player.speedKmh) / 360;
    this.camera.fov = 65 + speedRatio * 15;
    this.camera.updateProjectionMatrix();

    if (this.cameraMode === 'chase') {
      const dist = 7.5 + speedRatio * 2.0;
      const height = 2.8 + speedRatio * 0.4;
      targetPos.copy(playerPos)
        .sub(forward.clone().multiplyScalar(dist))
        .add(new THREE.Vector3(0, height, 0));
      targetLook.copy(playerPos).add(forward.clone().multiplyScalar(8)).add(new THREE.Vector3(0, 1.2, 0));
    } else if (this.cameraMode === 'cockpit') {
      targetPos.copy(playerPos).add(new THREE.Vector3(0, 0.72, 0)).add(forward.clone().multiplyScalar(0.2));
      targetLook.copy(playerPos).add(forward.clone().multiplyScalar(40)).add(new THREE.Vector3(0, 0.8, 0));
    } else if (this.cameraMode === 'nose') {
      targetPos.copy(playerPos).add(new THREE.Vector3(0, 0.35, 0)).add(forward.clone().multiplyScalar(2.4));
      targetLook.copy(playerPos).add(forward.clone().multiplyScalar(30)).add(new THREE.Vector3(0, 0.3, 0));
    } else if (this.cameraMode === 'tv') {
      targetPos.copy(playerPos)
        .add(right.clone().multiplyScalar(12))
        .add(new THREE.Vector3(0, 6, 0))
        .sub(forward.clone().multiplyScalar(8));
      targetLook.copy(playerPos).add(new THREE.Vector3(0, 0.8, 0));
    } else if (this.cameraMode === 'topdown') {
      targetPos.copy(playerPos).add(new THREE.Vector3(0, 35, -5));
      targetLook.copy(playerPos);
    }

    const damp = this.cameraMode === 'cockpit' || this.cameraMode === 'nose' ? 0.95 : 0.18;
    this.smoothedCamPos.lerp(targetPos, damp);
    this.smoothedCamLook.lerp(targetLook, damp);

    this.camera.position.copy(this.smoothedCamPos);
    this.camera.lookAt(this.smoothedCamLook);
  }

  public dispose() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
