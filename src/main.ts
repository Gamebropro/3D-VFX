// @ts-ignore
import { WebGPURenderer } from "three/webgpu";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// ============================================================
// Global Variables
// ============================================================
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: any = null;
let controls: OrbitControls;
let animationFrameId: number;

// Lighting
let sunLight: THREE.DirectionalLight;
let skyLight: THREE.HemisphereLight;
let ambientLight: THREE.AmbientLight;

// Editor Objects
let testSphereGroup: THREE.Group;
let customModel: THREE.Group | null = null;
let gridHelper: THREE.GridHelper;
let axesHelper: THREE.AxesHelper;

// Day/Night System Objects
let skyMesh: THREE.Mesh;
let sunMesh: THREE.Mesh;
let moonMesh: THREE.Mesh;
let starField: THREE.Points;

// UI Elements
let apiSelect: HTMLSelectElement;
let sliderSunIntensity: HTMLInputElement;
let sliderSunTemp: HTMLInputElement;
let sliderSkyIntensity: HTMLInputElement;

let valSunIntensity: HTMLElement;
let valSunTemp: HTMLElement;
let valSkyIntensity: HTMLElement;

let btnImport: HTMLButtonElement;
let fileInput: HTMLInputElement;
let btnClearModel: HTMLButtonElement;
let btnResetView: HTMLButtonElement;

let progressContainer: HTMLElement;
let progressBar: HTMLElement;
let progressText: HTMLElement;

let detailsPlaceholder: HTMLElement;
let detailsContent: HTMLElement;
let detailName: HTMLElement;
let detailTris: HTMLElement;
let detailVerts: HTMLElement;
let detailSize: HTMLElement;
let detailScale: HTMLElement;

let fpsCounter: HTMLElement;
let hudApi: HTMLElement;
let hudGpu: HTMLElement;
let dropZoneOverlay: HTMLElement;

// Day/Night UI Elements
let sliderTimeOfDay: HTMLInputElement;
let valTimeOfDay: HTMLElement;
let toggleDayNightCycle: HTMLInputElement;
let sliderCycleSpeed: HTMLInputElement;
let valCycleSpeed: HTMLElement;
let dnSunAlt: HTMLElement;
let dnPhase: HTMLElement;
let presetButtons: NodeListOf<HTMLButtonElement>;
let cycleSpeedGroup: HTMLElement;

// State
let currentApi: "webgpu" | "webgl2" = "webgpu";
let lastTime = 0;
let frameCount = 0;
let fps = 60;

// Day/Night State
let timeOfDay: number = 12.0; // 0-24 hours
let dayNightCycleEnabled: boolean = false;
let cycleSpeed: number = 1.0;

// ============================================================
// Day/Night Color Keyframes
// ============================================================
interface ColorKeyframe {
  time: number; // 0-24
  skyTop: THREE.Color;
  skyBottom: THREE.Color;
  sunColor: THREE.Color;
  sunIntensity: number;
  skyColor: THREE.Color;
  skyIntensity: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  fogColor: THREE.Color;
  bgColor: THREE.Color;
  sunEmissive: THREE.Color;
  moonEmissive: THREE.Color;
}

const colorKeyframes: ColorKeyframe[] = [
  {
    // 0:00 - Midnight
    time: 0,
    skyTop: new THREE.Color(0x020210),
    skyBottom: new THREE.Color(0x050518),
    sunColor: new THREE.Color(0x4466aa),
    sunIntensity: 0.0,
    skyColor: new THREE.Color(0x0a0a2e),
    skyIntensity: 0.05,
    ambientColor: new THREE.Color(0x111133),
    ambientIntensity: 0.08,
    fogColor: new THREE.Color(0x030308),
    bgColor: new THREE.Color(0x020210),
    sunEmissive: new THREE.Color(0x000000),
    moonEmissive: new THREE.Color(0x8899bb),
  },
  {
    // 4:00 - Pre-dawn
    time: 4,
    skyTop: new THREE.Color(0x0a0a2e),
    skyBottom: new THREE.Color(0x1a1035),
    sunColor: new THREE.Color(0x664433),
    sunIntensity: 0.0,
    skyColor: new THREE.Color(0x15102a),
    skyIntensity: 0.1,
    ambientColor: new THREE.Color(0x1a1535),
    ambientIntensity: 0.1,
    fogColor: new THREE.Color(0x08081a),
    bgColor: new THREE.Color(0x050515),
    sunEmissive: new THREE.Color(0x000000),
    moonEmissive: new THREE.Color(0x7788aa),
  },
  {
    // 5:5 - Dawn / Sunrise
    time: 5.5,
    skyTop: new THREE.Color(0x1a2a55),
    skyBottom: new THREE.Color(0xff8844),
    sunColor: new THREE.Color(0xff7733),
    sunIntensity: 1.0,
    skyColor: new THREE.Color(0xdd6633),
    skyIntensity: 0.6,
    ambientColor: new THREE.Color(0xcc7744),
    ambientIntensity: 0.25,
    fogColor: new THREE.Color(0x663322),
    bgColor: new THREE.Color(0x1a1530),
    sunEmissive: new THREE.Color(0xff6622),
    moonEmissive: new THREE.Color(0x000000),
  },
  {
    // 7:00 - Morning
    time: 7,
    skyTop: new THREE.Color(0x4488cc),
    skyBottom: new THREE.Color(0x88bbee),
    sunColor: new THREE.Color(0xffeedd),
    sunIntensity: 2.0,
    skyColor: new THREE.Color(0x88bbee),
    skyIntensity: 0.9,
    ambientColor: new THREE.Color(0x99aacc),
    ambientIntensity: 0.3,
    fogColor: new THREE.Color(0x557799),
    bgColor: new THREE.Color(0x334466),
    sunEmissive: new THREE.Color(0xffeecc),
    moonEmissive: new THREE.Color(0x000000),
  },
  {
    // 12:00 - Noon
    time: 12,
    skyTop: new THREE.Color(0x3377cc),
    skyBottom: new THREE.Color(0x88ccee),
    sunColor: new THREE.Color(0xfffff0),
    sunIntensity: 2.5,
    skyColor: new THREE.Color(0x88ccee),
    skyIntensity: 1.0,
    ambientColor: new THREE.Color(0xaabbdd),
    ambientIntensity: 0.35,
    fogColor: new THREE.Color(0x6688aa),
    bgColor: new THREE.Color(0x446688),
    sunEmissive: new THREE.Color(0xffffff),
    moonEmissive: new THREE.Color(0x000000),
  },
  {
    // 17:00 - Late Afternoon
    time: 17,
    skyTop: new THREE.Color(0x3366aa),
    skyBottom: new THREE.Color(0x99bbdd),
    sunColor: new THREE.Color(0xffeebb),
    sunIntensity: 2.0,
    skyColor: new THREE.Color(0x99bbdd),
    skyIntensity: 0.8,
    ambientColor: new THREE.Color(0x99aacc),
    ambientIntensity: 0.3,
    fogColor: new THREE.Color(0x556688),
    bgColor: new THREE.Color(0x335577),
    sunEmissive: new THREE.Color(0xffeebb),
    moonEmissive: new THREE.Color(0x000000),
  },
  {
    // 17.5 - Dusk / Sunset
    time: 17.5,
    skyTop: new THREE.Color(0x1a2255),
    skyBottom: new THREE.Color(0xff6633),
    sunColor: new THREE.Color(0xff5522),
    sunIntensity: 1.2,
    skyColor: new THREE.Color(0xcc5533),
    skyIntensity: 0.5,
    ambientColor: new THREE.Color(0xbb6644),
    ambientIntensity: 0.2,
    fogColor: new THREE.Color(0x553322),
    bgColor: new THREE.Color(0x1a1530),
    sunEmissive: new THREE.Color(0xff4411),
    moonEmissive: new THREE.Color(0x000000),
  },
  {
    // 19:00 - Twilight
    time: 19,
    skyTop: new THREE.Color(0x0a0a35),
    skyBottom: new THREE.Color(0x2a1545),
    sunColor: new THREE.Color(0x553366),
    sunIntensity: 0.1,
    skyColor: new THREE.Color(0x1a1040),
    skyIntensity: 0.15,
    ambientColor: new THREE.Color(0x221540),
    ambientIntensity: 0.12,
    fogColor: new THREE.Color(0x0a0a20),
    bgColor: new THREE.Color(0x050518),
    sunEmissive: new THREE.Color(0x000000),
    moonEmissive: new THREE.Color(0x667799),
  },
  {
    // 20:00 - Night begins
    time: 20,
    skyTop: new THREE.Color(0x030315),
    skyBottom: new THREE.Color(0x080822),
    sunColor: new THREE.Color(0x445588),
    sunIntensity: 0.0,
    skyColor: new THREE.Color(0x0a0a2e),
    skyIntensity: 0.08,
    ambientColor: new THREE.Color(0x111133),
    ambientIntensity: 0.1,
    fogColor: new THREE.Color(0x030308),
    bgColor: new THREE.Color(0x020210),
    sunEmissive: new THREE.Color(0x000000),
    moonEmissive: new THREE.Color(0x8899bb),
  },
  {
    // 24:00 - Midnight (same as 0)
    time: 24,
    skyTop: new THREE.Color(0x020210),
    skyBottom: new THREE.Color(0x050518),
    sunColor: new THREE.Color(0x4466aa),
    sunIntensity: 0.0,
    skyColor: new THREE.Color(0x0a0a2e),
    skyIntensity: 0.05,
    ambientColor: new THREE.Color(0x111133),
    ambientIntensity: 0.08,
    fogColor: new THREE.Color(0x030308),
    bgColor: new THREE.Color(0x020210),
    sunEmissive: new THREE.Color(0x000000),
    moonEmissive: new THREE.Color(0x8899bb),
  },
];

// ============================================================
// Utility: Interpolate between keyframes
// ============================================================
function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  );
}

function lerpValue(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getTimeKeyframes(t: number): { kf1: ColorKeyframe; kf2: ColorKeyframe; t: number } {
  // Wrap t into 0-24
  t = ((t % 24) + 24) % 24;

  let kf1 = colorKeyframes[0];
  let kf2 = colorKeyframes[1];

  for (let i = 0; i < colorKeyframes.length - 1; i++) {
    if (t >= colorKeyframes[i].time && t <= colorKeyframes[i + 1].time) {
      kf1 = colorKeyframes[i];
      kf2 = colorKeyframes[i + 1];
      break;
    }
  }

  const range = kf2.time - kf1.time;
  const localT = range > 0 ? (t - kf1.time) / range : 0;

  return { kf1, kf2, t: localT };
}

function getInterpolatedValues(time: number) {
  const { kf1, kf2, t } = getTimeKeyframes(time);

  return {
    skyTop: lerpColor(kf1.skyTop, kf2.skyTop, t),
    skyBottom: lerpColor(kf1.skyBottom, kf2.skyBottom, t),
    sunColor: lerpColor(kf1.sunColor, kf2.sunColor, t),
    sunIntensity: lerpValue(kf1.sunIntensity, kf2.sunIntensity, t),
    skyColor: lerpColor(kf1.skyColor, kf2.skyColor, t),
    skyIntensity: lerpValue(kf1.skyIntensity, kf2.skyIntensity, t),
    ambientColor: lerpColor(kf1.ambientColor, kf2.ambientColor, t),
    ambientIntensity: lerpValue(kf1.ambientIntensity, kf2.ambientIntensity, t),
    fogColor: lerpColor(kf1.fogColor, kf2.fogColor, t),
    bgColor: lerpColor(kf1.bgColor, kf2.bgColor, t),
    sunEmissive: lerpColor(kf1.sunEmissive, kf2.sunEmissive, t),
    moonEmissive: lerpColor(kf1.moonEmissive, kf2.moonEmissive, t),
  };
}

// ============================================================
// Dynamic check for WebGPU support
// ============================================================
const isWebGPUSupported = (): boolean => {
  return !!(navigator && (navigator as any).gpu);
};

// ============================================================
// Initialize Graphics Renderer
// ============================================================
async function initRenderer(apiMode: "webgpu" | "webgl2") {
  const canvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;

  // Clean up previous renderer & loop
  if (renderer) {
    renderer.dispose();
    cancelAnimationFrame(animationFrameId);
  }

  // Fallback check
  let useWebGL = apiMode === "webgl2";
  if (apiMode === "webgpu" && !isWebGPUSupported()) {
    console.warn("WebGPU not supported by this browser. Falling back to WebGL2.");
    useWebGL = true;
    currentApi = "webgl2";
  } else {
    currentApi = apiMode;
  }

  try {
    // Instantiate the WebGPURenderer (forces WebGL2 fallback if forceWebGL is true)
    renderer = new WebGPURenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      forceWebGL: useWebGL,
    });

    // Asynchronous initialization required for WebGPU renderer
    await renderer.init();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // UE5 ACES Tone Mapping
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Update HUD & Select variables
    apiSelect.value = currentApi;
    const apiBadge = document.getElementById("api-badge") as HTMLElement;

    if (currentApi === "webgpu") {
      apiBadge.textContent = "WebGPU Mode";
      apiBadge.className = "badge";
      hudApi.textContent = "WebGPU";
    } else {
      apiBadge.textContent = "WebGL 2 Mode";
      apiBadge.className = "badge webgl";
      hudApi.textContent = "WebGL2";
    }

    // Display Hardware GPU details
    await displayGpuInfo();

    // Setup or update camera controls
    if (controls) {
      controls.dispose();
    }
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 40;
    controls.minDistance = 1;
    controls.target.set(0, 1.2, 0);
    controls.update();

    // Start rendering frame loop
    lastTime = performance.now();
    animate();
  } catch (error) {
    console.error("Renderer initialization failed:", error);
    // If WebGPU failed, force WebGL 2 fallback
    if (apiMode === "webgpu") {
      initRenderer("webgl2");
    }
  }
}

// ============================================================
// Fetch and display GPU Device Information
// ============================================================
async function displayGpuInfo() {
  if (currentApi === "webgpu" && isWebGPUSupported()) {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      const info = adapter ? adapter.info || (adapter as any).limits : null;
      if (info) {
        hudGpu.textContent = info.description || info.device || "WebGPU Core";
      } else {
        hudGpu.textContent = "WebGPU Generic Hardware";
      }
    } catch (e) {
      hudGpu.textContent = "WebGPU Compatible";
    }
  } else {
    const canvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        hudGpu.textContent = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      } else {
        hudGpu.textContent = gl.getParameter(gl.RENDERER) || "WebGL 2 Device";
      }
    } else {
      hudGpu.textContent = "WebGL 2 Core";
    }
  }
}

// ============================================================
// Create Sky Dome (inverted sphere with gradient)
// ============================================================
function createSkyDome() {
  const skyGeo = new THREE.SphereGeometry(50, 32, 16);

  // Shader material for vertical gradient sky
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      uSkyTop: { value: new THREE.Color(0x3377cc) },
      uSkyBottom: { value: new THREE.Color(0x88ccee) },
      uOpacity: { value: 1.0 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uSkyTop;
      uniform vec3 uSkyBottom;
      uniform float uOpacity;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
        vec3 skyColor = mix(uSkyBottom, uSkyTop, t);
        gl_FragColor = vec4(skyColor, uOpacity);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });

  skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.renderOrder = -1;
  scene.add(skyMesh);
}

// ============================================================
// Create Sun Mesh (glowing billboard sphere)
// ============================================================
function createSunMesh() {
  const sunGeo = new THREE.SphereGeometry(1.2, 24, 24);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1.0,
  });
  sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.renderOrder = 2;
  scene.add(sunMesh);

  // Sun glow (larger transparent sphere around sun)
  const glowGeo = new THREE.SphereGeometry(2.5, 24, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffeecc,
    transparent: true,
    opacity: 0.15,
  });
  const sunGlow = new THREE.Mesh(glowGeo, glowMat);
  sunGlow.name = "sunGlow";
  sunMesh.add(sunGlow);
}

// ============================================================
// Create Moon Mesh
// ============================================================
function createMoonMesh() {
  const moonGeo = new THREE.SphereGeometry(0.8, 24, 24);
  const moonMat = new THREE.MeshBasicMaterial({
    color: 0xccddff,
    transparent: true,
    opacity: 1.0,
  });
  moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.renderOrder = 2;
  scene.add(moonMesh);

  // Moon glow
  const glowGeo = new THREE.SphereGeometry(1.5, 24, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x667799,
    transparent: true,
    opacity: 0.1,
  });
  const moonGlow = new THREE.Mesh(glowGeo, glowMat);
  moonGlow.name = "moonGlow";
  moonMesh.add(moonGlow);
}

// ============================================================
// Create Star Field (particle system)
// ============================================================
function createStarField() {
  const starCount = 800;
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    // Random position on a large sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 45 + Math.random() * 3;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)); // Keep stars in upper hemisphere
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    sizes[i] = 0.5 + Math.random() * 1.5;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const starMat = new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 0.0 },
      uTime: { value: 0.0 },
    },
    vertexShader: `
      attribute float size;
      uniform float uTime;
      varying float vTwinkle;
      void main() {
        vTwinkle = 0.7 + 0.3 * sin(uTime * 2.0 + position.x * 10.0 + position.z * 7.0);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d) * vTwinkle * uOpacity;
        gl_FragColor = vec4(0.9, 0.92, 1.0, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  starField = new THREE.Points(starGeo, starMat);
  starField.renderOrder = 1;
  scene.add(starField);
}

// ============================================================
// Create UE5 Environment Scene
// ============================================================
function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x446688);
  scene.fog = new THREE.FogExp2(0x6688aa, 0.015);

  // Camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 3.5, 6.5);

  // Grid Helper representing UE5 origin coordinates
  gridHelper = new THREE.GridHelper(50, 50, 0x00f0ff, 0x22222a);
  // @ts-ignore
  gridHelper.material.opacity = 0.15;
  // @ts-ignore
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  // Axis Helper
  axesHelper = new THREE.AxesHelper(3);
  // @ts-ignore
  axesHelper.material.linewidth = 2;
  scene.add(axesHelper);

  // 1. Directional Sun Light
  sunLight = new THREE.DirectionalLight(0xfff2e0, 2.5);
  sunLight.position.set(12, 18, 10);
  sunLight.castShadow = true;

  // Shadow camera mapping
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 100;

  const d = 8;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  // 2. Hemispheric Sky Light
  skyLight = new THREE.HemisphereLight(0xb1e1ff, 0x2d2b27, 1.0);
  scene.add(skyLight);

  // 3. Subtle ambient light
  ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);

  // Create Day/Night system objects
  createSkyDome();
  createSunMesh();
  createMoonMesh();
  createStarField();

  // Create Default Material Test Sphere Group
  buildDefaultTestSphere();

  // Handle Resize
  window.addEventListener("resize", onWindowResize);
}

// ============================================================
// Draw checkerboard texture on canvas
// ============================================================
function createCheckerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#2d2d35";
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = "#1e1e24";
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(i * 32, j * 32, 32, 32);
      }
    }
  }

  // Draw grid border lines
  ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 16; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 32, 0);
    ctx.lineTo(i * 32, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * 32);
    ctx.lineTo(512, i * 32);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// ============================================================
// Build the default test sphere stand
// ============================================================
function buildDefaultTestSphere() {
  testSphereGroup = new THREE.Group();

  // 1. Grid Checker Platform
  const platformGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.1, 64);
  const platformMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a20,
    roughness: 0.8,
    metalness: 0.3,
  });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.y = -0.05;
  platform.receiveShadow = true;
  testSphereGroup.add(platform);

  // 2. Chrome torus track around sphere
  const torusGeo = new THREE.TorusGeometry(1.25, 0.04, 16, 100);
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 1.0,
    roughness: 0.08,
  });
  const torus = new THREE.Mesh(torusGeo, chromeMat);
  torus.rotation.x = Math.PI / 2;
  torus.position.y = 1.0;
  torus.castShadow = true;
  torus.receiveShadow = true;
  testSphereGroup.add(torus);

  // 3. Central Material Test Sphere
  const sphereGeo = new THREE.SphereGeometry(1.0, 64, 64);
  const checkerTexture = createCheckerTexture();
  const sphereMat = new THREE.MeshStandardMaterial({
    map: checkerTexture,
    metalness: 0.8,
    roughness: 0.15,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.y = 1.0;
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  testSphereGroup.add(sphere);

  scene.add(testSphereGroup);
}

// ============================================================
// Clean up loaded geometry/material memory
// ============================================================
function disposeCustomModel() {
  if (customModel) {
    scene.remove(customModel);

    customModel.traverse((node: any) => {
      if (node.isMesh) {
        node.geometry.dispose();

        if (Array.isArray(node.material)) {
          node.material.forEach((mat: THREE.Material) => cleanMaterial(mat));
        } else if (node.material) {
          cleanMaterial(node.material);
        }
      }
    });

    customModel = null;
  }
}

function cleanMaterial(mat: THREE.Material) {
  mat.dispose();
  for (const key in mat) {
    if ((mat as any)[key] && (mat as any)[key].isTexture) {
      (mat as any)[key].dispose();
    }
  }
}

// ============================================================
// Import GLTF/GLB file
// ============================================================
function loadModelFromFile(file: File) {
  // Show loading indicator
  progressContainer.classList.remove("hidden");
  progressBar.style.width = "0%";
  progressText.textContent = "0%";

  const fileUrl = URL.createObjectURL(file);

  const loadingManager = new THREE.LoadingManager();

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://unpkg.com/three@0.184.0/examples/jsm/libs/draco/");

  const gltfLoader = new GLTFLoader(loadingManager);
  gltfLoader.setDRACOLoader(dracoLoader);

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const sizeStr =
    parseFloat(sizeMB) >= 1.0 ? `${sizeMB} MB` : `${(file.size / 1024).toFixed(1)} KB`;

  gltfLoader.load(
    fileUrl,
    (gltf) => {
      // SUCCESS
      progressContainer.classList.add("hidden");

      // Clean up previous model / test sphere
      disposeCustomModel();
      scene.remove(testSphereGroup);

      customModel = gltf.scene;

      // Enable shadows recursively
      customModel.traverse((node: any) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          if (node.material.map) {
            node.material.map.anisotropy = 4;
          }
        }
      });

      // Calculate Bounding Box
      const box = new THREE.Box3().setFromObject(customModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      customModel.position.x += customModel.position.x - center.x;
      customModel.position.y += customModel.position.y - center.y;
      customModel.position.z += customModel.position.z - center.z;

      customModel.position.y += size.y / 2;

      const maxDimension = Math.max(size.x, size.y, size.z);
      const targetSize = 3.2;
      const scaleFactor = targetSize / (maxDimension || 1.0);
      customModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

      customModel.position.multiplyScalar(scaleFactor);

      scene.add(customModel);

      camera.position.set(0, 2.5, 5.0);
      controls.target.set(0, (size.y * scaleFactor) / 2, 0);
      controls.update();

      // Parse triangles and vertices
      let tris = 0;
      let verts = 0;
      customModel.traverse((node: any) => {
        if (node.isMesh) {
          const geom = node.geometry;
          if (geom.index) {
            tris += geom.index.count / 3;
          } else if (geom.attributes.position) {
            tris += geom.attributes.position.count / 3;
          }
          if (geom.attributes.position) {
            verts += geom.attributes.position.count;
          }
        }
      });

      detailsPlaceholder.classList.add("hidden");
      detailsContent.classList.remove("hidden");

      detailName.textContent = file.name;
      detailTris.textContent = Math.round(tris).toLocaleString();
      detailVerts.textContent = Math.round(verts).toLocaleString();
      detailSize.textContent = sizeStr;
      detailScale.textContent = `${scaleFactor.toFixed(4)}x`;

      URL.revokeObjectURL(fileUrl);
      dracoLoader.dispose();
    },
    (xhr) => {
      if (xhr.total > 0) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
      } else {
        const loadedKB = (xhr.loaded / 1024).toFixed(0);
        progressText.textContent = `${loadedKB} KB`;
        progressBar.style.width = "60%";
      }
    },
    (err) => {
      console.error("Error loading model:", err);
      progressContainer.classList.add("hidden");
      alert("Failed to load model. Ensure it is a valid GLTF/GLB file.");
      URL.revokeObjectURL(fileUrl);
      dracoLoader.dispose();
    }
  );
}

// ============================================================
// Reset custom model back to default sphere
// ============================================================
function resetToDefaultSphere() {
  disposeCustomModel();
  scene.add(testSphereGroup);

  camera.position.set(0, 3.5, 6.5);
  controls.target.set(0, 1.2, 0);
  controls.update();

  detailsContent.classList.add("hidden");
  detailsPlaceholder.classList.remove("hidden");
}

// ============================================================
// Resize Viewport Callback
// ============================================================
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}

// ============================================================
// Day/Night System: Update all environment based on time
// ============================================================
function updateDayNightSystem(time: number) {
  const vals = getInterpolatedValues(time);

  // Update Sky Dome
  if (skyMesh) {
    const skyMat = skyMesh.material as THREE.ShaderMaterial;
    skyMat.uniforms.uSkyTop.value.copy(vals.skyTop);
    skyMat.uniforms.uSkyBottom.value.copy(vals.skyBottom);
  }

  // Calculate sun position based on time
  // Time 6 = sunrise (horizon east), 12 = noon (overhead), 18 = sunset (horizon west)
  const sunAngle = ((time - 6) / 12) * Math.PI; // 0 at 6am, PI at 6pm
  const sunRadius = 30;
  const sunX = Math.cos(sunAngle) * sunRadius;
  const sunY = Math.sin(sunAngle) * sunRadius;
  const sunZ = 5;

  sunLight.position.set(sunX, Math.max(sunY, 0.5), sunZ);
  sunLight.color.copy(vals.sunColor);
  sunLight.intensity = vals.sunIntensity;

  // Sun mesh position (same as light but visible)
  if (sunMesh) {
    sunMesh.position.set(sunX, sunY, sunZ);
    (sunMesh.material as THREE.MeshBasicMaterial).color.copy(vals.sunEmissive);

    // Hide sun below horizon
    const sunVisible = sunY > -2;
    sunMesh.visible = sunVisible;

    // Sun glow
    const glow = sunMesh.getObjectByName("sunGlow") as THREE.Mesh;
    if (glow) {
      (glow.material as THREE.MeshBasicMaterial).color.copy(vals.sunEmissive);
      (glow.material as THREE.MeshBasicMaterial).opacity = sunVisible ? 0.15 * vals.sunIntensity / 2.5 : 0;
    }
  }

  // Moon position (opposite of sun, 12 hours offset)
  if (moonMesh) {
    const moonAngle = ((time + 6) / 12) * Math.PI; // Overhead at midnight, below at noon
    const moonX = Math.cos(moonAngle) * sunRadius;
    const moonY = Math.sin(moonAngle) * sunRadius;
    moonMesh.position.set(moonX, moonY, -5);
    (moonMesh.material as THREE.MeshBasicMaterial).color.copy(vals.moonEmissive);

    // Moon visibility: visible when sun is mostly below horizon
    const moonVisible = moonY > -2 && vals.sunIntensity < 0.5;
    moonMesh.visible = moonVisible;

    const moonGlow = moonMesh.getObjectByName("moonGlow") as THREE.Mesh;
    if (moonGlow) {
      (moonGlow.material as THREE.MeshBasicMaterial).color.copy(vals.moonEmissive);
      (moonGlow.material as THREE.MeshBasicMaterial).opacity = moonVisible ? 0.12 : 0;
    }
  }

  // Stars visibility
  if (starField) {
    const starMat = starField.material as THREE.ShaderMaterial;
    // Stars visible when sun intensity is low
    const starOpacity = Math.max(0, 1.0 - vals.sunIntensity / 1.0);
    starMat.uniforms.uOpacity.value = starOpacity;
  }

  // Hemisphere light
  skyLight.color.copy(vals.skyColor);
  skyLight.intensity = vals.skyIntensity;

  // Ambient light
  ambientLight.color.copy(vals.ambientColor);
  ambientLight.intensity = vals.ambientIntensity;

  // Fog
  scene.fog = new THREE.FogExp2(vals.fogColor, 0.015);

  // Background
  scene.background = vals.bgColor;

  // Grid visibility (dim at night)
  if (gridHelper) {
    // @ts-ignore
    gridHelper.material.opacity = THREE.MathUtils.lerp(0.03, 0.15, Math.min(vals.sunIntensity / 1.5, 1.0));
  }
}

// ============================================================
// Get phase name from time
// ============================================================
function getPhaseName(time: number): string {
  time = ((time % 24) + 24) % 24;
  if (time < 4) return "Deep Night";
  if (time < 5.5) return "Pre-Dawn";
  if (time < 7) return "Dawn";
  if (time < 9) return "Morning";
  if (time < 15) return "Daytime";
  if (time < 17) return "Afternoon";
  if (time < 18.5) return "Dusk";
  if (time < 20) return "Twilight";
  return "Night";
}

// ============================================================
// Get sun altitude in degrees
// ============================================================
function getSunAltitude(time: number): number {
  const sunAngle = ((time - 6) / 12) * Math.PI;
  const altitude = Math.sin(sunAngle) * 90;
  return Math.round(Math.max(-90, Math.min(90, altitude)));
}

// ============================================================
// Format time as HH:MM
// ============================================================
function formatTime(time: number): string {
  time = ((time % 24) + 24) % 24;
  const hours = Math.floor(time);
  const minutes = Math.floor((time - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

// ============================================================
// Update Day/Night UI info
// ============================================================
function updateDayNightUI() {
  if (valTimeOfDay) {
    valTimeOfDay.textContent = formatTime(timeOfDay);
  }
  if (dnSunAlt) {
    const alt = getSunAltitude(timeOfDay);
    dnSunAlt.textContent = `${alt}°`;
  }
  if (dnPhase) {
    dnPhase.textContent = getPhaseName(timeOfDay);
  }
}

// ============================================================
// Setup Event Listeners
// ============================================================
function setupListeners() {
  // Renderer API switch
  apiSelect.addEventListener("change", () => {
    const api = apiSelect.value as "webgpu" | "webgl2";
    initRenderer(api);
  });

  // Light Sliders (manual override - does NOT affect day/night system directly)
  sliderSunIntensity.addEventListener("input", () => {
    const val = parseFloat(sliderSunIntensity.value);
    valSunIntensity.textContent = `${val.toFixed(1)}x`;
    // When day/night is active, this acts as a multiplier
    if (!dayNightCycleEnabled) {
      sunLight.intensity = val;
    }
  });

  sliderSunTemp.addEventListener("input", () => {
    const val = parseInt(sliderSunTemp.value);
    valSunTemp.textContent = `${val}K`;
    const color = convertTemperatureToColor(val);
    if (!dayNightCycleEnabled) {
      sunLight.color.copy(color);
    }
  });

  sliderSkyIntensity.addEventListener("input", () => {
    const val = parseFloat(sliderSkyIntensity.value);
    valSkyIntensity.textContent = `${val.toFixed(1)}x`;
    if (!dayNightCycleEnabled) {
      skyLight.intensity = val;
    }
  });

  // ---- Day/Night System Controls ----

  // Time of Day Slider
  sliderTimeOfDay.addEventListener("input", () => {
    timeOfDay = parseFloat(sliderTimeOfDay.value);
    updateDayNightUI();
  });

  // Auto Cycle Toggle
  toggleDayNightCycle.addEventListener("change", () => {
    dayNightCycleEnabled = toggleDayNightCycle.checked;
    if (dayNightCycleEnabled) {
      cycleSpeedGroup.classList.remove("cycle-speed-disabled");
    } else {
      cycleSpeedGroup.classList.add("cycle-speed-disabled");
    }
  });

  // Cycle Speed Slider
  sliderCycleSpeed.addEventListener("input", () => {
    cycleSpeed = parseFloat(sliderCycleSpeed.value);
    valCycleSpeed.textContent = `${cycleSpeed.toFixed(1)}x`;
  });

  // Preset Buttons
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const time = parseFloat(btn.getAttribute("data-time") || "12");
      timeOfDay = time;
      sliderTimeOfDay.value = time.toString();
      updateDayNightUI();

      // Update active state
      presetButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Import button trigger
  btnImport.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files[0]) {
      loadModelFromFile(fileInput.files[0]);
    }
  });

  // Clear Model
  btnClearModel.addEventListener("click", () => {
    resetToDefaultSphere();
  });

  // Reset Camera View
  btnResetView.addEventListener("click", () => {
    if (customModel) {
      const box = new THREE.Box3().setFromObject(customModel);
      const size = box.getSize(new THREE.Vector3());
      camera.position.set(0, 2.5, 5.0);
      controls.target.set(0, size.y / 2, 0);
    } else {
      camera.position.set(0, 3.5, 6.5);
      controls.target.set(0, 1.2, 0);
    }
    controls.update();
  });

  // Full Screen Drag & Drop listeners
  window.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dropZoneOverlay.classList.add("active");
  });

  dropZoneOverlay.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  dropZoneOverlay.addEventListener("dragleave", (e) => {
    const rect = dropZoneOverlay.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      dropZoneOverlay.classList.remove("active");
    }
  });

  dropZoneOverlay.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZoneOverlay.classList.remove("active");

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "gltf" || extension === "glb") {
        loadModelFromFile(file);
      } else {
        alert("Unsupported file format. Please drop a .gltf or .glb model.");
      }
    }
  });
}

// ============================================================
// Convert Color Temperature (Kelvin) to RGB color
// ============================================================
function convertTemperatureToColor(kelvin: number): THREE.Color {
  let temp = kelvin / 100;
  let r = 0,
    g = 0,
    b = 0;

  if (temp <= 66) {
    r = 255;
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
    if (temp <= 19) {
      b = 0;
    } else {
      b = temp - 10;
      b = 138.5177312231 * Math.log(b) - 305.0447927307;
    }
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
    b = 255;
  }

  const clamp = (x: number) => Math.max(0, Math.min(255, x));
  return new THREE.Color(clamp(r) / 255, clamp(g) / 255, clamp(b) / 255);
}

// ============================================================
// Simulation loop
// ============================================================
function animate() {
  animationFrameId = requestAnimationFrame(animate);

  const time = performance.now();
  const timeSeconds = time * 0.001;

  // Calculate FPS
  frameCount++;
  if (timeSeconds - lastTime >= 1.0) {
    fps = Math.round(frameCount * 1.0) / (timeSeconds - lastTime);
    fpsCounter.textContent = fps.toString();
    frameCount = 0;
    lastTime = timeSeconds;
  }

  // Update OrbitControls
  controls.update();

  // Day/Night auto cycle
  if (dayNightCycleEnabled) {
    // At speed 1.0, full 24h cycle takes ~24 seconds
    // cycleSpeed scales this: speed 10 = ~2.4s full cycle, speed 0.1 = ~240s
    timeOfDay += cycleSpeed * 0.016; // ~60fps frame time
    if (timeOfDay >= 24) timeOfDay -= 24;
    if (timeOfDay < 0) timeOfDay = 0;

    // Update slider position
    sliderTimeOfDay.value = timeOfDay.toString();
  }

  // Update the day/night system
  updateDayNightSystem(timeOfDay);
  updateDayNightUI();

  // Update star twinkle
  if (starField) {
    const starMat = starField.material as THREE.ShaderMaterial;
    starMat.uniforms.uTime.value = timeSeconds;
  }

  // Rotate materials test sphere slowly
  if (testSphereGroup) {
    const sphere = testSphereGroup.children[2];
    if (sphere) {
      sphere.rotation.y = timeSeconds * 0.1;
    }
  }

  // Render Scene
  if (renderer) {
    renderer.render(scene, camera);
  }
}

// ============================================================
// Entry Point
// ============================================================
window.addEventListener("DOMContentLoaded", async () => {
  // Query Dom - Existing Elements
  apiSelect = document.getElementById("api-select") as HTMLSelectElement;
  sliderSunIntensity = document.getElementById("slider-sun-intensity") as HTMLInputElement;
  sliderSunTemp = document.getElementById("slider-sun-temp") as HTMLInputElement;
  sliderSkyIntensity = document.getElementById("slider-sky-intensity") as HTMLInputElement;

  valSunIntensity = document.getElementById("val-sun-intensity") as HTMLElement;
  valSunTemp = document.getElementById("val-sun-temp") as HTMLElement;
  valSkyIntensity = document.getElementById("val-sky-intensity") as HTMLElement;

  btnImport = document.getElementById("btn-import") as HTMLButtonElement;
  fileInput = document.getElementById("file-input") as HTMLInputElement;
  btnClearModel = document.getElementById("btn-clear-model") as HTMLButtonElement;
  btnResetView = document.getElementById("btn-reset-view") as HTMLButtonElement;

  progressContainer = document.getElementById("progress-container") as HTMLElement;
  progressBar = document.getElementById("progress-bar") as HTMLElement;
  progressText = document.getElementById("progress-text") as HTMLElement;

  detailsPlaceholder = document.getElementById("details-placeholder") as HTMLElement;
  detailsContent = document.getElementById("details-content") as HTMLElement;
  detailName = document.getElementById("detail-name") as HTMLElement;
  detailTris = document.getElementById("detail-tris") as HTMLElement;
  detailVerts = document.getElementById("detail-verts") as HTMLElement;
  detailSize = document.getElementById("detail-size") as HTMLElement;
  detailScale = document.getElementById("detail-scale") as HTMLElement;

  fpsCounter = document.getElementById("fps-counter") as HTMLElement;
  hudApi = document.getElementById("hud-api") as HTMLElement;
  hudGpu = document.getElementById("hud-gpu") as HTMLElement;
  dropZoneOverlay = document.getElementById("drop-zone-overlay") as HTMLElement;

  // Query Dom - Day/Night System Elements
  sliderTimeOfDay = document.getElementById("slider-time-of-day") as HTMLInputElement;
  valTimeOfDay = document.getElementById("val-time-of-day") as HTMLElement;
  toggleDayNightCycle = document.getElementById("toggle-daynight-cycle") as HTMLInputElement;
  sliderCycleSpeed = document.getElementById("slider-cycle-speed") as HTMLInputElement;
  valCycleSpeed = document.getElementById("val-cycle-speed") as HTMLElement;
  dnSunAlt = document.getElementById("dn-sun-alt") as HTMLElement;
  dnPhase = document.getElementById("dn-phase") as HTMLElement;
  presetButtons = document.querySelectorAll(".btn-preset") as NodeListOf<HTMLButtonElement>;
  cycleSpeedGroup = document.getElementById("cycle-speed-group") as HTMLElement;

  // Set initial disabled state for cycle speed
  cycleSpeedGroup.classList.add("cycle-speed-disabled");

  // Initialize Graphics & Environment
  initScene();
  setupListeners();

  // Apply initial day/night state
  updateDayNightSystem(timeOfDay);
  updateDayNightUI();

  // Run on WebGPU when starting the engine (if supported)
  const defaultMode = isWebGPUSupported() ? "webgpu" : "webgl2";
  await initRenderer(defaultMode);
});