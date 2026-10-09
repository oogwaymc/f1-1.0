/**
 * Standalone Single-File HTML Exporter
 * Bundles the full game into a self-contained .html file that runs offline
 * on any device without a web server!
 */

export function downloadStandaloneHtmlFile() {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex Formula 24 - 3D F1 Standalone Game</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body { background: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; width: 100vw; height: 100vh; }
    #canvas-container { width: 100vw; height: 100vh; position: absolute; top: 0; left: 0; }
    .screen { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 50; }
    .card { background: rgba(24, 24, 27, 0.95); border: 1px solid #27272a; border-radius: 1rem; padding: 2rem; max-width: 440px; width: 90%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .btn { background: #dc2626; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.875rem; width: 100%; margin-top: 1rem; }
    .btn:hover { background: #ef4444; }
    .input { width: 100%; padding: 0.75rem 1rem; background: #09090b; border: 1px solid #3f3f46; border-radius: 0.75rem; color: #fff; margin-top: 0.5rem; outline: none; font-size: 1rem; }
    .input:focus { border-color: #ef4444; }
    #hud { position: absolute; inset: 0; pointer-events: none; z-index: 10; display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem; }
    .hud-box { background: rgba(9, 9, 11, 0.85); border: 1px solid #27272a; border-radius: 0.75rem; padding: 0.75rem 1rem; font-family: monospace; }
    .speed-big { font-size: 3.5rem; font-weight: 900; line-height: 1; }
    .gear-big { font-size: 3.5rem; font-weight: 900; line-height: 1; color: #ef4444; }
    .warning { background: #f59e0b; color: #000; font-weight: 900; padding: 0.5rem 1rem; border-radius: 0.5rem; font-family: monospace; animation: pulse 0.5s infinite alternate; }
    @keyframes pulse { from { opacity: 0.8; } to { opacity: 1; transform: scale(1.02); } }
  </style>
</head>
<body>
  <div id="canvas-container"></div>

  <!-- Password Lock Screen -->
  <div id="lock-screen" class="screen">
    <div class="card">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏎️</div>
      <div style="font-size: 0.75rem; font-family: monospace; color: #a1a1aa; letter-spacing: 0.1em;">FIA FORMULA 1 PADDOCK · CAR #24</div>
      <h1 style="font-size: 1.75rem; font-weight: 900; margin: 0.25rem 0 1rem; text-transform: uppercase;">Apex Formula 24</h1>
      <p style="font-size: 0.875rem; color: #a1a1aa; margin-bottom: 1.5rem;">Enter password to unlock Grand Prix circuits:</p>
      <input type="password" id="pwd-input" class="input" placeholder="Password..." autofocus />
      <div id="pwd-err" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.5rem; display: none;">Invalid Passcode! Key: Joeisabitch</div>
      <button class="btn" onclick="checkPassword()">Authorize Access</button>
    </div>
  </div>

  <!-- Circuit Selector Screen -->
  <div id="track-screen" class="screen" style="display: none;">
    <div class="card" style="max-width: 680px;">
      <div style="font-size: 0.75rem; font-family: monospace; color: #a1a1aa;">FORMULA 1 WORLD CHAMPIONSHIP</div>
      <h2 style="font-size: 1.75rem; font-weight: 900; margin-bottom: 1.25rem; text-transform: uppercase;">Select Grand Prix Track</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; text-align: left; margin-bottom: 1rem;">
        <button class="btn" style="background: #27272a; margin: 0;" onclick="startRace('monza')">🇮🇹 Monza (Temple of Speed)</button>
        <button class="btn" style="background: #27272a; margin: 0;" onclick="startRace('silverstone')">🇬🇧 Silverstone (Maggotts)</button>
        <button class="btn" style="background: #27272a; margin: 0;" onclick="startRace('spa')">🇧🇪 Spa (Eau Rouge)</button>
        <button class="btn" style="background: #27272a; margin: 0;" onclick="startRace('monaco')">🇲🇨 Monaco (Grand Hotel)</button>
      </div>
      <div style="font-size: 0.75rem; color: #a1a1aa; font-family: monospace;">Controls: W / Up = Throttle | S / Down = Brake | A/D or Left/Right = Steer (No auto-steering) | Space = Pause</div>
    </div>
  </div>

  <!-- In-Race HUD -->
  <div id="hud" style="display: none;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div class="hud-box">
        <div style="color: #ef4444; font-weight: bold;">CAR #24 · GRAND PRIX</div>
        <div id="hud-lap">LAP 1 / 3</div>
        <div id="hud-time" style="font-size: 1.25rem; font-weight: bold;">00:00.000</div>
      </div>
      <div id="track-limits-banner" class="warning" style="display: none;">
        ⚠️ TRACK LIMITS VIOLATION · OFF TARMAC
      </div>
      <div class="hud-box" style="text-align: right;">
        <div>CONTROLS: WASD / ARROWS</div>
        <div>SPACE = PAUSE</div>
        <div style="color: #a1a1aa; font-size: 0.7rem;">DEV CHEATS: TYPE 2411</div>
      </div>
    </div>

    <!-- Cockpit Telemetry -->
    <div style="display: flex; justify-content: center; align-items: flex-end;">
      <div class="hud-box" style="display: flex; align-items: center; gap: 2rem; padding: 1rem 2rem;">
        <div style="text-align: center;">
          <div style="font-size: 0.7rem; color: #a1a1aa;">GEAR</div>
          <div id="hud-gear" class="gear-big">1</div>
        </div>
        <div style="text-align: center;">
          <div id="hud-speed" class="speed-big">0</div>
          <div style="font-size: 0.7rem; color: #a1a1aa;">KM / H</div>
        </div>
        <div style="text-align: center;">
          <div id="hud-rpm" style="font-size: 1.25rem; font-weight: bold; color: #10b981;">4200</div>
          <div style="font-size: 0.7rem; color: #a1a1aa;">RPM</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Audio Synthesizer
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let osc1, engineGain;
    function initAudio() {
      if (osc1) return;
      try {
        osc1 = audioCtx.createOscillator();
        engineGain = audioCtx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(80, audioCtx.currentTime);
        engineGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc1.connect(engineGain);
        engineGain.connect(audioCtx.destination);
        osc1.start();
      } catch(e) {}
    }

    function checkPassword() {
      const input = document.getElementById('pwd-input').value;
      if (input === 'Joeisabitch') {
        document.getElementById('lock-screen').style.display = 'none';
        document.getElementById('track-screen').style.display = 'flex';
        initAudio();
      } else {
        document.getElementById('pwd-err').style.display = 'block';
      }
    }

    document.getElementById('pwd-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkPassword();
    });

    // Three.js Game Engine
    let scene, camera, renderer, carMesh, frontWheels = [];
    let car = { x: 0, z: 0, yaw: 0, speed: 0, steer: 0, lap: 1, lapStart: 0, isOffTrack: false };
    const keys = { w: false, s: false, a: false, d: false };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
    });

    function startRace(trackId) {
      document.getElementById('track-screen').style.display = 'none';
      document.getElementById('hud').style.display = 'flex';
      initThree();
      car.lapStart = Date.now();
      requestAnimationFrame(loop);
    }

    function initThree() {
      const container = document.getElementById('canvas-container');
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x38bdf8);
      scene.fog = new THREE.FogExp2(0x38bdf8, 0.0015);

      camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
      dirLight.position.set(100, 200, 100);
      scene.add(dirLight);

      // Build Oval Race Circuit with Tarmac, White Limits, and Kerbs
      const trackWidth = 14;
      const radius = 220;
      const straight = 350;

      // Ground grass
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: 0x143518 }));
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      // Build F1 Car
      carMesh = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 3.2), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.6 }));
      body.position.y = 0.35;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.4), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      wing.position.set(0, 0.15, 1.6);
      const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.3), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      rearWing.position.set(0, 0.8, -1.6);
      carMesh.add(body, wing, rearWing);

      // Wheels
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      [-0.9, 0.9].forEach(side => {
        const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.35, 12), tireMat);
        fw.rotation.z = Math.PI / 2;
        fw.position.set(side, 0.35, 1.2);
        carMesh.add(fw);
        frontWheels.push(fw);

        const rw = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.45, 12), tireMat);
        rw.rotation.z = Math.PI / 2;
        rw.position.set(side, 0.42, -1.2);
        carMesh.add(rw);
      });

      scene.add(carMesh);
    }

    let lastTime = performance.now();
    function loop(time) {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      // TRUE FREE STEERING (WASD / ARROWS, NO AUTO-STEER)
      let targetSteer = 0;
      if (keys.a) targetSteer = 0.55;
      if (keys.d) targetSteer = -0.55;
      car.steer += (targetSteer - car.steer) * 8 * dt;

      // Throttle & Brake
      if (keys.w) car.speed += 35 * dt;
      else if (keys.s) car.speed -= 55 * dt;
      else car.speed -= 10 * dt;

      car.speed = Math.max(0, Math.min(85, car.speed)); // Speed in m/s (up to ~306 km/h)

      // Steering rotates yaw based on forward motion
      if (car.speed > 0.5) {
        car.yaw += (car.speed / 3.6) * Math.tan(car.steer) * dt;
      }

      // Free Translation along car yaw
      car.x += Math.sin(car.yaw) * car.speed * dt;
      car.z += Math.cos(car.yaw) * car.speed * dt;

      // Update 3D car position
      carMesh.position.set(car.x, 0, car.z);
      carMesh.rotation.y = car.yaw;
      frontWheels.forEach(w => w.rotation.y = car.steer);

      // Camera follow
      const forward = new THREE.Vector3(Math.sin(car.yaw), 0, Math.cos(car.yaw));
      camera.position.set(car.x, 2.8, car.z).sub(forward.clone().multiplyScalar(7.5));
      camera.lookAt(car.x + forward.x * 10, 1.2, car.z + forward.z * 10);

      // Audio frequency modulation
      const kmh = Math.round(car.speed * 3.6);
      if (osc1) {
        osc1.frequency.setTargetAtTime(80 + (kmh / 320) * 320, audioCtx.currentTime, 0.05);
      }

      // HUD updates
      document.getElementById('hud-speed').innerText = kmh;
      document.getElementById('hud-gear').innerText = kmh > 260 ? '7' : kmh > 210 ? '6' : kmh > 160 ? '5' : kmh > 110 ? '4' : kmh > 60 ? '3' : kmh > 20 ? '2' : '1';
      document.getElementById('hud-rpm').innerText = Math.round(4200 + (kmh % 45) * 220);

      const elapsed = Date.now() - car.lapStart;
      const m = Math.floor(elapsed / 60000);
      const s = Math.floor((elapsed % 60000) / 1000);
      const ms = Math.floor(elapsed % 1000);
      document.getElementById('hud-time').innerText = \`\${m}:\${s < 10 ? '0' : ''}\${s}.\${ms < 100 ? '0' : ''}\${ms}\`;

      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Apex_Formula_24_Game.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
