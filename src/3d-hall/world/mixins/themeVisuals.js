import * as THREE from "three";
import { createGroundTexture, createMistTexture } from "../textureFactory.js";

// Mixin: theme colour helpers and visual refresh.
// Assigned to WorldBuilder.prototype in WorldBuilder.js.

export function getMemoryThemeColors(themeKey) {
  if (themeKey === "midnight") {
    return ["#90a7ff", "#b6c6ff", "#8199f2", "#d0dcff", "#657fdd"];
  }
  if (themeKey === "sunset") {
    return ["#ffd9b4", "#ffc79f", "#ffb98f", "#ffe1bf", "#f4b180"];
  }
  return ["#ffd8ef", "#ffe5f5", "#ffd0ea", "#ffeaf5", "#f7dce9"];
}

export function getReadablePanelTint(themeKey) {
  if (themeKey === "midnight") return "#e8f0ff";
  if (themeKey === "sunset")   return "#fff0df";
  return "#ffffff";
}

export function refreshGroundTexture(themeKey) {
  if (!this.groundMesh?.material) return;

  const nextTexture = createGroundTexture(themeKey);
  nextTexture.wrapS = THREE.RepeatWrapping;
  nextTexture.wrapT = THREE.RepeatWrapping;
  nextTexture.repeat.set(8, 8);
  nextTexture.colorSpace = THREE.SRGBColorSpace;

  this.groundTexture?.dispose?.();
  this.groundTexture = nextTexture;
  this.groundMesh.material.map = nextTexture;
  this.groundMesh.material.needsUpdate = true;
}

export function refreshMistTexture(themeKey) {
  if (!this.mistMaterials.length) return;

  const nextTexture = createMistTexture(themeKey);
  nextTexture.colorSpace = THREE.SRGBColorSpace;

  this.mistTexture?.dispose?.();
  this.mistTexture = nextTexture;

  this.mistMaterials.forEach((material) => {
    material.map = nextTexture;
    material.needsUpdate = true;
  });
}

export function applyThemeVisuals(themeKey) {
  this.activeThemeKey = themeKey;
  this.refreshGroundTexture(themeKey);
  this.refreshMistTexture(themeKey);

  const palette = this.getMemoryThemeColors(themeKey);
  const panelTint = this.getReadablePanelTint(themeKey);

  this.memoryStations.forEach((stationData) => {
    const themedEntry = {
      ...stationData.entry,
      color: palette[stationData.index % palette.length],
    };

    const photoAspectState = stationData.photoAspectState ?? { requestId: 0, currentAspect: 3.88 / 2.88 };
    const videoAspectState = stationData.videoAspectState ?? { requestId: 0, currentAspect: 16 / 9 };
    stationData.photoAspectState = photoAspectState;
    stationData.videoAspectState = videoAspectState;

    photoAspectState.requestId += 1;
    videoAspectState.requestId += 1;
    const photoRequestId = photoAspectState.requestId;
    const videoRequestId = videoAspectState.requestId;

    const nextTextures = this.createMemoryStationTextures(
      themedEntry,
      (aspect) => {
        if (photoRequestId !== photoAspectState.requestId) return;
        photoAspectState.currentAspect = aspect;
        this.applyPhotoFrameAspect(stationData.photoFrame, stationData.photoPanel, aspect);
      },
      (aspect) => {
        if (videoRequestId !== videoAspectState.requestId) return;
        videoAspectState.currentAspect = aspect;
        this.applyVideoFrameAspect(stationData.videoFrame, stationData.videoPanel, aspect);
      },
      (texture) => {
        if (videoRequestId !== videoAspectState.requestId) return;
        this.updatePanelTexture(stationData.videoPanel, texture);
      },
    );

    const nextPhotoAspect = nextTextures.photoTexture.userData?.photoAspect ?? photoAspectState.currentAspect;
    photoAspectState.currentAspect = nextPhotoAspect;
    this.applyPhotoFrameAspect(stationData.photoFrame, stationData.photoPanel, nextPhotoAspect);

    const nextVideoAspect = nextTextures.videoTexture.userData?.mediaAspect ?? videoAspectState.currentAspect;
    videoAspectState.currentAspect = nextVideoAspect;
    this.applyVideoFrameAspect(stationData.videoFrame, stationData.videoPanel, nextVideoAspect);

    this.updatePanelTexture(stationData.photoPanel,        nextTextures.photoTexture);
    this.updatePanelTexture(stationData.videoPanel,        nextTextures.videoFallbackTexture ?? nextTextures.videoTexture);
    this.updatePanelTexture(stationData.archivePanel,      nextTextures.photoFrameTexture);
    this.updatePanelTexture(stationData.descriptionPanel,  nextTextures.descriptionTexture);

    this.updatePanelTint(stationData.photoPanel,        panelTint);
    this.updatePanelTint(stationData.videoPanel,        panelTint);
    this.updatePanelTint(stationData.archivePanel,      panelTint);
    this.updatePanelTint(stationData.descriptionPanel,  panelTint);

    this.disposeStationTextures(stationData.textures);
    stationData.textures = nextTextures;
  });
}
