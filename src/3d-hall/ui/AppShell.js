export class AppShell {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.render();
    this.cacheElements();
  }

  render() {
    // Inject into a dedicated child div so React's ownership of rootElement
    // is never broken — avoids "removeChild: not a child" on unmount.
    this.mountNode = document.createElement("div");
    this.mountNode.className = "appshell-mount";
    this.rootElement.appendChild(this.mountNode);
    this.mountNode.innerHTML = `
      <div class="overlay">
        <section class="title-card">
          <p class="eyebrow">Memoria Prototype</p>
          <h1>Dream Archive Realm</h1>
          <p>
            A drifting timeline of memories arranged left and right through the
            dream realm. Follow photos, written descriptions, and floating voice
            clouds step by step through the archive.
          </p>
        </section>
        <button class="back-to-project" type="button">Back to Project</button>
        <button class="launch" type="button">Enter the realm</button>
        <button class="menu-toggle" type="button" aria-expanded="false">☰ Menu</button>
        <section class="menu-panel" aria-label="World menu">
          <button class="mode-toggle menu-action" type="button" aria-pressed="false">
            <span class="menu-icon" aria-hidden="true">⚙</span>
            <span>Custom Mode</span>
          </button>
          <button class="theme-toggle menu-action" type="button" aria-expanded="false">
            <span class="menu-icon" aria-hidden="true">🖌️</span>
            <span>Select Theme</span>
          </button>
          <div class="theme-picker" aria-label="Theme options">
            <button class="theme-option is-active" type="button" data-theme="dream">
              <span class="theme-preview theme-preview-dream" aria-hidden="true"></span>
              <span>Dream</span>
            </button>
            <button class="theme-option" type="button" data-theme="midnight">
              <span class="theme-preview theme-preview-midnight" aria-hidden="true"></span>
              <span>Midnight</span>
            </button>
            <button class="theme-option" type="button" data-theme="sunset">
              <span class="theme-preview theme-preview-sunset" aria-hidden="true"></span>
              <span>Sunset</span>
            </button>
          </div>
        </section>
        <section class="controls">
          <p>View mode: move with W A S D and look with the mouse. Custom mode: click memory stations to move, resize, or delete them. Changes auto-save per user and project, and you can still use Save/Load manually. Press Esc to unlock. Use the VR button when WebXR is available.</p>
        </section>
        <section class="custom-panel" aria-live="polite">
          <p class="custom-title">Memory Layout Customizer</p>
          <label class="custom-label" for="custom-user-id">User ID</label>
          <input id="custom-user-id" class="custom-user-input" type="text" maxlength="32" placeholder="guest" />
          <div class="custom-actions">
            <button class="tool-move is-active" type="button">Move</button>
            <button class="tool-resize" type="button">Resize</button>
            <button class="tool-delete" type="button">Delete Selected</button>
          </div>
          <label class="custom-label" for="custom-scale">Scale</label>
          <div class="custom-scale-row">
            <input id="custom-scale" class="custom-scale" type="range" min="0.35" max="3" step="0.01" value="1" />
            <span class="custom-scale-value">100%</span>
          </div>
          <div class="custom-actions">
            <button class="tool-save" type="button">Save Layout</button>
            <button class="tool-load" type="button">Load Layout</button>
            <button class="tool-reset" type="button">Reset Layout</button>
          </div>
          <p class="custom-hint">Tip: press E for move, R for resize, and Delete to remove selected memory.</p>
          <p class="custom-status">View mode enabled.</p>
        </section>
        <div class="reticle" aria-hidden="true"></div>
      </div>
    `;
  }

  cacheElements() {
    const q = (sel) => this.mountNode.querySelector(sel);
    this.backButton        = q(".back-to-project");
    this.launchButton      = q(".launch");
    this.menuToggleButton  = q(".menu-toggle");
    this.menuPanel         = q(".menu-panel");
    this.modeToggleButton  = q(".mode-toggle");
    this.themeToggleButton = q(".theme-toggle");
    this.themePicker       = q(".theme-picker");
    this.themeOptionButtons = this.mountNode.querySelectorAll(".theme-option");
    this.customPanel       = q(".custom-panel");
    this.customStatus      = q(".custom-status");
    this.userIdInput       = q(".custom-user-input");
    this.moveButton        = q(".tool-move");
    this.resizeButton      = q(".tool-resize");
    this.deleteButton      = q(".tool-delete");
    this.scaleSlider       = q(".custom-scale");
    this.scaleValue        = q(".custom-scale-value");
    this.saveButton        = q(".tool-save");
    this.loadButton        = q(".tool-load");
    this.resetButton       = q(".tool-reset");
    this.reticle           = q(".reticle");
  }
}
