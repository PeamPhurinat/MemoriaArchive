/**
 * Records the WebGL canvas using the MediaRecorder API and
 * triggers a file download when stopped.
 */
export class WalkthroughRecorder {
  constructor() {
    this._recorder = null;
    this._chunks = [];
    this._mimeType = '';
    this.isRecording = false;
  }

  /**
   * Begin capturing frames from the given canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {number} fps
   * @param {number} bitsPerSecond
   */
  start(canvas, fps = 30, bitsPerSecond = 8_000_000) {
    if (this.isRecording) return;

    if (typeof canvas.captureStream !== 'function') {
      console.warn('[WalkthroughRecorder] captureStream is not supported in this browser.');
      return;
    }

    const stream = canvas.captureStream(fps);
    this._chunks = [];

    // Pick best supported format
    const candidates = [
      'video/mp4;codecs=avc1',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    this._mimeType = candidates.find((t) => {
      try { return MediaRecorder.isTypeSupported(t); } catch { return false; }
    }) ?? '';

    try {
      this._recorder = new MediaRecorder(stream, {
        mimeType: this._mimeType,
        videoBitsPerSecond: bitsPerSecond,
      });
    } catch {
      this._recorder = new MediaRecorder(stream);
      this._mimeType = this._recorder.mimeType;
    }

    this._recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this._chunks.push(e.data);
    };

    this._recorder.start(100); // collect a chunk every 100 ms
    this.isRecording = true;
  }

  /**
   * Stop recording and download the result.
   * @param {string} filename  (without extension)
   * @returns {Promise<void>}
   */
  stop(filename = 'memoria-walkthrough') {
    if (!this.isRecording || !this._recorder) return Promise.resolve();

    return new Promise((resolve) => {
      this._recorder.onstop = () => {
        const ext = this._mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(this._chunks, { type: this._mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.isRecording = false;
        this._recorder = null;
        this._chunks = [];
        resolve();
      };

      this._recorder.stop();
    });
  }

  /**
   * Stop recording and discard all captured data (no download).
   */
  cancel() {
    if (!this.isRecording || !this._recorder) return;

    this._recorder.onstop = () => {
      this.isRecording = false;
      this._recorder = null;
      this._chunks = [];
    };
    this._recorder.stop();
  }
}
