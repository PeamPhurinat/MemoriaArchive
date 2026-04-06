// Handles save/load/reset of scene layout to localStorage and Supabase cloud.

import { LAYOUT_SCHEMA_VERSION, WORLD_THEMES } from "./constants.js";
import { getLayoutStorageKey, getThemeStorageKey } from "./sceneUtils.js";
import { loadLayoutFromCloud, saveLayoutToCloud } from "../supabaseClient.js";

export class LayoutManager {
  constructor({
    customizableComponents,
    defaultLayoutStates,
    spawnedComponentIds,
    spawnCounter,
    themeState,
    worldBuilder,
    autoSaveState,
    READ_ONLY,
    AUTO_SAVE_DELAY_MS,
    getCurrentUserId,
    getCurrentProjectId,
    getDisplayName,
    getProjectTitle,
    captureComponentState,
    applyComponentState,
    clearAllSpawnedObjects,
    applyTheme,
    captureThemeBaseline,
    clearSelection,
    updateScaleUi,
    setCustomStatus,
    registerCustomizableComponent,
  }) {
    this.customizableComponents = customizableComponents;
    this.defaultLayoutStates    = defaultLayoutStates;
    this.spawnedComponentIds    = spawnedComponentIds;
    this._spawnCounter          = spawnCounter;
    this.themeState             = themeState;
    this.worldBuilder           = worldBuilder;
    this.autoSaveState          = autoSaveState;
    this.READ_ONLY              = READ_ONLY;
    this.AUTO_SAVE_DELAY_MS     = AUTO_SAVE_DELAY_MS;
    this.getCurrentUserId       = getCurrentUserId;
    this.getCurrentProjectId    = getCurrentProjectId;
    this.getDisplayName         = getDisplayName || (() => "");
    this.getProjectTitle        = getProjectTitle || (() => "");
    this.captureComponentState  = captureComponentState;
    this.applyComponentState    = applyComponentState;
    this._clearAllSpawnedObjects = clearAllSpawnedObjects;
    this.applyTheme             = applyTheme;
    this.captureThemeBaseline   = captureThemeBaseline;
    this.clearSelection         = clearSelection;
    this.updateScaleUi          = updateScaleUi;
    this.setCustomStatus        = setCustomStatus;
    this.registerCustomizableComponent = registerCustomizableComponent;
  }

  get spawnCounter() { return this._spawnCounter.value; }
  set spawnCounter(v) { this._spawnCounter.value = v; }

  collectLayoutSnapshot() {
    const components = {};
    this.customizableComponents.forEach((component, componentId) => {
      components[componentId] = {
        ...this.captureComponentState(component),
        metadata: component.userData.componentMetadata ?? {},
      };
    });
    return components;
  }

  restoreDefaultLayout() {
    this.defaultLayoutStates.forEach((state, componentId) => {
      const component = this.customizableComponents.get(componentId);
      if (component) {
        this.applyComponentState(component, state);
      }
    });
    this.updateScaleUi();
  }

  clearAllSpawnedObjects() {
    this.spawnedComponentIds.forEach((id) => {
      const comp = this.customizableComponents.get(id);
      if (comp) this.worldBuilder.scene.remove(comp);
      this.customizableComponents.delete(id);
      this.defaultLayoutStates.delete(id);
    });
    this.spawnedComponentIds.clear();
  }

  applyLayoutPayload(payload) {
    if (!payload || typeof payload !== "object") return false;
    if ((payload.version ?? 0) < LAYOUT_SCHEMA_VERSION) return false;

    const savedThemeKey = String(payload.themeKey || "").trim();
    if (savedThemeKey) {
      this.applyTheme(savedThemeKey, { silent: true, persist: true });
    }

    const componentStates = payload.components ?? {};
    this.clearAllSpawnedObjects();
    this.restoreDefaultLayout();

    // Restore built-in components
    Object.entries(componentStates).forEach(([componentId, state]) => {
      const component = this.customizableComponents.get(componentId);
      if (component) {
        this.applyComponentState(component, state);
      }
    });

    // Re-create user-spawned objects that were saved
    Object.entries(componentStates).forEach(([componentId, state]) => {
      const meta = state.metadata ?? {};
      if (!meta.isUserSpawned || !meta.type) return;
      if (this.customizableComponents.has(componentId)) return;

      const counterMatch = componentId.match(/-(\d+)$/);
      if (counterMatch) {
        this._spawnCounter.value = Math.max(this._spawnCounter.value, parseInt(counterMatch[1], 10));
      }

      const group = this.worldBuilder.createSpawnableObject(meta.type);
      if (!group) return;
      group.userData.componentId = componentId;
      group.userData.componentLabel = meta.label ?? meta.type;
      group.userData.isCustomizable = true;
      group.userData.isUserSpawned = true;
      this.registerCustomizableComponent(componentId, group, meta);
      this.spawnedComponentIds.add(componentId);
      this.applyComponentState(group, state);
    });

    this.captureThemeBaseline();
    this.applyTheme(this.themeState.active, { silent: true, persist: false });

    this.clearSelection();
    this.updateScaleUi();
    return true;
  }

  async saveLayoutForUser(userId, options = {}) {
    const { silent = false } = options;
    if (this.autoSaveState.timerId) {
      clearTimeout(this.autoSaveState.timerId);
      this.autoSaveState.timerId = null;
    }
    const projectId = this.getCurrentProjectId();
    const displayName = this.getDisplayName() || userId;
    const projectTitle = this.getProjectTitle() || projectId;
    const payload = {
      version: LAYOUT_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      userId,
      projectId,
      themeKey: this.themeState.active,
      components: this.collectLayoutSnapshot(),
    };

    let cloudSaved = false;
    let cloudSaveFailed = false;
    const cloudResult = await saveLayoutToCloud({ projectId, payload });
    cloudSaved = cloudResult.ok;
    cloudSaveFailed = !cloudResult.ok;
    if (cloudSaveFailed) {
      const reason = String(cloudResult.reason || "").trim();
      const detail = reason ? ` Reason: ${reason}` : "";
      if (silent) {
        this.setCustomStatus(`Autosave stored layout locally for "${displayName}" in project "${projectTitle}" because server failed.${detail}`);
      } else {
        this.setCustomStatus(`Server save failed for "${displayName}" in project "${projectTitle}". Saved locally only.${detail}`);
      }
    }

    try {
      localStorage.setItem(getLayoutStorageKey(userId, projectId), JSON.stringify(payload));
      localStorage.setItem(getThemeStorageKey(userId, projectId), this.themeState.active);
      if (silent) {
        if (cloudSaved) {
          this.setCustomStatus(`Autosaved layout + theme for "${displayName}" in project "${projectTitle}" to Supabase.`);
        }
        return;
      }
      if (cloudSaved) {
        this.setCustomStatus(`Saved layout + theme for "${displayName}" in project "${projectTitle}" to Supabase.`);
      } else {
        this.setCustomStatus(`Saved layout + theme for "${displayName}" locally.`);
      }
    } catch {
      if (!silent) {
        this.setCustomStatus("Could not save layout. Browser storage may be unavailable.");
      }
    }
  }

  async loadLayoutForUser(userId, options = {}) {
    const projectId = this.getCurrentProjectId();
    const { silent = false } = options;
    const displayName = this.getDisplayName() || userId;
    const projectTitle = this.getProjectTitle() || projectId;
    const cloudResult = await loadLayoutFromCloud({ projectId });
    if (cloudResult.ok && cloudResult.payload) {
      const didApply = this.applyLayoutPayload(cloudResult.payload);
      if (didApply) {
        try {
          localStorage.setItem(getLayoutStorageKey(userId, projectId), JSON.stringify(cloudResult.payload));
          if (cloudResult.payload?.themeKey) {
            localStorage.setItem(getThemeStorageKey(userId, projectId), String(cloudResult.payload.themeKey));
          }
        } catch {
          // Ignore local backup failure and keep cloud-loaded scene.
        }
        if (!silent) {
          this.setCustomStatus(`Loaded layout + theme for "${displayName}" from server.`);
        }
        return true;
      }
      if (!silent) {
        this.setCustomStatus(`Server layout for "${displayName}" is invalid.`);
      }
      return false;
    }

    const raw = localStorage.getItem(getLayoutStorageKey(userId, projectId));
    if (!raw) {
      const localThemeKey = localStorage.getItem(getThemeStorageKey(userId, projectId));
      if (localThemeKey && WORLD_THEMES[localThemeKey]) {
        this.applyTheme(localThemeKey, { silent: true, persist: false });
      }
      if (!silent) {
        this.setCustomStatus(`No saved layout found for "${displayName}" in project "${projectTitle}".`);
      }
      return false;
    }

    try {
      const parsed = JSON.parse(raw);
      const didApply = this.applyLayoutPayload(parsed);
      if (!didApply) throw new Error("Invalid payload");
      if (!silent) {
        this.setCustomStatus(`Loaded layout for "${displayName}" from local backup.`);
      }
      return true;
    } catch {
      if (!silent) {
        this.setCustomStatus(`Saved layout for "${displayName}" is invalid.`);
      }
      return false;
    }
  }

  scheduleAutoSave() {
    if (this.READ_ONLY) return;
    if (this.autoSaveState.timerId) {
      clearTimeout(this.autoSaveState.timerId);
    }
    this.autoSaveState.timerId = window.setTimeout(() => {
      this.autoSaveState.timerId = null;
      const userId = this.getCurrentUserId();
      if (!userId) return;
      void this.saveLayoutForUser(userId, { silent: true });
    }, this.AUTO_SAVE_DELAY_MS);
  }
}
