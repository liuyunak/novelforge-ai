import { getModelConfig, type ModelRole } from './models.js';

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_TIMEOUT = 30000;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface ChatCompletionResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = baseUrl || process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL;

    if (!this.apiKey) {
      console.warn('DEEPSEEK_API_KEY is not set. AI calls will fail.');
    }
  }

  async chat(
    messages: ChatMessage[],
    role: ModelRole,
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResult> {
    const config = getModelConfig(role);
    const model = options.model || config.model;
    const temperature = options.temperature ?? config.temperature;
    const maxTokens = options.maxTokens || config.maxTokens;
    const timeout = options.timeout || DEFAULT_TIMEOUT;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`DeepSeek API call timed out after ${timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async streamChat(
    messages: ChatMessage[],
    role: ModelRole,
    options: ChatCompletionOptions = {}
  ): Promise<ReadableStream<string>> {
    const config = getModelConfig(role);
    const model = options.model || config.model;
    const temperature = options.temperature ?? config.temperature;
    const maxTokens = options.maxTokens || config.maxTokens;
    const timeout = options.timeout || DEFAULT_TIMEOUT;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      clearTimeout(timeoutId);
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      clearTimeout(timeoutId);
      throw new Error('No response body from DeepSeek API');
    }

    const streamReader = reader;
    const decoder = new TextDecoder();
    let buffer = '';
    let streamComplete = false;

    const stream = new ReadableStream<string>({
      start(controller) {
        async function read() {
          try {
            const { done, value } = await streamReader.read();
            if (done) {
              streamComplete = true;
              clearTimeout(timeoutId);
              controller.close();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;

              const data = trimmed.slice(6);
              if (data === '[DONE]') {
                streamComplete = true;
                clearTimeout(timeoutId);
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(content);
                }
              } catch {
                // ignore parse errors for individual chunks
              }
            }

            read();
          } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
              controller.error(new Error(`DeepSeek API stream timed out after ${timeout}ms`));
            } else {
              controller.error(error);
            }
          }
        }

        read();
      },
      cancel() {
        if (!streamComplete) {
          clearTimeout(timeoutId);
          controller.abort();
          streamReader.cancel();
        }
      },
    });

    return stream;
  }
}

export const deepSeekClient = new DeepSeekClient();
