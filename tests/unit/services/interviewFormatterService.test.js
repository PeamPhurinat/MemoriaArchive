/**
 * Unit tests for interviewFormatterService.js
 * Tests the buildRoomPayload function that converts AI memory cards
 * into the structured payload used by the 3D memory hall.
 */

const { buildRoomPayload } = require('../../../server/src/services/interviewFormatterService');

describe('interviewFormatterService', () => {
  describe('buildRoomPayload', () => {

    test('should return empty slots when no cards are provided', () => {
      const result = buildRoomPayload([]);

      expect(result.textSlots).toHaveLength(0);
      expect(result.photoSlots).toHaveLength(0);
      expect(result.audioSlots).toHaveLength(0);
      expect(result.ordering).toHaveLength(0);
    });

    test('should return empty slots when called with no argument', () => {
      const result = buildRoomPayload();

      expect(result.textSlots).toHaveLength(0);
      expect(result.ordering).toHaveLength(0);
    });

    test('should convert a valid memory card into a text slot', () => {
      const cards = [
        {
          title: 'First Date',
          description: 'We met at a coffee shop.',
          emotion: 'Happy',
          sourceQuote: 'That was the best coffee I ever had.',
        },
      ];

      const result = buildRoomPayload(cards);

      expect(result.textSlots).toHaveLength(1);
      expect(result.textSlots[0].id).toBe('text-1');
      expect(result.textSlots[0].title).toBe('First Date');
      expect(result.textSlots[0].text).toContain('We met at a coffee shop.');
      expect(result.textSlots[0].text).toContain('Emotion: Happy');
      expect(result.textSlots[0].sourceQuote).toBe('That was the best coffee I ever had.');
    });

    test('should include emotion note in text when emotion is provided', () => {
      const cards = [{ title: 'Memory', description: 'A great day.', emotion: 'Joyful' }];
      const result = buildRoomPayload(cards);

      expect(result.textSlots[0].text).toBe('A great day. Emotion: Joyful.');
    });

    test('should not include emotion note when emotion is missing', () => {
      const cards = [{ title: 'Memory', description: 'A quiet evening.' }];
      const result = buildRoomPayload(cards);

      expect(result.textSlots[0].text).toBe('A quiet evening.');
    });

    test('should use fallback title "Memory N" when title is empty', () => {
      const cards = [{ title: '', description: 'Something happened.' }];
      const result = buildRoomPayload(cards);

      expect(result.textSlots[0].title).toBe('Memory 1');
    });

    test('should use fallback description when description is empty', () => {
      const cards = [{ title: 'Valid Title', description: '' }];
      const result = buildRoomPayload(cards);

      expect(result.textSlots[0].text).toBe('No description provided.');
    });

    test('should cap output at 8 slots even when more cards are provided', () => {
      const cards = Array.from({ length: 12 }, (_, i) => ({
        title: `Memory ${i + 1}`,
        description: `Description ${i + 1}`,
      }));

      const result = buildRoomPayload(cards);

      expect(result.textSlots).toHaveLength(8);
      expect(result.ordering).toHaveLength(8);
    });

    test('should filter out cards with no title and no description', () => {
      const cards = [
        { title: '', description: '' },
        { title: 'Valid', description: 'Has content' },
        { title: '   ', description: '   ' },
      ];

      const result = buildRoomPayload(cards);

      expect(result.textSlots).toHaveLength(1);
      expect(result.textSlots[0].title).toBe('Valid');
    });

    test('should trim whitespace from title and description', () => {
      const cards = [
        { title: '  Trimmed Title  ', description: '  Trimmed description.  ' },
      ];

      const result = buildRoomPayload(cards);

      expect(result.textSlots[0].title).toBe('Trimmed Title');
      expect(result.textSlots[0].text).toBe('Trimmed description.');
    });

    test('should build ordering array matching text slot IDs', () => {
      const cards = [
        { title: 'A', description: 'Desc A' },
        { title: 'B', description: 'Desc B' },
        { title: 'C', description: 'Desc C' },
      ];

      const result = buildRoomPayload(cards);

      expect(result.ordering).toEqual(['text-1', 'text-2', 'text-3']);
    });

    test('should set all slots visible in the visibility map', () => {
      const cards = [
        { title: 'A', description: 'Desc A' },
        { title: 'B', description: 'Desc B' },
      ];

      const result = buildRoomPayload(cards);

      expect(result.visibility['text-1']).toBe(true);
      expect(result.visibility['text-2']).toBe(true);
    });

    test('should always return empty photoSlots and audioSlots arrays', () => {
      const cards = [{ title: 'X', description: 'Y' }];
      const result = buildRoomPayload(cards);

      expect(Array.isArray(result.photoSlots)).toBe(true);
      expect(Array.isArray(result.audioSlots)).toBe(true);
      expect(result.photoSlots).toHaveLength(0);
      expect(result.audioSlots).toHaveLength(0);
    });

    test('should handle null or undefined card fields gracefully', () => {
      const cards = [{ title: null, description: undefined, emotion: null }];
      const result = buildRoomPayload(cards);

      // null/undefined normalizes to '' which means both are empty → filtered out
      expect(result.textSlots).toHaveLength(0);
    });

    test('should not throw when called with undefined (uses default parameter)', () => {
      // undefined triggers the default parameter `memoryCards = []`
      expect(() => buildRoomPayload(undefined)).not.toThrow();
      expect(() => buildRoomPayload()).not.toThrow();
    });

    test('should throw when called with null (null bypasses the default parameter)', () => {
      // null is an explicit value — JS default params do not apply, so .map() throws
      expect(() => buildRoomPayload(null)).toThrow();
    });
  });
});
