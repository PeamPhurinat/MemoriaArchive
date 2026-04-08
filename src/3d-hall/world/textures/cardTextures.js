import * as THREE from "three";
import { getTextureThemePalette, roundedRect, wrapText } from "./themePalette.js";

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
  const W = 820;
  const H = 440;

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const palette = getTextureThemePalette(themeKey);

  const bx  = 30;
  const by  = 20;
  const bw  = W - 60;
  const bh  = 310;
  const rad = 32;

  ctx.strokeStyle = palette.voiceGlowRing;
  ctx.lineWidth   = 2.5;
  roundedRect(ctx, bx - 6, by - 6, bw + 12, bh + 12, rad + 4);
  ctx.stroke();

  const bodyGrad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  bodyGrad.addColorStop(0, palette.voiceBgStart);
  bodyGrad.addColorStop(1, palette.voiceBgEnd);
  ctx.fillStyle = bodyGrad;
  roundedRect(ctx, bx, by, bw, bh, rad);
  ctx.fill();

  ctx.save();
  roundedRect(ctx, bx, by, bw, bh, rad);
  ctx.clip();
  ctx.fillStyle   = palette.voiceAccent;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(bx, by, 7, bh);
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.fillStyle = palette.voiceHighlight;
  ctx.fillRect(bx + 20, by + 14, 340, 2);

  const labelY = by + 58;
  const iconX  = bx + 38;
  const iconY  = labelY - 10;
  ctx.save();
  ctx.translate(iconX, iconY);
  ctx.fillStyle   = palette.voiceAccent;
  ctx.globalAlpha = 0.88;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(9,  0);
  ctx.lineTo(0,  9);
  ctx.lineTo(-9, 0);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.fillStyle = palette.voiceLabel;
  ctx.font      = "600 20px Segoe UI";
  ctx.fillText("VOICE MEMORY", iconX + 18, labelY);

  ctx.strokeStyle = palette.voiceHighlight;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(bx + 20, by + 76);
  ctx.lineTo(bx + bw - 20, by + 76);
  ctx.stroke();

  ctx.fillStyle = palette.voiceAccentFade;
  ctx.font      = "700 96px Georgia, serif";
  ctx.fillText("\u201C", bx + 24, by + 170);

  ctx.fillStyle = palette.voiceText;
  ctx.font      = "400 30px Segoe UI";
  wrapText(ctx, `\u201C${text}\u201D`, bx + 72, by + 152, bw - 110, 44);

  ctx.fillStyle = palette.voiceAccentFade;
  ctx.font      = "700 96px Georgia, serif";
  ctx.fillText("\u201D", bx + bw - 84, by + bh - 14);

  const dotsY = by + bh - 26;
  const dotsX = bx + 34;
  [[0.70], [0.40], [0.20]].forEach(([alpha], i) => {
    ctx.save();
    ctx.fillStyle   = palette.voiceAccent;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(dotsX + i * 18, dotsY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const tailLeft  = bx + 60;
  const tailRight = bx + 118;
  const tailBaseY = by + bh;
  const tailTipX  = bx + 82;
  const tailTipY  = tailBaseY + 68;

  ctx.fillStyle = palette.voiceBgEnd;
  ctx.beginPath();
  ctx.moveTo(tailLeft,  tailBaseY);
  ctx.lineTo(tailRight, tailBaseY);
  ctx.lineTo(tailTipX,  tailTipY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = palette.voiceGlowRing;
  ctx.lineWidth   = 2;
  ctx.lineJoin    = "round";
  ctx.beginPath();
  ctx.moveTo(tailLeft,  tailBaseY);
  ctx.lineTo(tailTipX,  tailTipY);
  ctx.lineTo(tailRight, tailBaseY);
  ctx.stroke();

  ctx.fillStyle = palette.voiceBgEnd;
  ctx.fillRect(tailLeft - 1, tailBaseY - 3, tailRight - tailLeft + 2, 6);

  return new THREE.CanvasTexture(canvas);
}
