import { buildTutorSystemPrompt } from '../services/aiService';

describe('buildTutorSystemPrompt', () => {
  it('returns base prompt without subject', () => {
    const prompt = buildTutorSystemPrompt();
    expect(prompt).toContain('friendly, patient, and encouraging AI tutor');
    expect(prompt).toContain('children aged 6-14');
    expect(prompt).not.toContain('current subject is');
  });

  it('includes subject name when provided', () => {
    const prompt = buildTutorSystemPrompt('Math');
    expect(prompt).toContain('The current subject is: Math');
    expect(prompt).toContain('friendly, patient, and encouraging AI tutor');
  });
});
