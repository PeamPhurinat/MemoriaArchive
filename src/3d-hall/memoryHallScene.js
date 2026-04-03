import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { isSupabaseConfigured, loadLayoutFromCloud, saveLayoutToCloud } from "./supabaseClient.js";
import { AppShell } from "../3d-hall/ui/AppShell.js";
import { WorldBuilder } from "../3d-hall/world/WorldBuilder.js";

export function initMemoryHall(container, memoriesData) {
const app = container;
const appShell = new AppShell(app);
document.body.removeAttribute("data-world-theme");

const {
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
  saveButton,
  loadButton,
  resetButton,
  reticle,
} = appShell;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc88ab8);
scene.fog = new THREE.FogExp2(0xe8b1c7, 0.012);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  400,
);

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

const LAYOUT_STORAGE_PREFIX = "memoria-layout-v1";
const ACTIVE_USER_STORAGE_KEY = "memoria-active-user";
const THEME_STORAGE_KEY = "memoria-world-theme-v1";

const WORLD_THEMES = {
  dream: {
    label: "Dream",
    sceneBackground: 0xc88ab8,
    fogColor: 0xe8b1c7,
    fogDensity: 0.012,
    materialTint: "#ffd8ef",
    materialMix: 0.44,
    emissiveTint: "#ffd8ef",
    emissiveMix: 0.4,
    lightTint: "#ffd8ef",
    lightMix: 0.38,
    lightIntensityMultiplier: 1,
    pulseBaseMultiplier: 1,
    pulseRangeMultiplier: 1,
  },
  midnight: {
    label: "Midnight",
    sceneBackground: 0x151a37,
    fogColor: 0x1f2852,
    fogDensity: 0.016,
    materialTint: "#5e76d9",
    materialMix: 0.68,
    emissiveTint: "#90bbff",
    emissiveMix: 0.66,
    lightTint: "#8ea7ff",
    lightMix: 0.72,
    lightIntensityMultiplier: 0.62,
    pulseBaseMultiplier: 0.58,
    pulseRangeMultiplier: 0.74,
  },
  sunset: {
    label: "Sunset",
    sceneBackground: 0xdf9aa4,
    fogColor: 0xf0b796,
    fogDensity: 0.011,
    materialTint: "#ffbf95",
    materialMix: 0.58,
    emissiveTint: "#ffd1ab",
    emissiveMix: 0.48,
    lightTint: "#ffbe86",
    lightMix: 0.54,
    lightIntensityMultiplier: 0.9,
    pulseBaseMultiplier: 0.94,
    pulseRangeMultiplier: 0.92,
  },
};

const customState = {
  mode: "view",
  selectedId: null,
  transformMode: "translate",
};

const customizableComponents = new Map();
const defaultLayoutStates = new Map();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragIntersection = new THREE.Vector3();

const customDrag = {
  isPointerDown: false,
  isDragging: false,
  pointerId: null,
  component: null,
  offset: new THREE.Vector3(),
  plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
};

const selectionOutline = new THREE.BoxHelper(undefined, 0xff8fca);
selectionOutline.visible = false;
scene.add(selectionOutline);

const controls = new PointerLockControls(camera, renderer.domElement);
const controlObject =
  controls.object ?? (typeof controls.getObject === "function" ? controls.getObject() : camera);
controlObject.position.set( 0, 1.7, 42);
scene.add(controlObject);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enabled = false;
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.08;
orbitControls.minDistance = 6;
orbitControls.maxDistance = 150;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.08;
orbitControls.target.set(0, 4, -12);
orbitControls.update();

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.enabled = false;
transformControls.setSize(1.15);
transformControls.setMode(customState.transformMode);
transformControls.showX = true;
transformControls.showY = true;
transformControls.showZ = true;
scene.add(transformControls);

transformControls.addEventListener("dragging-changed", (event) => {
  orbitControls.enabled = customState.mode === "custom" && !event.value;
});

transformControls.addEventListener("objectChange", () => {
  const selected = getSelectedComponent();
  if (selected) {
    clampScale(selected);
  }
  updateScaleUi();
  updateSelectionOutline();
});

launchButton.addEventListener("click", () => {
  if (customState.mode === "view") {
    controls.lock();
  }
});
renderer.domElement.addEventListener("click", () => {
  if (!controls.isLocked && customState.mode === "view") {
    controls.lock();
  }
});

renderer.domElement.addEventListener("pointerdown", handleCanvasPointerDown);
renderer.domElement.addEventListener("pointermove", handleCanvasPointerMove);
renderer.domElement.addEventListener("pointerup", handleCanvasPointerUp);
renderer.domElement.addEventListener("pointerleave", handleCanvasPointerUp);

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

const movement = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
  sprint: false,
};
const MOVEMENT_KEY_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "Space",
  "ControlLeft",
  "ControlRight",
  "ShiftLeft", 
  "ShiftRight",
]);

const animatedObjects = [];
const pulseLights = [];
const world = {
  size: 120,
  minY: 1.7,
  maxY: 42,
};

const themeState = {
  active: "dream",
  materialBases: new Map(),
  lightBases: new Map(),
  pulseBases: new Map(),
};

const clock = new THREE.Clock();

const SHORTCUT_BLOCKED_MOVE_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD"]);

function suppressLockedMovementShortcuts(event) {
  if (!(controls.isLocked && customState.mode === "view")) {
    return;
  }
  if (!(event.ctrlKey || event.metaKey)) {
    return;
  }
  if (!SHORTCUT_BLOCKED_MOVE_KEYS.has(event.code)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  if (typeof event.stopImmediatePropagation === "function") {
    event.stopImmediatePropagation();
  }
}

window.addEventListener("keydown", suppressLockedMovementShortcuts, true);
window.addEventListener("keyup", suppressLockedMovementShortcuts, true);


document.addEventListener("keydown", (event) => {
  const isTypingField =
    document.activeElement === userIdInput ||
    document.activeElement?.tagName === "INPUT" ||
    document.activeElement?.tagName === "TEXTAREA";
  const isLockedViewMode = controls.isLocked && customState.mode === "view";

  if (customState.mode === "custom") {
    if (!isTypingField) {
      if (event.code === "KeyE") {
        setTransformMode("translate");
        return;
      }
      if (event.code === "KeyR") {
        setTransformMode("scale");
        return;
      }
      if (event.code === "Delete" || event.code === "Backspace") {
        deleteSelectedComponent();
        return;
      }
    }
  }

  if (isTypingField) {
    return;
  }

  // Prevent browser shortcuts (Ctrl+A/Ctrl+S, etc.) from interrupting movement
  // while actively navigating in locked first-person view.
  if (isLockedViewMode && MOVEMENT_KEY_CODES.has(event.code)) {
    event.preventDefault();
  }

  switch (event.code) {
    case "KeyW":
      movement.forward = true;
      break;
    case "KeyS":
      movement.backward = true;
      break;
    case "KeyA":
      movement.left = true;
      break;
    case "KeyD":
      movement.right = true;
      break;
    case "Space":
      movement.up = true;
      event.preventDefault();
      break;
    case "AltLeft":
    case "AltRight":
      movement.down = true;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      movement.sprint = true;
  break;
    default:
      break;
  }
});

document.addEventListener("keyup", (event) => {
  if (controls.isLocked && customState.mode === "view" && MOVEMENT_KEY_CODES.has(event.code)) {
    event.preventDefault();
  }

  switch (event.code) {
    case "KeyW":
      movement.forward = false;
      break;
    case "KeyS":
      movement.backward = false;
      break;
    case "KeyA":
      movement.left = false;
      break;
    case "KeyD":
      movement.right = false;
      break;
    case "Space":
      movement.up = false;
      break;
    case "AltLeft":
    case "AltRight":
      movement.down = false;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      movement.sprint = false;
  break;
    default:
      break;
  }
});

function resetMovementFlags() {
  movement.forward = false;
  movement.backward = false;
  movement.left = false;
  movement.right = false;
  movement.up = false;
  movement.down = false;
}

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

const worldBuilder = new WorldBuilder({
  scene,
  animatedObjects,
  pulseLights,
  world,
  registerCustomizableComponent,
  memoriesData,
});

worldBuilder.buildAll(memoriesData);
captureThemeBaseline();
initializeCustomizer();

function initializeCustomizer() {
  const savedUserId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY) ?? "guest";
  userIdInput.value = normalizeUserId(savedUserId);

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  applyTheme(storedTheme && WORLD_THEMES[storedTheme] ? storedTheme : "dream", { silent: true });

  menuToggleButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const shouldOpen = !menuPanel.classList.contains("is-visible");
    setMenuOpen(shouldOpen);
    if (!shouldOpen) {
      setThemePickerOpen(false);
    }
  });

  themeToggleButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!menuPanel.classList.contains("is-visible")) {
      setMenuOpen(true);
    }
    const shouldOpen = !themePicker.classList.contains("is-visible");
    setThemePickerOpen(shouldOpen);
  });

  themeOptionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const themeKey = button.dataset.theme;
      applyTheme(themeKey);
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (menuPanel.contains(target) || menuToggleButton.contains(target)) {
      return;
    }
    setThemePickerOpen(false);
    setMenuOpen(false);
  });

  modeToggleButton.addEventListener("click", () => {
    setMode(customState.mode === "view" ? "custom" : "view");
  });

  moveButton.addEventListener("click", () => setTransformMode("translate"));
  resizeButton.addEventListener("click", () => setTransformMode("scale"));
  deleteButton.addEventListener("click", deleteSelectedComponent);
  scaleSlider.addEventListener("input", () => {
    const selected = getSelectedComponent();
    if (!selected || selected.visible === false) {
      return;
    }

    const nextScale = THREE.MathUtils.clamp(Number(scaleSlider.value), 0.35, 3);
    selected.scale.setScalar(nextScale);
    clampScale(selected);
    updateScaleUi();
    updateSelectionOutline();
  });

  saveButton.addEventListener("click", async () => {
    await saveLayoutForUser(getCurrentUserId());
  });
  loadButton.addEventListener("click", async () => {
    await loadLayoutForUser(getCurrentUserId());
  });
  resetButton.addEventListener("click", () => {
    restoreDefaultLayout();
    clearSelection();
    setCustomStatus(`Layout reset to default for "${getCurrentUserId()}".`);
  });

  userIdInput.addEventListener("change", () => {
    const userId = getCurrentUserId();
    setCustomStatus(`Active user: "${userId}".`);
  });

  setTransformMode("translate");
  setMode("view");
  void loadLayoutForUser(getCurrentUserId(), { silent: true });
  updateScaleUi();
}

function normalizeUserId(value) {
  const safeValue = String(value ?? "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 32);
  return safeValue || "guest";
}

function getCurrentUserId() {
  const userId = normalizeUserId(userIdInput.value);
  userIdInput.value = userId;
  localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
  return userId;
}

function getLayoutStorageKey(userId) {
  return `${LAYOUT_STORAGE_PREFIX}:${userId}`;
}

function setMenuOpen(isOpen) {
  menuPanel.classList.toggle("is-visible", isOpen);
  menuToggleButton.setAttribute("aria-expanded", String(isOpen));
}

function setThemePickerOpen(isOpen) {
  themePicker.classList.toggle("is-visible", isOpen);
  themeToggleButton.setAttribute("aria-expanded", String(isOpen));
}

function captureThemeBaseline() {
  scene.traverse((object) => {
    if (object.isMesh) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!material || themeState.materialBases.has(material)) {
          return;
        }
        themeState.materialBases.set(material, {
          color: material.color ? material.color.clone() : null,
          emissive: material.emissive ? material.emissive.clone() : null,
        });
      });
    }

    if (object.isLight && !themeState.lightBases.has(object)) {
      themeState.lightBases.set(object, {
        color: object.color.clone(),
        intensity: object.intensity,
      });
    }
  });

  pulseLights.forEach((entry) => {
    if (!themeState.pulseBases.has(entry)) {
      themeState.pulseBases.set(entry, {
        base: entry.base,
        range: entry.range,
      });
    }
  });
}

function applyTheme(themeKey, options = {}) {
  const { silent = false } = options;
  const selectedThemeKey = WORLD_THEMES[themeKey] ? themeKey : "dream";
  const theme = WORLD_THEMES[selectedThemeKey];
  themeState.active = selectedThemeKey;

  scene.background = new THREE.Color(theme.sceneBackground);
  scene.fog.color = new THREE.Color(theme.fogColor);
  scene.fog.density = theme.fogDensity;

  const materialTint = new THREE.Color(theme.materialTint);
  const emissiveTint = new THREE.Color(theme.emissiveTint);
  const lightTint = new THREE.Color(theme.lightTint);

  themeState.materialBases.forEach((baseState, material) => {
    if (baseState.color && material.color) {
      material.color.copy(baseState.color).lerp(materialTint, theme.materialMix);
    }
    if (baseState.emissive && material.emissive) {
      material.emissive.copy(baseState.emissive).lerp(emissiveTint, theme.emissiveMix);
    }
    material.needsUpdate = true;
  });

  themeState.lightBases.forEach((baseState, light) => {
    light.color.copy(baseState.color).lerp(lightTint, theme.lightMix);
    light.intensity = baseState.intensity * theme.lightIntensityMultiplier;
  });

  themeState.pulseBases.forEach((baseState, entry) => {
    entry.base = baseState.base * theme.pulseBaseMultiplier;
    entry.range = baseState.range * theme.pulseRangeMultiplier;
  });

  worldBuilder.applyThemeVisuals(selectedThemeKey);
  selectionOutline.material.color.copy(lightTint);

  themeOptionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === selectedThemeKey);
  });

  app.setAttribute("data-world-theme", selectedThemeKey);
  localStorage.setItem(THEME_STORAGE_KEY, selectedThemeKey);

  if (!silent) {
    setCustomStatus(`Theme changed to ${theme.label}.`);
  }
}

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
  if (!component || !state) {
    return;
  }

  if (Array.isArray(state.position) && state.position.length === 3) {
    component.position.set(state.position[0], state.position[1], state.position[2]);
  }
  if (Array.isArray(state.rotation) && state.rotation.length === 3) {
    component.rotation.set(state.rotation[0], state.rotation[1], state.rotation[2]);
  }
  if (Array.isArray(state.scale) && state.scale.length === 3) {
    component.scale.set(state.scale[0], state.scale[1], state.scale[2]);
    clampScale(component);
  }
  component.visible = state.visible !== false;
}

function getUniformScale(component) {
  return (component.scale.x + component.scale.y + component.scale.z) / 3;
}

function updateScaleUi() {
  const selected = getSelectedComponent();
  if (!selected || selected.visible === false) {
    scaleSlider.value = "1";
    scaleSlider.disabled = true;
    scaleValue.textContent = "--";
    return;
  }

  const uniformScale = THREE.MathUtils.clamp(getUniformScale(selected), 0.35, 3);
  scaleSlider.disabled = false;
  scaleSlider.value = uniformScale.toFixed(2);
  scaleValue.textContent = `${Math.round(uniformScale * 100)}%`;
}

function restoreDefaultLayout() {
  defaultLayoutStates.forEach((state, componentId) => {
    const component = customizableComponents.get(componentId);
    if (component) {
      applyComponentState(component, state);
    }
  });
  updateScaleUi();
}

function collectLayoutSnapshot() {
  const components = {};
  customizableComponents.forEach((component, componentId) => {
    components[componentId] = {
      ...captureComponentState(component),
      metadata: component.userData.componentMetadata ?? {},
    };
  });
  return components;
}

function applyLayoutPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const componentStates = payload.components ?? {};
  restoreDefaultLayout();
  Object.entries(componentStates).forEach(([componentId, state]) => {
    const component = customizableComponents.get(componentId);
    if (component) {
      applyComponentState(component, state);
    }
  });

  clearSelection();
  updateScaleUi();
  return true;
}

async function saveLayoutForUser(userId) {
  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    components: collectLayoutSnapshot(),
  };

  let cloudSaved = false;
  let cloudSaveFailed = false;
  if (isSupabaseConfigured) {
    const cloudResult = await saveLayoutToCloud(userId, payload);
    cloudSaved = cloudResult.ok;
    cloudSaveFailed = !cloudResult.ok;
  }

  try {
    localStorage.setItem(getLayoutStorageKey(userId), JSON.stringify(payload));
    if (cloudSaved) {
      setCustomStatus(`Saved layout for "${userId}" to Supabase (local backup also saved).`);
    } else if (cloudSaveFailed) {
      setCustomStatus(
        `Supabase save failed for "${userId}". Saved locally only. Check your table/policies.`,
      );
    } else {
      setCustomStatus(`Saved layout for "${userId}" locally.`);
    }
  } catch {
    setCustomStatus("Could not save layout. Browser storage may be unavailable.");
  }
}

async function loadLayoutForUser(userId, options = {}) {
  const { silent = false } = options;
  if (isSupabaseConfigured) {
    const cloudResult = await loadLayoutFromCloud(userId);
    if (cloudResult.ok && cloudResult.payload) {
      const didApply = applyLayoutPayload(cloudResult.payload);
      if (didApply) {
        try {
          localStorage.setItem(getLayoutStorageKey(userId), JSON.stringify(cloudResult.payload));
        } catch {
          // Ignore local backup failure and keep cloud-loaded scene.
        }
        if (!silent) {
          setCustomStatus(`Loaded layout for "${userId}" from Supabase.`);
        }
        return true;
      }
      if (!silent) {
        setCustomStatus(`Supabase layout for "${userId}" is invalid.`);
      }
      return false;
    }
  }

  const raw = localStorage.getItem(getLayoutStorageKey(userId));
  if (!raw) {
    if (!silent) {
      setCustomStatus(
        isSupabaseConfigured
          ? `No Supabase/local layout found for "${userId}".`
          : `No saved layout found for "${userId}".`,
      );
    }
    return false;
  }

  try {
    const parsed = JSON.parse(raw);
    const didApply = applyLayoutPayload(parsed);
    if (!didApply) {
      throw new Error("Invalid payload");
    }
    if (!silent) {
      setCustomStatus(`Loaded layout for "${userId}" from local backup.`);
    }
    return true;
  } catch {
    if (!silent) {
      setCustomStatus(`Saved layout for "${userId}" is invalid.`);
    }
    return false;
  }
}

function setTransformMode(mode) {
  const nextMode = mode === "scale" ? "scale" : "translate";
  customState.transformMode = nextMode;
  transformControls.setMode(nextMode);
  syncTransformControls();

  moveButton.classList.toggle("is-active", nextMode === "translate");
  resizeButton.classList.toggle("is-active", nextMode === "scale");
  if (nextMode === "scale") {
    setCustomStatus("Resize mode enabled. Drag gizmo handles or use the scale slider.");
  }
}

function getSelectedComponent() {
  if (!customState.selectedId) {
    return null;
  }
  return customizableComponents.get(customState.selectedId) ?? null;
}

function selectComponent(component) {
  if (!component || customState.mode !== "custom" || component.visible === false) {
    return;
  }

  customState.selectedId = component.userData.componentId;
  syncTransformControls();
  updateSelectionOutline();

  const label = component.userData.componentLabel ?? customState.selectedId;
  const action =
    customState.transformMode === "scale"
      ? "resize using the gizmo"
      : "move by dragging or with the gizmo";
  setCustomStatus(`Selected "${label}". You can now ${action}.`);
  updateScaleUi();
}

function clearSelection() {
  customState.selectedId = null;
  stopCustomDrag();
  syncTransformControls();
  selectionOutline.visible = false;
  updateScaleUi();
}

function deleteSelectedComponent() {
  if (customState.mode !== "custom") {
    return;
  }

  const selected = getSelectedComponent();
  if (!selected) {
    setCustomStatus("Select a memory component first.");
    return;
  }

  const label = selected.userData.componentLabel ?? selected.userData.componentId;
  selected.visible = false;
  clearSelection();
  setCustomStatus(`Deleted "${label}" from this layout. Save to keep this change.`);
  updateScaleUi();
}

function clampScale(component) {
  component.scale.x = Math.max(0.35, component.scale.x);
  component.scale.y = Math.max(0.35, component.scale.y);
  component.scale.z = Math.max(0.35, component.scale.z);
}

function updateSelectionOutline() {
  const selected = getSelectedComponent();
  if (!selected || customState.mode !== "custom" || selected.visible === false) {
    selectionOutline.visible = false;
    return;
  }

  selectionOutline.setFromObject(selected);
  selectionOutline.visible = true;
}

function syncTransformControls() {
  const selected = getSelectedComponent();
  const canUseGizmo =
    customState.mode === "custom" &&
    customState.transformMode === "scale" &&
    !!selected &&
    selected.visible !== false;

  if (canUseGizmo) {
    transformControls.attach(selected);
    transformControls.enabled = true;
    transformControls.visible = true;
    return;
  }

  transformControls.detach();
  transformControls.enabled = false;
  transformControls.visible = false;
}

function setMode(mode) {
  const nextMode = mode === "custom" ? "custom" : "view";
  customState.mode = nextMode;
  const isCustomMode = nextMode === "custom";

  const modeLabel = modeToggleButton.querySelector("span:last-child");
  if (modeLabel) {
    modeLabel.textContent = isCustomMode ? "View Mode" : "Custom Mode";
  }
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
    syncTransformControls();
    setCustomStatus("Custom mode enabled. Click a memory station to edit it.");
  } else {
    orbitControls.enabled = false;
    stopCustomDrag();
    clearSelection();
    syncTransformControls();
    setCustomStatus("View mode enabled.");
  }

  setMenuOpen(false);
  setThemePickerOpen(false);
}

function findCustomizableRoot(object) {
  let current = object;
  while (current) {
    if (current.userData?.isCustomizable) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function handleCanvasPointerDown(event) {
  if (customState.mode !== "custom" || event.button !== 0 || transformControls.dragging) {
    return;
  }

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const roots = Array.from(customizableComponents.values()).filter(
    (component) => component.visible !== false,
  );

  if (customState.transformMode === "scale" && transformControls.enabled && transformControls.object) {
    const gizmoHits = raycaster.intersectObject(transformControls, true);
    if (gizmoHits.length) {
      return;
    }
  }

  const intersections = raycaster.intersectObjects(roots, true);

  if (!intersections.length) {
    clearSelection();
    stopCustomDrag();
    return;
  }

  const selectedRoot = findCustomizableRoot(intersections[0].object);
  if (selectedRoot) {
    selectComponent(selectedRoot);
    if (customState.transformMode === "translate") {
      startCustomDrag(selectedRoot, event);
    }
  }
}

function startCustomDrag(component, event) {
  customDrag.component = component;
  customDrag.isPointerDown = true;
  customDrag.isDragging = false;
  customDrag.pointerId = event.pointerId ?? null;
  customDrag.plane.set(new THREE.Vector3(0, 1, 0), -component.position.y);

  if (raycaster.ray.intersectPlane(customDrag.plane, dragIntersection)) {
    customDrag.offset.copy(component.position).sub(dragIntersection);
  } else {
    customDrag.offset.set(0, 0, 0);
  }

  orbitControls.enabled = false;
  if (customDrag.pointerId !== null) {
    try {
      renderer.domElement.setPointerCapture(customDrag.pointerId);
    } catch {
      // Ignore browsers that reject capture for this target.
    }
  }
}

function stopCustomDrag() {
  if (customDrag.pointerId !== null) {
    try {
      renderer.domElement.releasePointerCapture(customDrag.pointerId);
    } catch {
      // Ignore browsers that already released capture.
    }
  }
  customDrag.pointerId = null;
  customDrag.component = null;
  customDrag.isPointerDown = false;
  customDrag.isDragging = false;
  customDrag.offset.set(0, 0, 0);
  orbitControls.enabled = customState.mode === "custom" && !transformControls.dragging;
}

function handleCanvasPointerMove(event) {
  if (
    customState.mode !== "custom" ||
    customState.transformMode !== "translate" ||
    !customDrag.isPointerDown ||
    !customDrag.component
  ) {
    return;
  }

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  if (!raycaster.ray.intersectPlane(customDrag.plane, dragIntersection)) {
    return;
  }

  const component = customDrag.component;
  const nextPosition = dragIntersection.clone().add(customDrag.offset);

  component.position.x = THREE.MathUtils.clamp(nextPosition.x, -world.size + 8, world.size - 8);
  component.position.z = THREE.MathUtils.clamp(nextPosition.z, -world.size + 8, world.size - 8);
  customDrag.isDragging = true;
  updateSelectionOutline();
}

function handleCanvasPointerUp() {
  if (customState.mode !== "custom" || customState.transformMode !== "translate") {
    return;
  }

  if (customDrag.component && customDrag.isDragging) {
    const label = customDrag.component.userData.componentLabel ?? customDrag.component.userData.componentId;
    setCustomStatus(`Moved "${label}". Save layout to keep this change.`);
  }

  stopCustomDrag();
}

function updateCustomModeMovement(delta) {
  if (
    customState.mode !== "custom" ||
    customDrag.isPointerDown ||
    transformControls.dragging
  ) {
    return;
  }

  if (!movement.forward && !movement.backward && !movement.left && !movement.right) {
    return;
  }

  const step = delta * 7 * (movement.sprint ? 1.25 : 1);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() === 0) {
    return;
  }
  forward.normalize();

  const right = new THREE.Vector3()
    .crossVectors(forward, new THREE.Vector3(0, 1, 0))
    .normalize();

  const movementOffset = new THREE.Vector3();
  if (movement.forward) {
    movementOffset.addScaledVector(forward, step);
  }
  if (movement.backward) {
    movementOffset.addScaledVector(forward, -step);
  }
  if (movement.left) {
    movementOffset.addScaledVector(right, -step);
  }
  if (movement.right) {
    movementOffset.addScaledVector(right, step);
  }

  controlObject.position.add(movementOffset);
  controlObject.position.x = THREE.MathUtils.clamp(
    controlObject.position.x,
    -world.size + 8,
    world.size - 8,
  );
  controlObject.position.z = THREE.MathUtils.clamp(
    controlObject.position.z,
    -world.size + 8,
    world.size - 8,
  );
  controlObject.position.y = world.minY;

  orbitControls.target.add(movementOffset);
  orbitControls.target.x = THREE.MathUtils.clamp(
    orbitControls.target.x,
    -world.size + 8,
    world.size - 8,
  );
  orbitControls.target.z = THREE.MathUtils.clamp(
    orbitControls.target.z,
    -world.size + 8,
    world.size - 8,
  );
}

function updateMovement(delta) {
  if (!controls.isLocked || customState.mode !== "view") {
    return;
  }

  const step = delta * 7 * (movement.sprint ? 1.25 : 1);

  if (movement.forward) {
    controls.moveForward(step);
  }
  if (movement.backward) {
    controls.moveForward(-step);
  }
  if (movement.left) {
    controls.moveRight(-step);
  }
  if (movement.right) {
    controls.moveRight(step);
  }

  if (movement.up) {
    controlObject.position.y += step;
  }
  if (movement.down) {
    controlObject.position.y -= step;
  }

  controlObject.position.x = THREE.MathUtils.clamp(
    controlObject.position.x,
    -world.size + 8,
    world.size - 8,
  );
  controlObject.position.z = THREE.MathUtils.clamp(
    controlObject.position.z,
    -world.size + 8,
    world.size - 8,
  );
  controlObject.position.y = THREE.MathUtils.clamp(
    controlObject.position.y,
    world.minY,
    world.maxY,
  );
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.elapsedTime;

  updateMovement(delta);
  updateCustomModeMovement(delta);
  if (customState.mode === "custom") {
    orbitControls.update();
    updateSelectionOutline();
  }

  animatedObjects.forEach((entry, index) => {
    const offset = Math.sin(elapsed * entry.floatSpeed + index) * entry.floatAmount;
    if (entry.local) {
      entry.object.position.y = entry.baseY + offset;
    } else {
      entry.object.position.y = entry.baseY + offset;
    }
    entry.object.rotation.y += entry.spinSpeed * delta;
  });

  pulseLights.forEach((entry, index) => {
    entry.light.intensity = entry.base + Math.sin(elapsed * entry.speed + index) * entry.range;
  });

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateSelectionOutline();
});


app.__memoriaWalkthroughContext = { scene, camera, renderer, worldBuilder, controls, orbitControls };

return function cleanup() {
  window.removeEventListener("keydown", suppressLockedMovementShortcuts, true);
  window.removeEventListener("keyup", suppressLockedMovementShortcuts, true);
  renderer.setAnimationLoop(null);
  worldBuilder.dispose?.();
  controls.unlock();
  controls.dispose();
  orbitControls.dispose();
  transformControls.dispose();
  renderer.dispose();
  if (app.contains(renderer.domElement)) {
    app.removeChild(renderer.domElement);
  }
  if (vrButton && vrButton.parentNode) {
    vrButton.parentNode.removeChild(vrButton);
  }
  app.removeAttribute("data-world-theme");
};
}
