import * as THREE from "three";
import { getTextureThemePalette } from "./themePalette.js";

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
    const displayAspect = THREE.MathUtils.clamp(imageAspect, 0.741, 2.2);

    // Do not resize canvas after CanvasTexture is allocated on GPU —
    // use fixed size 1024x768 and draw the image to fit.
    canvas.width = 1024;
    canvas.height = 768;

    drawBase();
    notifyPhotoAspect(displayAspect);

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

  // Draw base immediately and notify aspect so all frame geometries are correctly
  // sized from the start — not just memory slot 1.
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
