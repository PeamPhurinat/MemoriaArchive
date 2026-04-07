import * as THREE from "three";
import { createGroundTexture, createMistTexture, createStarTexture } from "../textureFactory.js";

// Mixin: ground, sky, particles, ruins, columns, timeline, spawnable objects, dispose.
// Assigned to WorldBuilder.prototype in WorldBuilder.js.

export function createGround() {
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

export function createSkyHalo() {
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(244, 1.2, 32, 120),
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
    new THREE.TorusGeometry(226, 0.55, 24, 96),
    new THREE.MeshBasicMaterial({
      color: 0xffebf6,
      transparent: true,
      opacity: 0.14,
    }),
  );
  innerHalo.rotation.x = Math.PI / 2.8;
  innerHalo.position.set(0, 28, 12);
  this.scene.add(innerHalo);
  this.animatedObjects.push({
    object: innerHalo,
    baseY: innerHalo.position.y,
    floatAmount: 0.55,
    floatSpeed: 0.28,
    spinSpeed: -0.06,
  });
}

export function createSkyMist() {
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

export function createBrokenColumns() {
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

export function createStandingPillars() {
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

export function createRomanColumn(isStanding) {
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

export function createTimelineTrail() {
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

export function createFloatingRuinFragments() {
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

export function createDreamParticles() {
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

export function createGlitterStars() {
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

export function createSpawnableObject(type) {
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.88, metalness: 0.04 });
  const marbMat  = new THREE.MeshStandardMaterial({ color: 0xf4f2ef, roughness: 0.66, metalness: 0.03 });

  const group = new THREE.Group();

  switch (type) {
    case "pillar": {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.5, 24), marbMat);
      base.position.y = 0.25; base.castShadow = true; base.receiveShadow = true; group.add(base);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 9.0, 24), marbMat);
      shaft.position.y = 5.0; shaft.castShadow = true; shaft.receiveShadow = true; group.add(shaft);
      const echinus = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.66, 0.58, 24), marbMat);
      echinus.position.y = 9.74; echinus.castShadow = true; group.add(echinus);
      const abacus = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.26, 1.7), marbMat);
      abacus.position.y = 10.16; abacus.castShadow = true; group.add(abacus);
      group.userData.spawnLabel = "Pillar";
      break;
    }

    case "orb": {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.52, 0.62, 16), stoneMat);
      stand.position.y = 0.31; stand.castShadow = true; stand.receiveShadow = true; group.add(stand);
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 32, 32),
        new THREE.MeshStandardMaterial({
          color: 0xd4f0ff, emissive: 0x88ccff, emissiveIntensity: 0.7,
          roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.82,
        }),
      );
      sphere.position.y = 1.38; sphere.castShadow = true; group.add(sphere);
      const glow = new THREE.PointLight(0xaaddff, 12, 10, 2);
      glow.position.y = 1.38; group.add(glow);
      this.pulseLights.push({ light: glow, base: 12, speed: 1.6, range: 4 });
      this.animatedObjects.push({ object: sphere, baseY: 1.38, floatAmount: 0.12, floatSpeed: 1.1, spinSpeed: 0.28 });
      group.userData.spawnLabel = "Orb";
      break;
    }

    case "pedestal": {
      const pedBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 1.8), stoneMat);
      pedBase.position.y = 0.09; pedBase.receiveShadow = true; group.add(pedBase);
      const pedShaft = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.32, 0.82), stoneMat);
      pedShaft.position.y = 0.84; pedShaft.castShadow = true; pedShaft.receiveShadow = true; group.add(pedShaft);
      const pedTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 1.6), marbMat);
      pedTop.position.y = 1.58; pedTop.castShadow = true; group.add(pedTop);
      group.userData.spawnLabel = "Pedestal";
      break;
    }

    case "bench": {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 0.82), stoneMat);
      seat.position.y = 0.56; seat.castShadow = true; seat.receiveShadow = true; group.add(seat);
      [-1.1, 1.1].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.56, 0.72), stoneMat);
        leg.position.set(lx, 0.28, 0); leg.castShadow = true; leg.receiveShadow = true; group.add(leg);
      });
      group.userData.spawnLabel = "Bench";
      break;
    }

    case "arch": {
      const archR = 1.8, archFW = 0.22;
      const leftPost  = new THREE.Mesh(new THREE.BoxGeometry(archFW, 2.2, archFW), stoneMat);
      leftPost.position.set(-archR, 1.1, 0); leftPost.castShadow = true; group.add(leftPost);
      const rightPost = new THREE.Mesh(new THREE.BoxGeometry(archFW, 2.2, archFW), stoneMat);
      rightPost.position.set(archR, 1.1, 0); rightPost.castShadow = true; group.add(rightPost);
      const arc = new THREE.Mesh(new THREE.TorusGeometry(archR, archFW / 2, 8, 36, Math.PI), stoneMat);
      arc.position.set(0, 2.2, 0); arc.castShadow = true; group.add(arc);
      group.userData.spawnLabel = "Arch";
      break;
    }

    case "shard": {
      const shardMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.9, 0),
        new THREE.MeshStandardMaterial({
          color: 0xffd8f8, emissive: 0xff88ee, emissiveIntensity: 0.55,
          roughness: 0.12, metalness: 0.22, transparent: true, opacity: 0.78,
        }),
      );
      shardMesh.position.y = 2.2; shardMesh.castShadow = true; group.add(shardMesh);
      const shardGlow = new THREE.PointLight(0xff99ee, 8, 8, 2);
      shardGlow.position.y = 2.2; group.add(shardGlow);
      this.pulseLights.push({ light: shardGlow, base: 8, speed: 2.0, range: 3 });
      this.animatedObjects.push({ object: shardMesh, baseY: 2.2, floatAmount: 0.2, floatSpeed: 0.9, spinSpeed: 0.45 });
      group.userData.spawnLabel = "Dream Shard";
      break;
    }

    case "lantern": {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.8, 8), stoneMat);
      post.position.y = 1.4; post.castShadow = true; post.receiveShadow = true; group.add(post);
      const cage = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.56, 0.44),
        new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.42, metalness: 0.58, wireframe: false }),
      );
      cage.position.y = 2.94; cage.castShadow = true; group.add(cage);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffcc44, emissiveIntensity: 1.2, roughness: 0.2 }),
      );
      flame.position.y = 2.94; group.add(flame);
      const lanternGlow = new THREE.PointLight(0xffdd88, 10, 8, 2);
      lanternGlow.position.y = 2.94; group.add(lanternGlow);
      this.pulseLights.push({ light: lanternGlow, base: 10, speed: 2.4, range: 2.5 });
      group.userData.spawnLabel = "Lantern";
      break;
    }

    case "barrier": {
      const barrierPostMat = new THREE.MeshStandardMaterial({ color: 0xc0a860, roughness: 0.40, metalness: 0.60 });
      const barrierRopeMat = new THREE.MeshStandardMaterial({ color: 0x8a7860, roughness: 0.88 });
      [-0.9, 0.9].forEach((lx) => {
        const postGroup = new THREE.Group();
        postGroup.position.set(lx, 0, 0);
        postGroup.userData.isBarrierPost = true;
        const pst = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), barrierPostMat);
        pst.position.y = 0.55; pst.castShadow = true; pst.receiveShadow = true; postGroup.add(pst);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), barrierPostMat);
        ball.position.y = 1.14; postGroup.add(ball);
        group.add(postGroup);
      });
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.8, 8), barrierRopeMat);
      rope.rotation.z = Math.PI / 2;
      rope.position.set(0, 0.90, 0); rope.castShadow = true; group.add(rope);
      group.userData.spawnLabel = "Barrier";
      break;
    }

    case "cat": {
      const statMat = new THREE.MeshStandardMaterial({ color: 0xcfcbc2, roughness: 0.84, metalness: 0.05 });
      const catBase = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.82, 0.12, 20), statMat);
      catBase.position.y = 0.06; catBase.receiveShadow = true; group.add(catBase);
      const haunches = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.36, 0.52, 12), statMat);
      haunches.position.y = 0.38; haunches.castShadow = true; group.add(haunches);
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.30, 0.52, 12), statMat);
      torso.position.set(0, 0.82, 0.04); torso.rotation.x = -0.18; torso.castShadow = true; group.add(torso);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.22, 10), statMat);
      neck.position.set(0, 1.14, 0.06); neck.castShadow = true; group.add(neck);
      const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), statMat);
      catHead.scale.set(1, 0.92, 1); catHead.position.set(0, 1.42, 0.05); catHead.castShadow = true; group.add(catHead);
      [[-0.11, 0.15], [0.11, -0.15]].forEach(([ex, rz]) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.20, 5), statMat);
        ear.position.set(ex, 1.62, 0.02); ear.rotation.z = rz; ear.castShadow = true; group.add(ear);
      });
      [-0.13, 0.13].forEach((px) => {
        const paw = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), statMat);
        paw.scale.set(1.1, 0.55, 1.3); paw.position.set(px, 0.14, 0.28); group.add(paw);
      });
      const catTail = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.038, 8, 18, Math.PI * 1.15), statMat);
      catTail.position.set(0.18, 0.28, -0.22); catTail.rotation.set(-0.3, 0.5, Math.PI * 0.5); group.add(catTail);
      group.userData.spawnLabel = "Cat Statue";
      break;
    }

    case "dog": {
      const statMat = new THREE.MeshStandardMaterial({ color: 0xcfcbc2, roughness: 0.84, metalness: 0.05 });
      const dogBase = new THREE.Mesh(new THREE.CylinderGeometry(0.80, 0.90, 0.12, 20), statMat);
      dogBase.position.y = 0.06; dogBase.receiveShadow = true; group.add(dogBase);
      const dogHaunches = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), statMat);
      dogHaunches.scale.set(1, 1.1, 1.15); dogHaunches.position.y = 0.46; dogHaunches.castShadow = true; group.add(dogHaunches);
      const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.50, 0.58), statMat);
      dogBody.position.set(0, 0.80, 0.10); dogBody.rotation.x = -0.20; dogBody.castShadow = true; group.add(dogBody);
      const dogNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.28, 10), statMat);
      dogNeck.position.set(0, 1.14, 0.18); dogNeck.rotation.x = -0.30; dogNeck.castShadow = true; group.add(dogNeck);
      const dogHead = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.40, 0.46), statMat);
      dogHead.position.set(0, 1.44, 0.26); dogHead.castShadow = true; group.add(dogHead);
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.20, 0.26), statMat);
      snout.position.set(0, 1.34, 0.50); group.add(snout);
      [[-0.24, -0.10], [0.24, 0.10]].forEach(([ex, rz]) => {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.30, 0.06), statMat);
        ear.position.set(ex, 1.36, 0.20); ear.rotation.set(0.1, 0, rz); ear.castShadow = true; group.add(ear);
      });
      [-0.16, 0.16].forEach((px) => {
        const paw = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 8), statMat);
        paw.scale.set(1, 0.55, 1.3); paw.position.set(px, 0.14, 0.36); group.add(paw);
      });
      const dogTail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.44, 8), statMat);
      dogTail.position.set(0, 0.78, -0.36); dogTail.rotation.x = -0.90; dogTail.castShadow = true; group.add(dogTail);
      group.userData.spawnLabel = "Dog Statue";
      break;
    }

    case "knight": {
      const armorMat = new THREE.MeshStandardMaterial({ color: 0xb8b8b4, roughness: 0.50, metalness: 0.62 });
      const stonePlinthMat = new THREE.MeshStandardMaterial({ color: 0xcfcbc2, roughness: 0.88, metalness: 0.04 });
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.28, 1.0), stonePlinthMat);
      plinth.position.y = 0.14; plinth.receiveShadow = true; group.add(plinth);
      const plinthStep = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.12, 0.80), stonePlinthMat);
      plinthStep.position.y = 0.34; group.add(plinthStep);
      [-0.10, 0.10].forEach((fx) => {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.28), armorMat);
        foot.position.set(fx, 0.54, 0.04); foot.castShadow = true; group.add(foot);
      });
      [-0.10, 0.10].forEach((lx) => {
        const greave = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.11, 0.52, 10), armorMat);
        greave.position.set(lx, 0.88, 0); greave.castShadow = true; group.add(greave);
      });
      [-0.14, 0.14].forEach((tx) => {
        const tasset = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.14), armorMat);
        tasset.position.set(tx, 1.20, 0); group.add(tasset);
      });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.34), armorMat);
      torso.position.y = 1.48; torso.castShadow = true; group.add(torso);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.48, 0.12), armorMat);
      back.position.set(0, 1.48, -0.22); group.add(back);
      [-0.34, 0.34].forEach((px) => {
        const paul = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), armorMat);
        paul.scale.set(1, 0.75, 0.85); paul.position.set(px, 1.72, 0); paul.castShadow = true; group.add(paul);
      });
      const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.50, 8), armorMat);
      armL.position.set(-0.36, 1.46, 0.12); armL.rotation.set(0.5, 0, -0.25); armL.castShadow = true; group.add(armL);
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.06), armorMat);
      shield.position.set(-0.52, 1.42, 0.36); shield.rotation.y = 0.20; shield.castShadow = true; group.add(shield);
      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), armorMat);
      boss.position.set(-0.52, 1.42, 0.40); group.add(boss);
      const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.50, 8), armorMat);
      armR.position.set(0.36, 1.58, 0); armR.rotation.set(0, 0, 0.30); armR.castShadow = true; group.add(armR);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.10, 0.025), armorMat);
      blade.position.set(0.54, 2.22, 0); blade.castShadow = true; group.add(blade);
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.06), armorMat);
      guard.position.set(0.54, 1.64, 0); group.add(guard);
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6), armorMat);
      grip.position.set(0.54, 1.74, 0); group.add(grip);
      const knightNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.13, 0.18, 10), armorMat);
      knightNeck.position.y = 1.83; knightNeck.castShadow = true; group.add(knightNeck);
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), armorMat);
      helm.scale.set(1, 1.15, 1); helm.position.y = 2.08; helm.castShadow = true; group.add(helm);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.08), armorMat);
      visor.position.set(0, 2.02, 0.20); group.add(visor);
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.04, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }));
      slit.position.set(0, 2.04, 0.24); group.add(slit);
      const plume = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.18), armorMat);
      plume.position.set(0, 2.42, 0); group.add(plume);
      group.userData.spawnLabel = "Knight";
      break;
    }

    default:
      break;
  }

  this.scene.add(group);
  return group;
}

export function dispose() {
  this.memoryStations.forEach((stationData) => {
    this.disposeStationTextures(stationData.textures);
  });
  this.memoryStations = [];

  this.groundTexture?.dispose?.();
  this.groundTexture = null;

  this.mistTexture?.dispose?.();
  this.mistTexture = null;
}
