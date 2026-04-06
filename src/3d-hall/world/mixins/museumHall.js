import * as THREE from "three";

// Mixin: createMuseumHall + updateMuseumConstraints
// Assigned to WorldBuilder.prototype in WorldBuilder.js.

export function createMuseumHall() {
  // --- Default dimensions ---
  const HW       = 20;
  const HH       = 17;
  const FRONT_Z  = 26;
  const BACK_Z   = -66;
  const HALL_LEN = FRONT_Z - BACK_Z;
  const CZ       = (FRONT_Z + BACK_Z) / 2;

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
  const darkDoorMat = new THREE.MeshStandardMaterial({ color: 0x2e1a0c, roughness: 0.70 });
  const fanBarMat   = new THREE.MeshStandardMaterial({ color: 0xb0a080, roughness: 0.50, metalness: 0.30 });

  // --- Helpers ---
  const makeGroup = (x, y, z) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    this.scene.add(g);
    return g;
  };
  const boxIn = (group, w, h, d, mat, lx = 0, ly = 0, lz = 0, cast = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(lx, ly, lz);
    m.castShadow = cast;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };
  const reg = (id, group, label, meta = {}) => {
    group.userData.componentLabel = label;
    group.userData.isCustomizable = true;
    this.registerCustomizableComponent(id, group, { ...meta, label });
  };

  // Spotlight targets live in world-space (not in their track group) so they
  // can be updated independently in updateMuseumConstraints.
  const spotTargets = [];

  // ================================================================
  // 1. WOOD-PLANK FLOOR
  // ================================================================
  const woodCanvas = document.createElement("canvas");
  woodCanvas.width = 512; woodCanvas.height = 512;
  const ctx = woodCanvas.getContext("2d");
  const PLANK_W = 128;
  ["#c89858", "#d0a565", "#c49050", "#cfa070"].forEach((col, p) => {
    ctx.fillStyle = col;
    ctx.fillRect(p * PLANK_W, 0, PLANK_W, 512);
    ctx.strokeStyle = "rgba(110,65,15,0.10)";
    ctx.lineWidth = 1;
    for (let gi = 0; gi < 10; gi++) {
      const gy = gi * 52;
      ctx.beginPath();
      ctx.moveTo(p * PLANK_W + 4, gy);
      ctx.bezierCurveTo(p * PLANK_W + PLANK_W * 0.3, gy + 9, p * PLANK_W + PLANK_W * 0.7, gy - 7, p * PLANK_W + PLANK_W - 4, gy + 4);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(90,50,10,0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p * PLANK_W, 0); ctx.lineTo(p * PLANK_W, 512); ctx.stroke();
  });
  const woodTex = new THREE.CanvasTexture(woodCanvas);
  woodTex.wrapS = THREE.RepeatWrapping;
  woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.repeat.set(6, 20);
  woodTex.colorSpace = THREE.SRGBColorSpace;
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, color: 0xd4a96a, roughness: 0.76, metalness: 0.02 });

  const floorGroup = makeGroup(0, 0, CZ);
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, HALL_LEN), woodMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0.01;
  floorMesh.receiveShadow = true;
  floorGroup.add(floorMesh);

  // ================================================================
  // 2. WALLS
  // ================================================================
  const wallLeftGroup = makeGroup(-HW, HH / 2, CZ);
  (() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, HH, HALL_LEN), wallMat); m.castShadow = true; m.receiveShadow = true; wallLeftGroup.add(m); })();

  const wallRightGroup = makeGroup(HW, HH / 2, CZ);
  (() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, HH, HALL_LEN), wallMat); m.castShadow = true; m.receiveShadow = true; wallRightGroup.add(m); })();

  const DOOR_W = 5.2, DOOR_H = 8.5, ARCH_R = DOOR_W * 0.50;
  const bwSideW = HW - DOOR_W / 2;
  const aboveH  = HH - DOOR_H - ARCH_R;
  const wallBackGroup = makeGroup(0, 0, BACK_Z);
  boxIn(wallBackGroup, bwSideW, HH, 0.5, wallMat, -(DOOR_W / 2 + bwSideW / 2), HH / 2, 0);
  boxIn(wallBackGroup, bwSideW, HH, 0.5, wallMat,  (DOOR_W / 2 + bwSideW / 2), HH / 2, 0);
  if (aboveH > 0) boxIn(wallBackGroup, HW * 2, aboveH, 0.5, wallMat, 0, DOOR_H + ARCH_R + aboveH / 2, 0);

  const ENTRY_W = 12, ENTRY_ARCH_R = 6, ENTRY_H = 11;
  const fwSideW    = HW - ENTRY_W / 2;
  const entryAboveH = HH - ENTRY_H - ENTRY_ARCH_R;
  const wallFrontGroup = makeGroup(0, 0, FRONT_Z);
  boxIn(wallFrontGroup, fwSideW, HH, 0.5, wallMat, -(ENTRY_W / 2 + fwSideW / 2), HH / 2, 0);
  boxIn(wallFrontGroup, fwSideW, HH, 0.5, wallMat,  (ENTRY_W / 2 + fwSideW / 2), HH / 2, 0);
  if (entryAboveH > 0) boxIn(wallFrontGroup, HW * 2, entryAboveH, 0.5, wallMat, 0, ENTRY_H + ENTRY_ARCH_R + entryAboveH / 2, 0);

  // ================================================================
  // 3. CEILING
  // ================================================================
  const ceilGroup = makeGroup(0, HH + 0.3, CZ);
  (() => { const m = new THREE.Mesh(new THREE.BoxGeometry(HW * 2 + 1, 0.6, HALL_LEN + 0.5), ceilMat); m.receiveShadow = true; ceilGroup.add(m); })();

  // ================================================================
  // 4. CROWN MOLDING
  // ================================================================
  const moldH = 0.36, moldD = 0.28;
  const crownLeftGroup = makeGroup(-HW + 0.22 + moldD / 2, HH - moldH / 2, CZ);
  boxIn(crownLeftGroup, moldD, moldH, HALL_LEN, moldMat, 0, 0, 0, false);
  boxIn(crownLeftGroup, moldD * 0.6, moldH * 0.55, HALL_LEN, moldMat, 0, -moldH * 1.1, 0, false);
  reg("museum-crown-left", crownLeftGroup, "Crown Molding Left", { type: "museum-crown", side: "left" });

  const crownRightGroup = makeGroup(HW - 0.22 - moldD / 2, HH - moldH / 2, CZ);
  boxIn(crownRightGroup, moldD, moldH, HALL_LEN, moldMat, 0, 0, 0, false);
  boxIn(crownRightGroup, moldD * 0.6, moldH * 0.55, HALL_LEN, moldMat, 0, -moldH * 1.1, 0, false);
  reg("museum-crown-right", crownRightGroup, "Crown Molding Right", { type: "museum-crown", side: "right" });

  // ================================================================
  // 5. WHITE MARBLE COLUMNS
  // ================================================================
  const COL_X = 10;
  const colZs = [20, 2, -16, -34, -52];
  const columnGroups = [];

  colZs.forEach((cz2, zi) => {
    [-COL_X, COL_X].forEach((cx, ci) => {
      const colGroup = makeGroup(cx, 0, cz2);
      boxIn(colGroup, 1.5, 0.18, 1.5, marbMat, 0, 0.09, 0, false);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.80, 0.90, 0.52, 24), marbMat);
      base.position.set(0, 0.44, 0); base.castShadow = true; colGroup.add(base);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 15.42, 24), marbMat);
      shaft.position.set(0, 8.41, 0); shaft.castShadow = true; colGroup.add(shaft);
      const echinus = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.64, 0.60, 24), marbMat);
      echinus.position.set(0, 16.42, 0); colGroup.add(echinus);
      boxIn(colGroup, 1.75, 0.28, 1.75, marbMat, 0, 16.86, 0, false);

      const side = ci === 0 ? "L" : "R";
      reg(`museum-column-${side}${zi + 1}`, colGroup, `Marble Column ${side}${zi + 1}`, { type: "museum-column" });
      columnGroups.push(colGroup);
    });
  });

  // ================================================================
  // 6. STONE PILASTERS (auto-follow side walls — not user-movable)
  // ================================================================
  const PIL_OFFSET = 1.15;
  const pilastersLeft = [], pilastersRight = [];
  colZs.forEach((cz2) => {
    const plg = makeGroup(-HW + PIL_OFFSET, 0, cz2);
    boxIn(plg, 1.55, HH - 0.45, 1.35, stonMat, 0, (HH - 0.45) / 2, 0);
    boxIn(plg, 1.90, 0.42, 1.60, stonMat, 0, HH - 0.45 + 0.21, 0, false);
    pilastersLeft.push(plg);

    const prg = makeGroup(HW - PIL_OFFSET, 0, cz2);
    boxIn(prg, 1.55, HH - 0.45, 1.35, stonMat, 0, (HH - 0.45) / 2, 0);
    boxIn(prg, 1.90, 0.42, 1.60, stonMat, 0, HH - 0.45 + 0.21, 0, false);
    pilastersRight.push(prg);
  });

  // ================================================================
  // 7. GRAND ARCH DOOR — back wall
  // ================================================================
  const FW = 0.36;
  const doorGroup = makeGroup(0, 0, BACK_Z + 0.28);
  boxIn(doorGroup, FW, DOOR_H, FW, moldMat, -DOOR_W / 2 + FW / 2, DOOR_H / 2, 0);
  boxIn(doorGroup, FW, DOOR_H, FW, moldMat,  DOOR_W / 2 - FW / 2, DOOR_H / 2, 0);
  const archFrame = new THREE.Mesh(new THREE.TorusGeometry(ARCH_R, FW / 2, 8, 36, Math.PI), moldMat);
  archFrame.position.set(0, DOOR_H, 0); doorGroup.add(archFrame);
  boxIn(doorGroup, 0.44, 0.44, FW, moldMat, 0, DOOR_H + ARCH_R - 0.22, 0, false);
  const leafW = (DOOR_W / 2 - FW) * 0.95, leafH = DOOR_H - 0.38;
  [-1, 1].forEach((side) => {
    boxIn(doorGroup, leafW, leafH, 0.18, doorMat, side * leafW / 2, leafH / 2 + 0.19, 0);
    const panH = leafH * 0.32;
    [0.28, -0.22].forEach((dy) => {
      boxIn(doorGroup, leafW * 0.68, panH, 0.05, darkDoorMat, side * leafW / 2, leafH / 2 + 0.19 + dy * leafH, 0.08);
    });
  });
  const fanMesh = new THREE.Mesh(new THREE.CircleGeometry(ARCH_R * 0.86, 32, 0, Math.PI), glassMat);
  fanMesh.position.set(0, DOOR_H + 0.06, 0); doorGroup.add(fanMesh);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 4) * Math.PI;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, ARCH_R * 0.86, 6), fanBarMat);
    bar.rotation.z = angle - Math.PI / 2;
    bar.position.set(Math.cos(angle) * ARCH_R * 0.43, DOOR_H + Math.sin(angle) * ARCH_R * 0.43, 0.02);
    doorGroup.add(bar);
  }
  reg("museum-door-back", doorGroup, "Arch Door (Back)", { type: "museum-door", side: "back" });

  // ================================================================
  // 8. ENTRANCE ARCH — front wall
  // ================================================================
  const EFW = 0.36;
  const entryGroup = makeGroup(0, 0, FRONT_Z - 0.28);
  boxIn(entryGroup, EFW, ENTRY_H, EFW, moldMat, -ENTRY_W / 2 + EFW / 2, ENTRY_H / 2, 0);
  boxIn(entryGroup, EFW, ENTRY_H, EFW, moldMat,  ENTRY_W / 2 - EFW / 2, ENTRY_H / 2, 0);
  const entryArchFrame = new THREE.Mesh(new THREE.TorusGeometry(ENTRY_ARCH_R, EFW / 2, 8, 36, Math.PI), moldMat);
  entryArchFrame.position.set(0, ENTRY_H, 0); entryGroup.add(entryArchFrame);
  boxIn(entryGroup, 0.44, 0.44, EFW, moldMat, 0, ENTRY_H + ENTRY_ARCH_R - 0.22, 0, false);
  const entryFanMesh = new THREE.Mesh(new THREE.CircleGeometry(ENTRY_ARCH_R * 0.88, 32, 0, Math.PI), glassMat);
  entryFanMesh.position.set(0, ENTRY_H + 0.06, 0); entryGroup.add(entryFanMesh);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 4) * Math.PI;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, ENTRY_ARCH_R * 0.88, 6), fanBarMat);
    bar.rotation.z = angle - Math.PI / 2;
    bar.position.set(Math.cos(angle) * ENTRY_ARCH_R * 0.44, ENTRY_H + Math.sin(angle) * ENTRY_ARCH_R * 0.44, 0.02);
    entryGroup.add(bar);
  }
  reg("museum-door-front", entryGroup, "Arch Door (Front)", { type: "museum-door", side: "front" });

  // ================================================================
  // 9. SKYLIGHT WINDOWS
  // ================================================================
  const skylightCenters = [-4, -30];
  const SKYW = 10, SKYL = 16;
  const skylightGroups = [];
  skylightCenters.forEach((sz, si) => {
    const skyGroup = makeGroup(0, HH, sz);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(SKYW, SKYL), glassMat);
    sky.rotation.x = -Math.PI / 2; sky.position.y = 0.01; skyGroup.add(sky);
    boxIn(skyGroup, SKYW + 0.28, 0.10, SKYL + 0.28, gridMat, 0, 0.08, 0, false);
    [-1, 0, 1].forEach((ii) => boxIn(skyGroup, 0.07, 0.10, SKYL, gridMat, ii * SKYW / 3, 0.08, 0, false));
    [-2, -1, 0, 1, 2].forEach((ii) => boxIn(skyGroup, SKYW, 0.10, 0.07, gridMat, 0, 0.08, ii * SKYL / 4, false));
    reg(`museum-skylight-${si + 1}`, skyGroup, `Skylight ${si + 1}`, { type: "museum-skylight" });
    skylightGroups.push(skyGroup);
  });

  // ================================================================
  // 10. GALLERY CEILING LIGHT TRACKS + SPOTLIGHTS
  // ================================================================
  const galleryLightZs = [11, -7, -25, -43];
  const lightTrackGroups = [];
  galleryLightZs.forEach((lz, li) => {
    const trackGroup = makeGroup(0, HH, lz);
    boxIn(trackGroup, 13, 0.12, 0.22, trackMat, 0, -0.05, 0, false);
    [-4.5, 0, 4.5].forEach((lx) => {
      const spot = new THREE.SpotLight(0xfff5e4, 16, 22, Math.PI / 6.5, 0.40, 1.4);
      spot.position.set(lx, -0.18, 0);
      trackGroup.add(spot);
      spot.target.position.set(lx, 0, lz);
      this.scene.add(spot.target);
      spotTargets.push({ target: spot.target, localX: lx, trackGroup });
      boxIn(trackGroup, 0.22, 0.22, 0.22, trackMat, lx, -0.22, 0, false);
    });
    reg(`museum-light-track-${li + 1}`, trackGroup, `Light Track ${li + 1}`, { type: "museum-light-track" });
    lightTrackGroups.push(trackGroup);
  });

  // ================================================================
  // 11. ROPE BARRIERS
  // ================================================================
  const ROPE_X = 8, POST_STEP = 9.0;
  const makeRopeGroup = (px) => {
    const rg = makeGroup(0, 0, 0);
    const postZList = [];
    for (let pz = FRONT_Z - 3; pz >= BACK_Z + 3; pz -= POST_STEP) {
      postZList.push(pz);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.12, 8), postMat);
      post.position.set(px, 0.56, pz); rg.add(post);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), postMat);
      finial.position.set(px, 1.16, pz); rg.add(finial);
    }
    for (let i = 0; i < postZList.length - 1; i++) {
      const z1 = postZList[i], z2 = postZList[i + 1];
      const ropeLen = Math.abs(z2 - z1);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, ropeLen, 6), ropeMat);
      rope.rotation.x = Math.PI / 2; rope.position.set(px, 0.92, (z1 + z2) / 2); rg.add(rope);
    }
    return rg;
  };
  const ropeLeftGroup  = makeRopeGroup(-ROPE_X);
  reg("museum-rope-left",  ropeLeftGroup,  "Rope Barrier (Left)",  { type: "museum-rope", side: "left" });
  const ropeRightGroup = makeRopeGroup(ROPE_X);
  reg("museum-rope-right", ropeRightGroup, "Rope Barrier (Right)", { type: "museum-rope", side: "right" });

  // ================================================================
  // 12. BASEBOARD + WAINSCOTING (auto-follow walls — not user-movable)
  // ================================================================
  const baseboardLeftGroup  = makeGroup(-HW + 0.07, 0.24, CZ);
  boxIn(baseboardLeftGroup,  0.16, 0.48, HALL_LEN, moldMat, 0, 0, 0, false);
  const baseboardRightGroup = makeGroup( HW - 0.07, 0.24, CZ);
  boxIn(baseboardRightGroup, 0.16, 0.48, HALL_LEN, moldMat, 0, 0, 0, false);

  // Store all refs so updateMuseumConstraints() can read/write them
  this.museumHall = {
    defaultHW: HW, defaultHH: HH, defaultCZ: CZ, defaultHallLen: HALL_LEN,
    wallLeft:  wallLeftGroup,  wallRight: wallRightGroup,
    wallBack:  wallBackGroup,  wallFront: wallFrontGroup,
    ceiling:   ceilGroup,
    crownLeft: crownLeftGroup, crownRight: crownRightGroup,
    floor:     floorGroup,
    columns:   columnGroups,
    pilastersLeft, pilastersRight,
    skylights: skylightGroups,
    lightTracks: lightTrackGroups,
    spotTargets,
    baseboardLeft: baseboardLeftGroup, baseboardRight: baseboardRightGroup,
    moldH, moldD, PIL_OFFSET,
  };
}

export function updateMuseumConstraints() {
  const hall = this.museumHall;
  if (!hall) return;

  const ceilBottomY = hall.ceiling.position.y - 0.3;
  const leftX   = hall.wallLeft.position.x;
  const rightX  = hall.wallRight.position.x;
  const frontZ  = hall.wallFront.position.z;
  const backZ   = hall.wallBack.position.z;
  const hallWidth = rightX - leftX;
  const hallLen   = frontZ - backZ;
  const CZ        = (frontZ + backZ) / 2;
  const colScale  = ceilBottomY / hall.defaultHH;

  hall.ceiling.position.x = 0;
  hall.ceiling.position.z = CZ;

  hall.floor.scale.set(
    hallWidth  / (hall.defaultHW * 2),
    1,
    hallLen    / hall.defaultHallLen,
  );
  hall.floor.position.z = CZ;

  hall.crownLeft.position.x  = leftX  + hall.moldD / 2 + 0.22;
  hall.crownLeft.position.y  = ceilBottomY - hall.moldH / 2;
  hall.crownRight.position.x = rightX - hall.moldD / 2 - 0.22;
  hall.crownRight.position.y = ceilBottomY - hall.moldH / 2;

  hall.columns.forEach((col) => { col.scale.y = colScale; });

  hall.pilastersLeft.forEach((g) => {
    g.position.x = leftX  + hall.PIL_OFFSET;
    g.scale.y    = colScale;
  });
  hall.pilastersRight.forEach((g) => {
    g.position.x = rightX - hall.PIL_OFFSET;
    g.scale.y    = colScale;
  });

  hall.skylights.forEach((g) => { g.position.y = ceilBottomY; });
  hall.lightTracks.forEach((g) => { g.position.y = ceilBottomY; });

  hall.spotTargets.forEach(({ target, localX, trackGroup }) => {
    target.position.set(trackGroup.position.x + localX, 0, trackGroup.position.z);
    target.updateMatrixWorld(true);
  });

  hall.baseboardLeft.position.x  = leftX  + 0.07;
  hall.baseboardRight.position.x = rightX - 0.07;
}
