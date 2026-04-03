import { CameraPath } from './CameraPath.js';
import { WalkthroughRecorder } from './WalkthroughRecorder.js';
import { WalkthroughUI } from './WalkthroughUI.js';

/** Default memory station positions — matches WorldBuilder.js slot order */
const DEFAULT_SLOT_POSITIONS = [
  { x: -11, z: 18 },
  { x: 10, z: 4 },
  { x: -9, z: -11 },
  { x: 11, z: -28 },
  { x: -10, z: -45 },
];

/**
 * Attach the walkthrough-video export system to an existing Memory Hall scene.
 *
 * @param {{
 *   scene: import('three').Scene,
 *   camera: import('three').PerspectiveCamera,
 *   renderer: import('three').WebGLRenderer,
 *   controls: import('three/examples/jsm/controls/PointerLockControls').PointerLockControls,
 *   orbitControls: import('three/examples/jsm/controls/OrbitControls').OrbitControls,
 *   animate: Function,
 *   container: HTMLElement,
 *   memoryTitles?: string[],
 * }} options
 */
export function initWalkthroughExport({
  scene,
  camera,
  renderer,
  controls,
  orbitControls,
  animate,
  container,
  memoryTitles = [],
}) {
  const ui = new WalkthroughUI();
  const recorder = new WalkthroughRecorder();

  let isActive = false;
  let cameraPath = null;
  let rafId = null;
  let lastTime = 0;
  let savedPos = null;
  let savedQuat = null;

  ui.mount(container, startWalkthrough);

  // ── Helpers ──────────────────────────────────────────────────────

  function getStationPositions() {
    // Find actual station groups in the scene (supports user-moved stations).
    if (scene) {
      const groups = scene.children.filter(
        (obj) =>
          obj.userData?.isCustomizable &&
          typeof obj.userData?.componentId === 'string' &&
          obj.userData.componentId.startsWith('memory-')
      );
      if (groups.length > 0) {
        return groups.map((g) => ({ x: g.position.x, z: g.position.z }));
      }
    }
    return DEFAULT_SLOT_POSITIONS;
  }

  // ── Core flow ────────────────────────────────────────────────────

  function startWalkthrough() {
    if (isActive) return;

    if (typeof renderer.domElement.captureStream !== 'function') {
      alert(
        'Video capture is not supported in this browser.\n' +
        'Try Chrome or Edge for best results.'
      );
      return;
    }

    isActive = true;

    // Save camera state so we can restore it afterward
    savedPos = camera.position.clone();
    savedQuat = camera.quaternion.clone();

    // Disable all user controls
    try { controls?.unlock?.(); } catch (_) { /* ignore */ }
    if (orbitControls) orbitControls.enabled = false;

    // Stop the scene's own animation loop — we take over rendering completely.
    // This prevents orbitControls.update() and other interference.
    renderer.setAnimationLoop(null);

    // Build camera path
    const allStations = getStationPositions();
    const count = memoryTitles.length > 0
      ? Math.min(memoryTitles.length, allStations.length)
      : allStations.length;

    cameraPath = new CameraPath(allStations.slice(0, count), memoryTitles.slice(0, count));

    cameraPath.onStationStart = (_index, title) => {
      ui.updateProgress(cameraPath.progress, title);
    };

    cameraPath.onComplete = () => {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      ui.updateProgress(1, 'All memories visited');
      ui.showStopButton(finishWalkthrough);
    };

    // Show recording UI and start capturing
    ui.setRecording(true);
    ui.updateProgress(0, 'Starting walkthrough…');
    recorder.start(renderer.domElement);

    // Begin our RAF loop — we render every frame ourselves
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!isActive) return;

    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Advance camera along the path
    cameraPath.update(delta, camera);
    ui.updateProgress(cameraPath.progress, cameraPath.currentLabel);

    // Render the scene with our camera position
    renderer.render(scene, camera);

    if (!cameraPath.isComplete) {
      rafId = requestAnimationFrame(tick);
    }
  }

  async function finishWalkthrough() {
    isActive = false;

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    ui.updateProgress(1, 'Saving video…');

    await recorder.stop('memoria-walkthrough');

    // Restore camera
    if (savedPos) camera.position.copy(savedPos);
    if (savedQuat) camera.quaternion.copy(savedQuat);

    // Restore controls
    if (orbitControls) orbitControls.enabled = false;

    // Restore the scene's animation loop
    if (typeof animate === 'function') {
      renderer.setAnimationLoop(animate);
    }

    ui.setRecording(false);
  }

  return { start: startWalkthrough, stop: finishWalkthrough };
}
