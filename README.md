# MIDITool

MIDITool is an AI-powered music generation pipeline that creates MIDI files using LLMs. It provides a hierarchical context model (projects, groups, tracks, clips) and a multi-stage pipeline for generating musical ideas and converting them to MIDI.

## Features

- Multi-level context hierarchy (Project > Group > Track > Clip)
- AI-driven music generation using various LLM providers
- MIDI file generation and processing
- Command-line interface for easy interaction
- Support for multiple LLM providers (Anthropic, OpenAI, etc.)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/miditool.git
cd miditool

# Install dependencies
bun install

# Copy environment template and fill in your API keys
cp .env.example .env
# Edit .env with your API keys
```

## Usage

### CLI Commands

```bash
# Show help
bun start help

# Test LLM connection
bun run test-llm

# Generate a test MIDI file to verify MIDI processing
bun run test-midi

# Create an example project
bun run create-example

# Generate MIDI for a project
bun run generate example-project
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

- `ANTHROPIC_API_KEY`: API key for Anthropic (Claude)
- `OPENAI_API_KEY`: API key for OpenAI
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
```

## License

MIT

This project was created using [Bun](https://bun.sh), a fast all-in-one JavaScript runtime.
