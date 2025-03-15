# MIDITool Documentation

Welcome to the MIDITool documentation! This directory contains detailed information about the MIDITool project, including architecture, usage guides, and development instructions.

## Documentation Index

- [Architecture Overview](architecture-overview.md) - High-level description of the system design and components
- [User Guide](user-guide.md) - Instructions for users to install and use the tool
- [Developer Guide](developer-guide.md) - Information for developers working on or extending the project

## Quick Links

- [Project Repository](https://github.com/Foundation42/miditool)
- [TODO List](/TODO.md) - Future development roadmap
- [CLAUDE.md](/CLAUDE.md) - Project guidelines and command reference

## Features Overview

MIDITool is an AI-powered music generation pipeline that creates MIDI files using LLMs. Key features include:

- Multi-level context hierarchy (Project > Group > Track > Clip)
- Two-phase music generation with validation and retry
- Support for multiple LLM providers (OpenAI, Anthropic, Mistral, etc.)
- MIDI validation, repair, and analysis tools
- Command-line interface for easy interaction

## Getting Started

To quickly get started with MIDITool:

1. Install and configure the environment
   ```bash
   # Clone and setup
   git clone https://github.com/Foundation42/miditool.git
   cd miditool
   bun install
   
   # Set up environment
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. Run a simple test
   ```bash
   bun run simple-test
   ```

3. Play a generated MIDI file
   ```bash
   bun run play ./output/simple-test/*/FILENAME.mid
   ```

For more detailed instructions, check the [User Guide](user-guide.md).

## Contributing

Contributions to MIDITool are welcome! Please review the [Developer Guide](developer-guide.md) for information on development practices and how to extend the project.