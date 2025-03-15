# CLAUDE.md - Project Guidelines for Miditool

## Documentation

Comprehensive documentation is available in the `docs/` directory:
- **[Architecture Overview](docs/architecture-overview.md)**: System design and components
- **[User Guide](docs/user-guide.md)**: Installation and usage instructions
- **[Developer Guide](docs/developer-guide.md)**: Development practices and extension

## Build & Dev Commands
- Install dependencies: `bun install`
- Run application: `bun run index.ts`
- Run a specific file: `bun run path/to/file.ts`
- Typecheck: `bun run tsc --noEmit`
- Format code: `bunx prettier --write "**/*.ts"`

## Code Style Guidelines
- **TypeScript**: Use strict mode with proper type annotations
- **Imports**: Use ES modules syntax (import/export)
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces
- **Types**: Prefer interfaces for object types, avoid `any`
- **Error Handling**: Use async/await with try/catch blocks
- **Nullability**: Leverage TypeScript's strict null checks
- **Comments**: Document public APIs and complex logic
- **Architecture**: Follow the MVC pattern for the music generation pipeline

## Project Structure
- Music generation pipeline with LLM interface
- Context management (Project, Group, Track, Clip hierarchy)
- MIDI processing utilities
- CLI/API interface for pipeline interaction

## LLM Integration
- Use `bunlib` library for LLM integration: `import { generate } from 'bunlib'`
- LLM call format: `generate(systemPrompt, userPrompt, modelConfig, options)`
- Supports multiple providers: OpenAI, Anthropic, Gemini, Vertex, Mistral, Ollama
- Configure with `LLMConfig`: `{ provider: "openai", model: "gpt-4o" }`
- Default provider now set to OpenAI for improved reliability

## Environment Variables
- ANTHROPIC_API_KEY: API key for Anthropic (Claude) models
- OPENAI_API_KEY: API key for OpenAI models
- MISTRAL_API_KEY: API key for Mistral models
- GOOGLE_API_KEY: API key for Gemini models
- DEEPSEEK_API_KEY: API key for DeepSeek models
- OLLAMA_ENDPOINT: Endpoint for Ollama (e.g., http://localhost:11434)
- LLM_PROVIDER: Default LLM provider to use (e.g., "mistral", "anthropic")
- LLM_MODEL: Default model to use with the provider
- OUTPUT_DIR: Directory for MIDI file output
- MAX_CONCURRENT_REQUESTS: Limit for concurrent LLM calls

## Testing Different Providers
- Test with Mistral: `bun run test-mistral` or `bun run test-mistral-cli`
- Test with OpenAI: `bun run test-openai`
- Run simple one-clip test: `bun run simple-test`
- List all providers: `bun run list-providers`
- Switch providers with environment variables: `LLM_PROVIDER=mistral LLM_MODEL=mistral-large-latest bun run test-llm`

## MIDI Tools
- Generate a known-good MIDI file: `bun run generate-good-midi`
- Generate a test melody: `bun run generate-test-melody`
- Analyze a MIDI file: `bun run analyze-midi <file.mid>`
- Validate a MIDI file with LLM: `bun run validate-midi <file.mid>` (options: `--quick`, `--output=path`)
- Fix a MIDI file: `bun run fix-midi <file.mid> [output-path]`
- Fix track lengths: `bun run midi-track-fixer <file.mid> [output-path]`
- Play a MIDI file: `bun run play <file.mid>`
- Try two-phase generation: `bun run two-phase-test`
- Summarize log files: `bun run summarize-log <log-file> [output-path]`

## Current Progress
- Core pipeline is working for single clip generation
- MIDI playback now fixed with proper soundfont configuration
- Support for multiple LLM providers with OpenAI as default
- Advanced MIDI validation and analysis tools in place
- LLM-based MIDI validation with fail-safe file handling
- Two-step validation to reduce token usage and latency
- Simplified single-track Format 0 MIDI generation
- Two-phase generation with validation feedback and retries
- Log summarization with concise human-friendly output
- Debug logging for LLM inputs/outputs
- Next steps in TODO.md file
- Comprehensive documentation in docs/ directory

## Development Workflow

### Before Starting Work
- Read the documentation in the docs/ directory to understand the system
- Review the TODO.md file to see planned improvements
- Run tests to verify your environment is set up correctly: `bun run simple-test`

### During Development
- Use the two-phase generation approach for better results
- Enable debug mode for detailed logging when troubleshooting
- Validate generated MIDI files using the validation tools
- Follow the TypeScript code style guidelines

### Before Committing
- Run typechecking: `bun run typecheck`
- Format code: `bun run format`
- Test your changes with different LLM providers if applicable
- Update documentation if adding new features
