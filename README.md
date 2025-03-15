# MIDITool

MIDITool is an AI-powered music generation pipeline that creates MIDI files using LLMs. It provides a hierarchical context model (projects, groups, tracks, clips) and a multi-stage pipeline for generating musical ideas and converting them to MIDI.

## Features

- Multi-level context hierarchy (Project > Group > Track > Clip)
- AI-driven music generation using various LLM providers
- MIDI file generation and processing with automatic playback
- Command-line interface for easy interaction
- Support for multiple LLM providers (Mistral, Anthropic, OpenAI, etc.)
- Advanced LLM-based MIDI validation and analysis
- Automatic MIDI repair tools for track lengths and end-of-track markers
- Two-phase generation with validation feedback and retries
- Simple single-track MIDI generation for improved reliability
- Mandatory MIDI validation with automatic retry
- Debug logging for LLM inputs and outputs
- Configurable for different musical styles and contexts

## Installation

```bash
# Clone the repository
git clone https://github.com/Foundation42/miditool.git
cd miditool

# Install dependencies
bun install

# Copy environment template and fill in your API keys
cp .env.example .env
# Edit .env with your API keys

# Set up MIDI playback (on Linux)
bun run setup-timidity
```

## Usage

### CLI Commands

```bash
# Show help
bun start help

# Test LLM connection
bun run test-llm

# Test with specific LLM provider
bun run test-mistral-cli  # Test Mistral
bun run test-openai       # Test OpenAI

# Generate known-good MIDI files
bun run generate-good-midi      # Create a standards-compliant MIDI file
bun run generate-test-melody    # Create a test melody with clear notes

# Create and generate projects
bun run create-example          # Create an example project structure
bun run generate example-project # Generate MIDI for a project
bun run simple-test             # Run a simple single-clip generation test
bun run two-phase-test          # Test two-phase generation with validation

# MIDI tools
bun run play <path-to-midi-file>     # Play a MIDI file
bun run analyze-midi <midi-file>     # Analyze a MIDI file
bun run fix-midi <midi-file>         # Repair a problematic MIDI file
```

### Using as a Library

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
await pipeline.generateClip(project, group, track, clip);
```

## Environment Variables

### LLM API Keys
- `ANTHROPIC_API_KEY`: API key for Anthropic (Claude)
- `OPENAI_API_KEY`: API key for OpenAI
- `MISTRAL_API_KEY`: API key for Mistral
- `GOOGLE_API_KEY`: API key for Gemini/Vertex AI
- `DEEPSEEK_API_KEY`: API key for DeepSeek
- `OLLAMA_ENDPOINT`: Endpoint for Ollama (local LLMs)

### LLM Configuration
- `LLM_PROVIDER`: Default LLM provider (anthropic, openai, mistral, etc.)
- `LLM_MODEL`: Specific model to use with the provider

### Pipeline Settings
- `OUTPUT_DIR`: Directory for output files (default: ./output)
- `MAX_CONCURRENT_REQUESTS`: Maximum number of concurrent LLM requests (default: 2)

## Development

```bash
# Run type checking
bun run typecheck

# Format code
bun run format

# Build for production
bun run build

# List all supported LLM providers
bun run list-providers
```

## MIDI Playback

For MIDI playback, the tool requires one of the following players:

- **FluidSynth** (recommended): `sudo pacman -S fluidsynth soundfont-fluid` (Arch) or `sudo apt install fluidsynth fluid-soundfont-gm` (Ubuntu)
- **TiMidity++**: `sudo pacman -S timidity++` (Arch) or `sudo apt install timidity` (Ubuntu) 

Run `bun run setup-timidity` to configure TiMidity with the correct soundfonts.

## Project Structure

- `src/`: Source code
  - `types.ts`: Core type definitions
  - `llm.ts`: LLM interface wrappers
  - `midi.ts`: MIDI utilities
  - `pipeline.ts`: Core pipeline implementation
  - `cli.ts`: Command-line interface
- `tests/`: Test scripts
- `tools/`: Utility tools
  - `midi-analyzer.ts`: Tool to validate MIDI files
  - `midi-fixer.ts`: Tool to repair MIDI files
  - `setup-timidity.sh`: Script to configure TiMidity
- `output/`: Generated MIDI files

## License

MIT

This project was created using [Bun](https://bun.sh), a fast all-in-one JavaScript runtime.
