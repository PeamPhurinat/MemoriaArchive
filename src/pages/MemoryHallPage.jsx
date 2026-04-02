import React, { useEffect, useRef } from 'react';
import { initMemoryHall } from '../3d-hall/memoryHallScene';
import '../3d-hall/style.css';

const buildMemoryHallSlots = (project) => {
  const memories = Array.isArray(project?.memories) ? project.memories : [];
  const textSlots = Array.isArray(project?.textSlots) ? project.textSlots : [];
  const photos = Array.isArray(project?.photos) ? project.photos : [];

  const slotCount = Math.max(memories.length, textSlots.length, photos.length);
  if (slotCount === 0) {
    return null;
  }

  return Array.from({ length: Math.min(slotCount, 5) }, (_, index) => {
    const memory = memories[index] || {};
    const textSlot = textSlots[index] || {};
    const photo = photos[index] || {};

    const title =
      memory?.title ||
      textSlot?.title ||
      photo?.name ||
      `Memory ${index + 1}`;

    const description =
      memory?.description ||
      memory?.text ||
      textSlot?.text ||
      textSlot?.description ||
      'No description provided.';

    return {
      id: memory?.id || textSlot?.id || photo?.id || `memory-slot-${index + 1}`,
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
      photo:
        memory?.photo ||
        memory?.url ||
        textSlot?.photo ||
        textSlot?.url ||
        photo?.url ||
        null,
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
