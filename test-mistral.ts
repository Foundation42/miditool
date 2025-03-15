/**
 * Test script for using Mistral with MIDITool
 */
import { config as loadEnv } from "dotenv";
import { callLLM } from "./src/llm";
import { MusicGenerationPipeline } from "./src/pipeline";
import { join } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

// Load environment variables
loadEnv();

// Output directory
const OUTPUT_DIR = "./output/mistral-test";

// Create output directory if it doesn't exist
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Mistral model configuration
const MISTRAL_CONFIG = {
  provider: "mistral",
  model: "mistral-large-latest"
};

/**
 * Test basic Mistral LLM interaction
 */
async function testMistralLLM() {
  console.log("Testing basic Mistral LLM interaction...");
  
  try {
    const response = await callLLM(
      "You are a helpful assistant with expertise in music.",
      "Write a short paragraph about the importance of rhythm in music.",
      MISTRAL_CONFIG
    );
    
    console.log("✅ Mistral response:");
    console.log(response);
    
    // Save the response to a file
    writeFileSync(
      join(OUTPUT_DIR, "mistral-response.txt"),
      response,
      "utf-8"
    );
    
    return true;
  } catch (error) {
    console.error("❌ Error with Mistral LLM:", error);
    return false;
  }
}

/**
 * Test generating a clip with Mistral
 */
async function testMistralClipGeneration() {
  console.log("Testing Mistral for clip generation...");
  
  try {
    // Create pipeline with Mistral configuration
    const pipeline = new MusicGenerationPipeline({
      outputDir: OUTPUT_DIR,
      maxConcurrentRequests: 1,
      stages: [
        {
          name: "idea-generation",
          systemPrompt: `You are an expert music composer. Your task is to generate creative ideas for a MIDI clip
based on the provided context (project, group, track). Respond with a detailed paragraph describing the musical 
ideas that would work well for this context. Consider rhythm, melody, harmony, and how it fits into the overall project.`,
          modelConfig: MISTRAL_CONFIG
        },
        {
          name: "midi-generation",
          systemPrompt: `You are an expert MIDI composer. Your task is to generate a MIDI file based on the provided
musical idea and context. Respond with a complete hex dump of a valid MIDI file. The hex dump should be
formatted with bytes separated by spaces. Make sure the MIDI file starts with the header "4D 54 68 64" and
follows the standard MIDI file format. Only include the hex bytes in your response, no explanations or text.`,
          modelConfig: MISTRAL_CONFIG
        }
      ]
    });
    
    // Create a simple project
    const project = pipeline.createProject("Mistral Test Project", {
      description: "A test project for Mistral",
      style: "Jazz",
      tempo: 110,
      key: "F major",
      timeSignature: "4/4"
    });
    
    // Add a group
    const group = pipeline.createGroup(project, "Rhythm Section", {
      role: "rhythm",
      description: "The rhythm section for the jazz piece"
    });
    
    // Add a track
    const track = pipeline.createTrack(group, "Piano", "Grand Piano", {
      description: "Jazz piano comping"
    });
    
    // Add a clip
    const clip = pipeline.createClip(track, "Piano Comp", 0, 4, {
      description: "Basic piano comping pattern in F major"
    });
    
    // Generate the clip
    console.log("Generating clip with Mistral...");
    const generatedClip = await pipeline.generateClip(project, group, track, clip);
    
    console.log("✅ Clip generated successfully");
    console.log(`Musical idea: ${generatedClip.prompt}`);
    console.log(`MIDI file saved to: ${OUTPUT_DIR}/${project.id}/${group.id}/${track.id}/${clip.id}.mid`);
    
    // Save the project for reference
    writeFileSync(
      join(OUTPUT_DIR, "mistral-project.json"),
      JSON.stringify(project, null, 2),
      "utf-8"
    );
    
    return true;
  } catch (error) {
    console.error("❌ Error generating clip with Mistral:", error);
    return false;
  }
}

/**
 * Run the Mistral tests
 */
async function runMistralTests() {
  // Test basic interaction first
  const basicTestSuccess = await testMistralLLM();
  
  if (basicTestSuccess) {
    // If basic test succeeds, try generating a clip
    await testMistralClipGeneration();
  } else {
    console.log("Skipping clip generation due to basic test failure");
  }
}

// Run the tests
runMistralTests().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});