import * as THREE from "three";
import {
  createPhotoTexture,
  createMemoryTexture,
  createDescriptionTexture,
  createVoiceCloudTexture,
  createReadablePanel,
} from "../textureFactory.js";
import { createVideoTexture } from "../VideoTextureBuilder.js";

// Mixin: memory monolith stations and panel helpers.
// Assigned to WorldBuilder.prototype in WorldBuilder.js.

export function createMemoryMonoliths(memoriesData = this.memoriesData) {
  const dreamThemeColors = this.getMemoryThemeColors("dream");

  const slotPositions = [
    { x: -13, z:  11, side:  1 },
    { x:  13, z:  -7, side: -1 },
    { x: -13, z: -25, side:  1 },
    { x:  13, z: -43, side: -1 },
    { x: -13, z: -61, side:  1 },
    { x:  13, z: -79, side: -1 },
    { x: -13, z: -97, side:  1 },
    { x:  13, z:-113, side: -1 },
  ];

  const MAX_MONOLITHS = 8;

  const entries = Array.isArray(memoriesData)
    ? memoriesData.slice(0, MAX_MONOLITHS).map((memory, index) => ({
        year: memory?.year || `#${index + 1}`,
        title: memory?.title || `Memory ${index + 1}`,
        note: memory?.note || "Interview Memory",
        photo:
          memory?.photo ||
          memory?.photoUrl ||
          memory?.image ||
          memory?.imageUrl ||
          memory?.imageSrc ||
          memory?.url ||
          null,
        video:
          memory?.video ||
          memory?.videoUrl ||
          memory?.videoSrc ||
          memory?.clip ||
          memory?.src ||
          null,
        description:
          memory?.description ||
          memory?.text ||
          "No description provided.",
        voice:
          memory?.voice ||
          memory?.sourceQuote ||
          memory?.description ||
          "No voice memory.",
        x: slotPositions[index].x,
        z: slotPositions[index].z,
        side: slotPositions[index].side,
      }))
    : [];

  if (entries.length === 0) {
    return;
  }

  entries.forEach((entry, index) => {
    const themedEntry = {
      ...entry,
      color: dreamThemeColors[index % dreamThemeColors.length],
    };

    const station = new THREE.Group();
    const componentId = `memory-${themedEntry.year}`;
    station.userData.componentId = componentId;
    station.userData.componentLabel = `${themedEntry.year} - ${themedEntry.title}`;
    station.userData.isCustomizable = true;
    station.position.set(themedEntry.x, 0, themedEntry.z);
    station.rotation.y = themedEntry.side === 1
      ? THREE.MathUtils.degToRad(45)
      : THREE.MathUtils.degToRad(-45);
    this.scene.add(station);

    const orientation = THREE.MathUtils.degToRad(themedEntry.side === -1 ? 12 : -12);

    const photoFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 3.4, 0.24),
      new THREE.MeshStandardMaterial({
        color: 0xededed,
        emissive: 0x9f9f9f,
        emissiveIntensity: 0.12,
        roughness: 0.34,
        metalness: 0.1,
      }),
    );
    photoFrame.position.set(0, 5.2, 0);
    photoFrame.rotation.y = orientation;
    photoFrame.castShadow = true;
    photoFrame.receiveShadow = true;

    const photoPanel = createReadablePanel(3.88, 2.88, new THREE.Texture(), { offset: 0.13 });
    photoFrame.add(photoPanel);
    station.add(photoFrame);

    const videoFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.32, 1.93, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        emissive: 0x8f8f8f,
        emissiveIntensity: 0.1,
        roughness: 0.36,
        metalness: 0.12,
      }),
    );
    videoFrame.position.set(themedEntry.side * -4.2, 5.6, -2.8);
    videoFrame.rotation.y = THREE.MathUtils.degToRad(themedEntry.side === -1 ? -26 : 26);
    videoFrame.castShadow = true;
    videoFrame.receiveShadow = true;

    const videoPanel = createReadablePanel(3.18, 1.79, new THREE.Texture(), { offset: 0.13 });
    videoFrame.add(videoPanel);
    station.add(videoFrame);

    const photoAspectState = { requestId: 0, currentAspect: 3.88 / 2.88 };
    const videoAspectState = { requestId: 0, currentAspect: 16 / 9 };

    photoAspectState.requestId += 1;
    const initialPhotoRequestId = photoAspectState.requestId;
    videoAspectState.requestId += 1;
    const initialVideoRequestId = videoAspectState.requestId;

    const stationTextures = this.createMemoryStationTextures(
      themedEntry,
      (aspect) => {
        if (initialPhotoRequestId !== photoAspectState.requestId) return;
        photoAspectState.currentAspect = aspect;
        this.applyPhotoFrameAspect(photoFrame, photoPanel, aspect);
      },
      (aspect) => {
        if (initialVideoRequestId !== videoAspectState.requestId) return;
        videoAspectState.currentAspect = aspect;
        this.applyVideoFrameAspect(videoFrame, videoPanel, aspect);
      },
      (texture) => {
        if (initialVideoRequestId !== videoAspectState.requestId) return;
        this.updatePanelTexture(videoPanel, texture);
      },
    );

    this.updatePanelTexture(photoPanel, stationTextures.photoTexture);
    const initialPhotoAspect =
      stationTextures.photoTexture.userData?.photoAspect ?? photoAspectState.currentAspect;
    photoAspectState.currentAspect = initialPhotoAspect;
    this.applyPhotoFrameAspect(photoFrame, photoPanel, initialPhotoAspect);

    this.updatePanelTexture(
      videoPanel,
      stationTextures.videoFallbackTexture ?? stationTextures.videoTexture,
    );
    const initialVideoAspect =
      stationTextures.videoTexture.userData?.mediaAspect ?? videoAspectState.currentAspect;
    videoAspectState.currentAspect = initialVideoAspect;
    this.applyVideoFrameAspect(videoFrame, videoPanel, initialVideoAspect);

    const archiveCard = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 3.6, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0xe4e4e4,
        emissive: 0x8c8c8c,
        emissiveIntensity: 0.12,
        roughness: 0.3,
        metalness: 0.12,
      }),
    );
    archiveCard.position.set(themedEntry.side * 4.8, 3.2, 1.4);
    archiveCard.rotation.y = THREE.MathUtils.degToRad(themedEntry.side === -1 ? 24 : -24);
    archiveCard.castShadow = true;
    archiveCard.receiveShadow = true;
    const archivePanel = createReadablePanel(1.92, 3.08, stationTextures.photoFrameTexture, { offset: 0.11 });
    archiveCard.add(archivePanel);
    station.add(archiveCard);

    const descriptionPanel = createReadablePanel(3.9, 2.45, stationTextures.descriptionTexture, {
      offset: 0.03,
    });
    descriptionPanel.position.set(themedEntry.side * 3.2, 2.1, -4.2);
    descriptionPanel.rotation.y = THREE.MathUtils.degToRad(themedEntry.side === -1 ? 12 : -12);
    station.add(descriptionPanel);

    const voiceCloud = createReadablePanel(4.2, 2.3, stationTextures.voiceTexture, {
      offset: 0.03,
      depthWrite: false,
    });
    voiceCloud.position.set(themedEntry.side * 3.8, 8.2, 1.2);
    voiceCloud.rotation.y = THREE.MathUtils.degToRad(themedEntry.side === -1 ? 15 : -15);
    station.add(voiceCloud);

    const beacon = new THREE.PointLight(index % 2 === 0 ? 0xf0f0f0 : 0xbcbcbc, 16, 16, 2);
    beacon.position.set(0, 4.4, 1.8);
    station.add(beacon);
    this.pulseLights.push({
      light: beacon,
      base: 16,
      speed: 1 + index * 0.18,
      range: 3,
    });

    const cloudPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 2.4, 0.45, 32),
      new THREE.MeshStandardMaterial({
        color: 0xf8f8f8,
        emissive: 0x8e8e8e,
        emissiveIntensity: 0.18,
        transparent: true,
        opacity: 0.62,
        roughness: 0.92,
        metalness: 0.02,
      }),
    );
    cloudPedestal.position.set(0, 0.26, 0);
    cloudPedestal.scale.set(1.4, 1, 1.1);
    cloudPedestal.receiveShadow = true;
    station.add(cloudPedestal);

    this.animatedObjects.push({ object: photoFrame,       baseY: 5.2, floatAmount: 0.16, floatSpeed: 0.55 + index * 0.08, spinSpeed: 0 });
    this.animatedObjects.push({ object: archiveCard,      baseY: 3.2, floatAmount: 0.14, floatSpeed: 0.72 + index * 0.06, spinSpeed: 0 });
    this.animatedObjects.push({ object: videoFrame,       baseY: 5.6, floatAmount: 0.11, floatSpeed: 0.78 + index * 0.07, spinSpeed: 0 });
    this.animatedObjects.push({ object: descriptionPanel, baseY: 2.1, floatAmount: 0.12, floatSpeed: 0.9  + index * 0.08, spinSpeed: 0 });
    this.animatedObjects.push({ object: voiceCloud,       baseY: 8.2, floatAmount: 0.2,  floatSpeed: 0.8  + index * 0.12, spinSpeed: 0 });

    this.memoryStations.push({
      index,
      station,
      entry: {
        year: themedEntry.year,
        title: themedEntry.title,
        note: themedEntry.note,
        description: themedEntry.description,
        voice: themedEntry.voice,
        side: themedEntry.side,
        photo: themedEntry.photo || null,
        video: themedEntry.video || null,
      },
      photoPanel,
      photoFrame,
      videoPanel,
      videoFrame,
      archivePanel,
      descriptionPanel,
      voiceCloud,
      textures: stationTextures,
      photoAspectState,
      videoAspectState,
    });

    this.registerCustomizableComponent(componentId, station, {
      year: themedEntry.year,
      title: themedEntry.title,
      note: themedEntry.note,
    });
  });
}

export function createMemoryStationTextures(
  entry,
  onPhotoAspectChange = null,
  onVideoAspectChange = null,
  onVideoTextureReady = null,
) {
  const photoTexture = createPhotoTexture(entry, this.activeThemeKey, onPhotoAspectChange);
  photoTexture.colorSpace = THREE.SRGBColorSpace;

  const photoFrameTexture = createMemoryTexture(
    entry.year,
    entry.note,
    entry.color,
    this.activeThemeKey,
  );
  photoFrameTexture.colorSpace = THREE.SRGBColorSpace;

  const descriptionTexture = createDescriptionTexture(entry, this.activeThemeKey);
  descriptionTexture.colorSpace = THREE.SRGBColorSpace;

  const voiceTexture = createVoiceCloudTexture(entry.voice, entry.color, this.activeThemeKey);
  voiceTexture.colorSpace = THREE.SRGBColorSpace;

  const { videoTexture, videoFallbackTexture } = createVideoTexture(
    entry,
    onVideoAspectChange,
    onVideoTextureReady,
  );

  return {
    photoTexture,
    photoFrameTexture,
    descriptionTexture,
    voiceTexture,
    videoTexture,
    videoFallbackTexture,
  };
}

export function updatePanelTexture(panelGroup, texture) {
  if (!panelGroup) return;
  panelGroup.children.forEach((child) => {
    if (!child.material) return;
    child.material.map = texture;
    child.material.needsUpdate = true;
  });
}

export function resizeReadablePanel(panelGroup, width, height) {
  if (!panelGroup) return;
  panelGroup.children.forEach((child) => {
    if (!child?.isMesh || !child.geometry) return;
    child.geometry.dispose?.();
    child.geometry = new THREE.PlaneGeometry(width, height);
  });
}

export function applyMediaFrameAspect(frame, panel, aspect, options = {}) {
  if (!frame || !Number.isFinite(aspect) || aspect <= 0) return;

  const baseInnerWidth = options.baseInnerWidth ?? 3.88;
  const baseInnerHeight = options.baseInnerHeight ?? 2.88;
  const frameBorder = options.frameBorder ?? 0.06;
  const minAspect = options.minAspect ?? 0.9;
  const maxAspect = options.maxAspect ?? 2.2;
  const maxLandscapeScale = options.maxLandscapeScale ?? 1.3;

  const baseInnerAspect = baseInnerWidth / baseInnerHeight;
  const boundedAspect = THREE.MathUtils.clamp(aspect, minAspect, maxAspect);

  let innerWidth, innerHeight;
  if (boundedAspect >= 1) {
    innerWidth = baseInnerWidth * Math.min(boundedAspect / baseInnerAspect, maxLandscapeScale);
    innerHeight = innerWidth / boundedAspect;
  } else {
    innerHeight = baseInnerHeight;
    innerWidth = innerHeight * boundedAspect;
  }

  const outerWidth = innerWidth + frameBorder * 2;
  const outerHeight = innerHeight + frameBorder * 2;

  frame.geometry.dispose?.();
  frame.geometry = new THREE.BoxGeometry(outerWidth, outerHeight, 0.24);

  this.resizeReadablePanel(panel, innerWidth, innerHeight);
  frame.scale.set(1, 1, 1);
}

export function applyPhotoFrameAspect(photoFrame, photoPanel, aspect) {
  this.applyMediaFrameAspect(photoFrame, photoPanel, aspect, {
    baseInnerWidth: 3.88,
    baseInnerHeight: 2.88,
    frameBorder: 0.06,
    minAspect: 0.9,
    maxAspect: 2.2,
    maxLandscapeScale: 1.3,
  });
}

export function applyVideoFrameAspect(videoFrame, videoPanel, aspect) {
  this.applyMediaFrameAspect(videoFrame, videoPanel, aspect, {
    baseInnerWidth: 3.68,
    baseInnerHeight: 2.79,
    frameBorder: 0.06,
    minAspect: 0.56,
    maxAspect: 2.4,
    maxLandscapeScale: 1.2,
  });
}

export function updatePanelTint(panelGroup, tintColor) {
  if (!panelGroup) return;
  panelGroup.children.forEach((child) => {
    if (!child.material || !child.material.color) return;
    child.material.color.set(tintColor);
  });
}

export function disposeStationTextures(textures) {
  if (!textures) return;
  const uniqueTextures = [...new Set(Object.values(textures).filter(Boolean))];
  uniqueTextures.forEach((texture) => {
    texture?.userData?.cleanup?.();
    texture?.dispose?.();
  });
}
