const normalizeText = (value) => String(value || "").trim();

const buildRoomPayload = (memoryCards = []) => {
  const normalizedCards = memoryCards
    .map((card) => ({
      title: normalizeText(card?.title),
      description: normalizeText(card?.description),
      emotion: normalizeText(card?.emotion),
      sourceQuote: normalizeText(card?.sourceQuote)
    }))
    .filter((card) => card.title || card.description)
    .slice(0, 8);

  const textSlots = normalizedCards.map((card, index) => {
    const id = `text-${index + 1}`;
    const description = card.description || "No description provided.";
    const emotionNote = card.emotion ? ` Emotion: ${card.emotion}.` : "";
    return {
      id,
      title: card.title || `Memory ${index + 1}`,
      text: `${description}${emotionNote}`.trim(),
      sourceQuote: card.sourceQuote || ""
    };
  });

  const ordering = textSlots.map((slot) => slot.id);
  const visibility = {};
  ordering.forEach((id) => {
    visibility[id] = true;
  });

  return {
    textSlots,
    photoSlots: [],
    audioSlots: [],
    ordering,
    visibility
  };
};

module.exports = {
  buildRoomPayload
};
