import { deepSeekClient } from '../ai/client.js';
import { writerSystemPrompt } from './prompts/writer.js';

export interface WriterInput {
  assembledPrompt: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export async function streamWrite(
  input: WriterInput
): Promise<ReadableStream<string>> {
  const {
    assembledPrompt,
    temperature = 0.8,
    maxTokens = 4000,
    topP = 0.9,
  } = input;

  const stream = await deepSeekClient.streamChat(
    [
      { role: 'system', content: writerSystemPrompt },
      { role: 'user', content: assembledPrompt },
    ],
    'writer',
    {
      temperature,
      maxTokens,
    }
  );

  return stream;
}
