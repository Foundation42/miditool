/**
 * Declaration file for bunlib to fix type issues
 */

declare module 'bunlib' {
  export type LLMProvider =
    | "openai"
    | "anthropic"
    | "gemini"
    | "vertex"
    | "deepseek"
    | "mistral"
    | "ollama";

  export interface LLMConfig {
    provider: LLMProvider | string;
    model: string;
    systemPrompt?: string;
  }

  export interface LLMOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    stream?: boolean;
    systemPrompt?: string;
    model?: string;
    stripThink?: boolean;
    [key: string]: any;
  }

  export interface LLMResponse {
    text: string;
  }

  export function generate(
    systemPrompt: string,
    userPrompt: string, 
    modelConfig: LLMConfig,
    options?: LLMOptions
  ): Promise<LLMResponse>;
}