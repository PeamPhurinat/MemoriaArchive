import './walkthroughExport.css';

/**
 * Manages the walkthrough export UI:
 *  - "Export Video" button (shown in idle state)
 *  - Recording overlay with REC badge, memory title, and progress bar
 */
export class WalkthroughUI {
  constructor() {
    this._button = null;
    this._overlay = null;
    this._recBadge = null;
    this._titleEl = null;
    this._progressFill = null;
    this._stopButton = null;
  }

  /**
   * Mount UI elements into the given container.
   * @param {HTMLElement} container
   * @param {() => void} onExportClick
   */
  mount(container, onExportClick) {
    // ── Export button ─────────────────────────────────────────────
    this._button = document.createElement('button');
    this._button.className = 'wt-export-btn';
    this._button.textContent = '🎬 Export Video';
    this._button.addEventListener('click', onExportClick);
    container.appendChild(this._button);

    // ── Recording overlay ─────────────────────────────────────────
    this._overlay = document.createElement('div');
    this._overlay.className = 'wt-overlay';
    this._overlay.style.display = 'none';

    // REC badge (fixed top-right)
    this._recBadge = document.createElement('div');
    this._recBadge.className = 'wt-rec-badge';
    this._recBadge.innerHTML = '<span class="wt-rec-dot"></span>REC';

    // Memory title
    this._titleEl = document.createElement('div');
    this._titleEl.className = 'wt-title';

    // Progress bar
    const track = document.createElement('div');
    track.className = 'wt-progress-track';
    this._progressFill = document.createElement('div');
    this._progressFill.className = 'wt-progress-fill';
    track.appendChild(this._progressFill);

    this._overlay.appendChild(this._recBadge);
    this._overlay.appendChild(this._titleEl);
    this._overlay.appendChild(track);
    container.appendChild(this._overlay);
  }

  /**
   * Switch between idle (button visible) and recording (overlay visible) states.
   * @param {boolean} active
   */
  setRecording(active) {
    if (this._button) this._button.style.display = active ? 'none' : '';
    if (this._overlay) this._overlay.style.display = active ? 'flex' : 'none';
    if (!active && this._stopButton) {
      this._stopButton.remove();
      this._stopButton = null;
    }
  }

  /**
   * Update the progress bar and label text.
   * @param {number} ratio  0–1
   * @param {string} [label]
   */
  updateProgress(ratio, label) {
    if (this._progressFill) {
      this._progressFill.style.width = `${Math.round(Math.min(ratio, 1) * 100)}%`;
    }
    if (this._titleEl && label !== undefined) {
      this._titleEl.textContent = label;
    }
  }

  /**
   * Show a "Stop & Save Video" button so the user decides when to end recording.
   * @param {() => void} onStop
   */
  showStopButton(onStop) {
    if (this._stopButton) return; // already shown
    this._stopButton = document.createElement('button');
    this._stopButton.className = 'wt-stop-btn';
    this._stopButton.textContent = '⏹ Stop & Save Video';
    this._stopButton.addEventListener('click', () => {
      this._stopButton?.remove();
      this._stopButton = null;
      onStop();
    });
    this._overlay.appendChild(this._stopButton);
  }

  /** Remove all mounted elements. */
  unmount() {
    this._button?.remove();
    this._overlay?.remove();
    this._stopButton?.remove();
  }
}
