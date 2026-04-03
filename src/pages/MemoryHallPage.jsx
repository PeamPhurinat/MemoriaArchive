import React, { useEffect, useRef } from 'react';
import { initMemoryHall } from '../3d-hall/memoryHallScene';
import '../3d-hall/style.css';

const buildMemoryHallSlots = (project) => {
  const memories = Array.isArray(project?.memories) ? project.memories : [];
  const textSlots = Array.isArray(project?.textSlots) ? project.textSlots : [];
  const photos =
    (Array.isArray(project?.photos) && project.photos.length > 0
      ? project.photos
      : null) ||
    (Array.isArray(project?.photoSlots) && project.photoSlots.length > 0
      ? project.photoSlots
      : null) ||
    (Array.isArray(project?.roomPayload?.photoSlots) && project.roomPayload.photoSlots.length > 0
      ? project.roomPayload.photoSlots
      : []);
  const videos = Array.isArray(project?.videos) ? project.videos : [];

<<<<<<< Updated upstream
  const slotCount = Math.max(memories.length, textSlots.length, photos.length, videos.length);
=======
  const pickMediaUrl = (...candidates) => {
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return null;
  };

  const slotCount = Math.max(memories.length, textSlots.length, photos.length);
>>>>>>> Stashed changes
  if (slotCount === 0) {
    return null;
  }

  const toTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

  const isLikelyVideoUrl = (value) => {
    const source = toTrimmedString(value).toLowerCase();
    if (!source) return false;
    if (source.startsWith('data:video/')) return true;
    return /\.(mp4|webm|mov|m4v|ogv|ogg|avi)(\?.*)?(#.*)?$/.test(source);
  };

  const isLikelyImageUrl = (value) => {
    const source = toTrimmedString(value).toLowerCase();
    if (!source) return false;
    if (source.startsWith('data:image/')) return true;
    return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?(#.*)?$/.test(source);
  };

  const isResolvablePhotoUrl = (value) => {
    const source = toTrimmedString(value);
    if (!source) return false;
    if (isLikelyVideoUrl(source)) return false;
    if (isLikelyImageUrl(source)) return true;
    if (/^data:/i.test(source)) return false;
    if (/^blob:/i.test(source)) return true;
    if (/^https?:\/\//i.test(source)) return true;
    if (source.startsWith('/') || source.startsWith('./') || source.startsWith('../')) return true;
    if (/^[a-zA-Z]:[\\/]/.test(source)) return false;
    return /[\\/]/.test(source);
  };

  const pickFirst = (...candidates) => {
    for (const candidate of candidates) {
      const trimmed = toTrimmedString(candidate);
      if (trimmed) return trimmed;
    }
    return null;
  };

  return Array.from({ length: Math.min(slotCount, 5) }, (_, index) => {
    const memory = memories[index] || {};
    const textSlot = textSlots[index] || {};
    const photo = photos[index] || {};
    const video = videos[index] || {};

    const title =
      memory?.title ||
      textSlot?.title ||
      photo?.name ||
      video?.name ||
      `Memory ${index + 1}`;

    const description =
      memory?.description ||
      memory?.text ||
      textSlot?.text ||
      textSlot?.description ||
      'No description provided.';

    const memoryUrl = toTrimmedString(memory?.url);
    const textSlotUrl = toTrimmedString(textSlot?.url);
    const photoUrl = toTrimmedString(photo?.url);
    const videoUrl = toTrimmedString(video?.url);

    const resolvedPhoto = pickFirst(
      memory?.photo,
      memory?.photoUrl,
      memory?.image,
      memory?.imageUrl,
      memory?.imageSrc,
      textSlot?.photo,
      textSlot?.photoUrl,
      textSlot?.image,
      textSlot?.imageUrl,
      textSlot?.imageSrc,
      photo?.photo,
      photo?.photoUrl,
      photo?.image,
      photo?.imageUrl,
      photo?.src,
      isResolvablePhotoUrl(photoUrl) ? photoUrl : null,
      isResolvablePhotoUrl(memoryUrl) ? memoryUrl : null,
      isResolvablePhotoUrl(textSlotUrl) ? textSlotUrl : null,
    );

    const resolvedVideo = pickFirst(
      memory?.video,
      memory?.videoUrl,
      memory?.videoSrc,
      memory?.clip,
      memory?.src,
      textSlot?.video,
      textSlot?.videoUrl,
      textSlot?.videoSrc,
      textSlot?.clip,
      textSlot?.src,
      video?.video,
      video?.videoUrl,
      video?.videoSrc,
      video?.clip,
      video?.src,
      isLikelyVideoUrl(memoryUrl) ? memoryUrl : null,
      isLikelyVideoUrl(textSlotUrl) ? textSlotUrl : null,
      isLikelyVideoUrl(videoUrl) ? videoUrl : null,
    );

    return {
      id: memory?.id || textSlot?.id || photo?.id || video?.id || `memory-slot-${index + 1}`,
      year: memory?.year || textSlot?.year || `#${index + 1}`,
      title,
      note: memory?.note || textSlot?.note || 'Interview Memory',
      description,
      text: description,
      voice:
        memory?.voice ||
        textSlot?.voice ||
        memory?.sourceQuote ||
        textSlot?.sourceQuote ||
        description,
<<<<<<< Updated upstream
      photo: resolvedPhoto,
      video: resolvedVideo,
=======
      photo:
        pickMediaUrl(
          memory?.photo,
          memory?.url,
          textSlot?.photo,
          textSlot?.url,
          photo?.url
        ),
      video:
        pickMediaUrl(
          memory?.video,
          memory?.videoUrl,
          memory?.videoSrc,
          memory?.clip,
          textSlot?.video,
          textSlot?.videoUrl,
          photo?.video,
          photo?.videoUrl
        ),
>>>>>>> Stashed changes
    };
  });
};

const MemoryHallPage = ({ project }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const memoriesData = buildMemoryHallSlots(project);

const cleanup = initMemoryHall(container, memoriesData);

    return () => {
      if (cleanup) cleanup();
    };
  }, [project]);

  return <div ref={containerRef} className="memory-hall-root" />;
};

export default MemoryHallPage;
