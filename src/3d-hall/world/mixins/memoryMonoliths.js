import * as THREE from "three";
import {
  createPhotoTexture,
  createMemoryTexture,
  createDescriptionTexture,
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
    station.rotation.y = THREE.MathUtils.degToRad(themedEntry.side === 1 ? 8 : -8);
    this.scene.add(station);

    // ─── Glow backdrop ลอยหลังรูป ─────────────────────────
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(themedEntry.color),
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 6.4), glowMat);
    glowPlane.position.set(0, 4.4, -0.35);
    station.add(glowPlane);

    // ─── Photo (hero ตรงกลาง ใหญ่เด่น) ────────────────────
    const photoFrame = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 5.2, 0.18),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xd4d4d4,
        emissiveIntensity: 0.25,
        roughness: 0.18,
        metalness: 0.06,
      }),
    );
    photoFrame.position.set(0, 4.4, 0);
    photoFrame.castShadow = true;
    photoFrame.receiveShadow = true;
    const photoPanel = createReadablePanel(6.9, 4.7, new THREE.Texture(), { offset: 0.10 });
    photoFrame.add(photoPanel);
    station.add(photoFrame);

    // ─── Description card (gallery plaque ข้างล่างรูป) ─────
    const descriptionPanel = createReadablePanel(5.0, 2.4, new THREE.Texture(), { offset: 0.03 });
    descriptionPanel.position.set(0, 1.2, 1.2);
    station.add(descriptionPanel);

    // ─── Video (companion piece ข้างรูป เอียงเข้าหา) ──────
    const videoFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 2.1, 0.16),
      new THREE.MeshStandardMaterial({
        color: 0xf2f2f2,
        emissive: 0xa0a0a0,
        emissiveIntensity: 0.14,
        roughness: 0.30,
        metalness: 0.08,
      }),
    );
    const vSide = themedEntry.side;
    videoFrame.position.set(vSide * -5.2, 4.0, -1.8);
    videoFrame.rotation.y = THREE.MathUtils.degToRad(vSide === -1 ? -22 : 22);
    videoFrame.castShadow = true;
    videoFrame.receiveShadow = true;
    const videoPanel = createReadablePanel(3.3, 1.9, new THREE.Texture(), { offset: 0.09 });
    videoFrame.add(videoPanel);
    station.add(videoFrame);

    // ─── Archive card (accent card ฝั่งตรงข้าม) ───────────
    const archiveCard = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 3.4, 0.16),
      new THREE.MeshStandardMaterial({
        color: 0xfafafa,
        emissive: 0xa8a8a8,
        emissiveIntensity: 0.14,
        roughness: 0.26,
        metalness: 0.10,
      }),
    );
    archiveCard.position.set(vSide * 5.4, 3.4, -0.8);
    archiveCard.rotation.y = THREE.MathUtils.degToRad(vSide === -1 ? 16 : -16);
    archiveCard.castShadow = true;
    archiveCard.receiveShadow = true;
    const archivePanel = createReadablePanel(1.82, 2.96, new THREE.Texture(), { offset: 0.09 });
    archiveCard.add(archivePanel);
    station.add(archiveCard);

    // ─── Textures ──────────────────────────────────────────
    const photoAspectState = { requestId: 0, currentAspect: 6.9 / 4.7 };
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

    this.updatePanelTexture(descriptionPanel, stationTextures.descriptionTexture);

    this.updatePanelTexture(
      videoPanel,
      stationTextures.videoFallbackTexture ?? stationTextures.videoTexture,
    );
    const initialVideoAspect =
      stationTextures.videoTexture.userData?.mediaAspect ?? videoAspectState.currentAspect;
    videoAspectState.currentAspect = initialVideoAspect;
    this.applyVideoFrameAspect(videoFrame, videoPanel, initialVideoAspect);

    this.updatePanelTexture(archivePanel, stationTextures.photoFrameTexture);

    // ─── Lighting (warm spotlight บนรูป) ───────────────────
    const spotlight = new THREE.PointLight(0xfff0e6, 22, 18, 2);
    spotlight.position.set(0, 7.5, 3.0);
    station.add(spotlight);
    this.pulseLights.push({ light: spotlight, base: 22, speed: 0.8 + index * 0.15, range: 4 });

    const accentLight = new THREE.PointLight(
      new THREE.Color(themedEntry.color), 8, 12, 2
    );
    accentLight.position.set(0, 2.0, 2.5);
    station.add(accentLight);
    this.pulseLights.push({ light: accentLight, base: 8, speed: 1.2 + index * 0.1, range: 3 });

    // ─── Pedestal ──────────────────────────────────────────
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 3.0, 0.3, 48),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xc0c0c0,
        emissiveIntensity: 0.22,
        transparent: true,
        opacity: 0.50,
        roughness: 0.85,
        metalness: 0.02,
      }),
    );
    pedestal.position.set(0, 0.16, 0.4);
    pedestal.scale.set(1.5, 1, 1.0);
    pedestal.receiveShadow = true;
    station.add(pedestal);

    // ─── Animation ─────────────────────────────────────────
    this.animatedObjects.push({ object: photoFrame,       baseY: 4.4,  floatAmount: 0.12, floatSpeed: 0.45 + index * 0.06, spinSpeed: 0 });
    this.animatedObjects.push({ object: descriptionPanel, baseY: 1.2,  floatAmount: 0.06, floatSpeed: 0.50 + index * 0.05, spinSpeed: 0 });
    this.animatedObjects.push({ object: videoFrame,       baseY: 4.0,  floatAmount: 0.10, floatSpeed: 0.60 + index * 0.07, spinSpeed: 0 });
    this.animatedObjects.push({ object: archiveCard,      baseY: 3.4,  floatAmount: 0.10, floatSpeed: 0.55 + index * 0.06, spinSpeed: 0 });
    this.animatedObjects.push({ object: glowPlane,        baseY: 4.4,  floatAmount: 0.12, floatSpeed: 0.45 + index * 0.06, spinSpeed: 0 });
    this.memoryStations.push({
      index,
      station,
      entry: {
        year: themedEntry.year,
        title: themedEntry.title,
        note: themedEntry.note,
        description: themedEntry.description,
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

  const { videoTexture, videoFallbackTexture } = createVideoTexture(
    entry,
    onVideoAspectChange,
    onVideoTextureReady,
  );

  return {
    photoTexture,
    photoFrameTexture,
    descriptionTexture,
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
    baseInnerWidth: 6.9,
    baseInnerHeight: 4.7,
    frameBorder: 0.25,
    minAspect: 0.9,
    maxAspect: 2.2,
    maxLandscapeScale: 1.3,
  });
}

export function applyVideoFrameAspect(videoFrame, videoPanel, aspect) {
  this.applyMediaFrameAspect(videoFrame, videoPanel, aspect, {
    baseInnerWidth: 3.3,
    baseInnerHeight: 1.9,
    frameBorder: 0.15,
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
