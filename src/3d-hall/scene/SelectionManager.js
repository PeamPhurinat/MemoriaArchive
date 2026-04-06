import * as THREE from "three";

// Handles object selection, transform controls, custom drag, and spawning.

export class SelectionManager {
  constructor({
    scene,
    camera,
    renderer,
    world,
    customState,
    customizableComponents,
    defaultLayoutStates,
    spawnedComponentIds,
    spawnCounter,
    transformControls,
    orbitControls,
    selectionOutline,
    raycaster,
    pointer,
    dragIntersection,
    customDrag,
    worldBuilder,
    moveButton,
    resizeButton,
    scaleSlider,
    scaleValue,
    heightSlider,
    heightValue,
    setCustomStatus,
    scheduleAutoSave,
    captureThemeBaseline,
    applyTheme,
    themeState,
    registerCustomizableComponent,
  }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.world = world;
    this.customState = customState;
    this.customizableComponents = customizableComponents;
    this.defaultLayoutStates = defaultLayoutStates;
    this.spawnedComponentIds = spawnedComponentIds;
    this._spawnCounter = spawnCounter;
    this.transformControls = transformControls;
    this.orbitControls = orbitControls;
    this.selectionOutline = selectionOutline;
    this.raycaster = raycaster;
    this.pointer = pointer;
    this.dragIntersection = dragIntersection;
    this.customDrag = customDrag;
    this.worldBuilder = worldBuilder;
    this.moveButton = moveButton;
    this.resizeButton = resizeButton;
    this.scaleSlider = scaleSlider;
    this.scaleValue = scaleValue;
    this.heightSlider = heightSlider;
    this.heightValue = heightValue;
    this.setCustomStatus = setCustomStatus;
    this.scheduleAutoSave = scheduleAutoSave;
    this.captureThemeBaseline = captureThemeBaseline;
    this.applyTheme = applyTheme;
    this.themeState = themeState;
    this.registerCustomizableComponent = registerCustomizableComponent;
  }

  get spawnCounter() { return this._spawnCounter.value; }
  set spawnCounter(v) { this._spawnCounter.value = v; }

  clampScale(component) {
    component.scale.x = Math.max(0.35, component.scale.x);
    component.scale.y = Math.max(0.35, component.scale.y);
    component.scale.z = Math.max(0.35, component.scale.z);
  }

  getUniformScale(component) {
    return (component.scale.x + component.scale.y + component.scale.z) / 3;
  }

  updateScaleUi() {
    const selected = this.getSelectedComponent();
    if (!selected || selected.visible === false) {
      this.scaleSlider.value = "1";
      this.scaleSlider.disabled = true;
      this.scaleValue.textContent = "--";
      return;
    }
    const uniformScale = THREE.MathUtils.clamp(this.getUniformScale(selected), 0.35, 3);
    this.scaleSlider.disabled = false;
    this.scaleSlider.value = uniformScale.toFixed(2);
    this.scaleValue.textContent = `${Math.round(uniformScale * 100)}%`;
  }

  updateHeightUi() {
    const selected = this.getSelectedComponent();
    if (!selected || selected.visible === false) {
      this.heightSlider.value = "0";
      this.heightSlider.disabled = true;
      this.heightValue.textContent = "--";
      return;
    }
    const y = THREE.MathUtils.clamp(selected.position.y, 0, 12);
    this.heightSlider.disabled = false;
    this.heightSlider.value = y.toFixed(2);
    this.heightValue.textContent = y.toFixed(1);
  }

  getSelectedComponent() {
    if (!this.customState.selectedId) return null;
    return this.customizableComponents.get(this.customState.selectedId) ?? null;
  }

  selectComponent(component) {
    if (!component || this.customState.mode !== "custom" || component.visible === false) return;
    this.customState.selectedId = component.userData.componentId;
    this.syncTransformControls();
    this.updateSelectionOutline();
    const label = component.userData.componentLabel ?? this.customState.selectedId;
    const action = this.customState.transformMode === "scale"
      ? "resize using the gizmo"
      : "move by dragging or with the gizmo";
    this.setCustomStatus(`Selected "${label}". You can now ${action}.`);
    this.updateScaleUi();
    this.updateHeightUi();
  }

  clearSelection() {
    this.customState.selectedId = null;
    this.stopCustomDrag();
    this.syncTransformControls();
    this.selectionOutline.visible = false;
    this.updateScaleUi();
    this.updateHeightUi();
  }

  setTransformMode(mode) {
    const nextMode = mode === "scale" ? "scale" : "translate";
    this.customState.transformMode = nextMode;
    this.transformControls.setMode(nextMode);
    this.syncTransformControls();
    this.moveButton.classList.toggle("is-active", nextMode === "translate");
    this.resizeButton.classList.toggle("is-active", nextMode === "scale");
    if (nextMode === "scale") {
      this.setCustomStatus("Resize mode enabled. Drag gizmo handles or use the scale slider.");
    }
  }

  syncTransformControls() {
    const selected = this.getSelectedComponent();
    const canUseGizmo =
      this.customState.mode === "custom" &&
      this.customState.transformMode === "scale" &&
      !!selected &&
      selected.visible !== false;

    if (canUseGizmo) {
      this.transformControls.attach(selected);
      this.transformControls.enabled = true;
      this.transformControls.visible = true;
      return;
    }
    this.transformControls.detach();
    this.transformControls.enabled = false;
    this.transformControls.visible = false;
  }

  updateSelectionOutline() {
    const selected = this.getSelectedComponent();
    if (!selected || this.customState.mode !== "custom" || selected.visible === false) {
      this.selectionOutline.visible = false;
      return;
    }
    this.selectionOutline.setFromObject(selected);
    this.selectionOutline.visible = true;
  }

  deleteSelectedComponent() {
    if (this.customState.mode !== "custom") return;
    const selected = this.getSelectedComponent();
    if (!selected) {
      this.setCustomStatus("Select a memory component first.");
      return;
    }
    const componentId = selected.userData.componentId;
    const label = selected.userData.componentLabel ?? componentId;

    if (this.spawnedComponentIds.has(componentId)) {
      this.scene.remove(selected);
      this.customizableComponents.delete(componentId);
      this.spawnedComponentIds.delete(componentId);
      this.defaultLayoutStates.delete(componentId);
    } else {
      selected.visible = false;
    }
    this.clearSelection();
    this.setCustomStatus(`Deleted "${label}" from this layout. Changes auto-save shortly.`);
    this.scheduleAutoSave();
  }

  spawnObject(type, worldPosition) {
    const group = this.worldBuilder.createSpawnableObject(type);
    if (!group) return;

    this._spawnCounter.value += 1;
    const componentId = `spawned-${type}-${this._spawnCounter.value}`;
    const label = group.userData.spawnLabel ?? type;

    group.userData.componentId = componentId;
    group.userData.componentLabel = label;
    group.userData.isCustomizable = true;
    group.userData.isUserSpawned = true;

    if (worldPosition) {
      group.position.copy(worldPosition);
    } else {
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
      forward.normalize();
      group.position.copy(this.camera.position).addScaledVector(forward, 8);
      group.position.y = 0;
    }

    this.registerCustomizableComponent(componentId, group, { label, type, isUserSpawned: true });
    this.spawnedComponentIds.add(componentId);
    this.captureThemeBaseline();
    this.applyTheme(this.themeState.active, { silent: true, persist: false });
    this.selectComponent(group);
    this.scheduleAutoSave();
    this.setCustomStatus(`Added "${label}" to the scene.`);
  }

  findCustomizableRoot(object) {
    let current = object;
    while (current) {
      if (current.userData?.isCustomizable) return current;
      current = current.parent;
    }
    return null;
  }

  handleCanvasPointerDown(event) {
    if (this.customState.mode !== "custom" || event.button !== 0 || this.transformControls.dragging) return;

    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const roots = Array.from(this.customizableComponents.values()).filter(
      (component) => component.visible !== false,
    );

    if (this.customState.transformMode === "scale" && this.transformControls.enabled && this.transformControls.object) {
      const gizmoHits = this.raycaster.intersectObject(this.transformControls, true);
      if (gizmoHits.length) return;
    }

    const intersections = this.raycaster.intersectObjects(roots, true);
    if (!intersections.length) {
      this.clearSelection();
      this.stopCustomDrag();
      return;
    }

    const selectedRoot = this.findCustomizableRoot(intersections[0].object);
    if (selectedRoot) {
      this.selectComponent(selectedRoot);
      if (this.customState.transformMode === "translate") {
        this.startCustomDrag(selectedRoot, event);
      }
    }
  }

  startCustomDrag(component, event) {
    this.customDrag.component = component;
    this.customDrag.isPointerDown = true;
    this.customDrag.isDragging = false;
    this.customDrag.pointerId = event.pointerId ?? null;
    this.customDrag.plane.set(new THREE.Vector3(0, 1, 0), -component.position.y);

    if (this.raycaster.ray.intersectPlane(this.customDrag.plane, this.dragIntersection)) {
      this.customDrag.offset.copy(component.position).sub(this.dragIntersection);
    } else {
      this.customDrag.offset.set(0, 0, 0);
    }

    this.orbitControls.enabled = false;
    if (this.customDrag.pointerId !== null) {
      try {
        this.renderer.domElement.setPointerCapture(this.customDrag.pointerId);
      } catch {
        // Ignore browsers that reject capture for this target.
      }
    }
  }

  stopCustomDrag() {
    if (this.customDrag.pointerId !== null) {
      try {
        this.renderer.domElement.releasePointerCapture(this.customDrag.pointerId);
      } catch {
        // Ignore browsers that already released capture.
      }
    }
    this.customDrag.pointerId = null;
    this.customDrag.component = null;
    this.customDrag.isPointerDown = false;
    this.customDrag.isDragging = false;
    this.customDrag.offset.set(0, 0, 0);
    this.orbitControls.enabled = this.customState.mode === "custom" && !this.transformControls.dragging;
  }

  handleCanvasPointerMove(event) {
    if (
      this.customState.mode !== "custom" ||
      this.customState.transformMode !== "translate" ||
      !this.customDrag.isPointerDown ||
      !this.customDrag.component
    ) return;

    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    if (!this.raycaster.ray.intersectPlane(this.customDrag.plane, this.dragIntersection)) return;

    const component = this.customDrag.component;
    const nextPosition = this.dragIntersection.clone().add(this.customDrag.offset);
    component.position.x = THREE.MathUtils.clamp(nextPosition.x, -this.world.size + 8, this.world.size - 8);
    component.position.z = THREE.MathUtils.clamp(nextPosition.z, -this.world.size + 8, this.world.size - 8);
    this.customDrag.isDragging = true;
    this.updateSelectionOutline();
  }

  handleCanvasPointerUp() {
    if (this.customState.mode !== "custom" || this.customState.transformMode !== "translate") return;
    if (this.customDrag.component && this.customDrag.isDragging) {
      const label = this.customDrag.component.userData.componentLabel ?? this.customDrag.component.userData.componentId;
      this.setCustomStatus(`Moved "${label}". Changes auto-save shortly.`);
      this.scheduleAutoSave();
    }
    this.stopCustomDrag();
  }

  updateBarrierPostConstraints() {
    this.spawnedComponentIds.forEach((id) => {
      const comp = this.customizableComponents.get(id);
      if (!comp) return;
      if (comp.userData.componentMetadata?.type !== "barrier") return;
      const sx = comp.scale.x, sy = comp.scale.y, sz = comp.scale.z;
      comp.children.forEach((child) => {
        if (child.userData.isBarrierPost) {
          child.scale.set(1 / sx, 1 / sy, 1 / sz);
        }
      });
    });
  }
}
