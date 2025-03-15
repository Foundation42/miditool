Instructions for Claude Coder to help implement the production system:

# Implementation Instructions for Music Generation Pipeline

## Project Overview
We're building an AI-driven music generation pipeline that takes multi-level context (project, group, track, clip) and generates MIDI files through a series of LLM processing stages. The system will be implemented in TypeScript using Bun as the runtime.

## Key Requirements

1. Implement the TypeScript code based on the provided architecture
2. Use Bun as the runtime environment
3. Optimize for production use with proper error handling, logging, and performance considerations
4. Create a simple API or CLI interface for interacting with the pipeline

## Core Components to Implement

### 1. LLM Interface
- Create a robust wrapper for API calls to our LLM service
- Implement rate limiting, retries, and error handling
- Support for streaming responses if applicable
- Function signature: `async function generate(systemPrompt: string, userPrompt?: string): Promise<string>`

### 2. Context Management
- Implement validators for the context hierarchy (Project, Group, Track, Clip)
- Add proper serdes (serialization/deserialization) for context objects
- Create a storage mechanism for persistent context (filesystem or database)

### 3. Music Generation Pipeline
- Implement the `MusicGenerationPipeline` class as outlined in the architecture
- Enhance the parsing logic for LLM responses with more robust extraction
- Add proper error handling, logging, and performance tracking

### 4. MIDI Processing
- Implement binary MIDI file generation from hex strings
- Add validation for MIDI output format
- Create utility functions for working with MIDI files (e.g., merging, splitting)

### 5. CLI/API Interface
- Build a simple command-line interface for running the pipeline
- Alternatively, implement a REST API with Bun's HTTP server
- Include basic authentication if needed

## Optimization Considerations

1. **Concurrency**: Process multiple clips in parallel while respecting LLM rate limits
2. **Caching**: Implement caching for LLM responses to avoid redundant calls
3. **Checkpointing**: Save intermediate results to allow resuming interrupted pipelines
4. **Timeouts**: Add appropriate timeouts for LLM calls and pipeline stages

## Testing Requirements

1. Create unit tests for individual components
2. Implement integration tests for the full pipeline
3. Add sample projects for demonstration and testing

## Environment Configuration

- Use Bun's built-in `.env` support for configuration
- Required environment variables:
  - `LLM_API_KEY`: API key for the LLM service
  - `LLM_MODEL`: Model identifier
  - `OUTPUT_DIR`: Directory for MIDI file output
  - `MAX_CONCURRENT_REQUESTS`: Limit for concurrent LLM calls

## Advanced Features (Optional)

1. **User Feedback Loop**: Allow users to provide feedback at each stage
2. **Pipeline Visualization**: Create a visual representation of the pipeline stages
3. **Web Interface**: Build a simple web UI for interacting with the system
4. **Real-time Generation**: Support for streaming generation of music
5. **MIDI Playback**: Integrate with a MIDI playback engine for immediate audition

## Getting Started

1. Clone the repository
2. Run `bun install` to install dependencies
3. Configure environment variables in `.env`
4. Use `bun run build` to compile TypeScript
5. Run `bun run start` to launch the application

Please implement this system following modern TypeScript best practices, with proper error handling and documentation.