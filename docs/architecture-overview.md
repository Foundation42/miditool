# MIDITool Architecture Overview

## System Architecture

MIDITool is an AI-powered music generation pipeline that creates MIDI files using Large Language Models (LLMs). The system follows a hierarchical context model and uses a multi-stage pipeline for generation.

### Core Components

1. **Context Hierarchy**
   - Project: Top-level container with global settings (tempo, key, style)
   - Group: Collection of related tracks (e.g., rhythm section, melody section)
   - Track: Individual instrument track with specific sound
   - Clip: Segment of MIDI data for a specific track

2. **Pipeline Stages**
   - Idea Generation: Creates musical ideas based on project context
   - MIDI Generation: Converts musical ideas into valid MIDI hex data
   - Validation: Ensures generated MIDI is valid and playable
   - Retry Logic: Improves generation based on validation feedback

3. **LLM Integration**
   - Multiple provider support (OpenAI, Anthropic, Mistral, etc.)
   - Environment-based configuration
   - Robust error handling and retry mechanisms

4. **MIDI Processing**
   - Hex-to-binary conversion
   - File operations and validation
   - Repair tools for common MIDI issues

## Key Files and Their Roles

### Core Pipeline Implementation

- **src/pipeline.ts**
  - `MusicGenerationPipeline` class: Central implementation
  - Two generation approaches:
    - `generateClip()`: Single-phase generation
    - `generateClipTwoPhase()`: Enhanced with validation and retries
  - Context management and hierarchy implementation

### LLM Integration

- **src/llm.ts**
  - Wrapper for LLM API interactions
  - Multi-provider support with configuration
  - `callLLM()`: Main function with retry logic
  - Debug logging of inputs/outputs

### MIDI Utilities

- **src/midi.ts**
  - Binary data conversion and manipulation
  - `hexToBytes()` / `bytesToHex()`: Format conversion
  - `saveMidiFile()`: File operations
  - Validation utilities

### Type Definitions

- **src/types.ts**
  - Core data model interfaces
  - Configuration types for pipeline and LLMs
  - Hierarchical music model definitions

### CLI Interface

- **src/cli.ts**
  - Command-line interface implementation
  - Commands for testing, generating, and managing MIDI
  - File operations and playback

## Generation Process

1. **Context Building**
   - Construct hierarchical context from project structure
   - Prepare detailed prompt with musical constraints

2. **Two-Phase Generation**
   - Phase 1: Generate musical ideas with descriptive prompts
   - Phase 2: Convert ideas to MIDI hex data
   - Validation: Two-step process (quick check then detailed analysis)
   - Feedback loop: Use validation results to improve generation

3. **MIDI Processing**
   - Convert hex to binary data
   - Validate track lengths and MIDI markers
   - Save to file system with proper naming

## Optimization Features

- Concurrent processing with rate limiting
- Detailed logging for debugging
- Automatic validation and repair tools
- Multiple LLM provider support for flexibility
- Two-phase generation with validation feedback

## Current Status

- Core pipeline is functional for single clip generation
- Two-phase generation implemented with validation and retries
- Advanced validation tools with LLM analysis
- Multiple LLM provider support with OpenAI as default
- Debug logging system for troubleshooting