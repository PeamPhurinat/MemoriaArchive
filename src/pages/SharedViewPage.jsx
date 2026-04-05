import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedProject } from '../services/publicApi';
import { useAuth } from '../context/AuthContext';
import { initMemoryHall } from '../3d-hall/memoryHallScene';
import '../3d-hall/style.css';

const buildMemoryHallSlots = (project) => {
  const memories = Array.isArray(project?.memories) ? project.memories : [];
  const textSlots = Array.isArray(project?.textSlots) ? project.textSlots : [];
  const photos =
    (Array.isArray(project?.photos) && project.photos.length > 0 ? project.photos : null) ||
    (Array.isArray(project?.photoSlots) && project.photoSlots.length > 0 ? project.photoSlots : null) ||
    (Array.isArray(project?.roomPayload?.photoSlots) && project.roomPayload.photoSlots.length > 0
      ? project.roomPayload.photoSlots
      : []);
  const videos = Array.isArray(project?.videos) ? project.videos : [];
  const slotCount = Math.max(memories.length, textSlots.length, photos.length, videos.length);
  if (slotCount === 0) return null;

  const toTrimmedString = (v) => (typeof v === 'string' ? v.trim() : '');
  const isLikelyVideoUrl = (v) => {
    const s = toTrimmedString(v).toLowerCase();
    if (!s) return false;
    if (s.startsWith('data:video/')) return true;
    return /\.(mp4|webm|mov|m4v|ogv|ogg|avi)(\?.*)?(#.*)?$/.test(s);
  };
  const isLikelyImageUrl = (v) => {
    const s = toTrimmedString(v).toLowerCase();
    if (!s) return false;
    if (s.startsWith('data:image/')) return true;
    return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?(#.*)?$/.test(s);
  };
  const isResolvablePhotoUrl = (v) => {
    const s = toTrimmedString(v);
    if (!s) return false;
    if (isLikelyVideoUrl(s)) return false;
    if (isLikelyImageUrl(s)) return true;
    if (/^data:/i.test(s)) return false;
    if (/^blob:/i.test(s)) return true;
    if (/^https?:\/\//i.test(s)) return true;
    if (s.startsWith('/') || s.startsWith('./') || s.startsWith('../')) return true;
    return false;
  };
  const pickFirst = (...candidates) => {
    for (const c of candidates) {
      const t = toTrimmedString(c);
      if (t) return t;
    }
    return null;
  };

  return Array.from({ length: Math.min(slotCount, 5) }, (_, i) => {
    const memory = memories[i] || {};
    const textSlot = textSlots[i] || {};
    const photo = photos[i] || {};
    const video = videos[i] || {};

    const title = memory?.title || textSlot?.title || photo?.name || video?.name || `Memory ${i + 1}`;
    const description =
      memory?.description || memory?.text || textSlot?.text || textSlot?.description || 'No description provided.';

    const photoUrl = toTrimmedString(photo?.url);
    const memoryUrl = toTrimmedString(memory?.url);
    const textSlotUrl = toTrimmedString(textSlot?.url);
    const videoUrl = toTrimmedString(video?.url);

    const resolvedPhoto = pickFirst(
      memory?.photo, memory?.photoUrl, memory?.image, memory?.imageUrl, memory?.imageSrc,
      textSlot?.photo, textSlot?.photoUrl, textSlot?.image, textSlot?.imageUrl, textSlot?.imageSrc,
      photo?.photo, photo?.photoUrl, photo?.image, photo?.imageUrl, photo?.src,
      isResolvablePhotoUrl(photoUrl) ? photoUrl : null,
      isResolvablePhotoUrl(memoryUrl) ? memoryUrl : null,
      isResolvablePhotoUrl(textSlotUrl) ? textSlotUrl : null,
    );
    const resolvedVideo = pickFirst(
      memory?.video, memory?.videoUrl, memory?.videoSrc, memory?.clip, memory?.src,
      textSlot?.video, textSlot?.videoUrl, textSlot?.videoSrc, textSlot?.clip, textSlot?.src,
      video?.video, video?.videoUrl, video?.videoSrc, video?.clip, video?.src,
      isLikelyVideoUrl(memoryUrl) ? memoryUrl : null,
      isLikelyVideoUrl(textSlotUrl) ? textSlotUrl : null,
      isLikelyVideoUrl(videoUrl) ? videoUrl : null,
    );

    return {
      id: memory?.id || textSlot?.id || photo?.id || video?.id || `memory-slot-${i + 1}`,
      year: memory?.year || textSlot?.year || `#${i + 1}`,
      title,
      note: memory?.note || textSlot?.note || 'Memory',
      description,
      text: description,
      voice: memory?.voice || textSlot?.voice || memory?.sourceQuote || textSlot?.sourceQuote || description,
      photo: resolvedPhoto,
      video: resolvedVideo,
    };
  });
};

const SharedViewPage = () => {
  const { projectId } = useParams();
  const containerRef = useRef(null);
  const { user } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState('');
  const projectRef = useRef(null);
  const isOwnerRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getSharedProject(projectId)
      .then((project) => {
        if (cancelled) return;
        if (!project) {
          setStatus('error');
          setErrorMsg('This memory archive is not available.');
          return;
        }
        projectRef.current = project;
        isOwnerRef.current = Boolean(user?.id && user.id === project.ownerId);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setErrorMsg(err?.message || 'Failed to load memory archive.');
      });
    return () => { cancelled = true; };
  }, [projectId, user?.id]);

  useEffect(() => {
    if (status !== 'ready') return;
    const container = containerRef.current;
    if (!container) return;

    const isOwner = isOwnerRef.current;
    const memoriesData = buildMemoryHallSlots(projectRef.current);
    const cleanup = initMemoryHall(container, memoriesData, {
      projectId,
      userId: isOwner ? user?.id || '' : '',
      readOnly: !isOwner,
    });

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [status, projectId]);

  if (status === 'loading') {
    return (
      <div className="ma-auth-page">
        <div className="ma-auth-card">Loading memory archive...</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="ma-auth-page">
        <div className="ma-auth-card">{errorMsg}</div>
      </div>
    );
  }

  return <div ref={containerRef} className="memory-hall-root" />;
};

export default SharedViewPage;
