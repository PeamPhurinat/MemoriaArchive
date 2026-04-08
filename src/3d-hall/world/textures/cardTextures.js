import * as THREE from "three";
import { getTextureThemePalette, roundedRect, wrapText } from "./themePalette.js";

export function createMemoryTexture(title, subtitle, accentColor, themeKey = "dream") {
  void themeKey;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const context = canvas.getContext("2d");

  // White/cream background matching the photo frame aesthetic
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle warm gradient overlay
  const bgGrad = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, "rgba(255,245,252,1)");
  bgGrad.addColorStop(1, "rgba(248,232,244,1)");
  context.fillStyle = bgGrad;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Accent color bar on the left edge
  context.fillStyle = accentColor;
  context.globalAlpha = 0.85;
  context.fillRect(0, 0, 18, canvas.height);
  context.globalAlpha = 1;

  // Thin outer border matching the frame color
  context.strokeStyle = "rgba(200,170,190,0.5)";
  context.lineWidth = 6;
  roundedRect(context, 3, 3, canvas.width - 6, canvas.height - 6, 8);
  context.stroke();

  // "MEMORY" label
  context.fillStyle = accentColor;
  context.font = "700 20px Segoe UI";
  context.globalAlpha = 0.85;
  context.fillText("MEMORY", 46, 80);
  context.globalAlpha = 1;

  // Title — large and bold
  context.fillStyle = "#2a1a28";
  context.font = "700 62px Segoe UI";
  wrapText(context, title, 46, 168, 420, 68);

  // Divider line
  context.strokeStyle = accentColor;
  context.globalAlpha = 0.5;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(46, 300);
  context.lineTo(canvas.width - 46, 300);
  context.stroke();
  context.globalAlpha = 1;

  // Subtitle
  context.fillStyle = "#6b4060";
  context.font = "500 28px Segoe UI";
  wrapText(context, subtitle, 46, 360, 420, 40);

  // Decorative wave lines — softer, matching frame palette
  context.strokeStyle = accentColor;
  context.globalAlpha = 0.18;
  context.lineWidth = 3;
  [480, 540, 600, 660].forEach((y, i) => {
    context.beginPath();
    context.moveTo(46, y);
    context.bezierCurveTo(
      160, y - 34 + i * 4,
      310, y + 34 - i * 3,
      canvas.width - 46, y - 14 + i * 5,
    );
    context.stroke();
  });
  context.globalAlpha = 1;

  // Bottom avatar circle placeholder
  context.fillStyle = accentColor;
  context.globalAlpha = 0.2;
  context.beginPath();
  context.arc(100, 710, 36, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = accentColor;
  context.globalAlpha = 0.5;
  context.fillRect(156, 692, 200, 9);
  context.fillRect(156, 716, 150, 9);
  context.globalAlpha = 1;

  return new THREE.CanvasTexture(canvas);
}

export function createDescriptionTexture(entry, themeKey = "dream") {
  const palette = getTextureThemePalette(themeKey);
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");

  // White background matching photo/video frames
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, "rgba(255,247,253,1)");
  bgGrad.addColorStop(1, "rgba(248,234,244,1)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Accent left bar
  ctx.fillStyle = entry.color;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(0, 0, 16, canvas.height);
  ctx.globalAlpha = 1;

  // Thin border
  ctx.strokeStyle = "rgba(200,170,190,0.45)";
  ctx.lineWidth = 5;
  roundedRect(ctx, 3, 3, canvas.width - 6, canvas.height - 6, 10);
  ctx.stroke();

  // Memory number badge — pill shape, very visible
  const badgeX = 40;
  const badgeY = 28;
  const badgeH = 46;
  const badgeLabel = `#${entry.year}`;
  ctx.font = "700 26px Segoe UI";
  const badgeW = Math.max(80, ctx.measureText(badgeLabel).width + 36);
  ctx.fillStyle = entry.color;
  ctx.globalAlpha = 0.92;
  roundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(badgeLabel, badgeX + 18, badgeY + 33);

  // Title
  ctx.fillStyle = "#2a1a28";
  ctx.font = "700 48px Segoe UI";
  wrapText(ctx, entry.title, 40, 130, 640, 54);

  // Divider
  ctx.strokeStyle = entry.color;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(40, 198);
  ctx.lineTo(canvas.width - 40, 198);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Note / category label
  ctx.fillStyle = entry.color;
  ctx.font = "600 22px Segoe UI";
  ctx.globalAlpha = 0.9;
  ctx.fillText(entry.note, 40, 236);
  ctx.globalAlpha = 1;

  // Description body
  ctx.fillStyle = "#5a3a54";
  ctx.font = "400 26px Segoe UI";
  wrapText(ctx, entry.description, 40, 282, 640, 36);

  // Bottom accent line
  ctx.fillStyle = entry.color;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(40, 382, 120, 7);
  ctx.fillStyle = palette.descriptionLines[1];
  ctx.fillRect(172, 382, 80, 7);
  ctx.globalAlpha = 1;

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

  ctx.strokeStyle = accentColor;
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

  ctx.strokeStyle = accentColor;
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
