export type ModelRole = 'planner' | 'writer' | 'auditor';

interface ModelConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}

export const modelConfigs: Record<ModelRole, ModelConfig> = {
  planner: {
    model: 'deepseek-chat',
    maxTokens: 4096,
    temperature: 0.7,
  },
  writer: {
    model: 'deepseek-chat',
    maxTokens: 8192,
    temperature: 0.8,
  },
  auditor: {
    model: 'deepseek-chat',
    maxTokens: 4096,
    temperature: 0.3,
  },
};

export function getModelConfig(role: ModelRole): ModelConfig {
  return modelConfigs[role];
}
