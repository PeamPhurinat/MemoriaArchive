import * as THREE from "three";

// ── Matches museumHall.js ─────────────────────────────────────────
const BACK_Z = -120;

// ── Layout ────────────────────────────────────────────────────────
// Adjust these to change the size / position of the frame.
const FRAME_CENTER_Y = 8.5;    // height from floor to frame centre
const MAX_INNER_W    = 12;     // max photo width  (world units) ← adjust width
const MAX_INNER_H    =  9;     // max photo height (world units) ← adjust height
const BORDER         =  0.62;  // frame bar width on every side  ← adjust thickness
const DEPTH          =  0.18;  // frame extrusion depth
const LINER_W        =  0.10;  // inner dark liner strip width
const SPINE_W        =  0.08;  // raised centre-spine width on each bar
const OUTER_LIP_W   =  0.07;  // thin outer highlight strip width

export function createBackWallFrame(profilePhotoUrl) {

  // ── fog:false on every material so the frame is always crisp ─────
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc8a228, metalness: 0.92, roughness: 0.18, fog: false,
  });
  // Slightly lighter for the raised centre spine
  const spineGold = new THREE.MeshStandardMaterial({
    color: 0xe8c040, metalness: 0.96, roughness: 0.10, fog: false,
  });
  // Dark thin inner liner
  const linerMat = new THREE.MeshStandardMaterial({
    color: 0x1a1410, metalness: 0.10, roughness: 0.90, fog: false,
  });
  // Placeholder for photo
  const placeholderMat = new THREE.MeshBasicMaterial({
    color: 0x0d0d0d, fog: false,
  });

  // ── Root group ────────────────────────────────────────────────────
  const frameGroup = new THREE.Group();
  frameGroup.position.set(0, FRAME_CENTER_Y, BACK_Z + 0.22);
  this.scene.add(frameGroup);

  let photoMesh = null;

  // ── Builder ───────────────────────────────────────────────────────
  const buildFrame = (innerW, innerH) => {
    // Dispose previous children
    while (frameGroup.children.length > 0) {
      const c = frameGroup.children[0];
      c.geometry?.dispose();
      frameGroup.remove(c);
    }

    const outerW = innerW + BORDER * 2;
    const outerH = innerH + BORDER * 2;

    const add = (w, h, d, mat, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = false;
      m.receiveShadow = false;
      frameGroup.add(m);
      return m;
    };

    const topY   =  innerH / 2 + BORDER / 2;
    const botY   = -(innerH / 2 + BORDER / 2);
    const leftX  = -(innerW / 2 + BORDER / 2);
    const rightX =   innerW / 2 + BORDER / 2;

    // ── 1. Thin flat backing plate (recessed, full outer rect) ──────
    add(outerW + OUTER_LIP_W * 2,
        outerH + OUTER_LIP_W * 2,
        DEPTH * 0.22, goldMat, 0, 0, -DEPTH * 0.5);

    // ── 2. Four slim frame bars ──────────────────────────────────────
    add(outerW, BORDER, DEPTH, goldMat, 0,      topY,  0);
    add(outerW, BORDER, DEPTH, goldMat, 0,      botY,  0);
    add(BORDER, innerH, DEPTH, goldMat, leftX,  0,     0);
    add(BORDER, innerH, DEPTH, goldMat, rightX, 0,     0);

    // ── 3. Raised centre spine on each bar (fine detail line) ────────
    const spineZ = DEPTH * 0.5 + 0.01; // just proud of the face
    add(outerW,      SPINE_W, 0.04, spineGold, 0,     topY,  spineZ);
    add(outerW,      SPINE_W, 0.04, spineGold, 0,     botY,  spineZ);
    add(SPINE_W, innerH,      0.04, spineGold, leftX, 0,     spineZ);
    add(SPINE_W, innerH,      0.04, spineGold, rightX,0,     spineZ);

    // ── 4. Outer highlight lip ───────────────────────────────────────
    const lipZ = DEPTH * 0.5 + 0.005;
    const lipOutW = outerW + OUTER_LIP_W * 2;
    const lipOutH = outerH + OUTER_LIP_W * 2;
    add(lipOutW,     OUTER_LIP_W, 0.03, spineGold, 0,              outerH / 2 + OUTER_LIP_W / 2, lipZ);
    add(lipOutW,     OUTER_LIP_W, 0.03, spineGold, 0,             -outerH / 2 - OUTER_LIP_W / 2, lipZ);
    add(OUTER_LIP_W, lipOutH,     0.03, spineGold, -outerW / 2 - OUTER_LIP_W / 2, 0,             lipZ);
    add(OUTER_LIP_W, lipOutH,     0.03, spineGold,  outerW / 2 + OUTER_LIP_W / 2, 0,             lipZ);

    // ── 5. Inner dark liner (reveals depth between frame and photo) ──
    const linerZ = DEPTH * 0.48;
    add(innerW + LINER_W * 2, LINER_W, 0.04, linerMat, 0,              innerH / 2 + LINER_W / 2, linerZ);
    add(innerW + LINER_W * 2, LINER_W, 0.04, linerMat, 0,             -innerH / 2 - LINER_W / 2, linerZ);
    add(LINER_W, innerH,                     0.04, linerMat, -innerW / 2 - LINER_W / 2, 0,        linerZ);
    add(LINER_W, innerH,                     0.04, linerMat,  innerW / 2 + LINER_W / 2, 0,        linerZ);

    // ── 6. Photo / placeholder plane ────────────────────────────────
    const prevMat = photoMesh?.material ?? placeholderMat;
    photoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(innerW, innerH),
      prevMat,
    );
    photoMesh.position.z = DEPTH * 0.51;
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
