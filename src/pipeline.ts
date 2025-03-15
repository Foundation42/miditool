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
import { validateMidiHex } from "../tools/validate-midi-hex";

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
Your task is to generate a valid MIDI file based on the provided musical idea and context.

CRITICAL INSTRUCTIONS: You MUST provide a complete, valid MIDI file in hex format. Format your response 
as a continuous string of hexadecimal bytes separated by spaces. The file MUST play correctly in standard MIDI players.

Your MIDI file MUST follow these EXACT requirements:
1. Use Format 0 (single track) MIDI file structure for simplicity
2. Start with the standard MIDI header "4D 54 68 64" (MThd)
3. Include EXACTLY one header chunk followed by exactly ONE track chunk
4. Have the track chunk start with "4D 54 72 6B" (MTrk)
5. Set the instrument to PIANO (program change event: C0 00) at the beginning of the track
6. Include time signature (FF 58 04 04 02 18 08) and tempo (FF 51 03 07 A1 20) meta events at the start
7. Use note-on (90 nn 7F) events with velocity 127 (7F) for loudness
8. CRITICAL: For EVERY note-on event, include a matching note-off event (80 nn 00) with the SAME note number
9. Set tempo to 120 BPM using meta event (FF 51 03 07 A1 20)
10. Include 4/4 time signature using meta event (FF 58 04 04 02 18 08)
11. CRITICAL: Use NON-ZERO delta times between note events (do not play all notes simultaneously)
12. End with a proper end-of-track marker (FF 2F 00)

CRITICALLY IMPORTANT TIMING RULES:
- Each delta time MUST begin with a non-zero value (e.g., 60 or 40 or 81 40)
- After each note-on, wait an appropriate duration before the note-off
- The delta time between events determines note timing and must reflect musical rhythms
- Quarter notes should have higher delta time values than eighth notes

For a valid Format 0 MIDI file with a piano track playing a C major scale, follow this EXACT template:

4D 54 68 64 00 00 00 06 00 00 00 01 01 E0 4D 54 72 6B 00 00 00 43 
00 FF 58 04 04 02 18 08 00 FF 51 03 07 A1 20 00 C0 00 00 90 3C 7F 60 
80 3C 00 00 90 3E 7F 60 80 3E 00 00 90 40 7F 60 80 40 00 00 90 41 7F 
60 80 41 00 00 90 43 7F 60 80 43 00 00 90 45 7F 60 80 45 00 00 90 47 
7F 60 80 47 00 00 90 48 7F 60 80 48 00 00 FF 2F 00

Key elements explained:
- 4D 54 68 64 00 00 00 06 00 00 00 01 01 E0: Header chunk (format 0, 1 track, 480 ticks per quarter note)
- 4D 54 72 6B 00 00 00 43: Track header with length (67 bytes)
- 00 FF 58 04 04 02 18 08: Time signature meta event (4/4)
- 00 FF 51 03 07 A1 20: Tempo meta event (120 BPM)
- 00 C0 00: Program change to piano (instrument 0)
- 00 90 3C 7F: Note-on for C4 with velocity 127
- 60: Delta time (96 ticks, a quarter note duration)
- 80 3C 00: Note-off for C4
- (Pattern continues for the scale)
- 00 FF 2F 00: End of track

CRITICALLY IMPORTANT FOR PLAYBACK:
1. Track length MUST be PRECISELY calculated:
   - Count EVERY byte precisely - an error of even 1 byte will break playback
   - Calculate track length by counting all bytes from after the length field to the end of the track
2. Use PROPER delta times - NEVER use 00 for delta time between sequential notes
3. ALWAYS pair each note-on with a note-off for the SAME note number
4. Maintain chronological order of events (note-on → delta time → note-off → delta time → next note-on)
5. Include a proper end-of-track marker (FF 2F 00) at the end

IMPORTANT FOR COUNTING TRACK BYTES:
- Count all bytes after the track length field up to and including the end-of-track marker
- Double-check your byte counting before responding!

FOLLOW THIS TEMPLATE EXACTLY - This is a known good MIDI format that plays correctly in all players.`,
    modelConfig: DEFAULT_LLM_CONFIG
  }
];

/**
 * Default configuration for the music generation pipeline
 */
const DEFAULT_CONFIG: MusicGenerationConfig = {
  stages: DEFAULT_STAGES,
  outputDir: "./output",
  maxConcurrentRequests: 2,
  debug: false
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
   * Uses a single-phase approach (idea generation followed by MIDI generation)
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
      
      // Prepare debug paths if debug mode is enabled
      let ideaLogPath;
      if (this.config.debug) {
        ideaLogPath = join(
          this.config.outputDir, 
          project.id, 
          group.id, 
          track.id, 
          `${clip.id}_idea_stage.log`
        );
        console.log(`Debug mode enabled, logging to ${ideaLogPath}`);
      }
      
      const idea = await callLLM(
        ideaStage.systemPrompt,
        context,
        ideaStage.modelConfig,
        {
          debug: this.config.debug,
          logPath: ideaLogPath
        }
      );
      
      // Store the idea in the clip's prompt field
      updatedClip.prompt = idea;
      
      // Pipeline Stage 2: Generate MIDI from the idea
      const midiStage = this.config.stages[1];
      if (!midiStage) {
        throw new Error("Missing MIDI generation stage in pipeline configuration");
      }
      console.log(`Running stage: ${midiStage.name}`);
      
      // Prepare MIDI debug path
      let midiLogPath;
      if (this.config.debug) {
        midiLogPath = join(
          this.config.outputDir, 
          project.id, 
          group.id, 
          track.id, 
          `${clip.id}_midi_stage.log`
        );
      }
      
      const contextWithIdea = `${context}\n\nMusical idea: ${idea}\n\nGenerate a MIDI file for this idea.`;
      const midiHexResponse = await callLLM(
        midiStage.systemPrompt,
        contextWithIdea,
        midiStage.modelConfig,
        {
          debug: this.config.debug,
          logPath: midiLogPath
        }
      );
      
      // Extract hex data from the response
      const midiHex = this.extractMidiHex(midiHexResponse);
      updatedClip.midiData = midiHex;
      
      // Debug log the MIDI hex data
      const debugPath = join(this.config.outputDir, project.id, group.id, track.id, `${clip.id}_hex_log.txt`);
      await this.saveMidiDebugInfo(midiHexResponse, midiHex, debugPath);
      console.log(`Raw LLM response saved to: ${debugPath}`);
      
      // Basic structural validation
      if (!midiHex.toUpperCase().startsWith("4D 54 68 64")) {
        console.error("ERROR: Invalid MIDI data - missing MThd header");
        console.error(`MIDI data starts with: ${midiHex.substring(0, 30)}...`);
        throw new Error("Generated MIDI data is invalid (missing header)");
      }
      
      // Check for MTrk track header
      if (!midiHex.toUpperCase().includes("4D 54 72 6B")) {
        console.error("ERROR: Invalid MIDI data - missing MTrk track header");
        throw new Error("Generated MIDI data is invalid (missing track header)");
      }
      
      // Convert hex to binary
      const midiBytes = hexToBytes(midiHex);
      updatedClip.rawMidiBytes = midiBytes;
      
      // Additional validation
      if (midiBytes.length < 14) {
        console.error(`ERROR: MIDI data too short (${midiBytes.length} bytes)`);
        throw new Error("Generated MIDI data is too short to be valid");
      }
      
      // Always perform LLM validation (not just in debug mode)
      let validationPassed = true;
      try {
        console.log("Performing LLM validation of MIDI data...");
        const validationPath = join(this.config.outputDir, project.id, group.id, track.id, `${clip.id}_validation.txt`);
        const validationReport = await validateMidiHex(midiHex, validationPath);
        
        // Check for critical issues in the validation report
        const hasCriticalIssues = this.checkForCriticalIssues(validationReport);
        
        if (hasCriticalIssues) {
          console.warn("⚠️ WARNING: LLM validation detected potential issues with the MIDI data");
          console.warn("See the validation report for details: " + validationPath);
          validationPassed = false;
        } else {
          console.log("✅ LLM validation passed with no critical issues detected");
        }
      } catch (error) {
        console.error("Error during LLM validation:", error);
        validationPassed = false; // Fail safe - if validation errors out, don't save the file
      }
      
      // Only save the MIDI file if validation passes
      let outputPath = "";
      console.log(`Generated clip: ${clip.name}`);
      
      if (validationPassed) {
        const filename = `${clip.id}.mid`;
        outputPath = join(this.config.outputDir, project.id, group.id, track.id, filename);
        await saveMidiFile(midiBytes, outputPath);
        console.log(`✅ MIDI file saved to: ${outputPath}`);
        console.log(`To play the generated MIDI file: bun run play ${outputPath}`);
      } else {
        console.error("❌ MIDI validation failed - valid file not saved");
        // Save the invalid MIDI data with a .invalid extension for debugging
        const invalidFilename = `${clip.id}.invalid.mid`;
        const invalidPath = join(this.config.outputDir, project.id, group.id, track.id, invalidFilename);
        await saveMidiFile(midiBytes, invalidPath);
        console.log(`Invalid MIDI data saved to: ${invalidPath} for debugging`);
      }
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
   * Save MIDI debug information to a file
   * 
   * @param rawResponse - The raw LLM response
   * @param extractedHex - The extracted MIDI hex data
   * @param debugPath - Path to save the debug file
   */
  private async saveMidiDebugInfo(
    rawResponse: string, 
    extractedHex: string, 
    debugPath: string
  ): Promise<void> {
    try {
      // Create debug output with original response and extracted data
      const debugContent = `
================ RAW LLM RESPONSE ================
${rawResponse}

================ EXTRACTED MIDI HEX ================
${extractedHex}

================ VALIDATION INFO ================
Header valid: ${extractedHex.toUpperCase().startsWith("4D 54 68 64")}
Length: ${extractedHex.split(/\s+/).length} bytes
`;
      // Make sure directory exists
      const { dirname } = await import("node:path");
      const { mkdirSync, existsSync } = await import("node:fs");
      const dir = dirname(debugPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      // Write debug file
      const { writeFile } = await import("node:fs/promises");
      await writeFile(debugPath, debugContent, "utf-8");
    } catch (error) {
      console.error("Error saving MIDI debug info:", error);
    }
  }
  
  /**
   * Check for critical issues in MIDI validation report
   * 
   * @param validationReport - LLM validation report
   * @returns True if critical issues were found
   */
  private checkForCriticalIssues(validationReport: string): boolean {
    // List of keywords that might indicate critical issues
    const criticalIssueKeywords = [
      "missing note-off",
      "no note-off",
      "note-on and note-off mismatch",
      "not properly paired",
      "note-off events do not match",
      "not correctly paired",
      "not be turned off properly",
      "lack of note-off",
      "without note-off",
      "no corresponding note-off",
      "notes to play forever",
      "improper note pairing",
      "incorrect channel",
      "incorrect note",
      "invalid header",
      "corrupt",
      "will not play",
      "cannot play",
      "playback issue",
      "critical error",
      "severe issue",
      "incorrect format"
    ];
    
    // Convert to lowercase for case-insensitive matching
    const lowerReport = validationReport.toLowerCase();
    
    // Check for each critical issue keyword
    const criticalFound = criticalIssueKeywords.some(keyword => lowerReport.includes(keyword));
    
    // Special case detection for notes turned on multiple times without turning off
    if (lowerReport.includes("note-on events for the same note without corresponding note-off events")) {
      console.warn("⚠️ WARNING: Detection of multiple note-on events without note-offs");
      return true;
    }
    
    // Track length miscalculation detection 
    if (lowerReport.includes("track length") && 
        (lowerReport.includes("miscalculated") || lowerReport.includes("incorrect") || 
         lowerReport.includes("wrong") || lowerReport.includes("mismatch"))) {
      console.warn("⚠️ WARNING: Track length calculation issues detected");
      return true;
    }
    
    // Enhanced analysis for common issues beyond keywords
    // Check for notes that would play forever
    if (lowerReport.includes("note") && lowerReport.includes("turned on") && 
        lowerReport.includes("without") && lowerReport.includes("turned off")) {
      console.warn("⚠️ WARNING: Detection of notes turned on but not turned off");
      return true;
    }
    
    return criticalFound;
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
  
  /**
   * Generate a MIDI clip using a two-phase approach for improved reliability
   * Phase 1: Generate ideas and MIDI structure
   * Phase 2: Fix any validation issues using LLM analysis
   * 
   * @param project - The music project
   * @param group - The group containing the track
   * @param track - The track containing the clip
   * @param clip - The clip to generate
   * @param maxRetries - Maximum number of retries for MIDI generation (default: 3)
   * @returns Updated clip with MIDI data
   */
  async generateClipTwoPhase(
    project: Project,
    group: Group,
    track: Track,
    clip: Clip,
    maxRetries: number = 3
  ): Promise<Clip> {
    console.log(`Generating clip with two-phase approach: ${clip.name}`);
    
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
      
      // Phase 1: Generate musical ideas
      const ideaStage = this.config.stages[0];
      if (!ideaStage) {
        throw new Error("Missing idea generation stage in pipeline configuration");
      }
      console.log(`Running stage: ${ideaStage.name}`);
      
      // Prepare debug paths if debug mode is enabled
      let ideaLogPath;
      if (this.config.debug) {
        ideaLogPath = join(
          this.config.outputDir, 
          project.id, 
          group.id, 
          track.id, 
          `${clip.id}_idea_stage.log`
        );
        console.log(`Debug mode enabled, logging to ${ideaLogPath}`);
      }
      
      const idea = await callLLM(
        ideaStage.systemPrompt,
        context,
        ideaStage.modelConfig,
        {
          debug: this.config.debug,
          logPath: ideaLogPath
        }
      );
      
      // Store the idea in the clip's prompt field
      updatedClip.prompt = idea;
      
      // Phase 2A: Generate MIDI from the idea (with retries)
      const midiStage = this.config.stages[1];
      if (!midiStage) {
        throw new Error("Missing MIDI generation stage in pipeline configuration");
      }
      
      // Prepare MIDI debug path
      let midiLogPath;
      if (this.config.debug) {
        midiLogPath = join(
          this.config.outputDir, 
          project.id, 
          group.id, 
          track.id, 
          `${clip.id}_midi_stage.log`
        );
      }
      
      const contextWithIdea = `${context}\n\nMusical idea: ${idea}\n\nGenerate a MIDI file for this idea.`;
      
      // Try MIDI generation with retries
      let midiHex = "";
      let midiBytes = new Uint8Array();
      let validationPassed = false;
      let validationReport = "";
      let generationAttempt = 0;
      
      while (!validationPassed && generationAttempt < maxRetries) {
        generationAttempt++;
        console.log(`MIDI generation attempt ${generationAttempt}/${maxRetries}`);
        
        // If this is a retry, add specific guidance based on previous validation
        let retryPrompt = contextWithIdea;
        if (generationAttempt > 1 && validationReport) {
          retryPrompt = `${contextWithIdea}\n\nPrevious attempt had the following issues:\n${validationReport}\n\nPlease fix these issues in your new MIDI generation.`;
        }
        
        // Generate MIDI
        const midiHexResponse = await callLLM(
          midiStage.systemPrompt,
          retryPrompt,
          midiStage.modelConfig,
          {
            debug: this.config.debug,
            logPath: midiLogPath ? `${midiLogPath}.attempt${generationAttempt}` : undefined
          }
        );
        
        // Extract hex data from the response
        midiHex = this.extractMidiHex(midiHexResponse);
        updatedClip.midiData = midiHex;
        
        // Debug log the MIDI hex data
        const debugPath = join(this.config.outputDir, project.id, group.id, track.id, `${clip.id}_hex_log.attempt${generationAttempt}.txt`);
        await this.saveMidiDebugInfo(midiHexResponse, midiHex, debugPath);
        
        // Basic structural validation
        if (!midiHex.toUpperCase().startsWith("4D 54 68 64")) {
          console.error("ERROR: Invalid MIDI data - missing MThd header");
          continue; // Skip to next attempt
        }
        
        // Check for MTrk track header
        if (!midiHex.toUpperCase().includes("4D 54 72 6B")) {
          console.error("ERROR: Invalid MIDI data - missing MTrk track header");
          continue; // Skip to next attempt
        }
        
        // Convert hex to binary
        midiBytes = hexToBytes(midiHex);
        updatedClip.rawMidiBytes = midiBytes;
        
        // Additional validation
        if (midiBytes.length < 14) {
          console.error(`ERROR: MIDI data too short (${midiBytes.length} bytes)`);
          continue; // Skip to next attempt
        }
        
        // Perform LLM validation
        try {
          console.log("Validating MIDI data with LLM...");
          const validationPath = join(
            this.config.outputDir, 
            project.id, 
            group.id, 
            track.id, 
            `${clip.id}_validation.attempt${generationAttempt}.txt`
          );
          
          validationReport = await validateMidiHex(midiHex, validationPath);
          const hasCriticalIssues = this.checkForCriticalIssues(validationReport);
          
          if (hasCriticalIssues) {
            console.warn(`⚠️ Attempt ${generationAttempt}: LLM validation detected issues`);
            if (generationAttempt < maxRetries) {
              console.log("Trying again with feedback from validation...");
            }
          } else {
            console.log(`✅ Attempt ${generationAttempt}: LLM validation passed`);
            validationPassed = true;
          }
        } catch (error) {
          console.error(`Error during LLM validation (attempt ${generationAttempt}):`, error);
          // Continue to next attempt on validation error
        }
      }
      
      // Phase 2B: Save the MIDI file if validation passed
      console.log(`Generated clip: ${clip.name}`);
      
      if (validationPassed) {
        const filename = `${clip.id}.mid`;
        const outputPath = join(this.config.outputDir, project.id, group.id, track.id, filename);
        await saveMidiFile(midiBytes, outputPath);
        console.log(`✅ MIDI file saved to: ${outputPath}`);
        console.log(`To play the generated MIDI file: bun run play ${outputPath}`);
      } else {
        console.error(`❌ MIDI validation failed after ${maxRetries} attempts - valid file not saved`);
        // Save the best attempt with a .invalid extension for debugging
        const invalidFilename = `${clip.id}.best-attempt.invalid.mid`;
        const invalidPath = join(this.config.outputDir, project.id, group.id, track.id, invalidFilename);
        await saveMidiFile(midiBytes, invalidPath);
        console.log(`Best attempt saved to: ${invalidPath} for debugging`);
      }
      
      return updatedClip;
    } catch (error) {
      console.error(`Error generating clip ${clip.name}:`, error);
      throw error;
    } finally {
      this.activeRequests--;
    }
  }
}