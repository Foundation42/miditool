#!/usr/bin/env bun
/**
 * MIDITool - AI-powered music generation pipeline
 * Main entry point
 */
import { MusicToolCLI } from "./src/cli";

// Create and run the CLI
const cli = new MusicToolCLI();
cli.run().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});