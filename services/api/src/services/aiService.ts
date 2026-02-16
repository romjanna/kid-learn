import OpenAI from 'openai';
import { config } from '../config';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

const CHAT_MODEL = 'gpt-4o-mini-2024-07-18';
const EMBEDDING_MODEL = 'text-embedding-3-small';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    input: text,
    model: EMBEDDING_MODEL,
  });
  return response.data[0].embedding;
}

export function createTutorStream(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
) {
  return openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    stream: true,
    max_tokens: 1000,
    temperature: 0.7,
  });
}

export function buildTutorSystemPrompt(subjectName?: string): string {
  return `You are a friendly, patient, and encouraging AI tutor for children aged 6-14.

Rules:
- Explain concepts in simple, age-appropriate language
- Use examples and analogies kids can relate to
- Be encouraging and positive, even when correcting mistakes
- Break complex topics into small, digestible pieces
- Ask follow-up questions to check understanding
- Use short paragraphs and bullet points when helpful
${subjectName ? `- The current subject is: ${subjectName}` : ''}

Never be condescending. Make learning fun!`;
}
