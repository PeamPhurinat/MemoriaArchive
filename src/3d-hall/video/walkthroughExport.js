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
 * Call this after `initMemoryHall` has run and placed its context on the container:
 *   const ctx = container.__memoriaWalkthroughContext;
 *   initWalkthroughExport({ ...ctx, container, memoryTitles });
 *
 * @param {{
 *   camera: import('three').PerspectiveCamera,
 *   renderer: import('three').WebGLRenderer,
 *   worldBuilder: import('../world/WorldBuilder').WorldBuilder,
 *   controls: import('three/examples/jsm/controls/PointerLockControls').PointerLockControls,
 *   orbitControls: import('three/examples/jsm/controls/OrbitControls').OrbitControls,
 *   container: HTMLElement,
 *   memoryTitles?: string[],
 * }} options
 */
export function initWalkthroughExport({
  scene,
  camera,
  renderer,
  worldBuilder,
  controls,
  orbitControls,
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
    // Find the actual station groups in the scene (supports user-moved stations).
    // Stations are registered with userData.isCustomizable and componentId "memory-*".
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

    // Disable user controls so they can't interfere during recording
    try { controls?.unlock?.(); } catch (_) { /* ignore */ }
    if (orbitControls) orbitControls.enabled = false;

    // Build camera path from actual (possibly moved) station positions
    const allStations = getStationPositions();
    const count = memoryTitles.length > 0
      ? Math.min(memoryTitles.length, allStations.length)
      : allStations.length;

    cameraPath = new CameraPath(allStations.slice(0, count), memoryTitles.slice(0, count));

    cameraPath.onStationStart = (_index, title) => {
      ui.updateProgress(cameraPath.progress, title);
    };

    cameraPath.onComplete = () => {
      // Path finished — camera stays at last station, user decides when to stop
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      ui.updateProgress(1, 'All memories visited');
      ui.showStopButton(finishWalkthrough);
    };

    // Show recording UI and start capturing
    ui.setRecording(true);
    ui.updateProgress(0, 'Starting walkthrough…');
    recorder.start(renderer.domElement);

    // Begin our own RAF loop to drive the camera path
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!isActive) return;

    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    cameraPath.update(delta, camera);
    ui.updateProgress(cameraPath.progress, cameraPath.currentLabel);

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

    // Restore camera to where the user left it
    if (savedPos) camera.position.copy(savedPos);
    if (savedQuat) camera.quaternion.copy(savedQuat);

    // Restore controls to their original state (view mode = orbitControls off)
    if (orbitControls) orbitControls.enabled = false;

    ui.setRecording(false);
  }

  return { start: startWalkthrough, stop: finishWalkthrough };
}
