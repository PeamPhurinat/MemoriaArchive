// Theme-specific colour palettes used by all canvas texture generators.

export function getTextureThemePalette(themeKey = "dream") {
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
      voiceBgStart:    "rgba(22, 30, 64, 0.97)",
      voiceBgEnd:      "rgba(14, 19, 44, 0.98)",
      voiceGlowRing:   "rgba(124, 143, 255, 0.35)",
      voiceAccent:     "#7c8fff",
      voiceAccentFade: "rgba(124, 143, 255, 0.18)",
      voiceAccentMid:  "rgba(124, 143, 255, 0.38)",
      voiceHighlight:  "rgba(200, 216, 255, 0.09)",
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
      voiceBgStart:    "rgba(100, 50, 28, 0.97)",
      voiceBgEnd:      "rgba(68, 30, 14, 0.98)",
      voiceGlowRing:   "rgba(224, 120, 64, 0.35)",
      voiceAccent:     "#e07840",
      voiceAccentFade: "rgba(224, 120, 64, 0.20)",
      voiceAccentMid:  "rgba(224, 120, 64, 0.38)",
      voiceHighlight:  "rgba(255, 230, 200, 0.09)",
    };
  }

  // dream (default)
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
    voiceBgStart:    "rgba(102, 56, 96, 0.97)",
    voiceBgEnd:      "rgba(68, 34, 62, 0.98)",
    voiceGlowRing:   "rgba(212, 122, 170, 0.38)",
    voiceAccent:     "#d47aaa",
    voiceAccentFade: "rgba(212, 122, 170, 0.20)",
    voiceAccentMid:  "rgba(212, 122, 170, 0.38)",
    voiceHighlight:  "rgba(255, 220, 240, 0.10)",
  };
}

export function roundedRect(context, x, y, width, height, radius) {
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

export function wrapText(context, text, x, y, maxWidth, lineHeight) {
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
