/**
 * Core types for the music generation system
 */

/**
 * Base interface for all context objects
 */
export interface BaseContext {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project - Top level container for music generation
 */
export interface Project extends BaseContext {
  style?: string;
  tempo?: number;
  key?: string;
  timeSignature?: string;
  groups: Group[];
}

/**
 * Group - Collection of related tracks (e.g. rhythm section, melody, etc.)
 */
export interface Group extends BaseContext {
  role?: string; // e.g. "rhythm", "melody", "harmony"
  tracks: Track[];
}

/**
 * Track - Individual instrument track
 */
export interface Track extends BaseContext {
  instrument: string;
  clips: Clip[];
}

/**
 * Clip - Segment of MIDI data
 */
export interface Clip extends BaseContext {
  startTime: number; // Start time in beats
  duration: number; // Duration in beats
  midiData?: string; // Hex string representation of MIDI data
  rawMidiBytes?: Uint8Array; // Binary MIDI data
  prompt?: string; // Generation prompt if using LLM
}

/**
 * LLM model configuration
 */
export interface LLMModelConfig {
  provider: string;
  model: string;
}

/**
 * Pipeline stage configuration
 */
export interface PipelineStageConfig {
  name: string;
  systemPrompt: string;
  modelConfig: LLMModelConfig;
}

/**
 * Music generation pipeline configuration
 */
export interface MusicGenerationConfig {
  stages: PipelineStageConfig[];
  outputDir: string;
  maxConcurrentRequests: number;
  debug?: boolean; // Enable debug mode to log LLM inputs/outputs
}