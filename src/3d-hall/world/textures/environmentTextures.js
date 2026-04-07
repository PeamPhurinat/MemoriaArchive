import * as THREE from "three";
import { getTextureThemePalette } from "./themePalette.js";

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
