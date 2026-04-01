import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { isSupabaseConfigured, loadLayoutFromCloud, saveLayoutToCloud } from "./supabaseClient";

export function initMemoryHall(container) {
  const launchButton = container.querySelector(".mh-launch");
  const modeToggleButton = container.querySelector(".mh-mode-toggle");
  const customPanel = container.querySelector(".mh-custom-panel");
  const customStatus = container.querySelector(".mh-custom-status");
  const userIdInput = container.querySelector(".mh-custom-user-input");
  const moveButton = container.querySelector(".mh-tool-move");
  const resizeButton = container.querySelector(".mh-tool-resize");
  const deleteButton = container.querySelector(".mh-tool-delete");
  const scaleSlider = container.querySelector(".mh-custom-scale");
  const scaleValue = container.querySelector(".mh-custom-scale-value");
  const saveButton = container.querySelector(".mh-tool-save");
  const loadButton = container.querySelector(".mh-tool-load");
  const resetButton = container.querySelector(".mh-tool-reset");
  const reticle = container.querySelector(".mh-reticle");

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
  container.append(renderer.domElement);

  const vrButton = VRButton.createButton(renderer);
  vrButton.classList.add("mh-vr-button");
  container.append(vrButton);

  const LAYOUT_STORAGE_PREFIX = "memoria-layout-v1";
  const ACTIVE_USER_STORAGE_KEY = "memoria-active-user";

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
  camera.position.set(0, 1.7, 22);
  scene.add(camera);

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
  };

  const animatedObjects = [];
  const pulseLights = [];
  const world = {
    size: 120,
    minY: 1.7,
  };

  const clock = new THREE.Clock();

  function handleKeydown(event) {
    const isTypingField =
      document.activeElement === userIdInput ||
      document.activeElement?.tagName === "INPUT" ||
      document.activeElement?.tagName === "TEXTAREA";

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
      default:
        break;
    }
  }

  function handleKeyup(event) {
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
      default:
        break;
    }
  }

  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("keyup", handleKeyup);

  function resetMovementFlags() {
    movement.forward = false;
    movement.backward = false;
    movement.left = false;
    movement.right = false;
  }

  scene.add(new THREE.AmbientLight(0xf6d8ea, 1.9));

  const moonLight = new THREE.DirectionalLight(0xffc7a8, 2.2);
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

  scene.add(new THREE.HemisphereLight(0xf29f9f, 0xf8eadf, 1.2));

  const magentaGlow = new THREE.PointLight(0xffd0ea, 68, 120, 2);
  magentaGlow.position.set(0, 8, 0);
  scene.add(magentaGlow);
  pulseLights.push({ light: magentaGlow, base: 65, speed: 1.4, range: 10 });

  const violetGlow = new THREE.PointLight(0xf5d6ea, 58, 140, 2);
  violetGlow.position.set(-24, 12, -18);
  scene.add(violetGlow);
  pulseLights.push({ light: violetGlow, base: 55, speed: 1.1, range: 8 });

  const peachGlow = new THREE.PointLight(0xffe8f4, 48, 120, 2);
  peachGlow.position.set(22, 7, 26);
  scene.add(peachGlow);
  pulseLights.push({ light: peachGlow, base: 46, speed: 1.7, range: 7 });

  const groundTexture = createGroundTexture();
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(8, 8);
  groundTexture.colorSpace = THREE.SRGBColorSpace;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(world.size * 2.4, world.size * 2.4, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0xffedf7,
      map: groundTexture,
      metalness: 0.02,
      roughness: 0.78,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  createSkyHalo();
  createSkyMist();
  createBrokenColumns();
  createStandingPillars();
  createTimelineTrail();
  createMemoryMonoliths();
  createFloatingRuinFragments();
  createDreamParticles();
  createGlitterStars();
  initializeCustomizer();

  function createSkyHalo() {
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
    scene.add(halo);
    animatedObjects.push({
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
    scene.add(innerHalo);
    animatedObjects.push({
      object: innerHalo,
      baseY: innerHalo.position.y,
      floatAmount: 0.55,
      floatSpeed: 0.28,
      spinSpeed: -0.06,
    });
  }

  function createSkyMist() {
    const cloudTexture = createMistTexture();
    cloudTexture.colorSpace = THREE.SRGBColorSpace;

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
      scene.add(mist);

      animatedObjects.push({
        object: mist,
        baseY: mist.position.y,
        floatAmount: 0.45 + index * 0.08,
        floatSpeed: 0.16 + index * 0.03,
        spinSpeed: 0.004 * (index % 2 === 0 ? 1 : -1),
      });
    });
  }

  function createBrokenColumns() {
    const positions = [
      { x: -24, z: 14, rotation: 0.9, scale: 1.05 },
      { x: 20, z: -9, rotation: -0.65, scale: 0.95 },
      { x: -11, z: -26, rotation: 0.4, scale: 1.18 },
      { x: 28, z: 22, rotation: -1.1, scale: 1.02 },
      { x: 6, z: 31, rotation: 0.2, scale: 0.88 },
      { x: -31, z: -4, rotation: -0.35, scale: 1.12 },
    ];

    positions.forEach((entry, index) => {
      const column = createRomanColumn(false);
      column.scale.setScalar(entry.scale);
      column.rotation.z = Math.PI / 2;
      column.rotation.y = entry.rotation;
      column.position.set(entry.x, 1.2, entry.z);
      scene.add(column);

      animatedObjects.push({
        object: column.children[1],
        baseY: column.children[1].position.y,
        floatAmount: 0.04,
        floatSpeed: 0.9 + index * 0.07,
        spinSpeed: 0.12,
        local: true,
      });
    });
  }

  function createStandingPillars() {
    const placements = [
      { x: -16, z: 6, height: 1.25 },
      { x: 16, z: 8, height: 1.1 },
      { x: -12, z: -18, height: 1.4 },
      { x: 14, z: -21, height: 1.2 },
    ];

    placements.forEach((entry, index) => {
      const pillar = createRomanColumn(true);
      pillar.scale.setScalar(entry.height);
      pillar.position.set(entry.x, 0, entry.z);
      scene.add(pillar);

      const glow = new THREE.PointLight(index % 2 === 0 ? 0xffd9ee : 0xffeef8, 14, 18, 2);
      glow.position.set(entry.x, 6.5 * entry.height, entry.z);
      scene.add(glow);
      pulseLights.push({
        light: glow,
        base: 14,
        speed: 1.2 + index * 0.3,
        range: 3,
      });
    });
  }

  function createRomanColumn(isStanding) {
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
        color: 0xffbdbd,
        emissive: 0xffa4a4,
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

  function createMemoryMonoliths() {
    const entries = [
      {
        year: "2012",
        title: "Lantern Festival",
        note: "First uploaded photo",
        description: "A warm night market, paper lanterns, and the first memory saved into the archive.",
        voice: "We stayed until the lights disappeared into the sky.",
        color: "#ffd8ef",
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
        color: "#ffe5f5",
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
        color: "#ffd0ea",
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
        color: "#ffeaf5",
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
        color: "#f7dce9",
        x: -10,
        z: -45,
        side: -1,
      },
    ];

    entries.forEach((entry, index) => {
      const station = new THREE.Group();
      const componentId = `memory-${entry.year}`;
      station.userData.componentId = componentId;
      station.userData.componentLabel = `${entry.year} - ${entry.title}`;
      station.userData.isCustomizable = true;
      station.position.set(entry.x, 0, entry.z);
      scene.add(station);

      const orientation = THREE.MathUtils.degToRad(entry.side === -1 ? 18 : -18);

      const photoTexture = createPhotoTexture(entry);
      photoTexture.colorSpace = THREE.SRGBColorSpace;
      const photoFrameTexture = createMemoryTexture(entry.year, entry.note, entry.color);
      photoFrameTexture.colorSpace = THREE.SRGBColorSpace;
      const descriptionTexture = createDescriptionTexture(entry);
      descriptionTexture.colorSpace = THREE.SRGBColorSpace;
      const voiceTexture = createVoiceCloudTexture(entry.voice, entry.color);
      voiceTexture.colorSpace = THREE.SRGBColorSpace;

      const photoFrame = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 3.4, 0.24),
        new THREE.MeshStandardMaterial({
          color: 0xfff4fa,
          emissive: 0xffe3f2,
          emissiveIntensity: 0.12,
          roughness: 0.34,
          metalness: 0.1,
        }),
      );
      photoFrame.position.set(0, 4.4, 0);
      photoFrame.rotation.y = orientation;
      photoFrame.castShadow = true;
      photoFrame.receiveShadow = true;
      photoFrame.add(createReadablePanel(3.88, 2.88, photoTexture, { offset: 0.13 }));
      station.add(photoFrame);

      const archiveCard = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 3.6, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0xffeef8,
          emissive: 0xffd8ef,
          emissiveIntensity: 0.12,
          roughness: 0.3,
          metalness: 0.12,
        }),
      );
      archiveCard.position.set(entry.side * 3.5, 2.9, 0.8);
      archiveCard.rotation.y = THREE.MathUtils.degToRad(entry.side === -1 ? 24 : -24);
      archiveCard.castShadow = true;
      archiveCard.receiveShadow = true;
      archiveCard.add(createReadablePanel(1.92, 3.08, photoFrameTexture, { offset: 0.11 }));
      station.add(archiveCard);

      const descriptionPanel = createReadablePanel(3.9, 2.45, descriptionTexture, {
        offset: 0.03,
      });
      descriptionPanel.position.set(entry.side * 2.1, 1.95, -2.5);
      descriptionPanel.rotation.y = THREE.MathUtils.degToRad(entry.side === -1 ? 12 : -12);
      station.add(descriptionPanel);

      const voiceCloud = createReadablePanel(4.2, 2.3, voiceTexture, {
        offset: 0.03,
        depthWrite: false,
      });
      voiceCloud.position.set(entry.side * 2.9, 6.7, 0.6);
      voiceCloud.rotation.y = THREE.MathUtils.degToRad(entry.side === -1 ? -10 : 10);
      station.add(voiceCloud);

      const beacon = new THREE.PointLight(index % 2 === 0 ? 0xffd9ee : 0xffeef8, 16, 16, 2);
      beacon.position.set(0, 4.4, 1.8);
      station.add(beacon);
      pulseLights.push({
        light: beacon,
        base: 16,
        speed: 1 + index * 0.18,
        range: 3,
      });

      const cloudPedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2.4, 0.45, 32),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffd8ef,
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

      animatedObjects.push({
        object: photoFrame,
        baseY: photoFrame.position.y,
        floatAmount: 0.16,
        floatSpeed: 0.55 + index * 0.08,
        spinSpeed: 0.02 * entry.side,
      });
      animatedObjects.push({
        object: archiveCard,
        baseY: archiveCard.position.y,
        floatAmount: 0.14,
        floatSpeed: 0.72 + index * 0.06,
        spinSpeed: 0.03 * -entry.side,
      });
      animatedObjects.push({
        object: descriptionPanel,
        baseY: descriptionPanel.position.y,
        floatAmount: 0.12,
        floatSpeed: 0.9 + index * 0.08,
        spinSpeed: 0.01 * entry.side,
      });
      animatedObjects.push({
        object: voiceCloud,
        baseY: voiceCloud.position.y,
        floatAmount: 0.2,
        floatSpeed: 0.8 + index * 0.12,
        spinSpeed: 0.014 * -entry.side,
      });

      registerCustomizableComponent(componentId, station, {
        year: entry.year,
        title: entry.title,
        note: entry.note,
      });
    });
  }

  function createTimelineTrail() {
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
          color: index % 2 === 0 ? 0xffd8ef : 0xffeef8,
          emissive: index % 2 === 0 ? 0xffd8ef : 0xffeef8,
          emissiveIntensity: 0.9,
          roughness: 0.22,
          metalness: 0.24,
        }),
      );
      marker.position.set(point.x, 0.65, point.z);
      marker.castShadow = true;
      scene.add(marker);

      animatedObjects.push({
        object: marker,
        baseY: marker.position.y,
        floatAmount: 0.08,
        floatSpeed: 0.7 + index * 0.08,
        spinSpeed: 0.22,
      });
    });
  }

  function createFloatingRuinFragments() {
    const geometry = new THREE.DodecahedronGeometry(0.9, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffe8f4,
      emissive: 0xffd8ef,
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
      scene.add(fragment);

      animatedObjects.push({
        object: fragment,
        baseY: fragment.position.y,
        floatAmount: 0.65 + (index % 3) * 0.18,
        floatSpeed: 0.35 + index * 0.03,
        spinSpeed: 0.14,
      });
    }
  }

  function createDreamParticles() {
    const particleCount = 900;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();
    const palette = [0xfff1fa, 0xffe5f5, 0xffd8ef, 0xf7dce9, 0xffeef8];

    for (let index = 0; index < particleCount; index += 1) {
      const stride = index * 3;
      positions[stride] = THREE.MathUtils.randFloatSpread(world.size * 1.6);
      positions[stride + 1] = THREE.MathUtils.randFloat(0.6, 28);
      positions[stride + 2] = THREE.MathUtils.randFloatSpread(world.size * 1.6);

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
    scene.add(particles);
    animatedObjects.push({
      object: particles,
      baseY: particles.position.y,
      floatAmount: 0.8,
      floatSpeed: 0.1,
      spinSpeed: 0.01,
    });
  }

  function createGlitterStars() {
    const starTexture = createStarTexture();
    starTexture.colorSpace = THREE.SRGBColorSpace;

    const particleCount = 520;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();
    const palette = [0xfff7fc, 0xffe5f5, 0xffd8ef, 0xf7dce9, 0xffeef8];

    for (let index = 0; index < particleCount; index += 1) {
      const stride = index * 3;
      positions[stride] = THREE.MathUtils.randFloatSpread(world.size * 1.35);
      positions[stride + 1] = THREE.MathUtils.randFloat(2.4, 24);
      positions[stride + 2] = THREE.MathUtils.randFloatSpread(world.size * 1.35);

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
    scene.add(stars);
    animatedObjects.push({
      object: stars,
      baseY: stars.position.y,
      floatAmount: 0.22,
      floatSpeed: 0.12,
      spinSpeed: 0.014,
    });
  }

  function createGroundTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext("2d");

    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#fff7fc");
    gradient.addColorStop(0.5, "#ffe8f4");
    gradient.addColorStop(1, "#f7dce9");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < 44; index += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radiusX = 90 + Math.random() * 170;
      const radiusY = 34 + Math.random() * 76;
      const cloud = context.createRadialGradient(x, y, 12, x, y, radiusX);
      cloud.addColorStop(0, "rgba(255, 255, 255, 0.58)");
      cloud.addColorStop(0.38, "rgba(255, 216, 239, 0.4)");
      cloud.addColorStop(1, "rgba(255, 216, 239, 0)");
      context.fillStyle = cloud;
      context.beginPath();
      context.ellipse(x, y, radiusX, radiusY, Math.random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    }

    context.strokeStyle = "rgba(255, 226, 243, 0.22)";
    context.lineWidth = 2;
    for (let index = 0; index < 24; index += 1) {
      context.beginPath();
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * canvas.height;
      context.moveTo(startX, startY);
      context.bezierCurveTo(
        startX + 80 + Math.random() * 140,
        startY - 30 - Math.random() * 50,
        startX + 160 + Math.random() * 180,
        startY + 30 + Math.random() * 50,
        startX + 240 + Math.random() * 220,
        startY,
      );
      context.stroke();
    }

    for (let index = 0; index < 280; index += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 2 + Math.random() * 6;
      context.fillStyle = index % 2 === 0 ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 216, 239, 0.18)";
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  function createMemoryTexture(title, subtitle, accentColor) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 768;
    const context = canvas.getContext("2d");

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#fff7fc");
    gradient.addColorStop(0.52, "#ffe4f2");
    gradient.addColorStop(1, "#f6dce9");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = accentColor;
    context.globalAlpha = 0.22;
    context.beginPath();
    context.arc(388, 152, 110, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    context.strokeStyle = "rgba(255,255,255,0.2)";
    context.lineWidth = 4;
    roundedRect(context, 34, 34, 444, 700, 34);
    context.stroke();

    context.fillStyle = "#d58eb4";
    context.font = "700 22px Segoe UI";
    context.fillText("DREAM MEMORY", 60, 92);

    context.fillStyle = "#ffffff";
    context.font = "700 56px Segoe UI";
    wrapText(context, title, 60, 182, 394, 60);

    context.fillStyle = "#ffffff";
    context.font = "400 28px Segoe UI";
    wrapText(context, subtitle, 60, 326, 380, 42);

    context.strokeStyle = "#efbfd9";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(60, 430);
    context.bezierCurveTo(156, 380, 278, 510, 426, 444);
    context.stroke();
    context.beginPath();
    context.moveTo(60, 488);
    context.bezierCurveTo(182, 442, 278, 566, 426, 512);
    context.stroke();
    context.beginPath();
    context.moveTo(60, 548);
    context.bezierCurveTo(136, 496, 282, 628, 426, 572);
    context.stroke();

    context.fillStyle = "rgba(255,255,255,0.88)";
    context.beginPath();
    context.arc(116, 646, 38, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = accentColor;
    context.beginPath();
    context.arc(116, 646, 18, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#ffffff";
    context.fillRect(176, 622, 210, 10);
    context.fillRect(176, 648, 166, 10);
    context.fillRect(176, 674, 236, 10);

    return new THREE.CanvasTexture(canvas);
  }

  function createPhotoTexture(entry) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 768;
    const context = canvas.getContext("2d");

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#fff8fc");
    gradient.addColorStop(0.55, entry.color);
    gradient.addColorStop(1, "#f7dce9");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.globalAlpha = 0.45;
    context.fillStyle = "rgba(255,255,255,0.55)";
    context.beginPath();
    context.arc(160, 132, 120, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(255, 216, 239, 0.44)";
    context.beginPath();
    context.arc(780, 210, 180, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    const hillColors = ["rgba(255,255,255,0.7)", "rgba(255,228,242,0.78)", "rgba(247,220,233,0.88)"];
    hillColors.forEach((fill, index) => {
      context.fillStyle = fill;
      context.beginPath();
      context.moveTo(0, 530 + index * 34);
      context.bezierCurveTo(150, 430 - index * 12, 320, 650, 510, 560 - index * 8);
      context.bezierCurveTo(650, 500 - index * 10, 780, 720, 1024, 540 - index * 4);
      context.lineTo(1024, 768);
      context.lineTo(0, 768);
      context.closePath();
      context.fill();
    });

    context.strokeStyle = "rgba(255,255,255,0.3)";
    context.lineWidth = 4;
    for (let index = 0; index < 5; index += 1) {
      context.beginPath();
      context.moveTo(64, 90 + index * 110);
      context.bezierCurveTo(250, 20 + index * 95, 520, 210 + index * 84, 940, 76 + index * 104);
      context.stroke();
    }

    context.fillStyle = "rgba(255,255,255,0.88)";
    context.fillRect(58, 56, 300, 94);
    context.fillStyle = "#cf87ae";
    context.font = "700 44px Segoe UI";
    context.fillText(entry.title, 82, 114);

    return new THREE.CanvasTexture(canvas);
  }

  function createDescriptionTexture(entry) {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 420;
    const context = canvas.getContext("2d");

    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgba(127, 72, 112, 0.9)");
    gradient.addColorStop(1, "rgba(88, 48, 85, 0.92)");
    context.fillStyle = gradient;
    roundedRect(context, 16, 16, 688, 388, 34);
    context.fill();

    context.strokeStyle = entry.color;
    context.lineWidth = 4;
    roundedRect(context, 16, 16, 688, 388, 34);
    context.stroke();

    context.fillStyle = "#ffd8ef";
    context.font = "700 24px Segoe UI";
    context.fillText(entry.year, 46, 72);

    context.fillStyle = "#fff5fb";
    context.font = "700 38px Segoe UI";
    wrapText(context, entry.title, 46, 126, 480, 44);

    context.fillStyle = "#ffd6ec";
    context.font = "600 22px Segoe UI";
    context.fillText(entry.note, 46, 192);

    context.fillStyle = "#f2d9eb";
    context.font = "400 24px Segoe UI";
    wrapText(context, entry.description, 46, 246, 610, 34);

    context.fillStyle = "rgba(255, 199, 230, 0.9)";
    context.fillRect(46, 338, 170, 12);
    context.fillStyle = "rgba(198, 156, 214, 0.75)";
    context.fillRect(46, 364, 290, 12);
    context.fillRect(356, 364, 122, 12);

    return new THREE.CanvasTexture(canvas);
  }

  function createVoiceCloudTexture(text, accentColor) {
    const canvas = document.createElement("canvas");
    canvas.width = 820;
    canvas.height = 440;
    const context = canvas.getContext("2d");

    const bubbleGradient = context.createLinearGradient(0, 0, 0, canvas.height);
    bubbleGradient.addColorStop(0, "rgba(102, 56, 96, 0.92)");
    bubbleGradient.addColorStop(1, "rgba(138, 76, 104, 0.88)");
    context.fillStyle = bubbleGradient;
    context.beginPath();
    context.ellipse(260, 190, 180, 108, 0, 0, Math.PI * 2);
    context.ellipse(458, 176, 172, 98, 0, 0, Math.PI * 2);
    context.ellipse(356, 244, 228, 112, 0, 0, Math.PI * 2);
    context.ellipse(208, 252, 116, 74, 0, 0, Math.PI * 2);
    context.ellipse(560, 248, 118, 72, 0, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = accentColor;
    context.lineWidth = 5;
    context.beginPath();
    context.ellipse(260, 190, 180, 108, 0, 0, Math.PI * 2);
    context.ellipse(458, 176, 172, 98, 0, 0, Math.PI * 2);
    context.ellipse(356, 244, 228, 112, 0, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.moveTo(198, 308);
    context.lineTo(154, 390);
    context.lineTo(234, 326);
    context.closePath();
    context.fillStyle = "rgba(124, 68, 100, 0.9)";
    context.fill();
    context.strokeStyle = accentColor;
    context.stroke();

    context.fillStyle = "#ffd7ec";
    context.font = "600 22px Segoe UI";
    context.fillText("Voice memory", 150, 134);

    context.fillStyle = "#fff6fb";
    context.font = "400 32px Segoe UI";
    wrapText(context, `"${text}"`, 150, 198, 500, 42);

    return new THREE.CanvasTexture(canvas);
  }

  function createMistTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext("2d");

    const gradient = context.createRadialGradient(256, 128, 18, 256, 128, 160);
    gradient.addColorStop(0, "rgba(255, 239, 232, 0.55)");
    gradient.addColorStop(0.45, "rgba(255, 205, 223, 0.32)");
    gradient.addColorStop(1, "rgba(255, 205, 223, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < 6; index += 1) {
      const x = 70 + index * 72;
      const y = 110 + (index % 2) * 12;
      const puff = context.createRadialGradient(x, y, 10, x, y, 58);
      puff.addColorStop(0, "rgba(255, 248, 243, 0.46)");
      puff.addColorStop(1, "rgba(255, 248, 243, 0)");
      context.fillStyle = puff;
      context.beginPath();
      context.arc(x, y, 58, 0, Math.PI * 2);
      context.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  function createReadablePanel(width, height, texture, options = {}) {
    const group = new THREE.Group();
    const offset = options.offset ?? 0.02;

    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: options.depthWrite ?? true,
      }),
    );
    front.position.z = offset;
    group.add(front);

    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: options.depthWrite ?? true,
      }),
    );
    back.position.z = -offset;
    back.rotation.y = Math.PI;
    group.add(back);

    return group;
  }

  function createStarTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");

    context.translate(64, 64);
    context.fillStyle = "#ffffff";
    context.beginPath();

    for (let index = 0; index < 10; index += 1) {
      const radius = index % 2 === 0 ? 36 : 14;
      const angle = (index / 10) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.closePath();
    context.fill();

    const glow = context.createRadialGradient(0, 0, 4, 0, 0, 54);
    glow.addColorStop(0, "rgba(255,255,255,0.95)");
    glow.addColorStop(0.45, "rgba(255,255,255,0.42)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(0, 0, 54, 0, Math.PI * 2);
    context.fill();

    return new THREE.CanvasTexture(canvas);
  }

  function roundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let row = 0;

    words.forEach((word) => {
      const testLine = `${line}${word} `;
      if (context.measureText(testLine).width > maxWidth && line) {
        context.fillText(line.trim(), x, y + row * lineHeight);
        line = `${word} `;
        row += 1;
      } else {
        line = testLine;
      }
    });

    context.fillText(line.trim(), x, y + row * lineHeight);
  }

  function initializeCustomizer() {
    const savedUserId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY) ?? "guest";
    userIdInput.value = normalizeUserId(savedUserId);

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

    modeToggleButton.textContent = isCustomMode
      ? "Switch to View Mode"
      : "Switch to Custom Mode";
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

    const step = delta * 7;
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

    camera.position.add(movementOffset);
    camera.position.x = THREE.MathUtils.clamp(
      camera.position.x,
      -world.size + 8,
      world.size - 8,
    );
    camera.position.z = THREE.MathUtils.clamp(
      camera.position.z,
      -world.size + 8,
      world.size - 8,
    );
    camera.position.y = world.minY;

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

    const step = delta * 7;

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

    camera.position.x = THREE.MathUtils.clamp(
      camera.position.x,
      -world.size + 8,
      world.size - 8,
    );
    camera.position.z = THREE.MathUtils.clamp(
      camera.position.z,
      -world.size + 8,
      world.size - 8,
    );
    camera.position.y = world.minY;
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
      entry.object.position.y = entry.baseY + offset;
      entry.object.rotation.y += entry.spinSpeed * delta;
    });

    pulseLights.forEach((entry, index) => {
      entry.light.intensity = entry.base + Math.sin(elapsed * entry.speed + index) * entry.range;
    });

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);

  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateSelectionOutline();
  }

  window.addEventListener("resize", handleResize);

  // Return cleanup function
  return function cleanup() {
    renderer.setAnimationLoop(null);
    window.removeEventListener("resize", handleResize);
    document.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("keyup", handleKeyup);
    controls.dispose();
    orbitControls.dispose();
    transformControls.dispose();
    renderer.dispose();
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
    if (container.contains(vrButton)) {
      container.removeChild(vrButton);
    }
  };
}
