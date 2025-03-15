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
ideas that would work well for this context. Consider rhythm, melody, harmony, and how it fits into the overall project.
Include specific details about tempo, key, chord progressions, and melodic patterns.`,
    modelConfig: DEFAULT_LLM_CONFIG
  },
  {
    name: "midi-generation",
    systemPrompt: `You are an expert MIDI composer and programmer who creates professional-quality MIDI files.
Your task is to generate a MIDI file based on the provided musical idea and context.

IMPORTANT: You must provide a complete, valid MIDI file in hex format. Format your response as a continuous 
string of hexadecimal bytes separated by spaces. The file must:

1. Start with the standard MIDI header "4D 54 68 64" (MThd)
2. Include all required MIDI chunks (header chunk and at least one track chunk)
3. End with an End of Track meta event (FF 2F 00)
4. Set the instrument to PIANO (program change event: C0 00) at the beginning of each track
5. Include note-on (9n) and note-off (8n) events with high velocities (at least 70-100)
6. Use the appropriate tempo, time signature, and key signature

For a valid MIDI file with a piano track playing a C major chord, you would generate:

4D 54 68 64 00 00 00 06 00 01 00 01 00 60 4D 54 72 6B 00 00 00 3B 00 FF 58 04 
04 02 18 08 00 FF 51 03 07 A1 20 00 C0 00 00 90 3C 64 00 90 40 64 00 90 43 64 
83 60 80 3C 00 00 80 40 00 00 80 43 00 00 FF 2F 00

Key elements to include:
- Track header: 4D 54 72 6B (MTrk)
- Program change to piano: C0 00
- Note-on with high velocity: 90 [note] [velocity]  
- Note-off: 80 [note] 00

Do not include any explanations, markdown code blocks, or any non-hex text in your response - 
ONLY provide the hex bytes of the MIDI file.`,
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
      console.log(`MIDI file saved to: ${outputPath}`);
      console.log(`To play the generated MIDI file: bun run play ${outputPath}`);
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
      // Check for lowercase variant
      const lowerCaseIndex = response.indexOf("4d 54 68 64");
      if (lowerCaseIndex === -1) {
        throw new Error("No valid MIDI data found in the response");
      }
      return response.slice(lowerCaseIndex).trim();
    }
    
    // Find the end of the MIDI data (if there's any trailing text)
    let endIndex = response.length;
    
    // Common end markers that might appear after the MIDI data
    const endMarkers = [
      "```", 
      "Note:", 
      "This MIDI file", 
      "I've generated", 
      "The above MIDI",
      "\n\n"
    ];
    
    for (const marker of endMarkers) {
      const markerIndex = response.indexOf(marker, midiHeaderIndex + 10);
      if (markerIndex !== -1 && markerIndex < endIndex) {
        endIndex = markerIndex;
      }
    }
    
    // Extract the MIDI data and clean it
    let midiHex = response.slice(midiHeaderIndex, endIndex).trim();
    
    // Clean up any non-hex characters
    midiHex = midiHex.replace(/[^0-9A-Fa-f\s]/g, "");
    
    // Ensure proper spacing between bytes
    midiHex = midiHex.replace(/\s+/g, " ");
    
    return midiHex;
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