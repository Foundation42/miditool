/**
 * Simple test script for the MIDITool
 */
import { config as loadEnv } from "dotenv";
import { createTestMidiFile, saveMidiFile } from "./src/midi";
import { testLLMConnection } from "./src/llm";
import { MusicGenerationPipeline } from "./src/pipeline";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

// Load environment variables
loadEnv();

// Output directory
const OUTPUT_DIR = "./output";

// Create output directory if it doesn't exist
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Test the MIDI utilities
 */
async function testMidi() {
  console.log("Testing MIDI utilities...");
  
  try {
    // Create a test MIDI file
    const midiData = createTestMidiFile();
    const outputPath = join(OUTPUT_DIR, "test.mid");
    
    // Save the MIDI file
    await saveMidiFile(midiData, outputPath);
    console.log(`✅ Test MIDI file saved to ${outputPath}`);
  } catch (error) {
    console.error("❌ Error creating test MIDI file:", error);
  }
}

/**
 * Test creating a project
 */
function testCreateProject() {
  console.log("Testing project creation...");
  
  // Create pipeline
  const pipeline = new MusicGenerationPipeline({
    outputDir: OUTPUT_DIR
  });
  
  // Create a project
  const project = pipeline.createProject("Test Project", {
    description: "A test project",
    style: "Electronic",
    tempo: 120,
    key: "C minor",
    timeSignature: "4/4"
  });
  
  // Create a group
  const group = pipeline.createGroup(project, "Test Group", {
    role: "melody"
  });
  
  // Create a track
  const track = pipeline.createTrack(group, "Test Track", "Synth", {
    description: "A test track"
  });
  
  // Create a clip
  const clip = pipeline.createClip(track, "Test Clip", 0, 4, {
    description: "A test clip"
  });
  
  console.log("✅ Project structure created");
  console.log(JSON.stringify(project, null, 2));
}

/**
 * Run tests
 */
async function runTests() {
  // Test MIDI utilities
  await testMidi();
  
  // Test project creation
  testCreateProject();
  
  // Test LLM connection (only run if API key is set)
  if (process.env.ANTHROPIC_API_KEY) {
    console.log("Testing LLM connection...");
    const success = await testLLMConnection();
    
    if (success) {
      console.log("✅ LLM connection successful");
    } else {
      console.error("❌ LLM connection failed");
    }
  } else {
    console.log("⚠️ Skipping LLM test (no API key set)");
  }
}

// Run tests
runTests().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});