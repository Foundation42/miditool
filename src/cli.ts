/**
 * CLI interface for the music generation pipeline
 */
import { config as loadEnv } from "dotenv";
import { MusicGenerationPipeline } from "./pipeline";
import { testLLMConnection } from "./llm";
import { createTestMidiFile, saveMidiFile } from "./midi";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { writeFile, readFile } from "node:fs/promises";

// Load environment variables
loadEnv();

// Default output directory
const DEFAULT_OUTPUT_DIR = "./output";

// Create the output directory if it doesn't exist
if (!existsSync(DEFAULT_OUTPUT_DIR)) {
  mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
}

/**
 * Main CLI class
 */
export class MusicToolCLI {
  private pipeline: MusicGenerationPipeline;
  
  constructor() {
    this.pipeline = new MusicGenerationPipeline({
      outputDir: process.env.OUTPUT_DIR || DEFAULT_OUTPUT_DIR,
      maxConcurrentRequests: Number(process.env.MAX_CONCURRENT_REQUESTS || 2)
    });
  }
  
  /**
   * Process command line arguments and run the appropriate command
   */
  async run(args: string[] = process.argv.slice(2)): Promise<void> {
    if (args.length === 0) {
      this.showHelp();
      return;
    }
    
    const command = args[0];
    const commandArgs = args.slice(1);
    
    switch (command) {
      case "test-llm":
        // Check if provider and model are specified
        if (commandArgs.length >= 2) {
          const provider = commandArgs[0];
          const model = commandArgs[1];
          await this.testLLM(provider, model);
        } else {
          // Use default from environment
          await this.testLLM();
        }
        break;
        
      case "test-midi":
        await this.testMidi();
        break;
        
      case "create-example":
        await this.createExample();
        break;
        
      case "generate":
        if (commandArgs.length < 1) {
          console.error("Error: Project name is required");
          this.showHelp();
          return;
        }
        const projectName = commandArgs[0];
        if (!projectName) {
          console.error("Error: Project name is required");
          this.showHelp();
          return;
        }
        
        // Check if provider and model are specified
        let provider, model;
        if (commandArgs.length >= 3) {
          provider = commandArgs[1];
          model = commandArgs[2];
        }
        
        await this.generate(projectName, provider, model);
        break;
        
      case "play":
        if (commandArgs.length < 1) {
          console.error("Error: MIDI file path is required");
          this.showHelp();
          return;
        }
        await this.playMidi(commandArgs[0]);
        break;
        
      case "list-providers":
        this.listProviders();
        break;
        
      case "help":
        this.showHelp();
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        this.showHelp();
    }
  }
  
  /**
   * Display help information
   */
  private showHelp(): void {
    console.log(`
Music Generation Tool CLI

Usage:
  bun run cli.ts <command> [options]

Commands:
  test-llm [provider] [model]  Test LLM connection
  test-midi                    Generate a test MIDI file
  create-example               Create an example project
  generate <project> [provider] [model]  Generate MIDI for a project
  list-providers               List available LLM providers and their default models
  play <file>                  Play a MIDI file (requires timidity or fluidsynth)
  help                         Show this help message

Examples:
  bun run index.ts test-llm
  bun run index.ts test-llm mistral mistral-large-latest
  bun run index.ts generate example-project
  bun run index.ts generate example-project anthropic claude-3-7-sonnet-20250219

Environment Variables:
  LLM_PROVIDER                Default LLM provider (default: anthropic)
  LLM_MODEL                   Default model for the provider
  ANTHROPIC_API_KEY           API key for Anthropic (Claude)
  OPENAI_API_KEY              API key for OpenAI
  MISTRAL_API_KEY             API key for Mistral
  GOOGLE_API_KEY              API key for Gemini
  DEEPSEEK_API_KEY            API key for DeepSeek
  OLLAMA_ENDPOINT             Endpoint for Ollama
  OUTPUT_DIR                  Directory for output files (default: ./output)
  MAX_CONCURRENT_REQUESTS     Maximum number of concurrent LLM requests (default: 2)
`);
  }
  
  /**
   * List available LLM providers and their default models
   */
  private listProviders(): void {
    console.log(`
Available LLM Providers and Default Models:

Provider    | Default Model                  | Environment Variable
---------------------------------------------------------------------------
anthropic   | claude-3-7-sonnet-20250219     | ANTHROPIC_API_KEY
openai      | gpt-4-turbo                    | OPENAI_API_KEY
mistral     | mistral-large-latest           | MISTRAL_API_KEY
gemini      | gemini-1.5-pro-latest          | GOOGLE_API_KEY
deepseek    | deepseek-coder                 | DEEPSEEK_API_KEY
ollama      | llama3                         | OLLAMA_ENDPOINT
vertex      | gemini-1.5-pro                 | GOOGLE_API_KEY, GOOGLE_PROJECT_ID

Current configuration:
- Provider: ${process.env.LLM_PROVIDER || "anthropic"} (set with LLM_PROVIDER)
- Model: ${process.env.LLM_MODEL || "(using provider default)"} (set with LLM_MODEL)
`);
  }
  
  /**
   * Test the LLM connection
   * 
   * @param provider - Optional LLM provider to test
   * @param model - Optional model to test
   */
  private async testLLM(provider?: string, model?: string): Promise<void> {
    const providerDisplay = provider ? `${provider}/${model}` : "default";
    console.log(`Testing LLM connection with ${providerDisplay} LLM...`);
    
    // If provider and model are specified, create a config
    const config = provider && model ? { provider, model } : undefined;
    
    const success = await testLLMConnection(config);
    
    if (success) {
      console.log("✅ LLM connection successful");
    } else {
      console.error("❌ LLM connection failed");
    }
  }
  
  /**
   * Test MIDI file generation
   */
  private async testMidi(): Promise<void> {
    console.log("Generating test MIDI file...");
    
    try {
      const midiData = createTestMidiFile();
      const outputPath = join(DEFAULT_OUTPUT_DIR, "test.mid");
      
      await saveMidiFile(midiData, outputPath);
      console.log(`✅ Test MIDI file saved to ${outputPath}`);
    } catch (error) {
      console.error("❌ Error generating test MIDI file:", error);
    }
  }
  
  /**
   * Create an example project
   */
  private async createExample(): Promise<void> {
    console.log("Creating example project...");
    
    // Create a sample project
    const project = this.pipeline.createProject("Example Project", {
      description: "An example music project",
      style: "Pop",
      tempo: 120,
      key: "C major",
      timeSignature: "4/4"
    });
    
    // Add a rhythm group
    const rhythmGroup = this.pipeline.createGroup(project, "Rhythm", {
      role: "rhythm",
      description: "Rhythm section for the project"
    });
    
    // Add a melody group
    const melodyGroup = this.pipeline.createGroup(project, "Melody", {
      role: "melody",
      description: "Melody section for the project"
    });
    
    // Add tracks to rhythm group
    const drumsTrack = this.pipeline.createTrack(rhythmGroup, "Drums", "Drums", {
      description: "Main drum track"
    });
    
    const bassTrack = this.pipeline.createTrack(rhythmGroup, "Bass", "Bass Guitar", {
      description: "Bass guitar track"
    });
    
    // Add tracks to melody group
    const pianoTrack = this.pipeline.createTrack(melodyGroup, "Piano", "Grand Piano", {
      description: "Main piano track"
    });
    
    // Add clips to tracks
    const drumsClip = this.pipeline.createClip(drumsTrack, "Drum Pattern", 0, 4, {
      description: "Main drum pattern"
    });
    
    const bassClip = this.pipeline.createClip(bassTrack, "Bass Line", 0, 4, {
      description: "Main bass line"
    });
    
    const pianoClip = this.pipeline.createClip(pianoTrack, "Piano Melody", 0, 4, {
      description: "Main piano melody"
    });
    
    // Save the project to a file
    const projectFilePath = join(DEFAULT_OUTPUT_DIR, "example-project.json");
    await writeFile(
      projectFilePath, 
      JSON.stringify(project, null, 2),
      "utf-8"
    );
    
    console.log(`✅ Example project created and saved to ${projectFilePath}`);
  }
  
  /**
   * Generate MIDI for a project
   * 
   * @param projectName - Name of the project file
   * @param provider - Optional LLM provider to use
   * @param model - Optional model to use
   */
  private async generate(projectName: string, provider?: string, model?: string): Promise<void> {
    console.log(`Generating MIDI for project: ${projectName}`);
    
    try {
      // Create a custom pipeline if provider and model are specified
      let pipeline = this.pipeline;
      
      if (provider && model) {
        console.log(`Using custom LLM: ${provider}/${model}`);
        const modelConfig = { provider, model };
        
        // Create a new pipeline with the specified provider and model
        pipeline = new MusicGenerationPipeline({
          outputDir: process.env.OUTPUT_DIR || DEFAULT_OUTPUT_DIR,
          maxConcurrentRequests: Number(process.env.MAX_CONCURRENT_REQUESTS || 2),
          stages: [
            {
              name: "idea-generation",
              systemPrompt: `You are an expert music composer. Your task is to generate creative ideas for a MIDI clip
based on the provided context (project, group, track). Respond with a detailed paragraph describing the musical 
ideas that would work well for this context. Consider rhythm, melody, harmony, and how it fits into the overall project.`,
              modelConfig
            },
            {
              name: "midi-generation",
              systemPrompt: `You are an expert MIDI composer. Your task is to generate a MIDI file based on the provided
musical idea and context. Respond with a complete hex dump of a valid MIDI file. The hex dump should be
formatted with bytes separated by spaces. Make sure the MIDI file starts with the header "4D 54 68 64" and
follows the standard MIDI file format. Only include the hex bytes in your response, no explanations or text.`,
              modelConfig
            }
          ]
        });
      }
      
      // Load the project
      const projectFilePath = join(DEFAULT_OUTPUT_DIR, `${projectName}.json`);
      
      if (!existsSync(projectFilePath)) {
        console.error(`Project file not found: ${projectFilePath}`);
        return;
      }
      
      const projectJson = await readFile(projectFilePath, "utf-8");
      const project = JSON.parse(projectJson);
      
      // Convert dates from strings back to Date objects
      project.createdAt = new Date(project.createdAt);
      project.updatedAt = new Date(project.updatedAt);
      
      for (const group of project.groups) {
        group.createdAt = new Date(group.createdAt);
        group.updatedAt = new Date(group.updatedAt);
        
        for (const track of group.tracks) {
          track.createdAt = new Date(track.createdAt);
          track.updatedAt = new Date(track.updatedAt);
          
          for (const clip of track.clips) {
            clip.createdAt = new Date(clip.createdAt);
            clip.updatedAt = new Date(clip.updatedAt);
          }
        }
      }
      
      // Generate MIDI for each clip
      for (const group of project.groups) {
        for (const track of group.tracks) {
          for (const clip of track.clips) {
            console.log(`Generating clip: ${clip.name} in track: ${track.name}`);
            
            try {
              await pipeline.generateClip(project, group, track, clip);
              console.log(`✅ Generated clip: ${clip.name}`);
            } catch (error) {
              console.error(`❌ Error generating clip ${clip.name}:`, error);
            }
          }
        }
      }
      
      console.log("✅ MIDI generation complete");
    } catch (error) {
      console.error("❌ Error generating MIDI:", error);
    }
  }
  
  /**
   * Play a MIDI file using an external player
   * 
   * @param filePath - Path to the MIDI file
   */
  private async playMidi(filePath: string): Promise<void> {
    console.log(`Attempting to play MIDI file: ${filePath}`);
    
    try {
      // Check if the file exists and is a MIDI file
      if (!existsSync(filePath)) {
        console.error(`File does not exist: ${filePath}`);
        return;
      }
      
      if (!filePath.toLowerCase().endsWith('.mid') && !filePath.toLowerCase().endsWith('.midi')) {
        console.warn(`Warning: File does not have a .mid or .midi extension: ${filePath}`);
      }
      
      // Try different MIDI players in order of preference
      const players = [
        // FluidSynth with explicit soundfont and parameters
        { 
          cmd: "fluidsynth", 
          args: [
            "-a", "alsa", 
            "-m", "alsa_seq", 
            "-i", 
            "-g", "3.0", 
            "/usr/share/soundfonts/FluidR3_GM.sf2", 
            filePath
          ] 
        },
        // TiMidity with maximum amplitude
        { cmd: "timidity", args: ["-A100", filePath] },
        // Fallback options
        { cmd: "fluidsynth", args: ["-i", filePath] },
        { cmd: "pmidi", args: ["-p", "14:0", filePath] },
        { cmd: "aplaymidi", args: [filePath] }
      ];
      
      let success = false;
      
      for (const player of players) {
        try {
          console.log(`Trying to play with ${player.cmd}...`);
          
          // Try running the player and capture any errors
          const result = await new Promise<{ exitCode: number, error?: Error }>((resolve) => {
            const child = Bun.spawn({
              cmd: [player.cmd, ...player.args],
              stdout: "inherit",
              stderr: "inherit"
            });
            
            child.exited.then((exitCode) => {
              resolve({ exitCode });
            }).catch((error) => {
              resolve({ exitCode: -1, error });
            });
          });
          
          if (result.exitCode === 0) {
            console.log(`✅ Successfully played MIDI file with ${player.cmd}`);
            success = true;
            break;
          } else {
            console.log(`❌ Failed to play with ${player.cmd} (exit code: ${result.exitCode})`);
          }
        } catch (error) {
          console.log(`❌ Error trying to play with ${player.cmd}: ${error}`);
        }
      }
      
      if (!success) {
        console.error(`
Could not play MIDI file. Please install one of the following MIDI players:
  - timidity
  - fluidsynth
  - pmidi
  - aplaymidi

On Ubuntu/Debian, you can install with:
  sudo apt-get install timidity

On macOS with Homebrew:
  brew install timidity

Or use any other MIDI player of your choice to play the file manually.
`);
      }
    } catch (error) {
      console.error(`Error playing MIDI file:`, error);
    }
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  const cli = new MusicToolCLI();
  cli.run().catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}