import * as THREE from "three";

function getTextureThemePalette(themeKey = "dream") {
  if (themeKey === "midnight") {
    return {
      groundStops: ["#1c2144", "#283161", "#141833"],
      cloudTint: "rgba(134, 160, 255, 0.2)",
      cloudTintFade: "rgba(134, 160, 255, 0)",
      lineTint: "rgba(130, 152, 230, 0.2)",
      speckTint: "rgba(122, 146, 226, 0.18)",
      cardStops: ["#22305a", "#2b3f76", "#1a2749"],
      titleInk: "#e5efff",
      waveInk: "#95acff",
      photoStart: "#253469",
      photoEnd: "#1b2548",
      photoOrb: "rgba(150, 178, 255, 0.38)",
      hillColors: ["rgba(165, 188, 255,0.48)", "rgba(121,151,238,0.56)", "rgba(89,119,200,0.62)"],
      photoTitleInk: "#f0f5fd",
      descriptionStops: ["rgba(19, 25, 54, 0.94)", "rgba(35, 47, 88, 0.94)"],
      descriptionYear: "#d5e4ff",
      descriptionBody: "#e8f1ff",
      descriptionLines: ["rgba(198, 219, 255, 0.86)", "rgba(136, 169, 255, 0.66)"],
      voiceStops: ["rgba(18, 23, 50, 0.95)", "rgba(43, 57, 104, 0.9)"],
      voiceTail: "rgba(33, 44, 82, 0.92)",
      voiceLabel: "#d2e3ff",
      voiceText: "#f4f8ff",
      mistStops: ["rgba(158, 185, 255, 0.5)", "rgba(110, 140, 228, 0.28)", "rgba(110, 140, 228, 0)"],
      mistPuff: "rgba(190, 208, 255, 0.4)",
      panelTint: "#e8f0ff",
    };
  }

  if (themeKey === "sunset") {
    return {
      groundStops: ["#ffe7cb", "#f4bd90", "#d88962"],
      cloudTint: "rgba(255, 190, 140, 0.4)",
      cloudTintFade: "rgba(255, 190, 140, 0)",
      lineTint: "rgba(232, 148, 99, 0.2)",
      speckTint: "rgba(214, 126, 73, 0.18)",
      cardStops: ["#ffe8d1", "#ffcda8", "#e7a072"],
      titleInk: "#7d3f25",
      waveInk: "#d88f66",
      photoStart: "#ffe4cb",
      photoEnd: "#e99d73",
      photoOrb: "rgba(255, 177, 120, 0.38)",
      hillColors: ["rgba(255,237,216,0.66)", "rgba(255,202,158,0.72)", "rgba(241,166,117,0.78)"],
      photoTitleInk: "#7c4226",
      descriptionStops: ["rgba(104, 55, 32, 0.93)", "rgba(156, 92, 57, 0.9)"],
      descriptionYear: "#ffe9d2",
      descriptionBody: "#fff4e8",
      descriptionLines: ["rgba(255, 218, 183, 0.9)", "rgba(234, 155, 104, 0.7)"],
      voiceStops: ["rgba(96, 48, 29, 0.94)", "rgba(156, 92, 57, 0.9)"],
      voiceTail: "rgba(128, 73, 45, 0.9)",
      voiceLabel: "#ffe4c7",
      voiceText: "#fff7ee",
      mistStops: ["rgba(255, 213, 176, 0.52)", "rgba(239, 162, 113, 0.3)", "rgba(239, 162, 113, 0)"],
      mistPuff: "rgba(255, 225, 194, 0.42)",
      panelTint: "#fff0df",
    };
  }

  return {
    groundStops: ["#fff7fc", "#ffe8f4", "#f7dce9"],
    cloudTint: "rgba(255, 216, 239, 0.4)",
    cloudTintFade: "rgba(255, 216, 239, 0)",
    lineTint: "rgba(255, 226, 243, 0.22)",
    speckTint: "rgba(255, 216, 239, 0.18)",
    cardStops: ["#fff7fc", "#ffe4f2", "#f6dce9"],
    titleInk: "#d58eb4",
    waveInk: "#efbfd9",
    photoStart: "#fff8fc",
    photoEnd: "#f7dce9",
    photoOrb: "rgba(255, 216, 239, 0.44)",
    hillColors: ["rgba(255,255,255,0.7)", "rgba(255,228,242,0.78)", "rgba(247,220,233,0.88)"],
    photoTitleInk: "#fff7f7",
    descriptionStops: ["rgba(127, 72, 112, 0.9)", "rgba(88, 48, 85, 0.92)"],
    descriptionYear: "#ffd8ef",
    descriptionBody: "#fff5fb",
    descriptionLines: ["rgba(255, 199, 230, 0.9)", "rgba(198, 156, 214, 0.75)"],
    voiceStops: ["rgba(102, 56, 96, 0.92)", "rgba(138, 76, 104, 0.88)"],
    voiceTail: "rgba(124, 68, 100, 0.9)",
    voiceLabel: "#ffd7ec",
    voiceText: "#fff6fb",
    mistStops: ["rgba(255, 239, 232, 0.55)", "rgba(255, 205, 223, 0.32)", "rgba(255, 205, 223, 0)"],
    mistPuff: "rgba(255, 248, 243, 0.46)",
    panelTint: "#ffffff",
  };
}

export function createGroundTexture(themeKey = "dream") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");

  const palette = getTextureThemePalette(themeKey);
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, palette.groundStops[0]);
  gradient.addColorStop(0.5, palette.groundStops[1]);
  gradient.addColorStop(1, palette.groundStops[2]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < 44; index += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radiusX = 90 + Math.random() * 170;
    const radiusY = 34 + Math.random() * 76;
    const cloud = context.createRadialGradient(x, y, 12, x, y, radiusX);
    cloud.addColorStop(0, "rgba(255, 255, 255, 0.58)");
    cloud.addColorStop(0.38, palette.cloudTint);
    cloud.addColorStop(1, palette.cloudTintFade);
    context.fillStyle = cloud;
    context.beginPath();
    context.ellipse(x, y, radiusX, radiusY, Math.random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  context.strokeStyle = palette.lineTint;
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
    context.fillStyle = index % 2 === 0 ? "rgba(255, 255, 255, 0.22)" : palette.speckTint;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

export function createMemoryTexture(title, subtitle, accentColor, themeKey = "dream") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const context = canvas.getContext("2d");

  const palette = getTextureThemePalette(themeKey);
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, palette.cardStops[0]);
  gradient.addColorStop(0.52, palette.cardStops[1]);
  gradient.addColorStop(1, palette.cardStops[2]);
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

  context.fillStyle = palette.titleInk;
  context.font = "700 22px Segoe UI";
  context.fillText("DREAM MEMORY", 60, 92);

  context.fillStyle = "#ffffff";
  context.font = "700 56px Segoe UI";
  wrapText(context, title, 60, 182, 394, 60);

  context.fillStyle = "#ffffff";
  context.font = "400 28px Segoe UI";
  wrapText(context, subtitle, 60, 326, 380, 42);

  context.strokeStyle = palette.waveInk;
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

  context.fillStyle = "#ffffff";
  context.fillRect(176, 622, 210, 10);
  context.fillRect(176, 648, 166, 10);
  context.fillRect(176, 674, 236, 10);

  return new THREE.CanvasTexture(canvas);
}

export function createPhotoTexture(entry, themeKey = "dream", onPhotoAspectChange = null) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  const palette = getTextureThemePalette(themeKey);
  const texture = new THREE.CanvasTexture(canvas);

  const notifyPhotoAspect = (aspect) => {
    if (!Number.isFinite(aspect) || aspect <= 0) return;
    texture.userData.photoAspect = aspect;
    if (typeof onPhotoAspectChange === "function") {
      onPhotoAspectChange(aspect);
    }
  };

  const drawTitleBadge = ({ text, boxX, boxY, textX, textY, boxHeight, maxBoxWidth }) => {
    const label = (typeof text === "string" ? text.trim() : "") || "Untitled";
    const fontSize = 44;
    context.font = `700 ${fontSize}px Segoe UI`;
    const horizontalPadding = 24;
    const measuredWidth = context.measureText(label).width;
    const badgeWidth = Math.max(180, Math.min(maxBoxWidth, measuredWidth + horizontalPadding * 2));
    context.fillStyle = "rgba(255, 255, 255, 0.29)";
    context.fillRect(boxX, boxY, badgeWidth, boxHeight);
    context.fillStyle = palette.photoTitleInk;
    context.fillText(label, textX, textY, badgeWidth - horizontalPadding * 2);
  };

  const drawBase = () => {
    const widthRatio = canvas.width / 1024;
    const heightRatio = canvas.height / 768;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, palette.photoStart);
    gradient.addColorStop(0.55, entry.color);
    gradient.addColorStop(1, palette.photoEnd);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 0.45;
    context.fillStyle = "rgba(255,255,255,0.55)";
    context.beginPath();
    context.arc(160, 132, 120, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = palette.photoOrb;
    context.beginPath();
    context.arc(780, 210, 180, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
    palette.hillColors.forEach((fill, index) => {
      context.fillStyle = fill;
      context.beginPath();
      context.moveTo(0, (530 + index * 34) * heightRatio);
      context.bezierCurveTo(
        150 * widthRatio, (430 - index * 12) * heightRatio,
        320 * widthRatio, 650 * heightRatio,
        510 * widthRatio, (560 - index * 8) * heightRatio,
      );
      context.bezierCurveTo(
        650 * widthRatio, (500 - index * 10) * heightRatio,
        780 * widthRatio, 720 * heightRatio,
        canvas.width, (540 - index * 4) * heightRatio,
      );
      context.lineTo(canvas.width, canvas.height);
      context.lineTo(0, canvas.height);
      context.closePath();
      context.fill();
    });
    context.strokeStyle = "rgba(255,255,255,0.3)";
    context.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      context.beginPath();
      context.moveTo(64 * widthRatio, (90 + i * 110) * heightRatio);
      context.bezierCurveTo(
        250 * widthRatio, (20 + i * 95) * heightRatio,
        520 * widthRatio, (210 + i * 84) * heightRatio,
        940 * widthRatio, (76 + i * 104) * heightRatio,
      );
      context.stroke();
    }
    drawTitleBadge({ text: entry.title, boxX: 58, boxY: 56, textX: 82, textY: 114, boxHeight: 94, maxBoxWidth: 540 });
  };

  const drawPhoto = (image) => {
    const imageAspect = image.width / image.height;
    const displayAspect = THREE.MathUtils.clamp(imageAspect, 0.9, 2.2);
    const targetWidth = 1024;
    const targetHeight = Math.max(420, Math.round(targetWidth / displayAspect));

    // FIX: Notify aspect FIRST before resizing canvas so the frame geometry
    // updates correctly for all memory slots (not just the first one).
    notifyPhotoAspect(displayAspect);

    // Resize canvas to match image aspect
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw base layer first so background is never blank
    drawBase();

    const frameWidth = canvas.width;
    const frameHeight = canvas.height;

    context.save();
    context.beginPath();
    context.rect(0, 0, frameWidth, frameHeight);
    context.clip();

    // Cover fit: fill frame, crop overflow
    let drawWidth, drawHeight;
    if (imageAspect > frameWidth / frameHeight) {
      drawHeight = frameHeight;
      drawWidth = drawHeight * imageAspect;
    } else {
      drawWidth = frameWidth;
      drawHeight = drawWidth / imageAspect;
    }

    const drawX = (frameWidth - drawWidth) / 2;
    const drawY = (frameHeight - drawHeight) / 2;
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    const overlay = context.createLinearGradient(0, 0, 0, frameHeight);
    overlay.addColorStop(0, "rgba(0,0,0,0.22)");
    overlay.addColorStop(0.25, "rgba(0,0,0,0)");
    overlay.addColorStop(1, "rgba(0,0,0,0.18)");
    context.fillStyle = overlay;
    context.fillRect(0, 0, frameWidth, frameHeight);
    context.restore();

    drawTitleBadge({ text: entry.title, boxX: 30, boxY: 30, textX: 54, textY: 86, boxHeight: 80, maxBoxWidth: 560 });
  };

  const drawPhotoUnavailable = (message = "Image unavailable") => {
    canvas.width = 1024;
    canvas.height = 768;
    drawBase();
    notifyPhotoAspect(canvas.width / canvas.height);
    context.fillStyle = "rgba(40, 24, 42, 0.62)";
    context.fillRect(170, 210, 684, 300);
    context.strokeStyle = "rgba(255, 255, 255, 0.86)";
    context.lineWidth = 3;
    context.strokeRect(170, 210, 684, 300);
    context.fillStyle = "#ffffff";
    context.font = "700 42px Segoe UI";
    context.fillText("No Photo", 410, 342);
    context.font = "500 30px Segoe UI";
    context.fillText(message, 240, 396);
    context.font = "500 20px Segoe UI";
    context.fillStyle = "rgba(255, 255, 255, 0.9)";
    context.fillText("Check image URL / permissions", 322, 440);
  };

  // FIX: Draw base AND immediately notify aspect so all frame geometries
  // are correctly sized from the start — not just memory slot 1.
  drawBase();
  notifyPhotoAspect(canvas.width / canvas.height);
  texture.needsUpdate = true;

  const photoSource =
    typeof entry?.photo === "string" && entry.photo.trim().length > 0
      ? entry.photo.trim() : null;

  if (photoSource) {
    let settled = false;
    const settle = () => { settled = true; };

    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      drawPhotoUnavailable("Image request timed out");
      texture.needsUpdate = true;
      settle();
    }, 8000);

    const image = new Image();
    if (/^https?:\/\//i.test(photoSource)) image.crossOrigin = "anonymous";

    image.onload = () => {
      if (settled) return;
      window.clearTimeout(timeoutId);
      drawPhoto(image);
      texture.needsUpdate = true;
      settle();
    };

    image.onerror = () => {
      if (settled) return;
      window.clearTimeout(timeoutId);
      const loader = new THREE.TextureLoader();
      loader.load(
        photoSource,
        (loadedTexture) => {
          if (settled) { loadedTexture.dispose?.(); return; }
          const loadedImage = loadedTexture.image;
          if (loadedImage?.width && loadedImage?.height) {
            drawPhoto(loadedImage);
            texture.needsUpdate = true;
          } else {
            drawPhotoUnavailable("Could not decode image");
            texture.needsUpdate = true;
          }
          loadedTexture.dispose?.();
          settle();
        },
        undefined,
        () => {
          if (settled) return;
          drawPhotoUnavailable("Could not load image");
          texture.needsUpdate = true;
          settle();
        },
      );
    };
    image.src = photoSource;
  } else {
    drawPhotoUnavailable("Missing image URL");
    texture.needsUpdate = true;
  }

  return texture;
}

export function createDescriptionTexture(entry, themeKey = "dream") {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 420;
  const context = canvas.getContext("2d");

  const palette = getTextureThemePalette(themeKey);
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, palette.descriptionStops[0]);
  gradient.addColorStop(1, palette.descriptionStops[1]);
  context.fillStyle = gradient;
  roundedRect(context, 16, 16, 688, 388, 34);
  context.fill();

  context.strokeStyle = entry.color;
  context.lineWidth = 4;
  roundedRect(context, 16, 16, 688, 388, 34);
  context.stroke();

  context.fillStyle = palette.descriptionYear;
  context.font = "700 24px Segoe UI";
  context.fillText(entry.year, 46, 72);

  context.fillStyle = palette.descriptionBody;
  context.font = "700 38px Segoe UI";
  wrapText(context, entry.title, 46, 126, 480, 44);

  context.fillStyle = palette.descriptionYear;
  context.font = "600 22px Segoe UI";
  context.fillText(entry.note, 46, 192);

  context.fillStyle = palette.descriptionBody;
  context.font = "400 24px Segoe UI";
  wrapText(context, entry.description, 46, 246, 610, 34);

  context.fillStyle = palette.descriptionLines[0];
  context.fillRect(46, 338, 170, 12);
  context.fillStyle = palette.descriptionLines[1];
  context.fillRect(46, 364, 290, 12);
  context.fillRect(356, 364, 122, 12);

  return new THREE.CanvasTexture(canvas);
}

export function createVoiceCloudTexture(text, accentColor, themeKey = "dream") {
  const canvas = document.createElement("canvas");
  canvas.width = 820;
  canvas.height = 440;
  const context = canvas.getContext("2d");

  const palette = getTextureThemePalette(themeKey);
  const bubbleGradient = context.createLinearGradient(0, 0, 0, canvas.height);
  bubbleGradient.addColorStop(0, palette.voiceStops[0]);
  bubbleGradient.addColorStop(1, palette.voiceStops[1]);
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
  context.fillStyle = palette.voiceTail;
  context.fill();
  context.strokeStyle = accentColor;
  context.stroke();

  context.fillStyle = palette.voiceLabel;
  context.font = "600 22px Segoe UI";
  context.fillText("Voice memory", 150, 134);

  context.fillStyle = palette.voiceText;
  context.font = "400 32px Segoe UI";
  wrapText(context, `"${text}"`, 150, 198, 500, 42);

  return new THREE.CanvasTexture(canvas);
}

export function createMistTexture(themeKey = "dream") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  const palette = getTextureThemePalette(themeKey);
  const gradient = context.createRadialGradient(256, 128, 18, 256, 128, 160);
  gradient.addColorStop(0, palette.mistStops[0]);
  gradient.addColorStop(0.45, palette.mistStops[1]);
  gradient.addColorStop(1, palette.mistStops[2]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < 6; index += 1) {
    const x = 70 + index * 72;
    const y = 110 + (index % 2) * 12;
    const puff = context.createRadialGradient(x, y, 10, x, y, 58);
    puff.addColorStop(0, palette.mistPuff);
    puff.addColorStop(1, "rgba(255, 248, 243, 0)");
    context.fillStyle = puff;
    context.beginPath();
    context.arc(x, y, 58, 0, Math.PI * 2);
    context.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

export function createReadablePanel(width, height, texture, options = {}) {
  const group = new THREE.Group();
  const offset = options.offset ?? 0.02;
  const tintColor = options.tintColor ?? getTextureThemePalette(options.themeKey).panelTint;

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: texture,
      color: tintColor,
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
      color: tintColor,
      transparent: true,
      depthWrite: options.depthWrite ?? true,
    }),
  );
  back.position.z = -offset;
  back.rotation.y = Math.PI;
  group.add(back);

  return group;
}

export function createStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  context.translate(64, 64);
  context.fillStyle = "rgba(255,255,255,0.5)";
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
  glow.addColorStop(0, "rgba(255,255,255,0.4)");
  glow.addColorStop(0.45, "rgba(255,255,255,0.2)");
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