# MIDITool TODO List

## Next Development Steps

### Core Functionality
- [ ] Add support for multi-track MIDI generation (e.g., drums, bass, melody in one file)
- [ ] Implement a caching system for LLM responses to avoid redundant calls
- [ ] Add support for generating an entire project at once (all clips in all tracks)
- [ ] Create a JSON export/import system for projects to support project sharing
- [ ] Implement proper error recovery for failed generations

### MIDI Engineering
- [ ] Add MIDI validation before saving to ensure complete, valid files
- [ ] Support MIDI merging/splitting for complex multi-instrument compositions
- [ ] Create a simple MIDI player component for web playback
- [ ] Add support for MIDI effects (quantization, humanization, etc.)
- [ ] Support for converting MIDI to/from other formats (e.g., MusicXML)

### UI/UX Improvements
- [ ] Create a basic web interface for the pipeline
- [ ] Add visualization for MIDI data (piano roll, notation view)
- [ ] Implement project management UI with drag-and-drop
- [ ] Add audio playback with soundfonts in the browser
- [ ] Create visualization for the generation pipeline stages

### Testing & Performance
- [ ] Add unit tests for core functionality
- [ ] Implement benchmarking for different LLM providers
- [ ] Add stress testing for large projects
- [ ] Optimize concurrent processing for better performance
- [ ] Implement progress tracking for long-running generations

### LLM & Prompt Engineering
- [ ] Fine-tune prompts for different musical styles
- [ ] Create specialized prompts for different instruments
- [ ] Experiment with different temperature settings
- [ ] Add support for more LLM providers
- [ ] Implement a feedback loop for improving generations based on user input

### Documentation
- [ ] Improve documentation for API and CLI usage
- [ ] Add tutorials for common use cases
- [ ] Create examples for different musical genres
- [ ] Add architecture diagrams for the pipeline
- [ ] Create a user guide for the web interface

## Current Status and Progress
The core music generation pipeline is now functional with:
- Hierarchical context model (Project/Group/Track/Clip)
- Multi-provider LLM support with preference for Mistral
- Working MIDI generation with reliable playback
- Basic CLI interface for testing and generation
- Utility tools for MIDI validation and repair

The next major focus should be on improving multi-track MIDI generation and implementing the caching system to reduce redundant LLM calls.