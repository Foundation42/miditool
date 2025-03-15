/**
 * Simple test for the updated MIDI generation pipeline
 */
import { MusicGenerationPipeline } from "../src/pipeline";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Output directory
const OUTPUT_DIR = "./output/simple-test";

// Create output directory if it doesn't exist
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Create a simple test and generate a single clip
 */
async function runSimpleTest() {
  console.log("Running simple MIDI generation test...");
  
  // Create a pipeline with debug mode enabled
  const pipeline = new MusicGenerationPipeline({
    outputDir: OUTPUT_DIR,
    maxConcurrentRequests: 1,
    debug: true // Enable debug logging
  });
  
  // Create a minimal project structure
  const project = pipeline.createProject("Simple Test", {
    description: "A simple test project",
    style: "Classical",
    tempo: 120,
    key: "C major",
    timeSignature: "4/4"
  });
  
  // Create a single group
  const group = pipeline.createGroup(project, "Piano", {
    role: "solo",
    description: "Solo piano piece"
  });
  
  // Create a single track
  const track = pipeline.createTrack(group, "Piano", "Grand Piano", {
    description: "Solo piano track"
  });
  
  // Create a single clip
  const clip = pipeline.createClip(track, "Simple Melody", 0, 8, {
    description: "A simple C major melody with clear rhythm and dynamics"
  });
  
  // Generate the clip
  console.log("Generating clip...");
  try {
    const startTime = Date.now();
    const updatedClip = await pipeline.generateClip(project, group, track, clip);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Generated clip in ${elapsedTime} seconds`);
    console.log(`Idea: ${updatedClip.prompt?.substring(0, 100)}...`);
    
    // Print the MIDI file path for easy playback testing
    const midiFilePath = join(OUTPUT_DIR, project.id, group.id, track.id, `${clip.id}.mid`);
    console.log(`\nTo play the generated MIDI file:`);
    console.log(`bun run play ${midiFilePath}`);
    
  } catch (error) {
    console.error("❌ Error generating clip:", error);
  }
}

// Run the test
runSimpleTest().catch(error => {
  console.error("Unhandled error:", error);
});