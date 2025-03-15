# MIDITool Developer Guide

## Project Setup

```bash
# Clone the repository
git clone https://github.com/Foundation42/miditool.git
cd miditool

# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your API keys
```

## Development Environment

MIDITool is built with:
- **Bun**: JavaScript/TypeScript runtime (similar to Node.js but faster)
- **TypeScript**: For type safety and better code organization
- **Bunlib**: Custom library for LLM integration
- **midi-writer-js**: For MIDI file creation
- **midi-json-parser**: For MIDI file parsing

### Development Commands

```bash
# Typecheck the project
bun run typecheck

# Format code
bun run format

# Build for production
bun run build

# Run a specific file
bun run path/to/file.ts
```

## Project Structure

```
miditool/
├── docs/               # Documentation
├── output/             # Generated MIDI files
├── src/                # Source code
│   ├── bunlib.d.ts     # Type definitions for bunlib
│   ├── cli.ts          # Command-line interface
│   ├── index.ts        # Entry point
│   ├── llm.ts          # LLM integration
│   ├── midi.ts         # MIDI utilities
│   ├── pipeline.ts     # Core pipeline implementation
│   └── types.ts        # Type definitions
├── tests/              # Test scripts
│   ├── full-pipeline-test.ts
│   ├── generate-test-melody.ts
│   ├── simple-midi-test.ts
│   └── two-phase-test.ts
├── tools/              # Utility tools
│   ├── compare-midi.ts
│   ├── generate-good-midi.ts
│   ├── midi-analyzer.ts
│   ├── midi-fixer.ts
│   ├── midi-track-fixer.ts
│   ├── setup-timidity.sh
│   ├── summarize-logs.ts
│   └── validate-midi-hex.ts
├── CLAUDE.md           # Project guidelines
├── README.md           # Project overview
├── TODO.md             # Development roadmap
├── package.json        # Dependencies
├── project.md          # Implementation instructions
└── tsconfig.json       # TypeScript configuration
```

## Core Components

### 1. Pipeline Implementation (pipeline.ts)

The `MusicGenerationPipeline` class is the core of the system:

```typescript
class MusicGenerationPipeline {
  // Create context objects
  createProject(name: string, options?: ProjectOptions): Project
  createGroup(project: Project, name: string, options?: GroupOptions): Group
  createTrack(group: Group, name: string, instrument: string, options?: TrackOptions): Track
  createClip(track: Track, name: string, startBar: number, lengthBars: number, options?: ClipOptions): Clip
  
  // Generation methods
  async generateClip(project: Project, group: Group, track: Track, clip: Clip): Promise<Clip>
  async generateClipTwoPhase(project: Project, group: Group, track: Track, clip: Clip, maxAttempts: number = 3): Promise<Clip>
}
```

The two-phase generation process is recommended for better results.

### 2. LLM Integration (llm.ts)

The LLM integration provides a unified interface for multiple AI providers:

```typescript
// Main LLM call function
async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  modelConfig?: LLMModelConfig,
  options?: LLMCallOptions
): Promise<string>

// Test connection
async function testLLMConnection(modelConfig?: LLMModelConfig): Promise<boolean>
```

The system uses environment variables for configuration, with OpenAI as the default provider.

### 3. MIDI Utilities (midi.ts)

MIDI processing utilities handle binary data conversion and file operations:

```typescript
// Convert between formats
function hexToBytes(hexString: string): Uint8Array
function bytesToHex(bytes: Uint8Array): string

// File operations
async function saveMidiFile(midiData: Uint8Array, outputPath: string): Promise<string>

// Validation
function isValidMidi(midiData: Uint8Array): boolean

// Test file generation
function createTestMidiFile(): Uint8Array
```

### 4. Type Definitions (types.ts)

The type system defines the hierarchical music model and configuration options:

```typescript
// Hierarchical music model
interface Project { /* ... */ }
interface Group { /* ... */ }
interface Track { /* ... */ }
interface Clip { /* ... */ }

// Configuration interfaces
interface LLMModelConfig { /* ... */ }
interface PipelineStageConfig { /* ... */ }
interface MusicGenerationConfig { /* ... */ }
```

## Extending the Project

### Adding a New LLM Provider

To add support for a new LLM provider:

1. Update the `LLMModelConfig` interface in `types.ts`
2. Add the provider to `PROVIDER_DEFAULT_MODELS` in `llm.ts`
3. Update the provider handling in `callLLM` function
4. Add environment variable handling in `.env.example`

### Creating New Pipeline Stages

To add a new generation stage:

1. Define a new stage configuration in `DEFAULT_STAGES` in `pipeline.ts`
2. Update the `PipelineStageConfig` interface if needed
3. Modify the generation process in `generateClip` or `generateClipTwoPhase`

### Adding New MIDI Tools

To create additional MIDI processing tools:

1. Create a new tool file in the `tools/` directory
2. Add the script to `package.json` for easy access
3. Update the CLI interface in `cli.ts` if needed

## Testing

The project includes several test scripts for different aspects:

- `tests/simple-midi-test.ts`: Quick one-clip generation test
- `tests/two-phase-test.ts`: Tests the two-phase generation with validation
- `tests/full-pipeline-test.ts`: Comprehensive test of the entire pipeline
- `tests/generate-test-melody.ts`: Creates a test melody with clear notes

Running tests:

```bash
# Run a specific test
bun run simple-test
bun run two-phase-test
bun run full-test

# Test with different providers
LLM_PROVIDER=mistral LLM_MODEL=mistral-large-latest bun run simple-test
```

## API Integration

The system can be used as a library in other projects:

```typescript
import { MusicGenerationPipeline } from "miditool";

// Create a pipeline
const pipeline = new MusicGenerationPipeline({
  outputDir: "./my-output-dir",
  maxConcurrentRequests: 2
});

// Create a project
const project = pipeline.createProject("My Project", {
  description: "A cool music project",
  style: "Electronic",
  tempo: 128,
  key: "F minor",
  timeSignature: "4/4"
});

// Add a group
const group = pipeline.createGroup(project, "Synths", {
  role: "melody"
});

// Add a track
const track = pipeline.createTrack(group, "Lead Synth", "Analog Synth");

// Add a clip
const clip = pipeline.createClip(track, "Main Melody", 0, 8, {
  description: "The main melody hook for the song"
});

// Generate the clip
await pipeline.generateClipTwoPhase(project, group, track, clip);
```

## Debugging and Troubleshooting

When developing:

1. Enable debug mode to see detailed logs:
   ```typescript
   const pipeline = new MusicGenerationPipeline({
     debug: true
   });
   ```

2. Check log files in the output directory:
   - `*_idea_stage.log`: Musical idea generation
   - `*_midi_stage.log`: MIDI generation
   - `*_hex_log.txt`: Generated MIDI hex data
   - `*_validation.txt`: Validation reports

3. Use the validation tools to check MIDI files:
   ```bash
   bun run validate-midi path/to/file.mid
   ```

4. Summarize logs for better readability:
   ```bash
   bun run summarize-log path/to/log-file.log
   ```

## Future Development

See the `TODO.md` file for planned features and improvements:

- Multi-track MIDI generation
- Caching system for LLM responses
- Web interface with visualization
- Enhanced MIDI processing features