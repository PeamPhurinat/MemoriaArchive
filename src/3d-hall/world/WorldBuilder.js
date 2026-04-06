// Mixin imports — each file exports plain functions that are assigned
// to WorldBuilder.prototype below, keeping the class shell small.
import { createMuseumHall, updateMuseumConstraints } from "./mixins/museumHall.js";
import {
  createGround, createSkyHalo, createSkyMist,
  createBrokenColumns, createStandingPillars, createRomanColumn,
  createTimelineTrail, createFloatingRuinFragments,
  createDreamParticles, createGlitterStars,
  createSpawnableObject, dispose,
} from "./mixins/environment.js";
import {
  createMemoryMonoliths, createMemoryStationTextures,
  updatePanelTexture, resizeReadablePanel,
  applyMediaFrameAspect, applyPhotoFrameAspect, applyVideoFrameAspect,
  updatePanelTint, disposeStationTextures,
} from "./mixins/memoryMonoliths.js";
import {
  getMemoryThemeColors, getReadablePanelTint,
  refreshGroundTexture, refreshMistTexture, applyThemeVisuals,
} from "./mixins/themeVisuals.js";

export class WorldBuilder {
  constructor({
    scene,
    animatedObjects,
    pulseLights,
    world,
    registerCustomizableComponent,
    memoriesData = null,
  }) {
    this.scene = scene;
    this.animatedObjects = animatedObjects;
    this.pulseLights = pulseLights;
    this.world = world;
    this.registerCustomizableComponent = registerCustomizableComponent;
    this.memoriesData = memoriesData;
    this.memoryStations = [];
    this.activeThemeKey = "dream";
    this.groundMesh = null;
    this.groundTexture = null;
    this.mistTexture = null;
    this.mistMaterials = [];
  }

  buildAll(memoriesData = this.memoriesData) {
    this.memoriesData = memoriesData;
    this.createMuseumHall();
    this.createGround();
    this.createSkyHalo();
    this.createSkyMist();
    // this.createBrokenColumns();
    // this.createStandingPillars();
    this.createTimelineTrail();
    this.createMemoryMonoliths(memoriesData);
    this.createFloatingRuinFragments();
    this.createDreamParticles();
    this.createGlitterStars();
  }
}

// Assign all mixin methods to prototype
Object.assign(WorldBuilder.prototype, {
  // Museum hall
  createMuseumHall,
  updateMuseumConstraints,
  // Environment
  createGround,
  createSkyHalo,
  createSkyMist,
  createBrokenColumns,
  createStandingPillars,
  createRomanColumn,
  createTimelineTrail,
  createFloatingRuinFragments,
  createDreamParticles,
  createGlitterStars,
  createSpawnableObject,
  dispose,
  // Memory monoliths
  createMemoryMonoliths,
  createMemoryStationTextures,
  updatePanelTexture,
  resizeReadablePanel,
  applyMediaFrameAspect,
  applyPhotoFrameAspect,
  applyVideoFrameAspect,
  updatePanelTint,
  disposeStationTextures,
  // Theme visuals
  getMemoryThemeColors,
  getReadablePanelTint,
  refreshGroundTexture,
  refreshMistTexture,
  applyThemeVisuals,
});
