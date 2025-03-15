/**
 * MusicGenerationPipeline - Core implementation of the music generation pipeline
 */
import { v4 as uuidv4 } from "uuid";
import { join } from "node:path";
import type { 
  Project, Group, Track, Clip, 
  MusicGenerationConfig, PipelineStageConfig, 
  LLMModelConfig 
} from "./types";
import { callLLM, DEFAULT_LLM_CONFIG } from "./llm";
import { hexToBytes, saveMidiFile } from "./midi";

/**
 * Default stages for the music generation pipeline
 */
const DEFAULT_STAGES: PipelineStageConfig[] = [
  {
    name: "idea-generation",
    systemPrompt: `You are an expert music composer. Your task is to generate creative ideas for a MIDI clip
based on the provided context (project, group, track). Respond with a detailed paragraph describing the musical 
ideas that would work well for this context. Consider rhythm, melody, harmony, and how it fits into the overall project.`,
    modelConfig: DEFAULT_LLM_CONFIG
  },
  {
    name: "midi-generation",
    systemPrompt: `You are an expert MIDI composer. Your task is to generate a MIDI file based on the provided
musical idea and context. Respond with a complete hex dump of a valid MIDI file. The hex dump should be
formatted with bytes separated by spaces. Make sure the MIDI file starts with the header "4D 54 68 64" and
follows the standard MIDI file format. Only include the hex bytes in your response, no explanations or text.`,
    modelConfig: DEFAULT_LLM_CONFIG
  }
];

/**
 * Default configuration for the music generation pipeline
 */
const DEFAULT_CONFIG: MusicGenerationConfig = {
  stages: DEFAULT_STAGES,
  outputDir: "./output",
  maxConcurrentRequests: 2
};

/**
 * Music Generation Pipeline
 */
export class MusicGenerationPipeline {
  private config: MusicGenerationConfig;
  private activeRequests = 0;
  
  constructor(config: Partial<MusicGenerationConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      stages: config.stages || [...DEFAULT_STAGES]
    };
  }
  
  /**
   * Generate a MIDI clip for the given project/group/track/clip
   * 
   * @param project - The music project
   * @param group - The group containing the track
   * @param track - The track containing the clip
   * @param clip - The clip to generate
   * @returns Updated clip with MIDI data
   */
  async generateClip(
    project: Project,
    group: Group,
    track: Track,
    clip: Clip
  ): Promise<Clip> {
    console.log(`Generating clip: ${clip.name}`);
    
    // Build context for the LLM
    const context = this.buildContext(project, group, track, clip);
    
    // Clone the clip to avoid modifying the original
    const updatedClip: Clip = {
      ...clip,
      updatedAt: new Date()
    };
    
    // Wait for capacity if we're at the limit
    await this.waitForCapacity();
    
    try {
      this.activeRequests++;
      
      // Pipeline Stage 1: Generate musical ideas
      const ideaStage = this.config.stages[0];
      if (!ideaStage) {
        throw new Error("Missing idea generation stage in pipeline configuration");
      }
      console.log(`Running stage: ${ideaStage.name}`);
      const idea = await callLLM(
        ideaStage.systemPrompt,
        context,
        ideaStage.modelConfig
      );
      
      // Store the idea in the clip's prompt field
      updatedClip.prompt = idea;
      
      // Pipeline Stage 2: Generate MIDI from the idea
      const midiStage = this.config.stages[1];
      if (!midiStage) {
        throw new Error("Missing MIDI generation stage in pipeline configuration");
      }
      console.log(`Running stage: ${midiStage.name}`);
      const contextWithIdea = `${context}\n\nMusical idea: ${idea}\n\nGenerate a MIDI file for this idea.`;
      const midiHexResponse = await callLLM(
        midiStage.systemPrompt,
        contextWithIdea,
        midiStage.modelConfig
      );
      
      // Extract hex data from the response
      const midiHex = this.extractMidiHex(midiHexResponse);
      updatedClip.midiData = midiHex;
      
      // Convert hex to binary
      const midiBytes = hexToBytes(midiHex);
      updatedClip.rawMidiBytes = midiBytes;
      
      // Save the MIDI file
      const filename = `${clip.id}.mid`;
      const outputPath = join(this.config.outputDir, project.id, group.id, track.id, filename);
      await saveMidiFile(midiBytes, outputPath);
      
      console.log(`Generated clip: ${clip.name}`);
      return updatedClip;
    } catch (error) {
      console.error(`Error generating clip ${clip.name}:`, error);
      throw error;
    } finally {
      this.activeRequests--;
    }
  }
  
  /**
   * Build a context string for the LLM based on the project/group/track/clip
   */
  private buildContext(
    project: Project, 
    group: Group, 
    track: Track, 
    clip: Clip
  ): string {
    return `
PROJECT:
  Name: ${project.name}
  Description: ${project.description || 'N/A'}
  Style: ${project.style || 'N/A'}
  Tempo: ${project.tempo || 'N/A'}
  Key: ${project.key || 'N/A'}
  Time Signature: ${project.timeSignature || 'N/A'}

GROUP:
  Name: ${group.name}
  Role: ${group.role || 'N/A'}
  Description: ${group.description || 'N/A'}

TRACK:
  Name: ${track.name}
  Description: ${track.description || 'N/A'}
  Instrument: ${track.instrument}

CLIP:
  Name: ${clip.name}
  Description: ${clip.description || 'N/A'}
  Start Time: ${clip.startTime}
  Duration: ${clip.duration}
`;
  }
  
  /**
   * Extract MIDI hex data from an LLM response
   */
  private extractMidiHex(response: string): string {
    // Find hex pattern (4D 54 68 64 is MIDI header MThd)
    const midiHeaderIndex = response.indexOf("4D 54 68 64");
    if (midiHeaderIndex === -1) {
      throw new Error("No valid MIDI data found in the response");
    }
    
    return response.slice(midiHeaderIndex).trim();
  }
  
  /**
   * Wait until there's capacity to make more LLM requests
   */
  private async waitForCapacity(): Promise<void> {
    while (this.activeRequests >= this.config.maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  /**
   * Create a new project with default settings
   */
  createProject(name: string, options: Partial<Project> = {}): Project {
    const now = new Date();
    return {
      id: uuidv4(),
      name,
      createdAt: now,
      updatedAt: now,
      groups: [],
      ...options
    };
  }
  
  /**
   * Create a new group within a project
   */
  createGroup(project: Project, name: string, options: Partial<Group> = {}): Group {
    const now = new Date();
    const group: Group = {
      id: uuidv4(),
      name,
      createdAt: now,
      updatedAt: now,
      tracks: [],
      ...options
    };
    
    project.groups.push(group);
    return group;
  }
  
  /**
   * Create a new track within a group
   */
  createTrack(group: Group, name: string, instrument: string, options: Partial<Track> = {}): Track {
    const now = new Date();
    const track: Track = {
      id: uuidv4(),
      name,
      instrument,
      createdAt: now,
      updatedAt: now,
      clips: [],
      ...options
    };
    
    group.tracks.push(track);
    return track;
  }
  
  /**
   * Create a new clip within a track
   */
  createClip(track: Track, name: string, startTime: number, duration: number, options: Partial<Clip> = {}): Clip {
    const now = new Date();
    const clip: Clip = {
      id: uuidv4(),
      name,
      startTime,
      duration,
      createdAt: now,
      updatedAt: now,
      ...options
    };
    
    track.clips.push(clip);
    return clip;
  }
}