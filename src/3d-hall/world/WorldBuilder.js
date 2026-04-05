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
import {
  createVideoTexture,
} from "./VideoTextureBuilder.js";

export class WorldBuilder {
  constructor({
    scene,
    animatedObjects,
    pulseLights,
    world,
    registerCustomizableComponent,
    memoriesData = null,
  }) {
    this.scene = scene;
    this.animatedObjects = animatedObjects;
    this.pulseLights = pulseLights;
    this.world = world;
    this.registerCustomizableComponent = registerCustomizableComponent;
    this.memoriesData = memoriesData;
    this.memoryStations = [];
    this.activeThemeKey = "dream";
    this.groundMesh = null;
    this.groundTexture = null;
    this.mistTexture = null;
    this.mistMaterials = [];
  }

  buildAll(memoriesData = this.memoriesData) {
    this.memoriesData = memoriesData;
    this.createMuseumHall();
    this.createGround();
    this.createSkyHalo();
    this.createSkyMist();
    // this.createBrokenColumns();
    // this.createStandingPillars();
    this.createTimelineTrail();
    this.createMemoryMonoliths(memoriesData);
    this.createFloatingRuinFragments();
    this.createDreamParticles();
    this.createGlitterStars();
  }

  createMuseumHall() {
    // --- Dimensions ---
    const HW       = 20;          // interior half-width  (total 40 units wide)
    const HH       = 17;          // ceiling height
    const FRONT_Z  = 26;          // entrance wall z
    const BACK_Z   = -66;         // back wall z
    const HALL_LEN = FRONT_Z - BACK_Z;   // 92
    const CZ       = (FRONT_Z + BACK_Z) / 2; // -20  (hall centre z)

    // --- Materials ---
    const wallMat  = new THREE.MeshStandardMaterial({ color: 0xbec5ca, roughness: 0.92 });
    const ceilMat  = new THREE.MeshStandardMaterial({ color: 0xf0eeeb, roughness: 0.88 });
    const marbMat  = new THREE.MeshStandardMaterial({ color: 0xf4f2ef, roughness: 0.66, metalness: 0.03 });
    const stonMat  = new THREE.MeshStandardMaterial({ color: 0x747e88, roughness: 0.94 });
    const doorMat  = new THREE.MeshStandardMaterial({ color: 0x3e2410, roughness: 0.74, metalness: 0.08 });
    const moldMat  = new THREE.MeshStandardMaterial({ color: 0xfafaf8, roughness: 0.62, metalness: 0.04 });
    const ropeMat  = new THREE.MeshStandardMaterial({ color: 0x8a7860, roughness: 0.88 });
    const postMat  = new THREE.MeshStandardMaterial({ color: 0xc0a860, roughness: 0.40, metalness: 0.60 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x8ec8ff, transparent: true, opacity: 0.20,
      roughness: 0.05, metalness: 0.10, side: THREE.DoubleSide,
    });
    const gridMat  = new THREE.MeshStandardMaterial({ color: 0xa0a090, roughness: 0.50, metalness: 0.30 });
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.40, metalness: 0.50 });

    // ================================================================
    // 1. WOOD-PLANK FLOOR  (canvas texture, laid over existing ground)
    // ================================================================
    const woodCanvas = document.createElement("canvas");
    woodCanvas.width  = 512;
    woodCanvas.height = 512;
    const ctx = woodCanvas.getContext("2d");
    const PLANK_W = 128;
    const plankColors = ["#c89858", "#d0a565", "#c49050", "#cfa070"];
    for (let p = 0; p < 4; p++) {
      ctx.fillStyle = plankColors[p];
      ctx.fillRect(p * PLANK_W, 0, PLANK_W, 512);
      // grain lines
      ctx.strokeStyle = "rgba(110,65,15,0.10)";
      ctx.lineWidth = 1;
      for (let g = 0; g < 10; g++) {
        const gy = g * 52;
        ctx.beginPath();
        ctx.moveTo(p * PLANK_W + 4, gy);
        ctx.bezierCurveTo(
          p * PLANK_W + PLANK_W * 0.3, gy + 9,
          p * PLANK_W + PLANK_W * 0.7, gy - 7,
          p * PLANK_W + PLANK_W - 4, gy + 4,
        );
        ctx.stroke();
      }
      // plank edge
      ctx.strokeStyle = "rgba(90,50,10,0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p * PLANK_W, 0);
      ctx.lineTo(p * PLANK_W, 512);
      ctx.stroke();
    }
    const woodTex = new THREE.CanvasTexture(woodCanvas);
    woodTex.wrapS = THREE.RepeatWrapping;
    woodTex.wrapT = THREE.RepeatWrapping;
    woodTex.repeat.set(6, 20);
    woodTex.colorSpace = THREE.SRGBColorSpace;
    const woodMat = new THREE.MeshStandardMaterial({
      map: woodTex, color: 0xd4a96a, roughness: 0.76, metalness: 0.02,
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, HALL_LEN), woodMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.01, CZ);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // ================================================================
    // 2. WALLS
    // ================================================================
    const addBox = (w, h, d, mat, x, y, z, castShadow = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = castShadow;
      m.receiveShadow = true;
      this.scene.add(m);
      return m;
    };

    // Side walls
    addBox(0.5, HH, HALL_LEN, wallMat, -HW,      HH / 2, CZ);
    addBox(0.5, HH, HALL_LEN, wallMat,  HW,      HH / 2, CZ);

    // Back wall — left, right, and top sections (centre has arch door opening)
    const DOOR_W  = 5.2;
    const DOOR_H  = 8.5;
    const ARCH_R  = DOOR_W * 0.50;
    const bwSideW = HW - DOOR_W / 2;
    addBox(bwSideW, HH, 0.5, wallMat, -(DOOR_W / 2 + bwSideW / 2), HH / 2, BACK_Z);
    addBox(bwSideW, HH, 0.5, wallMat,  (DOOR_W / 2 + bwSideW / 2), HH / 2, BACK_Z);
    const aboveH = HH - DOOR_H - ARCH_R;
    addBox(HW * 2, aboveH, 0.5, wallMat, 0, DOOR_H + ARCH_R + aboveH / 2, BACK_Z);

    // Front entrance wall — wider/taller arch opening matching the back door style
    const ENTRY_W      = 12;           // wider than back door
    const ENTRY_ARCH_R = ENTRY_W / 2;  // 6  — full semicircle matches back-door proportions
    const ENTRY_H      = 11;           // rectangular height before arch crown
    const fwSideW = HW - ENTRY_W / 2;
    const entryAboveH = HH - ENTRY_H - ENTRY_ARCH_R;  // thin solid strip above arch crown
    addBox(fwSideW, HH, 0.5, wallMat, -(ENTRY_W / 2 + fwSideW / 2), HH / 2, FRONT_Z);
    addBox(fwSideW, HH, 0.5, wallMat,  (ENTRY_W / 2 + fwSideW / 2), HH / 2, FRONT_Z);
    if (entryAboveH > 0) {
      addBox(HW * 2, entryAboveH, 0.5, wallMat, 0, ENTRY_H + ENTRY_ARCH_R + entryAboveH / 2, FRONT_Z);
    }

    // Entrance arch decoration — identical style to back door
    const EFW = 0.36; // entrance frame width
    // Vertical jambs
    addBox(EFW, ENTRY_H, EFW, moldMat, -ENTRY_W / 2 + EFW / 2, ENTRY_H / 2, FRONT_Z - 0.28);
    addBox(EFW, ENTRY_H, EFW, moldMat,  ENTRY_W / 2 - EFW / 2, ENTRY_H / 2, FRONT_Z - 0.28);
    // Arch frame (half-torus)
    const entryArchFrame = new THREE.Mesh(
      new THREE.TorusGeometry(ENTRY_ARCH_R, EFW / 2, 8, 36, Math.PI), moldMat,
    );
    entryArchFrame.rotation.z = Math.PI;
    entryArchFrame.position.set(0, ENTRY_H, FRONT_Z - 0.28);
    this.scene.add(entryArchFrame);
    // Keystone
    addBox(0.44, 0.44, EFW, moldMat, 0, ENTRY_H + ENTRY_ARCH_R - 0.22, FRONT_Z - 0.28, false);
    // Fan/lunette window
    const entryFanMesh = new THREE.Mesh(
      new THREE.CircleGeometry(ENTRY_ARCH_R * 0.88, 32, 0, Math.PI),
      glassMat,
    );
    entryFanMesh.position.set(0, ENTRY_H + 0.06, FRONT_Z - 0.28);
    this.scene.add(entryFanMesh);
    const entryFanBarMat = new THREE.MeshStandardMaterial({ color: 0xb0a080, roughness: 0.50, metalness: 0.30 });
    for (let i = 0; i < 5; i++) {
      const angle = (i / 4) * Math.PI;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, ENTRY_ARCH_R * 0.88, 6), entryFanBarMat);
      bar.rotation.z = angle - Math.PI / 2;
      bar.position.set(0, ENTRY_H + ENTRY_ARCH_R * 0.44, FRONT_Z - 0.30);
      this.scene.add(bar);
    }

    // ================================================================
    // 3. CEILING
    // ================================================================
    addBox(HW * 2 + 1, 0.6, HALL_LEN + 0.5, ceilMat, 0, HH + 0.3, CZ, false);

    // ================================================================
    // 4. CROWN MOLDING (at wall–ceiling junction)
    // ================================================================
    const moldH = 0.36, moldD = 0.28;
    [[-HW + 0.22 + moldD / 2, CZ], [HW - 0.22 - moldD / 2, CZ]].forEach(([mx, mz]) => {
      addBox(moldD, moldH, HALL_LEN, moldMat, mx, HH - moldH / 2, mz, false);
      addBox(moldD * 0.6, moldH * 0.55, HALL_LEN, moldMat, mx, HH - moldH * 1.6, mz, false);
    });

    // ================================================================
    // 5. WHITE MARBLE COLUMNS (pairs inside hall, x = ±COL_X)
    // ================================================================
    const COL_X  = 10;
    const colZs  = [20, 2, -16, -34, -52];   // 5 pairs, 18-unit spacing
    colZs.forEach((cz2) => {
      [-COL_X, COL_X].forEach((cx) => {
        // Plinth
        addBox(1.5, 0.18, 1.5, marbMat, cx, 0.09, cz2, false);
        // Base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.80, 0.90, 0.52, 24), marbMat);
        base.position.set(cx, 0.44, cz2); base.castShadow = true; this.scene.add(base);
        // Shaft — spans from base top (y=0.70) to echinus bottom (y=16.12), height=15.42
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 15.42, 24), marbMat);
        shaft.position.set(cx, 8.41, cz2); shaft.castShadow = true; this.scene.add(shaft);
        // Echinus (flaring capital)
        const echinus = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.64, 0.60, 24), marbMat);
        echinus.position.set(cx, 16.42, cz2); this.scene.add(echinus);
        // Abacus slab — top flush with ceiling at HH=17
        addBox(1.75, 0.28, 1.75, marbMat, cx, 16.86, cz2, false);
      });
    });

    // ================================================================
    // 7. STONE PILASTERS (against walls, dark gray brick)
    // ================================================================
    const PIL_X = HW - 1.15;
    colZs.forEach((cz2) => {
      [-PIL_X, PIL_X].forEach((px) => {
        addBox(1.55, HH - 0.45, 1.35, stonMat, px, (HH - 0.45) / 2, cz2);
        addBox(1.90, 0.42, 1.60, stonMat, px, HH - 0.45 + 0.21, cz2, false);
      });
    });

    // ================================================================
    // 8. GRAND ARCH DOOR (in back wall)
    // ================================================================
    const FW = 0.36; // frame width
    // Vertical jambs
    addBox(FW, DOOR_H, FW, moldMat, -DOOR_W / 2 + FW / 2, DOOR_H / 2, BACK_Z + 0.28);
    addBox(FW, DOOR_H, FW, moldMat,  DOOR_W / 2 - FW / 2, DOOR_H / 2, BACK_Z + 0.28);
    // Arch frame (half-torus)
    const archFrame = new THREE.Mesh(
      new THREE.TorusGeometry(ARCH_R, FW / 2, 8, 36, Math.PI), moldMat,
    );
    archFrame.rotation.z = Math.PI;
    archFrame.position.set(0, DOOR_H, BACK_Z + 0.28);
    this.scene.add(archFrame);
    // Arch keystone
    addBox(0.44, 0.44, FW, moldMat, 0, DOOR_H + ARCH_R - 0.22, BACK_Z + 0.28, false);

    // Door leaves
    const leafW = (DOOR_W / 2 - FW) * 0.95;
    const leafH = DOOR_H - 0.38;
    [-1, 1].forEach((side) => {
      addBox(leafW, leafH, 0.18, doorMat, side * leafW / 2, leafH / 2 + 0.19, BACK_Z + 0.28);
      // Raised panel details
      const panH = leafH * 0.32;
      [0.28, -0.22].forEach((dy) => {
        addBox(leafW * 0.68, panH, 0.05,
          new THREE.MeshStandardMaterial({ color: 0x2e1a0c, roughness: 0.70 }),
          side * leafW / 2, leafH / 2 + 0.19 + dy * leafH, BACK_Z + 0.36,
        );
      });
    });

    // Fan/lunette window above door
    const fanMesh = new THREE.Mesh(
      new THREE.CircleGeometry(ARCH_R * 0.86, 32, 0, Math.PI),
      glassMat,
    );
    fanMesh.position.set(0, DOOR_H + 0.06, BACK_Z + 0.28);
    this.scene.add(fanMesh);
    // Fan bars
    const fanBarMat = new THREE.MeshStandardMaterial({ color: 0xb0a080, roughness: 0.50, metalness: 0.30 });
    for (let i = 0; i < 5; i++) {
      const angle = (i / 4) * Math.PI;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, ARCH_R * 0.86, 6), fanBarMat);
      bar.rotation.z = angle - Math.PI / 2;
      bar.position.set(0, DOOR_H + ARCH_R * 0.43, BACK_Z + 0.30);
      this.scene.add(bar);
    }

    // ================================================================
    // 9. SKYLIGHT WINDOWS (in ceiling, with grid frames)
    // ================================================================
    const skylightCenters = [-4, -30];
    const SKYW = 10, SKYL = 16;
    skylightCenters.forEach((sz) => {
      // Glass
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(SKYW, SKYL), glassMat);
      sky.rotation.x = -Math.PI / 2;
      sky.position.set(0, HH + 0.01, sz);
      this.scene.add(sky);
      // Outer frame
      addBox(SKYW + 0.28, 0.10, SKYL + 0.28, gridMat, 0, HH + 0.08, sz, false);
      // Grid lines along X
      [-1, 0, 1].forEach((i) => {
        addBox(0.07, 0.10, SKYL, gridMat, i * SKYW / 3, HH + 0.08, sz, false);
      });
      // Grid lines along Z
      [-2, -1, 0, 1, 2].forEach((i) => {
        addBox(SKYW, 0.10, 0.07, gridMat, 0, HH + 0.08, sz + i * SKYL / 4, false);
      });
    });

    // ================================================================
    // 10. GALLERY CEILING LIGHT TRACKS + SPOTLIGHTS
    // ================================================================
    const galleryLightZs = [11, -7, -25, -43];   // centred in each bay between columns
    galleryLightZs.forEach((lz) => {
      addBox(13, 0.12, 0.22, trackMat, 0, HH - 0.05, lz, false);
      [-4.5, 0, 4.5].forEach((lx) => {
        const spot = new THREE.SpotLight(0xfff5e4, 16, 22, Math.PI / 6.5, 0.40, 1.4);
        spot.position.set(lx, HH - 0.18, lz);
        spot.target.position.set(lx, 0, lz);
        this.scene.add(spot);
        this.scene.add(spot.target);
        // Housing
        addBox(0.22, 0.22, 0.22, trackMat, lx, HH - 0.22, lz, false);
      });
    });

    // ================================================================
    // 11. ROPE BARRIERS (gold posts + rope along both sides)
    // ================================================================
    const ROPE_X = 8;          // rope at x=±8 — leaves 12-unit display alcove between rope and wall
    const POST_STEP = 9.0;   // one post per bay gap — less cluttered
    [-ROPE_X, ROPE_X].forEach((px) => {
      const postZList = [];
      for (let pz = FRONT_Z - 3; pz >= BACK_Z + 3; pz -= POST_STEP) {
        postZList.push(pz);
        // Post cylinder
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.12, 8), postMat);
        post.position.set(px, 0.56, pz);
        this.scene.add(post);
        // Post finial
        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), postMat);
        finial.position.set(px, 1.16, pz);
        this.scene.add(finial);
      }
      // Rope between posts (horizontal cylinder along Z)
      for (let i = 0; i < postZList.length - 1; i++) {
        const z1 = postZList[i], z2 = postZList[i + 1];
        const ropeLen = Math.abs(z2 - z1);
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, ropeLen, 6), ropeMat);
        rope.rotation.x = Math.PI / 2;
        rope.position.set(px, 0.92, (z1 + z2) / 2);
        this.scene.add(rope);
      }
    });

    // ================================================================
    // 12. BASEBOARD + WAINSCOTING (low wall accent)
    // ================================================================
    [[-HW + 0.07, CZ], [HW - 0.07, CZ]].forEach(([bx, bz]) => {
      addBox(0.16, 0.48, HALL_LEN, moldMat, bx, 0.24, bz, false);
    });
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
      new THREE.TorusGeometry(84, 1.2, 32, 120),
      new THREE.MeshBasicMaterial({
        color: 0xffd8ef,
        transparent: true,
        opacity: 0.1,
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
      new THREE.TorusGeometry(66, 0.55, 24, 96),
      new THREE.MeshBasicMaterial({
        color: 0xffebf6,
        transparent: true,
        opacity: 0.14,
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
      const componentId = `broken-column-${index + 1}`;
      column.scale.setScalar(entry.scale);
      column.rotation.z = Math.PI / 2;
      column.rotation.y = entry.rotation;
      column.position.set(entry.x, 1.2, entry.z);
      column.userData.componentId = componentId;
      column.userData.componentLabel = `Roman Column ${index + 1}`;
      column.userData.isCustomizable = true;
      this.scene.add(column);

      this.animatedObjects.push({
        object: column.children[1],
        baseY: column.children[1].position.y,
        floatAmount: 0.04,
        floatSpeed: 0.9 + index * 0.07,
        spinSpeed: 0.12,
        local: true,
      });

      this.registerCustomizableComponent(componentId, column, {
        type: "broken-column",
        index,
        scale: entry.scale,
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
      const componentId = `standing-pillar-${index + 1}`;
      pillar.scale.setScalar(entry.height);
      pillar.position.set(entry.x, 0, entry.z);
      pillar.userData.componentId = componentId;
      pillar.userData.componentLabel = `Standing Pillar ${index + 1}`;
      pillar.userData.isCustomizable = true;
      this.scene.add(pillar);

      const glow = new THREE.PointLight(index % 2 === 0 ? 0xffd9ee : 0xffeef8, 14, 18, 2);
      glow.position.set(0, 6.5, 0);
      pillar.add(glow);
      this.pulseLights.push({
        light: glow,
        base: 14,
        speed: 1.2 + index * 0.3,
        range: 3,
      });

      this.registerCustomizableComponent(componentId, pillar, {
        type: "standing-pillar",
        index,
        height: entry.height,
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

  createMemoryMonoliths(memoriesData = this.memoriesData) {
    const dreamThemeColors = this.getMemoryThemeColors("dream");
    // Monoliths sit BEHIND the rope barriers (x=±8), in the 12-unit wide display alcoves.
    // Station centre at x=±13 (7 units from wall, 5 units behind rope line).
    // Panels extend up to ±4.8 from centre:
    //   inner edge (toward walkway): ±(13−4.8) = ±8.2 — just behind the rope at ±8  ✓
    //   outer edge (toward wall):    ±(13+4.8) = ±17.8 — clear of wall at ±20       ✓
    //   marble columns at x=±10: photo frame right edge at ±(13−2.2)=±10.8, 0.8 gap  ✓
    //   Roman standing pillars at x=±12–16: all at different z, no spatial overlap    ✓
    //
    // side=-1 on LEFT  (x=-13): video offset = +4.2 → x=−8.8 (near rope, facing walkway) ✓
    // side= 1 on RIGHT (x=+13): archive offset = +4.8 → x=+17.8 (toward wall, OK)
    //   archive on right side: side= 1 → archive at +13+4.8=+17.8 (wall side)
    //   We flip the convention: use side=1 on left and side=-1 on right so the
    //   "outward-leaning" panel is always toward the wall, keeping the photo+video
    //   facing the central walkway.
    const slotPositions = [
      { x: -13, z: 11,  side: 1  },  // left alcove  — bay z=20  to z=2
      { x:  13, z: -7,  side: -1 },  // right alcove — bay z=2   to z=-16
      { x: -13, z: -25, side: 1  },  // left alcove  — bay z=-16 to z=-34
      { x:  13, z: -43, side: -1 },  // right alcove — bay z=-34 to z=-52
      { x: -13, z: -59, side: 1  },  // left alcove  — bay z=-52 to back wall
    ];

    const entries = Array.isArray(memoriesData)
      ? memoriesData.slice(0, 5).map((memory, index) => ({
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
      // Rotate whole station 45° diagonally toward the front entrance:
      //   left alcove (side=1,  x=-13): +45° → panel normal faces +X +Z (right & toward door)
      //   right alcove (side=-1, x=+13): -45° → panel normal faces -X +Z (left  & toward door)
      station.rotation.y = themedEntry.side === 1
        ? THREE.MathUtils.degToRad(45)
        : THREE.MathUtils.degToRad(-45);
      this.scene.add(station);

      // Small additional tilt on individual frames (relative to station group, so still diagonal)
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
      // CHANGED: Y raised from 4.4 → 5.2 to give portrait images vertical headroom
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
      // CHANGED: position from (side * -3.15, 4.95, -1.2) → (side * -4.2, 5.6, -2.8)
      // Further sideways so landscape expansion won't overlap photoFrame,
      // deeper in Z so it layers behind, raised so portrait growth goes into clear sky
      videoFrame.position.set(themedEntry.side * -4.2, 5.6, -2.8);
      videoFrame.rotation.y = THREE.MathUtils.degToRad(themedEntry.side === -1 ? -26 : 26);
      videoFrame.castShadow = true;
      videoFrame.receiveShadow = true;

      const videoPanel = createReadablePanel(3.18, 1.79, new THREE.Texture(), { offset: 0.13 });
      videoFrame.add(videoPanel);
      station.add(videoFrame);

      const photoAspectState = {
        requestId: 0,
        currentAspect: 3.88 / 2.88,
      };
      const videoAspectState = {
        requestId: 0,
        currentAspect: 16 / 9,
      };

      photoAspectState.requestId += 1;
      const initialPhotoRequestId = photoAspectState.requestId;
      videoAspectState.requestId += 1;
      const initialVideoRequestId = videoAspectState.requestId;

      const stationTextures = this.createMemoryStationTextures(
        themedEntry,
        (aspect) => {
          if (initialPhotoRequestId !== photoAspectState.requestId) {
            return;
          }
          photoAspectState.currentAspect = aspect;
          this.applyPhotoFrameAspect(photoFrame, photoPanel, aspect);
        },
        (aspect) => {
          if (initialVideoRequestId !== videoAspectState.requestId) {
            return;
          }
          videoAspectState.currentAspect = aspect;
          this.applyVideoFrameAspect(videoFrame, videoPanel, aspect);
        },
        (texture) => {
          if (initialVideoRequestId !== videoAspectState.requestId) {
            return;
          }
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
      // CHANGED: position from (side * 3.5, 2.9, 0.8) → (side * 4.8, 3.2, 1.4)
      // Pushed further sideways to avoid overlapping photoFrame when it grows wide
      archiveCard.position.set(themedEntry.side * 4.8, 3.2, 1.4);
      archiveCard.rotation.y = THREE.MathUtils.degToRad(themedEntry.side === -1 ? 24 : -24);
      archiveCard.castShadow = true;
      archiveCard.receiveShadow = true;
      const archivePanel = createReadablePanel(1.92, 3.08, stationTextures.photoFrameTexture, { offset: 0.11 });
      archiveCard.add(archivePanel);
      station.add(archiveCard);

      // CHANGED: position from (side * 2.1, 1.95, -2.5) → (side * 3.2, 2.1, -4.2)
      // Pushed further sideways and deeper back so it reads as a distinct background layer
      const descriptionPanel = createReadablePanel(3.9, 2.45, stationTextures.descriptionTexture, {
        offset: 0.03,
      });
      descriptionPanel.position.set(themedEntry.side * 3.2, 2.1, -4.2);
      descriptionPanel.rotation.y = THREE.MathUtils.degToRad(themedEntry.side === -1 ? 12 : -12);
      station.add(descriptionPanel);

      // CHANGED: position from (side * 2.9, 6.7, 0.6) → (side * 3.8, 8.2, 1.2)
      // Lifted higher so it floats clearly above all other panels with no overlap risk
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

      // CHANGED: baseY updated from 4.4 → 5.2 to match new photoFrame Y position
      this.animatedObjects.push({
        object: photoFrame,
        baseY: 5.2,
        floatAmount: 0.16,
        floatSpeed: 0.55 + index * 0.08,
        spinSpeed: 0,
      });
      // CHANGED: baseY updated from 2.9 → 3.2 to match new archiveCard Y position
      this.animatedObjects.push({
        object: archiveCard,
        baseY: 3.2,
        floatAmount: 0.14,
        floatSpeed: 0.72 + index * 0.06,
        spinSpeed: 0,
      });
      // CHANGED: baseY updated from 4.95 → 5.6 to match new videoFrame Y position
      this.animatedObjects.push({
        object: videoFrame,
        baseY: 5.6,
        floatAmount: 0.11,
        floatSpeed: 0.78 + index * 0.07,
        spinSpeed: 0,
      });
      // CHANGED: baseY updated from 1.95 → 2.1 to match new descriptionPanel Y position
      this.animatedObjects.push({
        object: descriptionPanel,
        baseY: 2.1,
        floatAmount: 0.12,
        floatSpeed: 0.9 + index * 0.08,
        spinSpeed: 0,
      });
      // CHANGED: baseY updated from 6.7 → 8.2 to match new voiceCloud Y position
      this.animatedObjects.push({
        object: voiceCloud,
        baseY: 8.2,
        floatAmount: 0.2,
        floatSpeed: 0.8 + index * 0.12,
        spinSpeed: 0,
      });

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

  createMemoryStationTextures(
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

  updatePanelTexture(panelGroup, texture) {
    if (!panelGroup) {
      return;
    }

    panelGroup.children.forEach((child) => {
      if (!child.material) {
        return;
      }

      child.material.map = texture;
      child.material.needsUpdate = true;
    });
  }

  resizeReadablePanel(panelGroup, width, height) {
    if (!panelGroup) {
      return;
    }

    panelGroup.children.forEach((child) => {
      if (!child?.isMesh || !child.geometry) {
        return;
      }

      child.geometry.dispose?.();
      child.geometry = new THREE.PlaneGeometry(width, height);
    });
  }

  applyMediaFrameAspect(frame, panel, aspect, options = {}) {
    if (!frame || !Number.isFinite(aspect) || aspect <= 0) {
      return;
    }

    const baseInnerWidth = options.baseInnerWidth ?? 3.88;
    const baseInnerHeight = options.baseInnerHeight ?? 2.88;
    const frameBorder = options.frameBorder ?? 0.06;
    const minAspect = options.minAspect ?? 0.9;
    const maxAspect = options.maxAspect ?? 2.2;
    const maxLandscapeScale = options.maxLandscapeScale ?? 1.3;

    const baseInnerAspect = baseInnerWidth / baseInnerHeight;
    const boundedAspect = THREE.MathUtils.clamp(aspect, minAspect, maxAspect);

    let innerWidth;
    let innerHeight;

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

  applyPhotoFrameAspect(photoFrame, photoPanel, aspect) {
    this.applyMediaFrameAspect(photoFrame, photoPanel, aspect, {
      baseInnerWidth: 3.88,
      baseInnerHeight: 2.88,
      frameBorder: 0.06,
      minAspect: 0.9,
      maxAspect: 2.2,
      maxLandscapeScale: 1.3,
    });
  }

  applyVideoFrameAspect(videoFrame, videoPanel, aspect) {
    this.applyMediaFrameAspect(videoFrame, videoPanel, aspect, {
      baseInnerWidth: 3.68,
      baseInnerHeight: 2.79,
      frameBorder: 0.06,
      minAspect: 0.56,
      maxAspect: 2.4,
      maxLandscapeScale: 1.2,
    });
  }

  updatePanelTint(panelGroup, tintColor) {
    if (!panelGroup) {
      return;
    }

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

    const uniqueTextures = [...new Set(Object.values(textures).filter(Boolean))];
    uniqueTextures.forEach((texture) => {
      texture?.userData?.cleanup?.();
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

      const photoAspectState = stationData.photoAspectState ?? {
        requestId: 0,
        currentAspect: 3.88 / 2.88,
      };
      const videoAspectState = stationData.videoAspectState ?? {
        requestId: 0,
        currentAspect: 16 / 9,
      };
      stationData.photoAspectState = photoAspectState;
      stationData.videoAspectState = videoAspectState;

      photoAspectState.requestId += 1;
      videoAspectState.requestId += 1;
      const photoRequestId = photoAspectState.requestId;
      const videoRequestId = videoAspectState.requestId;

      const nextTextures = this.createMemoryStationTextures(
        themedEntry,
        (aspect) => {
          if (photoRequestId !== photoAspectState.requestId) {
            return;
          }
          photoAspectState.currentAspect = aspect;
          this.applyPhotoFrameAspect(stationData.photoFrame, stationData.photoPanel, aspect);
        },
        (aspect) => {
          if (videoRequestId !== videoAspectState.requestId) {
            return;
          }
          videoAspectState.currentAspect = aspect;
          this.applyVideoFrameAspect(stationData.videoFrame, stationData.videoPanel, aspect);
        },
        (texture) => {
          if (videoRequestId !== videoAspectState.requestId) {
            return;
          }
          this.updatePanelTexture(stationData.videoPanel, texture);
        },
      );

      const nextPhotoAspect =
        nextTextures.photoTexture.userData?.photoAspect ?? photoAspectState.currentAspect;
      photoAspectState.currentAspect = nextPhotoAspect;
      this.applyPhotoFrameAspect(stationData.photoFrame, stationData.photoPanel, nextPhotoAspect);

      const nextVideoAspect =
        nextTextures.videoTexture.userData?.mediaAspect ?? videoAspectState.currentAspect;
      videoAspectState.currentAspect = nextVideoAspect;
      this.applyVideoFrameAspect(stationData.videoFrame, stationData.videoPanel, nextVideoAspect);

      this.updatePanelTexture(stationData.photoPanel, nextTextures.photoTexture);
      this.updatePanelTexture(
        stationData.videoPanel,
        nextTextures.videoFallbackTexture ?? nextTextures.videoTexture,
      );
      this.updatePanelTexture(stationData.archivePanel, nextTextures.photoFrameTexture);
      this.updatePanelTexture(stationData.descriptionPanel, nextTextures.descriptionTexture);
      this.updatePanelTexture(stationData.voiceCloud, nextTextures.voiceTexture);

      this.updatePanelTint(stationData.photoPanel, panelTint);
      this.updatePanelTint(stationData.videoPanel, panelTint);
      this.updatePanelTint(stationData.archivePanel, panelTint);
      this.updatePanelTint(stationData.descriptionPanel, panelTint);
      this.updatePanelTint(stationData.voiceCloud, panelTint);

      this.disposeStationTextures(stationData.textures);
      stationData.textures = nextTextures;
    });
  }

  dispose() {
    this.memoryStations.forEach((stationData) => {
      this.disposeStationTextures(stationData.textures);
    });
    this.memoryStations = [];

    this.groundTexture?.dispose?.();
    this.groundTexture = null;

    this.mistTexture?.dispose?.();
    this.mistTexture = null;
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
      const componentId = `timeline-marker-${index + 1}`;
      marker.position.set(point.x, 0.65, point.z);
      marker.castShadow = true;
      marker.userData.componentId = componentId;
      marker.userData.componentLabel = `Timeline Marker ${index + 1}`;
      marker.userData.isCustomizable = true;
      this.scene.add(marker);

      this.registerCustomizableComponent(componentId, marker, {
        type: "timeline-marker",
        index,
      });

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
      transparent: true,
      opacity: 0.38,
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

