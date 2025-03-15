# CLAUDE.md - Project Guidelines for Miditool

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
- Configure with `LLMConfig`: `{ provider: "anthropic", model: "claude-3-7-sonnet-20250219" }`

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
- Test with Mistral: `bun run test-mistral`
- Switch providers with environment variables: `LLM_PROVIDER=mistral LLM_MODEL=mistral-large-latest bun run test-llm`