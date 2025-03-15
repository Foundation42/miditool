# MIDITool User Guide

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

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```
# LLM API Keys (at least one is required)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
MISTRAL_API_KEY=your_mistral_key_here
GOOGLE_API_KEY=your_google_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here

# Local LLM (optional)
OLLAMA_ENDPOINT=http://localhost:11434

# Default Provider Configuration
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o

# Pipeline Settings
OUTPUT_DIR=./output
MAX_CONCURRENT_REQUESTS=2
```

### Provider Models

MIDITool supports the following LLM providers and their default models:

| Provider  | Default Model              | Environment Variable |
|-----------|-----------------------------|---------------------|
| openai    | gpt-4o                     | OPENAI_API_KEY      |
| anthropic | claude-3-7-sonnet-20250219 | ANTHROPIC_API_KEY   |
| mistral   | mistral-large-latest       | MISTRAL_API_KEY     |
| gemini    | gemini-1.5-pro-latest      | GOOGLE_API_KEY      |
| deepseek  | deepseek-coder             | DEEPSEEK_API_KEY    |
| ollama    | llama3                     | OLLAMA_ENDPOINT     |
| vertex    | gemini-1.5-pro             | GOOGLE_API_KEY      |

## Command Line Usage

### Testing Your Setup

```bash
# Test the default LLM connection
bun run test-llm

# Test with a specific provider and model
bun run test-llm mistral mistral-large-latest
bun run test-llm openai gpt-4o

# List all available providers
bun run list-providers
```

### Creating and Generating Music

```bash
# Create an example project structure
bun run create-example

# Generate MIDI for the example project
bun run generate example-project

# Generate using a specific LLM provider
bun run generate example-project anthropic claude-3-7-sonnet-20250219

# Run a simple one-clip test
bun run simple-test

# Run two-phase generation with validation
bun run two-phase-test

# Run the full pipeline test
bun run full-test
```

### Working with MIDI Files

```bash
# Generate a known-good MIDI file
bun run generate-good-midi

# Generate a test melody
bun run generate-test-melody

# Analyze a MIDI file
bun run analyze-midi path/to/file.mid

# Validate a MIDI file with LLM
bun run validate-midi path/to/file.mid

# Fix common MIDI file issues
bun run fix-midi path/to/file.mid [output-path]

# Fix track lengths specifically
bun run tools/midi-track-fixer.ts path/to/file.mid [output-path]

# Play a MIDI file (requires timidity or fluidsynth)
bun run play path/to/file.mid

# Summarize log files
bun run summarize-log path/to/log-file.log [output-path]
```

## Project Structure

When you create a project, it follows this hierarchy:

1. **Project**: Overall container with global properties
   - Name, description, style, tempo, key, time signature

2. **Groups**: Collections of related tracks
   - Example: "Rhythm Section", "Melody Section", "Ambient Textures"
   - Properties: role, description

3. **Tracks**: Individual instrument tracks
   - Example: "Drums", "Bass", "Lead Synth"
   - Properties: instrument, description

4. **Clips**: Segments of MIDI data for a specific track
   - Example: "Verse 1", "Chorus", "Bridge"
   - Properties: start position, length, description

## Two-Phase Generation Process

The recommended approach for generating MIDI is the two-phase process:

1. **Idea Generation**: Creates descriptive musical ideas based on project context
2. **MIDI Generation**: Converts ideas into valid MIDI hex data
3. **Validation**: Ensures the generated MIDI is valid and playable
4. **Retry Logic**: If validation fails, feedback is used to improve the next attempt

This process ensures higher-quality MIDI files and reduces the likelihood of errors.

## Troubleshooting

### Common Issues

1. **LLM Connection Failures**
   - Check your API keys in the .env file
   - Verify internet connection
   - Try a different LLM provider

2. **MIDI Playback Issues**
   - Install timidity or fluidsynth: `sudo apt install timidity`
   - Run setup script: `bun run setup-timidity`
   - Check the MIDI file validity: `bun run validate-midi file.mid`

3. **Invalid MIDI Files**
   - Try fixing with: `bun run fix-midi file.mid`
   - Check track lengths: `bun run tools/midi-track-fixer.ts file.mid`
   - Examine the validation report for specific issues

### Debug Logs

The system creates detailed logs for troubleshooting:

- **Idea Stage**: `*_idea_stage.log`
- **MIDI Stage**: `*_midi_stage.log`
- **Hex Logs**: `*_hex_log.txt`
- **Validation**: `*_validation.txt`

Use the log summarizer to get a human-friendly overview:
```bash
bun run summarize-log path/to/log-file.log
```

## MIDI Playback Setup

### Linux

```bash
# Ubuntu/Debian
sudo apt install timidity fluid-soundfont-gm

# Arch Linux
sudo pacman -S timidity++ soundfont-fluid

# Configure TiMidity with proper soundfonts
bun run setup-timidity
```

### macOS

```bash
# With Homebrew
brew install timidity

# Or use FluidSynth
brew install fluid-synth
```