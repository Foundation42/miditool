/**
 * Simple test for two-phase MIDI generation
 * 
 * This script tests the improved two-phase MIDI generation process
 * with validation and retry capabilities
 */
import { MusicGenerationPipeline } from "../src/pipeline";
import { config } from "dotenv";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

// Load environment variables
config();

// Set output directory
const OUTPUT_DIR = "./output/two-phase-test";

async function runTest() {
  console.log("Running two-phase MIDI generation test...");
  
  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });
  
  // Initialize the pipeline
  const pipeline = new MusicGenerationPipeline({
    outputDir: OUTPUT_DIR,
    maxConcurrentRequests: 1,
    debug: true
  });
  
  // Create a test project
  const project = pipeline.createProject("Two-Phase Test", {
    description: "Testing the two-phase MIDI generation approach",
    style: "Classical",
    tempo: 120,
    key: "C major",
    timeSignature: "4/4"
  });
  
  // Create a group
  const group = pipeline.createGroup(project, "Piano", {
    role: "melody"
  });
  
  // Create a track
  const track = pipeline.createTrack(group, "Piano Track", "Piano");
  
  // Create a clip
  const clip = pipeline.createClip(track, "Simple Melody", 0, 8, {
    description: "A simple piano melody with clear note-on/note-off pairs"
  });
  
  console.log("Starting two-phase generation with validation and retries...");
  console.log("Project:", project.name);
  console.log("Group:", group.name);
  console.log("Track:", track.name);
  console.log("Clip:", clip.name);
  
  try {
    // Generate the clip using the two-phase approach
    const result = await pipeline.generateClipTwoPhase(project, group, track, clip, 3);
    
    console.log("Generation completed successfully!");
    console.log(`MIDI data length: ${result.midiData?.length || 0} characters`);
    console.log(`Raw MIDI bytes: ${result.rawMidiBytes?.length || 0} bytes`);
    
    // Success message
    console.log("\n✅ Test completed successfully");
    console.log(`Output files can be found in: ${OUTPUT_DIR}`);
    console.log(`To play the generated MIDI file: bun run play ${join(OUTPUT_DIR, project.id, group.id, track.id, clip.id + '.mid')}`);
  } catch (error) {
    console.error("Error during two-phase test:", error);
  }
}

// Run the test if executed directly
if (require.main === module) {
  runTest().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}