import * as THREE from "three";
import {
  createDescriptionTexture,
  createGroundTexture,
  createMemoryTexture,
  createMistTexture,
  createPhotoTexture,
  createReadablePanel,
  createStarTexture,
  createVoiceCloudTexture,
} from "./textureFactory.js";

export class WorldBuilder {
  constructor({ scene, animatedObjects, pulseLights, world, registerCustomizableComponent }) {
    this.scene = scene;
    this.animatedObjects = animatedObjects;
    this.pulseLights = pulseLights;
    this.world = world;
    this.registerCustomizableComponent = registerCustomizableComponent;
    this.memoryStations = [];
    this.activeThemeKey = "dream";
    this.groundMesh = null;
    this.groundTexture = null;
    this.mistTexture = null;
    this.mistMaterials = [];
  }

  buildAll() {
    this.createGround();
    this.createSkyHalo();
    this.createSkyMist();
    this.createBrokenColumns();
    this.createStandingPillars();
    this.createTimelineTrail();
    this.createMemoryMonoliths();
    this.createFloatingRuinFragments();
    this.createDreamParticles();
    this.createGlitterStars();
  }

  createGround() {
    const groundTexture = createGroundTexture(this.activeThemeKey);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(8, 8);
    groundTexture.colorSpace = THREE.SRGBColorSpace;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.world.size * 2.4, this.world.size * 2.4, 1, 1),
      new THREE.MeshStandardMaterial({
        color: 0xffedf7,
        map: groundTexture,
        metalness: 0.02,
        roughness: 0.78,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
    this.groundTexture = groundTexture;
  }

  createSkyHalo() {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(44, 1.2, 32, 120),
      new THREE.MeshBasicMaterial({
        color: 0xffd8ef,
        transparent: true,
        opacity: 0.28,
      }),
    );
    halo.rotation.x = Math.PI / 2.25;
    halo.position.set(0, 28, -10);
    this.scene.add(halo);
    this.animatedObjects.push({
      object: halo,
      baseY: halo.position.y,
      floatAmount: 0.8,
      floatSpeed: 0.22,
      spinSpeed: 0.08,
    });

    const innerHalo = new THREE.Mesh(
      new THREE.TorusGeometry(26, 0.55, 24, 96),
      new THREE.MeshBasicMaterial({
        color: 0xffebf6,
        transparent: true,
        opacity: 0.24,
      }),
    );
    innerHalo.rotation.x = Math.PI / 2.8;
    innerHalo.position.set(0, 18, 12);
    this.scene.add(innerHalo);
    this.animatedObjects.push({
      object: innerHalo,
      baseY: innerHalo.position.y,
      floatAmount: 0.55,
      floatSpeed: 0.28,
      spinSpeed: -0.06,
    });
  }

  createSkyMist() {
    const cloudTexture = createMistTexture(this.activeThemeKey);
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    this.mistTexture = cloudTexture;
    this.mistMaterials = [];

    const cloudMaterial = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      depthWrite: false,
      color: 0xffffff,
    });

    const formations = [
      { x: -28, y: 23, z: -42, sx: 18, sy: 8 },
      { x: 24, y: 18, z: -34, sx: 15, sy: 6.5 },
      { x: 0, y: 26, z: -58, sx: 22, sy: 9 },
      { x: 36, y: 21, z: -12, sx: 12, sy: 5.5 },
      { x: -38, y: 17, z: 6, sx: 14, sy: 6 },
    ];

    formations.forEach((entry, index) => {
      const mist = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), cloudMaterial.clone());
      mist.position.set(entry.x, entry.y, entry.z);
      mist.scale.set(entry.sx, entry.sy, 1);
      mist.rotation.y = THREE.MathUtils.degToRad(index % 2 === 0 ? 18 : -22);
      this.scene.add(mist);
      this.mistMaterials.push(mist.material);

      this.animatedObjects.push({
        object: mist,
        baseY: mist.position.y,
        floatAmount: 0.45 + index * 0.08,
        floatSpeed: 0.16 + index * 0.03,
        spinSpeed: 0.004 * (index % 2 === 0 ? 1 : -1),
      });
    });
  }

  createBrokenColumns() {
    const positions = [
      { x: -24, z: 14, rotation: 0.9, scale: 1.05 },
      { x: 20, z: -9, rotation: -0.65, scale: 0.95 },
      { x: -11, z: -26, rotation: 0.4, scale: 1.18 },
      { x: 28, z: 22, rotation: -1.1, scale: 1.02 },
      { x: 6, z: 31, rotation: 0.2, scale: 0.88 },
      { x: -31, z: -4, rotation: -0.35, scale: 1.12 },
    ];

    positions.forEach((entry, index) => {
      const column = this.createRomanColumn(false);
      column.scale.setScalar(entry.scale);
      column.rotation.z = Math.PI / 2;
      column.rotation.y = entry.rotation;
      column.position.set(entry.x, 1.2, entry.z);
      this.scene.add(column);

      this.animatedObjects.push({
        object: column.children[1],
        baseY: column.children[1].position.y,
        floatAmount: 0.04,
        floatSpeed: 0.9 + index * 0.07,
        spinSpeed: 0.12,
        local: true,
      });
    });
  }

  createStandingPillars() {
    const placements = [
      { x: -16, z: 6, height: 1.25 },
      { x: 16, z: 8, height: 1.1 },
      { x: -12, z: -18, height: 1.4 },
      { x: 14, z: -21, height: 1.2 },
    ];

    placements.forEach((entry, index) => {
      const pillar = this.createRomanColumn(true);
      pillar.scale.setScalar(entry.height);
      pillar.position.set(entry.x, 0, entry.z);
      this.scene.add(pillar);

      const glow = new THREE.PointLight(index % 2 === 0 ? 0xffd9ee : 0xffeef8, 14, 18, 2);
      glow.position.set(entry.x, 6.5 * entry.height, entry.z);
      this.scene.add(glow);
      this.pulseLights.push({
        light: glow,
        base: 14,
        speed: 1.2 + index * 0.3,
        range: 3,
      });
    });
  }

  createRomanColumn(isStanding) {
    const group = new THREE.Group();

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff3fa,
      roughness: 0.82,
      metalness: 0.04,
    });

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.82, 8, 24),
      stoneMaterial,
    );
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    if (isStanding) {
      shaft.position.y = 4;
    }
    group.add(shaft);

    const capital = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 0.92, 0.8, 24),
      stoneMaterial,
    );
    capital.castShadow = true;
    capital.receiveShadow = true;
    capital.position.y = isStanding ? 8.35 : 0;
    group.add(capital);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.12, 1.24, 0.7, 24),
      stoneMaterial,
    );
    base.castShadow = true;
    base.receiveShadow = true;
    base.position.y = isStanding ? 0.35 : 0;
    group.add(base);

    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(0.84, 0.05, 10, 32),
      new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        emissive: 0x9a9a9a,
        emissiveIntensity: 0.4,
        metalness: 0.2,
        roughness: 0.18,
      }),
    );
    trim.rotation.x = Math.PI / 2;
    trim.position.y = isStanding ? 6.8 : 0.25;
    group.add(trim);

    return group;
  }

  createMemoryMonoliths() {
    const dreamThemeColors = this.getMemoryThemeColors("dream");
    const entries = [
      {
        year: "2012",
        title: "Lantern Festival",
        note: "First uploaded photo",
        description: "A warm night market, paper lanterns, and the first memory saved into the archive.",
        voice: "We stayed until the lights disappeared into the sky.",
        x: -11,
        z: 18,
        side: -1,
      },
      {
        year: "2015",
        title: "Rainy Train Home",
        note: "Journal entry",
        description: "A quiet train ride, window reflections, and notes written while the city blurred past.",
        voice: "The whole window looked like a moving watercolor.",
        x: 10,
        z: 4,
        side: 1,
      },
      {
        year: "2017",
        title: "Studio Afternoon",
        note: "Voice memory",
        description: "Messy desks, half-finished sketches, and the kind of conversation you only appreciate later.",
        voice: "We thought we had more time, so we talked slowly.",
        x: -9,
        z: -11,
        side: -1,
      },
      {
        year: "2020",
        title: "Window Garden",
        note: "Photo and text",
        description: "Plants by the glass, handwritten lists, and the tiny routines that kept each day together.",
        voice: "The room was small, but it still felt like growing something.",
        x: 11,
        z: -28,
        side: 1,
      },
      {
        year: "2023",
        title: "Graduation Steps",
        note: "Archive upload",
        description: "Scattered friends, family photos, and a moment that felt both finished and unfinished.",
        voice: "We kept saying goodbye, then taking one more picture.",
        x: -10,
        z: -45,
        side: -1,
      },
    ];

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
      this.scene.add(station);

      const orientation = THREE.MathUtils.degToRad(themedEntry.side === -1 ? 18 : -18);
      const stationTextures = this.createMemoryStationTextures(themedEntry);

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
      photoFrame.position.set(0, 4.4, 0);
      photoFrame.rotation.y = orientation;
      photoFrame.castShadow = true;
      photoFrame.receiveShadow = true;
      const photoPanel = createReadablePanel(3.88, 2.88, stationTextures.photoTexture, { offset: 0.13 });
      photoFrame.add(photoPanel);
      station.add(photoFrame);

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
      archiveCard.position.set(themedEntry.side * 3.5, 2.9, 0.8);
      archiveCard.rotation.y = THREE.MathUtils.degToRad(themedEntry.side === -1 ? 24 : -24);
      archiveCard.castShadow = true;
      archiveCard.receiveShadow = true;
      const archivePanel = createReadablePanel(1.92, 3.08, stationTextures.photoFrameTexture, { offset: 0.11 });
      archiveCard.add(archivePanel);
      station.add(archiveCard);

      const descriptionPanel = createReadablePanel(3.9, 2.45, stationTextures.descriptionTexture, {
        offset: 0.03,
      });
      descriptionPanel.position.set(themedEntry.side * 2.1, 1.95, -2.5);
      descriptionPanel.rotation.y = THREE.MathUtils.degToRad(themedEntry.side === -1 ? 12 : -12);
      station.add(descriptionPanel);

      const voiceCloud = createReadablePanel(4.2, 2.3, stationTextures.voiceTexture, {
        offset: 0.03,
        depthWrite: false,
      });
      voiceCloud.position.set(themedEntry.side * 2.9, 6.7, 0.6);
      voiceCloud.rotation.y = THREE.MathUtils.degToRad(themedEntry.side === -1 ? -10 : 10);
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

      this.animatedObjects.push({
        object: photoFrame,
        baseY: photoFrame.position.y,
        floatAmount: 0.16,
        floatSpeed: 0.55 + index * 0.08,
        spinSpeed: 0.02 * themedEntry.side,
      });
      this.animatedObjects.push({
        object: archiveCard,
        baseY: archiveCard.position.y,
        floatAmount: 0.14,
        floatSpeed: 0.72 + index * 0.06,
        spinSpeed: 0.03 * -themedEntry.side,
      });
      this.animatedObjects.push({
        object: descriptionPanel,
        baseY: descriptionPanel.position.y,
        floatAmount: 0.12,
        floatSpeed: 0.9 + index * 0.08,
        spinSpeed: 0.01 * themedEntry.side,
      });
      this.animatedObjects.push({
        object: voiceCloud,
        baseY: voiceCloud.position.y,
        floatAmount: 0.2,
        floatSpeed: 0.8 + index * 0.12,
        spinSpeed: 0.014 * -themedEntry.side,
      });

      this.memoryStations.push({
        index,
        entry: {
          year: themedEntry.year,
          title: themedEntry.title,
          note: themedEntry.note,
          description: themedEntry.description,
          voice: themedEntry.voice,
          side: themedEntry.side,
        },
        photoPanel,
        archivePanel,
        descriptionPanel,
        voiceCloud,
        textures: stationTextures,
      });

      this.registerCustomizableComponent(componentId, station, {
        year: themedEntry.year,
        title: themedEntry.title,
        note: themedEntry.note,
      });
    });
  }

  createMemoryStationTextures(entry) {
    const photoTexture = createPhotoTexture(entry, this.activeThemeKey);
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

    return {
      photoTexture,
      photoFrameTexture,
      descriptionTexture,
      voiceTexture,
    };
  }

  updatePanelTexture(panelGroup, texture) {
    panelGroup.children.forEach((child) => {
      if (!child.material) {
        return;
      }

      child.material.map = texture;
      child.material.needsUpdate = true;
    });
  }

  updatePanelTint(panelGroup, tintColor) {
    panelGroup.children.forEach((child) => {
      if (!child.material || !child.material.color) {
        return;
      }

      child.material.color.set(tintColor);
    });
  }

  disposeStationTextures(textures) {
    if (!textures) {
      return;
    }

    Object.values(textures).forEach((texture) => {
      texture?.dispose?.();
    });
  }

  getMemoryThemeColors(themeKey) {
    if (themeKey === "midnight") {
      return ["#90a7ff", "#b6c6ff", "#8199f2", "#d0dcff", "#657fdd"];
    }

    if (themeKey === "sunset") {
      return ["#ffd9b4", "#ffc79f", "#ffb98f", "#ffe1bf", "#f4b180"];
    }

    return ["#ffd8ef", "#ffe5f5", "#ffd0ea", "#ffeaf5", "#f7dce9"];
  }

  getReadablePanelTint(themeKey) {
    if (themeKey === "midnight") {
      return "#e8f0ff";
    }

    if (themeKey === "sunset") {
      return "#fff0df";
    }

    return "#ffffff";
  }

  refreshGroundTexture(themeKey) {
    if (!this.groundMesh?.material) {
      return;
    }

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

  refreshMistTexture(themeKey) {
    if (!this.mistMaterials.length) {
      return;
    }

    const nextTexture = createMistTexture(themeKey);
    nextTexture.colorSpace = THREE.SRGBColorSpace;

    this.mistTexture?.dispose?.();
    this.mistTexture = nextTexture;

    this.mistMaterials.forEach((material) => {
      material.map = nextTexture;
      material.needsUpdate = true;
    });
  }

  applyThemeVisuals(themeKey) {
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

      const nextTextures = this.createMemoryStationTextures(themedEntry);
      this.updatePanelTexture(stationData.photoPanel, nextTextures.photoTexture);
      this.updatePanelTexture(stationData.archivePanel, nextTextures.photoFrameTexture);
      this.updatePanelTexture(stationData.descriptionPanel, nextTextures.descriptionTexture);
      this.updatePanelTexture(stationData.voiceCloud, nextTextures.voiceTexture);
      this.updatePanelTint(stationData.photoPanel, panelTint);
      this.updatePanelTint(stationData.archivePanel, panelTint);
      this.updatePanelTint(stationData.descriptionPanel, panelTint);
      this.updatePanelTint(stationData.voiceCloud, panelTint);

      this.disposeStationTextures(stationData.textures);
      stationData.textures = nextTextures;
    });
  }

  createTimelineTrail() {
    const checkpoints = [
      { x: -6, z: 24 },
      { x: 4, z: 13 },
      { x: -3, z: 1 },
      { x: 5, z: -13 },
      { x: -4, z: -26 },
      { x: 3, z: -39 },
      { x: -2, z: -53 },
    ];

    checkpoints.forEach((point, index) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.46, 20, 20),
        new THREE.MeshStandardMaterial({
          color: index % 2 === 0 ? 0xf0f0f0 : 0x9f9f9f,
          emissive: index % 2 === 0 ? 0xf0f0f0 : 0x9f9f9f,
          emissiveIntensity: 0.9,
          roughness: 0.22,
          metalness: 0.24,
        }),
      );
      marker.position.set(point.x, 0.65, point.z);
      marker.castShadow = true;
      this.scene.add(marker);

      this.animatedObjects.push({
        object: marker,
        baseY: marker.position.y,
        floatAmount: 0.08,
        floatSpeed: 0.7 + index * 0.08,
        spinSpeed: 0.22,
      });
    });
  }

  createFloatingRuinFragments() {
    const geometry = new THREE.DodecahedronGeometry(0.9, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0xd9d9d9,
      emissive: 0x8a8a8a,
      emissiveIntensity: 0.48,
      roughness: 0.38,
      metalness: 0.16,
    });

    for (let index = 0; index < 16; index += 1) {
      const fragment = new THREE.Mesh(geometry, material);
      const angle = (index / 16) * Math.PI * 2;
      const radius = 14 + (index % 4) * 6;
      fragment.position.set(
        Math.cos(angle) * radius,
        6 + (index % 5) * 2.1,
        Math.sin(angle) * radius,
      );
      fragment.rotation.set(angle * 0.6, angle, angle * 0.3);
      fragment.scale.setScalar(0.7 + (index % 3) * 0.28);
      fragment.castShadow = true;
      this.scene.add(fragment);

      this.animatedObjects.push({
        object: fragment,
        baseY: fragment.position.y,
        floatAmount: 0.65 + (index % 3) * 0.18,
        floatSpeed: 0.35 + index * 0.03,
        spinSpeed: 0.14,
      });
    }
  }

  createDreamParticles() {
    const particleCount = 900;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();
    const palette = [0xffffff, 0xe3e3e3, 0xc7c7c7, 0xa5a5a5, 0x7f7f7f];

    for (let index = 0; index < particleCount; index += 1) {
      const stride = index * 3;
      positions[stride] = THREE.MathUtils.randFloatSpread(this.world.size * 1.6);
      positions[stride + 1] = THREE.MathUtils.randFloat(0.6, 28);
      positions[stride + 2] = THREE.MathUtils.randFloatSpread(this.world.size * 1.6);

      color.set(palette[index % palette.length]);
      colors[stride] = color.r;
      colors[stride + 1] = color.g;
      colors[stride + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.11,
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    this.animatedObjects.push({
      object: particles,
      baseY: particles.position.y,
      floatAmount: 0.8,
      floatSpeed: 0.1,
      spinSpeed: 0.01,
    });
  }

  createGlitterStars() {
    const starTexture = createStarTexture();
    starTexture.colorSpace = THREE.SRGBColorSpace;

    const particleCount = 520;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();
    const palette = [0xffffff, 0xededed, 0xd2d2d2, 0xb6b6b6, 0x949494];

    for (let index = 0; index < particleCount; index += 1) {
      const stride = index * 3;
      positions[stride] = THREE.MathUtils.randFloatSpread(this.world.size * 1.35);
      positions[stride + 1] = THREE.MathUtils.randFloat(2.4, 24);
      positions[stride + 2] = THREE.MathUtils.randFloatSpread(this.world.size * 1.35);

      color.set(palette[index % palette.length]);
      colors[stride] = color.r;
      colors[stride + 1] = color.g;
      colors[stride + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.42,
      map: starTexture,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.08,
    });

    const stars = new THREE.Points(geometry, material);
    this.scene.add(stars);
    this.animatedObjects.push({
      object: stars,
      baseY: stars.position.y,
      floatAmount: 0.22,
      floatSpeed: 0.12,
      spinSpeed: 0.014,
    });
  }
}
