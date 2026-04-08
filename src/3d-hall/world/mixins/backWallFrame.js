import * as THREE from "three";

// ── Matches museumHall.js ─────────────────────────────────────────
const BACK_Z = -120;

// ── Layout ────────────────────────────────────────────────────────
const FRAME_CENTER_Y = 8.5;   // height from floor to frame centre
const MAX_INNER_W    = 12;    // max photo width  (world units)
const MAX_INNER_H    =  9;    // max photo height (world units)

// ── Frame geometry constants ──────────────────────────────────────
const RAIL_W         = 0.32;  // thin silver rail bar width
const RAIL_D         = 0.22;  // rail extrusion depth
const CORNER_SIZE    = 0.58;  // square corner block side length
const CORNER_D       = 0.30;  // corner block depth (proud of rail)
const SHADOW_PAD     = 0.72;  // shadow box extends this far beyond rail
const SHADOW_D       = 0.08;  // shadow box thickness (flat backing)
const GLOW_W         = 0.08;  // emissive glow trim strip width
const REVEAL_W       = 0.09;  // white reveal between rail and photo

export function createBackWallFrame(profilePhotoUrl) {

  // ── Materials ─────────────────────────────────────────────────────

  // Deep charcoal shadow-box backing
  const shadowMat = new THREE.MeshStandardMaterial({
    color: 0x12101a, metalness: 0.05, roughness: 0.92, fog: false,
  });

  // Brushed silver rail
  const railMat = new THREE.MeshStandardMaterial({
    color: 0xb8bec8, metalness: 0.88, roughness: 0.22, fog: false,
  });

  // Brighter silver for corner blocks
  const cornerMat = new THREE.MeshStandardMaterial({
    color: 0xd4dae6, metalness: 0.94, roughness: 0.12, fog: false,
  });

  // Soft purple emissive glow trim
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x9b6edc,
    emissive: new THREE.Color(0x7040c0),
    emissiveIntensity: 1.2,
    metalness: 0.0,
    roughness: 1.0,
    fog: false,
  });

  // Cream white reveal strip
  const revealMat = new THREE.MeshStandardMaterial({
    color: 0xf0ece8, metalness: 0.0, roughness: 0.95, fog: false,
  });

  // Photo placeholder
  const placeholderMat = new THREE.MeshBasicMaterial({
    color: 0x0a090f, fog: false,
  });

  // ── Root group ────────────────────────────────────────────────────
  const frameGroup = new THREE.Group();
  frameGroup.position.set(0, FRAME_CENTER_Y, BACK_Z + 0.24);
  this.scene.add(frameGroup);

  let photoMesh = null;

  // ── Builder ───────────────────────────────────────────────────────
  const buildFrame = (innerW, innerH) => {
    while (frameGroup.children.length > 0) {
      const c = frameGroup.children[0];
      c.geometry?.dispose();
      frameGroup.remove(c);
    }

    const add = (w, h, d, mat, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = false;
      m.receiveShadow = false;
      frameGroup.add(m);
      return m;
    };

    // Derived measurements
    const railOuterW = innerW + RAIL_W * 2;  // outer edge of rail
    const railOuterH = innerH + RAIL_W * 2;
    const shadowW    = railOuterW + SHADOW_PAD * 2;
    const shadowH    = railOuterH + SHADOW_PAD * 2;

    const topY   =  innerH / 2 + RAIL_W / 2;
    const botY   = -(innerH / 2 + RAIL_W / 2);
    const leftX  = -(innerW / 2 + RAIL_W / 2);
    const rightX =   innerW / 2 + RAIL_W / 2;

    const zBack  = -RAIL_D * 0.6;   // z of shadow box face
    const zRail  =  0;              // z of rail face
    const zFront =  RAIL_D * 0.55;  // z photo sits at

    // ── 1. Shadow-box backing panel ──────────────────────────────────
    add(shadowW, shadowH, SHADOW_D, shadowMat, 0, 0, zBack - SHADOW_D * 0.5);

    // ── 2. Emissive glow trim — runs along inner edge of shadow pad ──
    //    Four strips just inside the shadow-box, behind the rail
    const glowZ = zBack + SHADOW_D * 0.5 + 0.01;
    const glowOutW = railOuterW + GLOW_W * 2;
    const glowOutH = railOuterH + GLOW_W * 2;
    // top / bottom
    add(glowOutW, GLOW_W, 0.02, glowMat, 0,  railOuterH / 2 + GLOW_W / 2, glowZ);
    add(glowOutW, GLOW_W, 0.02, glowMat, 0, -railOuterH / 2 - GLOW_W / 2, glowZ);
    // left / right
    add(GLOW_W, glowOutH, 0.02, glowMat, -railOuterW / 2 - GLOW_W / 2, 0, glowZ);
    add(GLOW_W, glowOutH, 0.02, glowMat,  railOuterW / 2 + GLOW_W / 2, 0, glowZ);

    // ── 3. Four thin silver rail bars ────────────────────────────────
    add(railOuterW, RAIL_W, RAIL_D, railMat, 0,      topY,  zRail);
    add(railOuterW, RAIL_W, RAIL_D, railMat, 0,      botY,  zRail);
    add(RAIL_W, innerH,     RAIL_D, railMat, leftX,  0,     zRail);
    add(RAIL_W, innerH,     RAIL_D, railMat, rightX, 0,     zRail);

    // ── 4. Corner blocks — proud of the rail ─────────────────────────
    const cx = innerW / 2 + RAIL_W / 2;
    const cy = innerH / 2 + RAIL_W / 2;
    const cz = CORNER_D * 0.5 - RAIL_D * 0.5 + 0.01; // sits proud
    add(CORNER_SIZE, CORNER_SIZE, CORNER_D, cornerMat,  cx,  cy, cz);
    add(CORNER_SIZE, CORNER_SIZE, CORNER_D, cornerMat, -cx,  cy, cz);
    add(CORNER_SIZE, CORNER_SIZE, CORNER_D, cornerMat,  cx, -cy, cz);
    add(CORNER_SIZE, CORNER_SIZE, CORNER_D, cornerMat, -cx, -cy, cz);

    // Small diamond inset on each corner block (darker recess)
    const insetMat = new THREE.MeshStandardMaterial({
      color: 0x6a72a0, metalness: 0.6, roughness: 0.4, fog: false,
    });
    const insetZ = cz + CORNER_D * 0.5 + 0.005;
    const inset = CORNER_SIZE * 0.38;
    add(inset, inset, 0.02, insetMat,  cx,  cy, insetZ);
    add(inset, inset, 0.02, insetMat, -cx,  cy, insetZ);
    add(inset, inset, 0.02, insetMat,  cx, -cy, insetZ);
    add(inset, inset, 0.02, insetMat, -cx, -cy, insetZ);

    // ── 5. Cream reveal strip (between rail and photo) ───────────────
    const revealZ = zFront - 0.02;
    add(innerW + REVEAL_W * 2, REVEAL_W, 0.03, revealMat, 0,              innerH / 2 + REVEAL_W / 2, revealZ);
    add(innerW + REVEAL_W * 2, REVEAL_W, 0.03, revealMat, 0,             -innerH / 2 - REVEAL_W / 2, revealZ);
    add(REVEAL_W, innerH,                0.03, revealMat, -innerW / 2 - REVEAL_W / 2, 0,              revealZ);
    add(REVEAL_W, innerH,                0.03, revealMat,  innerW / 2 + REVEAL_W / 2, 0,              revealZ);

    // ── 6. Photo / placeholder plane ─────────────────────────────────
    const prevMat = photoMesh?.material ?? placeholderMat;
    photoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(innerW, innerH),
      prevMat,
    );
    photoMesh.position.z = zFront;
    frameGroup.add(photoMesh);

    return photoMesh;
  };

  // Initial build — default aspect until photo loads
  buildFrame(MAX_INNER_W, MAX_INNER_H);

  // Load photo and rebuild with correct aspect ratio
  if (profilePhotoUrl) {
    new THREE.TextureLoader().load(
      profilePhotoUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const { naturalWidth: nw, naturalHeight: nh } = texture.image;
        const ar = nw / nh;

        let innerW, innerH;
        if (ar >= 1) {
          innerW = Math.min(MAX_INNER_W, MAX_INNER_H * ar);
          innerH = innerW / ar;
        } else {
          innerH = Math.min(MAX_INNER_H, MAX_INNER_W / ar);
          innerW = innerH * ar;
        }

        buildFrame(innerW, innerH);
        photoMesh.material = new THREE.MeshBasicMaterial({
          map: texture,
          fog: false,
        });
      },
      undefined,
      () => { /* keep placeholder on error */ },
    );
  }

  this.registerCustomizableComponent('museum-back-wall-frame', frameGroup, {
    type: 'museum-back-wall-frame',
    label: 'Back Wall Profile Frame',
  });
}
