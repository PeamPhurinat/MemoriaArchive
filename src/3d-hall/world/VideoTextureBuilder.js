import * as THREE from "three";

/**
 * แปลง video source URL ให้เป็น absolute URL ที่ใช้ได้
 */
export function normalizeVideoSource(source) {
  if (typeof source !== "string" || source.trim().length === 0) {
    return null;
  }

  if (/^(https?:|blob:|data:)/i.test(source)) {
    return source;
  }

  const mediaOrigin = process.env.REACT_APP_MEDIA_ORIGIN;
  if (mediaOrigin) {
    return new URL(source, mediaOrigin).toString();
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    if (isLocalHost && source.startsWith("/uploads/")) {
      return `${protocol}//${host}:5000${source}`;
    }
    return new URL(source, window.location.origin).toString();
  }

  return source;
}

/**
 * สร้าง placeholder texture สำหรับ video frame ที่ยังไม่มีวิดีโอ
 */
export function createVideoPlaceholderTexture(title, subtitle) {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 540;
  const context = canvas.getContext("2d");

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#2d2230");
  gradient.addColorStop(1, "#463341");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(255, 255, 255, 0.78)";
  context.lineWidth = 3;
  context.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  context.font = "700 52px Segoe UI";
  context.fillText(title, 60, 250);

  context.fillStyle = "rgba(255, 255, 255, 0.75)";
  context.font = "500 32px Segoe UI";
  context.fillText(subtitle, 60, 310);

  return new THREE.CanvasTexture(canvas);
}

/**
 * สร้าง VideoTexture จาก entry.video URL
 * คืนค่า { videoTexture, videoFallbackTexture }
 */
export function createVideoTexture(entry, onVideoAspectChange = null, onVideoTextureReady = null) {
  const rawVideoSource =
    typeof entry?.video === "string" && entry.video.trim().length > 0
      ? entry.video.trim()
      : null;
  const videoSource = normalizeVideoSource(rawVideoSource);

  const fallbackTexture = createVideoPlaceholderTexture(
    videoSource ? "Video loading..." : "No uploaded video",
    videoSource ? "Waiting for media stream" : "Upload and attach a video in Project Detail",
  );
  fallbackTexture.colorSpace = THREE.SRGBColorSpace;
  fallbackTexture.userData = { mediaAspect: 16 / 9 };

  if (typeof onVideoAspectChange === "function") {
    onVideoAspectChange(16 / 9);
  }

  if (!videoSource) {
    return { videoTexture: fallbackTexture, videoFallbackTexture: fallbackTexture };
  }

  const videoElement = document.createElement("video");
  // crossOrigin ต้อง set ก่อน src
  if (/^https?:\/\//i.test(videoSource)) {
    videoElement.crossOrigin = "anonymous";
  }
  videoElement.loop = true;
  videoElement.muted = true;
  videoElement.autoplay = true;
  videoElement.preload = "auto";
  videoElement.playsInline = true;
  videoElement.setAttribute("playsinline", "");
  videoElement.setAttribute("muted", "");
  videoElement.src = videoSource;

  const videoTexture = new THREE.VideoTexture(videoElement);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.generateMipmaps = false;
  videoTexture.userData = { mediaAspect: 16 / 9, videoElement };

  const notifyAspect = () => {
    if (!videoElement.videoWidth || !videoElement.videoHeight) return;
    const aspect = THREE.MathUtils.clamp(
      videoElement.videoWidth / videoElement.videoHeight,
      1,
      2.4,
    );
    videoTexture.userData.mediaAspect = aspect;
    fallbackTexture.userData.mediaAspect = aspect;
    if (typeof onVideoAspectChange === "function") {
      onVideoAspectChange(aspect);
    }
  };

  const tryPlay = () => {
    const p = videoElement.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };

  let didNotifyReady = false;
  const notifyReady = (texture) => {
    if (didNotifyReady && texture === videoTexture) return;
    if (texture === videoTexture) didNotifyReady = true;
    if (typeof onVideoTextureReady === "function") onVideoTextureReady(texture);
  };

  const handleLoadedMetadata = () => notifyAspect();
  const handleLoadedData = () => { notifyAspect(); notifyReady(videoTexture); };
  const handleCanPlay = () => { notifyAspect(); notifyReady(videoTexture); tryPlay(); };
  const handleError = () => {
    console.warn("[VideoTextureBuilder] Video failed to load:", videoSource);
    notifyReady(fallbackTexture);
  };

  videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
  videoElement.addEventListener("loadeddata", handleLoadedData);
  videoElement.addEventListener("canplay", handleCanPlay);
  videoElement.addEventListener("error", handleError);

  videoTexture.userData.cleanup = () => {
    videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.removeEventListener("loadeddata", handleLoadedData);
    videoElement.removeEventListener("canplay", handleCanPlay);
    videoElement.removeEventListener("error", handleError);
    videoElement.pause();
    videoElement.removeAttribute("src");
    videoElement.load();
  };

  videoElement.load();
  tryPlay();

  return { videoTexture, videoFallbackTexture: fallbackTexture };
}
