import * as THREE from "three";
import { WORLD_THEMES, THEME_STORAGE_KEY } from "./constants.js";
import { getThemeStorageKey } from "./sceneUtils.js";

// Manages theme baseline capture and theme switching.
// Receives shared state references from memoryHallScene.js.

export class ThemeManager {
  constructor({ scene, pulseLights, worldBuilder, themeState, app, selectionOutline, themeOptionButtons, getCurrentUserId, setCustomStatus, scheduleAutoSave }) {
    this.scene = scene;
    this.pulseLights = pulseLights;
    this.worldBuilder = worldBuilder;
    this.themeState = themeState;
    this.app = app;
    this.selectionOutline = selectionOutline;
    this.themeOptionButtons = themeOptionButtons;
    this.getCurrentUserId = getCurrentUserId;
    this.setCustomStatus = setCustomStatus;
    this.scheduleAutoSave = scheduleAutoSave;
  }

  captureThemeBaseline() {
    this.scene.traverse((object) => {
      if (object.isMesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (!material || this.themeState.materialBases.has(material)) return;
          this.themeState.materialBases.set(material, {
            color: material.color ? material.color.clone() : null,
            emissive: material.emissive ? material.emissive.clone() : null,
          });
        });
      }

      if (object.isLight && !this.themeState.lightBases.has(object)) {
        this.themeState.lightBases.set(object, {
          color: object.color.clone(),
          intensity: object.intensity,
        });
      }
    });

    this.pulseLights.forEach((entry) => {
      if (!this.themeState.pulseBases.has(entry)) {
        this.themeState.pulseBases.set(entry, {
          base: entry.base,
          range: entry.range,
        });
      }
    });
  }

  applyTheme(themeKey, options = {}) {
    const { silent = false, persist = true } = options;
    const selectedThemeKey = WORLD_THEMES[themeKey] ? themeKey : "dream";
    const theme = WORLD_THEMES[selectedThemeKey];
    this.themeState.active = selectedThemeKey;

    this.scene.background = new THREE.Color(theme.sceneBackground);
    this.scene.fog.color = new THREE.Color(theme.fogColor);
    this.scene.fog.density = theme.fogDensity;

    const materialTint = new THREE.Color(theme.materialTint);
    const emissiveTint = new THREE.Color(theme.emissiveTint);
    const lightTint = new THREE.Color(theme.lightTint);

    this.themeState.materialBases.forEach((baseState, material) => {
      if (baseState.color && material.color) {
        material.color.copy(baseState.color).lerp(materialTint, theme.materialMix);
      }
      if (baseState.emissive && material.emissive) {
        material.emissive.copy(baseState.emissive).lerp(emissiveTint, theme.emissiveMix);
      }
      material.needsUpdate = true;
    });

    this.themeState.lightBases.forEach((baseState, light) => {
      light.color.copy(baseState.color).lerp(lightTint, theme.lightMix);
      light.intensity = baseState.intensity * theme.lightIntensityMultiplier;
    });

    this.themeState.pulseBases.forEach((baseState, entry) => {
      entry.base = baseState.base * theme.pulseBaseMultiplier;
      entry.range = baseState.range * theme.pulseRangeMultiplier;
    });

    this.worldBuilder.applyThemeVisuals(selectedThemeKey);
    this.selectionOutline.material.color.copy(lightTint);

    this.themeOptionButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.theme === selectedThemeKey);
    });

    this.app.setAttribute("data-world-theme", selectedThemeKey);
    if (persist) {
      localStorage.setItem(THEME_STORAGE_KEY, selectedThemeKey);
      localStorage.setItem(getThemeStorageKey(this.getCurrentUserId(), this.worldBuilder._projectId ?? ""), selectedThemeKey);
    }

    if (!silent) {
      this.setCustomStatus(`Theme changed to ${theme.label}.`);
      this.scheduleAutoSave();
    }
  }
}
