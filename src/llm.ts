/**
 * LLM interface wrapper for the music generation pipeline
 */
import { generate } from "bunlib";
import type { LLMModelConfig } from "./types";
import { config as loadEnv } from "dotenv";

// Load environment variables
loadEnv();

// Get provider and model from environment or use defaults
const envProvider = process.env.LLM_PROVIDER || "anthropic";
const envModel = process.env.LLM_MODEL || "claude-3-7-sonnet-20250219";

// Default LLM providers/models mapping
const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  "anthropic": "claude-3-7-sonnet-20250219",
  "openai": "gpt-4-turbo",
  "mistral": "mistral-large-latest",
  "gemini": "gemini-1.5-pro-latest",
  "ollama": "llama3",
  "deepseek": "deepseek-coder",
  "vertex": "gemini-1.5-pro"
};

// Get the default model for a provider
function getDefaultModelForProvider(provider: string): string {
  return PROVIDER_DEFAULT_MODELS[provider] || "unknown-model";
}

// Default LLM configuration
export const DEFAULT_LLM_CONFIG: LLMModelConfig = {
  provider: envProvider,
  model: envModel || getDefaultModelForProvider(envProvider)
};

// Maximum retries for LLM calls
const MAX_RETRIES = 3; 
// Retry backoff in ms
const RETRY_BACKOFF = 1000;

/**
 * Call an LLM with retries and error handling
 * 
 * @param systemPrompt - System prompt that defines the LLM role/behavior
 * @param userPrompt - User prompt with the specific request
 * @param modelConfig - LLM provider and model configuration
 * @param options - Additional options like temperature, max tokens, etc.
 * @returns Text response from the LLM
 */
export async function callLLM(
  systemPrompt: string, 
  userPrompt: string,
  modelConfig: LLMModelConfig = DEFAULT_LLM_CONFIG,
  options: Record<string, any> = {}
): Promise<string> {
  let retries = 0;
  let lastError: Error | null = null;
  
  // Add default options if not provided
  const finalOptions = {
    temperature: 0.7,
    maxTokens: 2048,
    ...options
  };
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`LLM call to ${modelConfig.provider}/${modelConfig.model}`);
      const response = await generate(systemPrompt, userPrompt, modelConfig, finalOptions);
      return response.text;
    } catch (error) {
      lastError = error as Error;
      retries++;
      console.error(`LLM call failed (attempt ${retries}/${MAX_RETRIES}):`, error);
      
      // Only wait if we're going to retry
      if (retries < MAX_RETRIES) {
        // Exponential backoff
        const backoff = RETRY_BACKOFF * Math.pow(2, retries - 1);
        console.log(`Retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }
  
  // If we get here, all retries failed
  throw new Error(`LLM call failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * Test the LLM connection with a simple prompt
 * 
 * @param modelConfig - LLM provider and model configuration
 * @returns True if connection successful, false otherwise
 */
export async function testLLMConnection(
  modelConfig: LLMModelConfig = DEFAULT_LLM_CONFIG
): Promise<boolean> {
  try {
    // Show which model we're using
    console.log(`LLM test using ${modelConfig.provider}/${modelConfig.model}`);
    
    const response = await callLLM(
      "You are a helpful assistant.", 
      "Say hello and confirm that you're working.",
      modelConfig
    );
    console.log("LLM test response:", response);
    return true;
  } catch (error) {
    console.error("LLM connection test failed:", error);
    return false;
  }
}