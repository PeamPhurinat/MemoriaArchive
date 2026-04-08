import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { AppShell } from "../3d-hall/ui/AppShell.js";
import { WorldBuilder } from "../3d-hall/world/WorldBuilder.js";
import { WORLD_THEMES, ACTIVE_USER_STORAGE_KEY, THEME_STORAGE_KEY, AUTO_SAVE_DELAY_MS } from "./scene/constants.js";
import { normalizeUserId, normalizeProjectId, getThemeStorageKey } from "./scene/sceneUtils.js";
import { ThemeManager } from "./scene/ThemeManager.js";
import { LayoutManager } from "./scene/LayoutManager.js";
import { SelectionManager } from "./scene/SelectionManager.js";

export function initMemoryHall(container, memoriesData, context = {}) {
const app = container;
const appShell = new AppShell(app);
document.body.removeAttribute("data-world-theme");

const {
  backButton,
  launchButton,
  menuToggleButton,
  menuPanel,
  modeToggleButton,
  themeToggleButton,
  themePicker,
  themeOptionButtons,
  customPanel,
  customStatus,
  userIdInput,
  moveButton,
  resizeButton,
  deleteButton,
  scaleSlider,
  scaleValue,
  heightSlider,
  heightValue,
  saveButton,
  loadButton,
  resetButton,
  reticle,
  addObjectButton,
  objectPalette,
  paletteCloseButton,
  paletteItems,
} = appShell;

// ================================================================
// Scene setup
// ================================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc4c8cc);
scene.fog = new THREE.FogExp2(0xcdd1d4, 0.006);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 400);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
app.append(renderer.domElement);

const vrButton = VRButton.createButton(renderer);
vrButton.classList.add("vr-button");
document.body.append(vrButton);

if (backButton && typeof context.onBack === "function") {
  backButton.addEventListener("click", context.onBack);
}

// ================================================================
// Constants / IDs
// ================================================================
const AUTHENTICATED_USER_ID = normalizeUserId(context.userId || "");
const ACTIVE_PROJECT_ID     = normalizeProjectId(context.projectId || "");
const READ_ONLY             = Boolean(context.readOnly);
const PROFILE_PHOTO         = context.profilePhoto || null;
const DISPLAY_NAME          = String(context.displayName || "").trim();
const PROJECT_TITLE         = String(context.projectTitle || "").trim();

// ================================================================
// Shared state
// ================================================================
const customState = { mode: "view", selectedId: null, transformMode: "translate" };
const autoSaveState = { timerId: null };
const customizableComponents = new Map();
const defaultLayoutStates    = new Map();
const raycaster     = new THREE.Raycaster();
const pointer       = new THREE.Vector2();
const dragIntersection = new THREE.Vector3();
const customDrag = {
  isPointerDown: false,
  isDragging: false,
  pointerId: null,
  component: null,
  offset: new THREE.Vector3(),
  plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
};
const spawnedComponentIds = new Set();
const spawnCounter = { value: 0 };    // boxed so LayoutManager/SelectionManager share the ref
const paletteDrag = { type: null };
const themeState = { active: "dream", materialBases: new Map(), lightBases: new Map(), pulseBases: new Map() };

// ================================================================
// Ghost + selection helpers
// ================================================================
const ghostMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.7, 0.7, 0.08, 24),
  new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }),
);
ghostMesh.visible = false;
scene.add(ghostMesh);

const selectionOutline = new THREE.BoxHelper(undefined, 0xff8fca);
selectionOutline.visible = false;
scene.add(selectionOutline);

// ================================================================
// Controls
// ================================================================
const controls = new PointerLockControls(camera, renderer.domElement);
const controlObject =
  controls.object ?? (typeof controls.getObject === "function" ? controls.getObject() : camera);
controlObject.position.set(0, 1.7, 42);
scene.add(controlObject);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enabled = false;
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.08;
orbitControls.minDistance = 6;
orbitControls.maxDistance = 150;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.08;
orbitControls.target.set(0, 1.7, -12);
orbitControls.update();

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.enabled = false;
transformControls.setSize(1.15);
transformControls.setMode(customState.transformMode);
transformControls.showX = true;
transformControls.showY = true;
transformControls.showZ = true;
scene.add(transformControls);

// ================================================================
// World / animation arrays
// ================================================================
const animatedObjects = [];
const pulseLights = [];
const world = { size: 160, minY: 1.7, maxY: 42 };
const clock = new THREE.Clock();

// ================================================================
// Helpers used across managers
// ================================================================
function setCustomStatus(message) {
  customStatus.textContent = message;
}

function registerCustomizableComponent(componentId, component, metadata = {}) {
  customizableComponents.set(componentId, component);
  component.userData.componentId = componentId;
  component.userData.componentMetadata = metadata;
  defaultLayoutStates.set(componentId, captureComponentState(component));
}

function captureComponentState(component) {
  return {
    position: component.position.toArray(),
    rotation: [component.rotation.x, component.rotation.y, component.rotation.z],
    scale: component.scale.toArray(),
    visible: component.visible !== false,
  };
}

function applyComponentState(component, state) {
  if (!component || !state) return;
  if (Array.isArray(state.position) && state.position.length === 3) {
    component.position.set(state.position[0], state.position[1], state.position[2]);
  }
  if (Array.isArray(state.rotation) && state.rotation.length === 3) {
    component.rotation.set(state.rotation[0], state.rotation[1], state.rotation[2]);
  }
  if (Array.isArray(state.scale) && state.scale.length === 3) {
    component.scale.set(state.scale[0], state.scale[1], state.scale[2]);
    selectionMgr.clampScale(component);
  }
  component.visible = state.visible !== false;
}

function getCurrentUserId() {
  if (AUTHENTICATED_USER_ID) {
    // Keep the display showing the name but always return the real UUID for storage keys
    userIdInput.value = DISPLAY_NAME || AUTHENTICATED_USER_ID;
    return AUTHENTICATED_USER_ID;
  }
  const userId = normalizeUserId(userIdInput.value);
  userIdInput.value = userId;
  localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
  return userId;
}

function getCurrentProjectId() {
  return ACTIVE_PROJECT_ID;
}

function setMenuOpen(isOpen) {
  menuPanel.classList.toggle("is-visible", isOpen);
  menuToggleButton.setAttribute("aria-expanded", String(isOpen));
}

function setThemePickerOpen(isOpen) {
  themePicker.classList.toggle("is-visible", isOpen);
  themeToggleButton.setAttribute("aria-expanded", String(isOpen));
}

function setObjectPaletteOpen(isOpen) {
  if (!objectPalette) return;
  objectPalette.classList.toggle("is-visible", isOpen);
  objectPalette.setAttribute("aria-hidden", String(!isOpen));
  if (addObjectButton) addObjectButton.classList.toggle("is-active", isOpen);
}

// ================================================================
// WorldBuilder
// ================================================================
const worldBuilder = new WorldBuilder({
  scene, animatedObjects, pulseLights, world, registerCustomizableComponent, memoriesData,
  profilePhoto: PROFILE_PHOTO,
});

// ================================================================
// Managers
// ================================================================
const themeMgr = new ThemeManager({
  scene, pulseLights, worldBuilder, themeState, app, selectionOutline,
  themeOptionButtons,
  getCurrentUserId,
  setCustomStatus,
  scheduleAutoSave: () => layoutMgr.scheduleAutoSave(),
});

const layoutMgr = new LayoutManager({
  customizableComponents, defaultLayoutStates, spawnedComponentIds, spawnCounter,
  themeState, worldBuilder, autoSaveState, READ_ONLY, AUTO_SAVE_DELAY_MS,
  getCurrentUserId, getCurrentProjectId,
  getDisplayName: () => DISPLAY_NAME,
  getProjectTitle: () => PROJECT_TITLE,
  captureComponentState, applyComponentState,
  clearAllSpawnedObjects: () => layoutMgr.clearAllSpawnedObjects(),
  applyTheme: (k, o) => themeMgr.applyTheme(k, o),
  captureThemeBaseline: () => themeMgr.captureThemeBaseline(),
  clearSelection: () => selectionMgr.clearSelection(),
  updateScaleUi: () => selectionMgr.updateScaleUi(),
  setCustomStatus,
  registerCustomizableComponent,
});

const selectionMgr = new SelectionManager({
  scene, camera, renderer, world, customState,
  customizableComponents, defaultLayoutStates, spawnedComponentIds, spawnCounter,
  transformControls, orbitControls, selectionOutline,
  raycaster, pointer, dragIntersection, customDrag,
  worldBuilder,
  moveButton, resizeButton, scaleSlider, scaleValue, heightSlider, heightValue,
  setCustomStatus,
  scheduleAutoSave: () => layoutMgr.scheduleAutoSave(),
  captureThemeBaseline: () => themeMgr.captureThemeBaseline(),
  applyTheme: (k, o) => themeMgr.applyTheme(k, o),
  themeState,
  registerCustomizableComponent,
});

// ================================================================
// TransformControls events (need manager refs)
// ================================================================
transformControls.addEventListener("dragging-changed", (event) => {
  orbitControls.enabled = customState.mode === "custom" && !event.value;
});
transformControls.addEventListener("objectChange", () => {
  const selected = selectionMgr.getSelectedComponent();
  if (selected) selectionMgr.clampScale(selected);
  selectionMgr.updateScaleUi();
  selectionMgr.updateHeightUi();
  selectionMgr.updateSelectionOutline();
  layoutMgr.scheduleAutoSave();
});

// ================================================================
// Canvas pointer events
// ================================================================
renderer.domElement.addEventListener("pointerdown",  (e) => selectionMgr.handleCanvasPointerDown(e));
renderer.domElement.addEventListener("pointermove",  (e) => selectionMgr.handleCanvasPointerMove(e));
renderer.domElement.addEventListener("pointerup",    ()  => selectionMgr.handleCanvasPointerUp());
renderer.domElement.addEventListener("pointerleave", ()  => selectionMgr.handleCanvasPointerUp());

// ================================================================
// PointerLockControls events
// ================================================================
launchButton.addEventListener("click", () => {
  if (customState.mode === "view") controls.lock();
});
renderer.domElement.addEventListener("click", () => {
  if (!controls.isLocked && customState.mode === "view") controls.lock();
});
controls.addEventListener("lock", () => {
  if (customState.mode === "view") {
    launchButton.classList.add("is-hidden");
    reticle.classList.add("is-visible");
  }
});
controls.addEventListener("unlock", () => {
  if (customState.mode === "view") {
    launchButton.classList.remove("is-hidden");
    reticle.classList.remove("is-visible");
  }
});

// ================================================================
// Keyboard movement
// ================================================================
const movement = { forward: false, backward: false, left: false, right: false, up: false, down: false, sprint: false };
const MOVEMENT_KEY_CODES = new Set(["KeyW","KeyA","KeyS","KeyD","Space","ControlLeft","ControlRight","ShiftLeft","ShiftRight"]);
const SHORTCUT_BLOCKED_MOVE_KEYS = new Set(["KeyW","KeyA","KeyS","KeyD"]);

function suppressLockedMovementShortcuts(event) {
  if (!(controls.isLocked && customState.mode === "view")) return;
  if (!(event.ctrlKey || event.metaKey)) return;
  if (!SHORTCUT_BLOCKED_MOVE_KEYS.has(event.code)) return;
  event.preventDefault();
  event.stopPropagation();
  if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
}
window.addEventListener("keydown", suppressLockedMovementShortcuts, true);
window.addEventListener("keyup",   suppressLockedMovementShortcuts, true);

document.addEventListener("keydown", (event) => {
  const isTypingField =
    document.activeElement === userIdInput ||
    document.activeElement?.tagName === "INPUT" ||
    document.activeElement?.tagName === "TEXTAREA";
  const isLockedViewMode = controls.isLocked && customState.mode === "view";

  if (customState.mode === "custom" && !isTypingField) {
    if (event.code === "KeyE") { selectionMgr.setTransformMode("translate"); return; }
    if (event.code === "KeyR") { selectionMgr.setTransformMode("scale"); return; }
    if (event.code === "Delete" || event.code === "Backspace") { selectionMgr.deleteSelectedComponent(); return; }
  }
  if (isTypingField) return;
  if (isLockedViewMode && MOVEMENT_KEY_CODES.has(event.code)) event.preventDefault();

  switch (event.code) {
    case "KeyW": movement.forward = true; break;
    case "KeyS": movement.backward = true; break;
    case "KeyA": movement.left = true; break;
    case "KeyD": movement.right = true; break;
    case "Space": movement.up = true; event.preventDefault(); break;
    case "AltLeft": case "AltRight": movement.down = true; break;
    case "ShiftLeft": case "ShiftRight": movement.sprint = true; break;
    default: break;
  }
});

document.addEventListener("keyup", (event) => {
  if (controls.isLocked && customState.mode === "view" && MOVEMENT_KEY_CODES.has(event.code)) event.preventDefault();
  switch (event.code) {
    case "KeyW": movement.forward = false; break;
    case "KeyS": movement.backward = false; break;
    case "KeyA": movement.left = false; break;
    case "KeyD": movement.right = false; break;
    case "Space": movement.up = false; break;
    case "AltLeft": case "AltRight": movement.down = false; break;
    case "ShiftLeft": case "ShiftRight": movement.sprint = false; break;
    default: break;
  }
});

function resetMovementFlags() {
  movement.forward = movement.backward = movement.left = movement.right = movement.up = movement.down = false;
}

// ================================================================
// Lighting
// ================================================================
const ambientLight = new THREE.AmbientLight(0xffffff, 1.7);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xe6e6e6, 2.1);
moonLight.position.set(-28, 40, 18);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(2048, 2048);
moonLight.shadow.camera.near = 1;
moonLight.shadow.camera.far = 180;
moonLight.shadow.camera.left = -50;
moonLight.shadow.camera.right = 50;
moonLight.shadow.camera.top = 50;
moonLight.shadow.camera.bottom = -50;
scene.add(moonLight);

const hemiLight = new THREE.HemisphereLight(0xd2d2d2, 0x777777, 1.1);
scene.add(hemiLight);

const magentaGlow = new THREE.PointLight(0xffffff, 62, 120, 2);
magentaGlow.position.set(0, 8, 0);
scene.add(magentaGlow);
pulseLights.push({ light: magentaGlow, base: 60, speed: 1.4, range: 8 });

const violetGlow = new THREE.PointLight(0xdedede, 52, 140, 2);
violetGlow.position.set(-24, 12, -18);
scene.add(violetGlow);
pulseLights.push({ light: violetGlow, base: 50, speed: 1.1, range: 6 });

const peachGlow = new THREE.PointLight(0xc4c4c4, 42, 120, 2);
peachGlow.position.set(22, 7, 26);
scene.add(peachGlow);
pulseLights.push({ light: peachGlow, base: 40, speed: 1.7, range: 5 });

// ================================================================
// Build world
// ================================================================
worldBuilder.buildAll(memoriesData);
themeMgr.captureThemeBaseline();
initializeCustomizer();

// ================================================================
// setMode
// ================================================================
function setMode(mode) {
  const previousMode = customState.mode;
  const nextMode = mode === "custom" ? "custom" : "view";
  customState.mode = nextMode;
  const isCustomMode = nextMode === "custom";

  const modeLabel = modeToggleButton.querySelector("span:last-child");
  if (modeLabel) modeLabel.textContent = isCustomMode ? "View Mode" : "Custom Mode";
  modeToggleButton.classList.toggle("is-active", isCustomMode);
  modeToggleButton.setAttribute("aria-pressed", String(isCustomMode));
  customPanel.classList.toggle("is-visible", isCustomMode);
  launchButton.classList.toggle("is-disabled", isCustomMode);
  resetMovementFlags();

  if (isCustomMode) {
    controls.unlock();
    launchButton.classList.remove("is-hidden");
    reticle.classList.remove("is-visible");
    orbitControls.enabled = true;
    selectionMgr.syncTransformControls();
    setCustomStatus("Custom mode enabled. Click a memory station to edit it.");
  } else {
    orbitControls.enabled = false;
    selectionMgr.stopCustomDrag();
    selectionMgr.clearSelection();
    selectionMgr.syncTransformControls();
    setObjectPaletteOpen(false);
    ghostMesh.visible = false;
    setCustomStatus("View mode enabled.");
    if (previousMode === "custom") layoutMgr.scheduleAutoSave();
  }
  setMenuOpen(false);
  setThemePickerOpen(false);
}

// ================================================================
// initializeCustomizer
// ================================================================
function initializeCustomizer() {
  if (READ_ONLY) {
    if (modeToggleButton) modeToggleButton.style.display = "none";
    if (saveButton)  saveButton.style.display  = "none";
    if (loadButton)  loadButton.style.display  = "none";
    if (resetButton) resetButton.style.display = "none";
    if (customPanel) customPanel.style.display = "none";
    if (userIdInput) {
      const labelEl = userIdInput.closest && userIdInput.closest(".custom-label");
      if (labelEl) labelEl.style.display = "none";
    }
  }

  const savedUserId = AUTHENTICATED_USER_ID || localStorage.getItem(ACTIVE_USER_STORAGE_KEY) || "guest";
  userIdInput.value = AUTHENTICATED_USER_ID ? (DISPLAY_NAME || normalizeUserId(savedUserId)) : normalizeUserId(savedUserId);
  userIdInput.disabled = Boolean(AUTHENTICATED_USER_ID);
  userIdInput.title = AUTHENTICATED_USER_ID ? (DISPLAY_NAME ? `Signed in as ${DISPLAY_NAME}` : "Authenticated account is used automatically.") : "";

  const currentUserId = getCurrentUserId();
  const storedTheme =
    localStorage.getItem(getThemeStorageKey(currentUserId, getCurrentProjectId())) ||
    localStorage.getItem(THEME_STORAGE_KEY);
  themeMgr.applyTheme(storedTheme && WORLD_THEMES[storedTheme] ? storedTheme : "dream", { silent: true, persist: false });

  menuToggleButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const shouldOpen = !menuPanel.classList.contains("is-visible");
    setMenuOpen(shouldOpen);
    if (!shouldOpen) setThemePickerOpen(false);
  });

  themeToggleButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!menuPanel.classList.contains("is-visible")) setMenuOpen(true);
    setThemePickerOpen(!themePicker.classList.contains("is-visible"));
  });

  themeOptionButtons.forEach((button) => {
    button.addEventListener("click", () => themeMgr.applyTheme(button.dataset.theme));
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (menuPanel.contains(target) || menuToggleButton.contains(target)) return;
    setThemePickerOpen(false);
    setMenuOpen(false);
  });

  modeToggleButton.addEventListener("click", () => setMode(customState.mode === "view" ? "custom" : "view"));

  moveButton.addEventListener("click",   () => selectionMgr.setTransformMode("translate"));
  resizeButton.addEventListener("click", () => selectionMgr.setTransformMode("scale"));
  deleteButton.addEventListener("click", () => selectionMgr.deleteSelectedComponent());

  scaleSlider.addEventListener("input", () => {
    const selected = selectionMgr.getSelectedComponent();
    if (!selected || selected.visible === false) return;
    const nextScale = THREE.MathUtils.clamp(Number(scaleSlider.value), 0.35, 3);
    selected.scale.setScalar(nextScale);
    selectionMgr.clampScale(selected);
    selectionMgr.updateScaleUi();
    selectionMgr.updateSelectionOutline();
    layoutMgr.scheduleAutoSave();
  });

  heightSlider.addEventListener("input", () => {
    const selected = selectionMgr.getSelectedComponent();
    if (!selected || selected.visible === false) return;
    selected.position.y = THREE.MathUtils.clamp(Number(heightSlider.value), 0, 12);
    selectionMgr.updateHeightUi();
    selectionMgr.updateSelectionOutline();
    layoutMgr.scheduleAutoSave();
  });

  saveButton.addEventListener("click",  async () => layoutMgr.saveLayoutForUser(getCurrentUserId()));
  loadButton.addEventListener("click",  async () => layoutMgr.loadLayoutForUser(getCurrentUserId()));
  resetButton.addEventListener("click", () => {
    layoutMgr.restoreDefaultLayout();
    selectionMgr.clearSelection();
    layoutMgr.scheduleAutoSave();
    setCustomStatus(`Layout reset for "${DISPLAY_NAME || getCurrentUserId()}" in project "${PROJECT_TITLE || getCurrentProjectId()}".`);
  });

  userIdInput.addEventListener("change", () => setCustomStatus(`Active user: "${DISPLAY_NAME || getCurrentUserId()}".`));

  // ---- Object palette ----
  if (addObjectButton) {
    addObjectButton.addEventListener("click", () => setObjectPaletteOpen(!objectPalette.classList.contains("is-visible")));
  }
  if (paletteCloseButton) {
    paletteCloseButton.addEventListener("click", () => setObjectPaletteOpen(false));
  }

  paletteItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (customState.mode !== "custom") return;
      selectionMgr.spawnObject(item.dataset.objectType, null);
    });
    item.addEventListener("dragstart", (event) => {
      if (customState.mode !== "custom") { event.preventDefault(); return; }
      paletteDrag.type = item.dataset.objectType;
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("text/plain", item.dataset.objectType);
    });
    item.addEventListener("dragend", () => {
      paletteDrag.type = null;
      ghostMesh.visible = false;
      renderer.domElement.classList.remove("palette-drop-active");
    });
  });

  renderer.domElement.addEventListener("dragover", (event) => {
    if (!paletteDrag.type || customState.mode !== "custom") return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    renderer.domElement.classList.add("palette-drop-active");
    const rect = renderer.domElement.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    const ny = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.setFromCamera({ x: nx, y: ny }, camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, hit)) {
      ghostMesh.position.copy(hit);
      ghostMesh.visible = true;
    }
  });

  renderer.domElement.addEventListener("dragleave", () => {
    ghostMesh.visible = false;
    renderer.domElement.classList.remove("palette-drop-active");
  });

  renderer.domElement.addEventListener("drop", (event) => {
    event.preventDefault();
    ghostMesh.visible = false;
    renderer.domElement.classList.remove("palette-drop-active");
    const type = paletteDrag.type || event.dataTransfer.getData("text/plain");
    paletteDrag.type = null;
    if (!type || customState.mode !== "custom") return;
    const rect = renderer.domElement.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    const ny = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.setFromCamera({ x: nx, y: ny }, camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const dropPos = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, dropPos)) {
      dropPos.y = 0;
      selectionMgr.spawnObject(type, dropPos);
    } else {
      selectionMgr.spawnObject(type, null);
    }
  });

  selectionMgr.setTransformMode("translate");
  setMode("view");
  void layoutMgr.loadLayoutForUser(getCurrentUserId(), { silent: true });
  selectionMgr.updateScaleUi();
  selectionMgr.updateHeightUi();
}

// ================================================================
// Movement helpers
// ================================================================
function updateCustomModeMovement(delta) {
  if (customState.mode !== "custom" || customDrag.isPointerDown || transformControls.dragging) return;
  if (!movement.forward && !movement.backward && !movement.left && !movement.right && !movement.up && !movement.down) return;

  const step = delta * 7 * (movement.sprint ? 1.25 : 1);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  const movementOffset = new THREE.Vector3();
  if (movement.forward)  movementOffset.addScaledVector(forward, step);
  if (movement.backward) movementOffset.addScaledVector(forward, -step);
  if (movement.left)     movementOffset.addScaledVector(right, -step);
  if (movement.right)    movementOffset.addScaledVector(right, step);
  if (movement.up)       movementOffset.y += step;
  if (movement.down)     movementOffset.y -= step;

  controlObject.position.add(movementOffset);
  controlObject.position.x = THREE.MathUtils.clamp(controlObject.position.x, -world.size + 8, world.size - 8);
  controlObject.position.z = THREE.MathUtils.clamp(controlObject.position.z, -world.size + 8, world.size - 8);
  controlObject.position.y = THREE.MathUtils.clamp(controlObject.position.y, world.minY, world.maxY);

  orbitControls.target.add(movementOffset);
  orbitControls.target.x = THREE.MathUtils.clamp(orbitControls.target.x, -world.size + 8, world.size - 8);
  orbitControls.target.z = THREE.MathUtils.clamp(orbitControls.target.z, -world.size + 8, world.size - 8);
}

function updateMovement(delta) {
  if (!controls.isLocked || customState.mode !== "view") return;
  const step = delta * 7 * (movement.sprint ? 2.0 : 1);

  if (movement.forward)  controls.moveForward(step);
  if (movement.backward) controls.moveForward(-step);
  if (movement.left)     controls.moveRight(-step);
  if (movement.right)    controls.moveRight(step);
  if (movement.up)       controlObject.position.y += step;
  if (movement.down)     controlObject.position.y -= step;

  controlObject.position.x = THREE.MathUtils.clamp(controlObject.position.x, -world.size + 8, world.size - 8);
  controlObject.position.z = THREE.MathUtils.clamp(controlObject.position.z, -world.size + 8, world.size - 8);
  controlObject.position.y = THREE.MathUtils.clamp(controlObject.position.y, world.minY, world.maxY);
}

// ================================================================
// Animation loop
// ================================================================
const _stationLookTarget = new THREE.Vector3();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.elapsedTime;

  updateMovement(delta);
  updateCustomModeMovement(delta);
  if (customState.mode === "custom") {
    orbitControls.update();
    selectionMgr.updateSelectionOutline();
  }

  animatedObjects.forEach((entry, index) => {
    entry.object.position.y = entry.baseY + Math.sin(elapsed * entry.floatSpeed + index) * entry.floatAmount;
    entry.object.rotation.y += entry.spinSpeed * delta;
  });

  pulseLights.forEach((entry, index) => {
    entry.light.intensity = entry.base + Math.sin(elapsed * entry.speed + index) * entry.range;
  });

  worldBuilder.updateMuseumConstraints();
  selectionMgr.updateBarrierPostConstraints();

  worldBuilder.memoryStations.forEach(({ station }) => {
    if (!station) return;
    _stationLookTarget.set(camera.position.x, station.position.y, camera.position.z);
    station.lookAt(_stationLookTarget);
  });

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  selectionMgr.updateSelectionOutline();
});

app.__memoriaWalkthroughContext = { scene, camera, renderer, worldBuilder, controls, orbitControls, animate };

return function cleanup() {
  if (autoSaveState.timerId) {
    clearTimeout(autoSaveState.timerId);
    autoSaveState.timerId = null;
  }
  window.removeEventListener("keydown", suppressLockedMovementShortcuts, true);
  window.removeEventListener("keyup",   suppressLockedMovementShortcuts, true);
  renderer.setAnimationLoop(null);
  worldBuilder.dispose?.();
  controls.unlock();
  controls.dispose();
  orbitControls.dispose();
  transformControls.dispose();
  renderer.dispose();
  if (app.contains(renderer.domElement))   app.removeChild(renderer.domElement);
  if (vrButton && vrButton.parentNode)     vrButton.parentNode.removeChild(vrButton);
  if (appShell.mountNode && app.contains(appShell.mountNode)) app.removeChild(appShell.mountNode);
  app.removeAttribute("data-world-theme");
};
}
