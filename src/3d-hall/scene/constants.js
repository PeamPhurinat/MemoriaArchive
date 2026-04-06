// Shared constants for the memory hall scene.

export const LAYOUT_STORAGE_PREFIX  = "memoria-layout-v3";
export const LAYOUT_SCHEMA_VERSION  = 3;
export const ACTIVE_USER_STORAGE_KEY = "memoria-active-user";
export const THEME_STORAGE_KEY      = "memoria-world-theme-v1";
export const AUTO_SAVE_DELAY_MS     = 900;

export const WORLD_THEMES = {
  dream: {
    label: "Dream",
    sceneBackground: 0xc88ab8,
    fogColor: 0xe8b1c7,
    fogDensity: 0.006,
    materialTint: "#ffd8ef",
    materialMix: 0.44,
    emissiveTint: "#ffd8ef",
    emissiveMix: 0.4,
    lightTint: "#ffd8ef",
    lightMix: 0.38,
    lightIntensityMultiplier: 1,
    pulseBaseMultiplier: 1,
    pulseRangeMultiplier: 1,
  },
  midnight: {
    label: "Midnight",
    sceneBackground: 0x151a37,
    fogColor: 0x1f2852,
    fogDensity: 0.009,
    materialTint: "#5e76d9",
    materialMix: 0.68,
    emissiveTint: "#90bbff",
    emissiveMix: 0.66,
    lightTint: "#8ea7ff",
    lightMix: 0.72,
    lightIntensityMultiplier: 0.62,
    pulseBaseMultiplier: 0.58,
    pulseRangeMultiplier: 0.74,
  },
  sunset: {
    label: "Sunset",
    sceneBackground: 0xdf9aa4,
    fogColor: 0xf0b796,
    fogDensity: 0.008,
    materialTint: "#ffbf95",
    materialMix: 0.58,
    emissiveTint: "#ffd1ab",
    emissiveMix: 0.48,
    lightTint: "#ffbe86",
    lightMix: 0.54,
    lightIntensityMultiplier: 0.9,
    pulseBaseMultiplier: 0.94,
    pulseRangeMultiplier: 0.92,
  },
};
