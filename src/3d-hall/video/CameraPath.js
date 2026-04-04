import * as THREE from 'three';

const CAM_HEIGHT = 1.7;
const FRAME_HEIGHT = 4.4;
const STAND_BACK = 8;    // units behind each station the camera stands
const TRAVEL_TIME = 3.5; // seconds flying between stations
const HOLD_TIME = 3;   // seconds pausing at each station

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class CameraPath {
  /**
   * @param {{ x: number, z: number }[]} stationPositions
   * @param {string[]} memoryTitles
   */
  constructor(stationPositions, memoryTitles = []) {
    this.memoryTitles = memoryTitles;
    this._buildSegments(stationPositions);
    this._segmentIndex = 0;
    this._segmentElapsed = 0;
    this._totalElapsed = 0;
    this.isComplete = false;
    this.currentLabel = '';

    /** @type {((index: number, title: string) => void) | null} */
    this.onStationStart = null;
    /** @type {(() => void) | null} */
    this.onComplete = null;
  }

  _camPosForStation(s) {
    return new THREE.Vector3(s.x, CAM_HEIGHT, s.z + STAND_BACK);
  }

  _lookForStation(s) {
    return new THREE.Vector3(s.x, FRAME_HEIGHT, s.z);
  }

  _buildSegments(stations) {
    this._segments = [];

    // Intro: slightly elevated overview position
    let prevPos = new THREE.Vector3(0, 6, 32);
    let prevLook = new THREE.Vector3(0, 4, 0);

    stations.forEach((station, i) => {
      const toPos = this._camPosForStation(station);
      const toLook = this._lookForStation(station);
      const title = this.memoryTitles[i] || `Memory ${i + 1}`;

      // Travel segment
      this._segments.push({
        fromPos: prevPos.clone(),
        fromLook: prevLook.clone(),
        toPos: toPos.clone(),
        toLook: toLook.clone(),
        duration: i === 0 ? TRAVEL_TIME * 0.7 : TRAVEL_TIME,
        type: 'travel',
        title: '',
      });

      // Hold segment
      this._segments.push({
        fromPos: toPos.clone(),
        fromLook: toLook.clone(),
        toPos: toPos.clone(),
        toLook: toLook.clone(),
        duration: HOLD_TIME,
        type: 'hold',
        stationIndex: i,
        title,
      });

      prevPos = toPos.clone();
      prevLook = toLook.clone();
    });

    this.totalDuration = this._segments.reduce((sum, s) => sum + s.duration, 0);
  }

  get progress() {
    return Math.min(this._totalElapsed / this.totalDuration, 1);
  }

  /**
   * Advance camera along the path.
   * @param {number} delta  seconds since last frame
   * @param {THREE.Camera} camera
   */
  update(delta, camera) {
    if (this.isComplete) return;

    const seg = this._segments[this._segmentIndex];
    if (!seg) {
      this.isComplete = true;
      this.onComplete?.();
      return;
    }

    // Fire callbacks on first tick of each segment
    if (this._segmentElapsed === 0) {
      if (seg.type === 'hold') {
        this.currentLabel = seg.title;
        this.onStationStart?.(seg.stationIndex, seg.title);
      } else if (seg.type === 'outro') {
        this.currentLabel = seg.title;
      }
    }

    this._segmentElapsed += delta;
    this._totalElapsed += delta;

    const t = Math.min(this._segmentElapsed / seg.duration, 1);
    const eased = seg.type === 'hold' ? 1 : easeInOutCubic(t);

    // Interpolate camera position
    const pos = new THREE.Vector3().lerpVectors(seg.fromPos, seg.toPos, eased);
    camera.position.copy(pos);

    // Interpolate lookAt target
    const look = new THREE.Vector3().lerpVectors(seg.fromLook, seg.toLook, eased);
    camera.lookAt(look);

    // Advance to next segment when current is done
    if (this._segmentElapsed >= seg.duration) {
      this._segmentIndex++;
      this._segmentElapsed = 0;
      if (this._segmentIndex >= this._segments.length) {
        this.isComplete = true;
        this.onComplete?.();
      }
    }
  }
}
