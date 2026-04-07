/**
 * Unit tests for sttService.js
 * Tests the transcribeAudio function which calls OpenAI's
 * audio transcription API. External dependencies are mocked.
 */

jest.mock('openai/uploads', () => ({
  toFile: jest.fn(),
}));

jest.mock('../../../server/src/config/env', () => ({
  sttModel: 'gpt-4o-mini-transcribe',
}));

jest.mock('../../../server/src/services/openaiClient', () => ({
  client: {
    audio: {
      transcriptions: {
        create: jest.fn(),
      },
    },
  },
  assertOpenAiKey: jest.fn(),
}));

const { toFile } = require('openai/uploads');
const { client, assertOpenAiKey } = require('../../../server/src/services/openaiClient');
const { transcribeAudio } = require('../../../server/src/services/sttService');

describe('sttService', () => {
  const mockBuffer = Buffer.from('fake audio data');
  const mockFile = { name: 'recording.webm' };

  beforeEach(() => {
    jest.clearAllMocks();
    toFile.mockResolvedValue(mockFile);
  });

  describe('transcribeAudio', () => {

    test('should return trimmed transcript text on success', async () => {
      client.audio.transcriptions.create.mockResolvedValue({ text: '  Hello world.  ' });

      const result = await transcribeAudio({
        buffer: mockBuffer,
        originalName: 'recording.webm',
        mimeType: 'audio/webm',
      });

      expect(result).toBe('Hello world.');
    });

    test('should call assertOpenAiKey before making the API call', async () => {
      client.audio.transcriptions.create.mockResolvedValue({ text: 'ok' });

      await transcribeAudio({ buffer: mockBuffer });

      expect(assertOpenAiKey).toHaveBeenCalledTimes(1);
    });

    test('should call toFile with the provided buffer and filename', async () => {
      client.audio.transcriptions.create.mockResolvedValue({ text: 'ok' });

      await transcribeAudio({
        buffer: mockBuffer,
        originalName: 'voice.webm',
        mimeType: 'audio/webm',
      });

      expect(toFile).toHaveBeenCalledWith(
        mockBuffer,
        'voice.webm',
        { type: 'audio/webm' }
      );
    });

    test('should use default filename "recording.webm" when originalName is not provided', async () => {
      client.audio.transcriptions.create.mockResolvedValue({ text: 'ok' });

      await transcribeAudio({ buffer: mockBuffer, mimeType: 'audio/webm' });

      expect(toFile).toHaveBeenCalledWith(
        mockBuffer,
        'recording.webm',
        expect.any(Object)
      );
    });

    test('should use default mimeType "audio/webm" when mimeType is not provided', async () => {
      client.audio.transcriptions.create.mockResolvedValue({ text: 'ok' });

      await transcribeAudio({ buffer: mockBuffer });

      expect(toFile).toHaveBeenCalledWith(
        mockBuffer,
        expect.any(String),
        { type: 'audio/webm' }
      );
    });

    test('should pass language to the API when provided', async () => {
      client.audio.transcriptions.create.mockResolvedValue({ text: 'สวัสดี' });

      await transcribeAudio({
        buffer: mockBuffer,
        originalName: 'thai.webm',
        mimeType: 'audio/webm',
        language: 'th',
      });

      expect(client.audio.transcriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'th' })
      );
    });

    test('should NOT include language key when language is not provided', async () => {
      client.audio.transcriptions.create.mockResolvedValue({ text: 'ok' });

      await transcribeAudio({ buffer: mockBuffer });

      const callArg = client.audio.transcriptions.create.mock.calls[0][0];
      expect(callArg).not.toHaveProperty('language');
    });

    test('should return empty string when API returns no text', async () => {
      client.audio.transcriptions.create.mockResolvedValue({ text: '' });

      const result = await transcribeAudio({ buffer: mockBuffer });

      expect(result).toBe('');
    });

    test('should throw a sanitized error with status when OpenAI API fails', async () => {
      const providerError = new Error('invalid api_key');
      providerError.status = 401;

      client.audio.transcriptions.create.mockRejectedValue(providerError);

      await expect(
        transcribeAudio({ buffer: mockBuffer })
      ).rejects.toMatchObject({
        message: expect.stringContaining('OpenAI STT error:'),
        status: 401,
      });
    });

    test('should redact API keys from error messages', async () => {
      const providerError = new Error('invalid key: sk-abc123XYZ456DEF789GHI012');
      providerError.status = 401;
      providerError.error = { message: 'invalid key: sk-abc123XYZ456DEF789GHI012' };

      client.audio.transcriptions.create.mockRejectedValue(providerError);

      await expect(
        transcribeAudio({ buffer: mockBuffer })
      ).rejects.toMatchObject({
        message: expect.not.stringContaining('sk-abc123XYZ456DEF789GHI012'),
      });
    });

    test('should use status 502 as fallback when provider error has no status', async () => {
      const providerError = new Error('network error');
      // No .status property
      client.audio.transcriptions.create.mockRejectedValue(providerError);

      await expect(
        transcribeAudio({ buffer: mockBuffer })
      ).rejects.toMatchObject({ status: 502 });
    });
  });
});
