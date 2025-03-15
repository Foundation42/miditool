/**
 * Full pipeline test for MIDITool with Mistral
 * 
 * This script creates a more complex project and generates MIDI for all clips
 */
import { config as loadEnv } from "dotenv";
import { MusicGenerationPipeline } from "../src/pipeline";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Load environment variables
loadEnv();

// Output directory
const OUTPUT_DIR = "./output/full-pipeline-test";

// Create output directory
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Create and generate a complex music project
 */
async function runFullPipelineTest() {
  console.log("Starting full pipeline test with Mistral...");
  
  // Create a pipeline with Mistral as the LLM provider
  const pipeline = new MusicGenerationPipeline({
    outputDir: OUTPUT_DIR,
    maxConcurrentRequests: 1 // Process one at a time for better observation
  });
  
  // Create a new project
  const project = pipeline.createProject("Mistral Full Project", {
    description: "A complex project to test the full pipeline with Mistral",
    style: "Electronic Pop",
    tempo: 125,
    key: "G minor",
    timeSignature: "4/4"
  });
  
  console.log(`Created project: ${project.name}`);
  
  // Create rhythm group
  const rhythmGroup = pipeline.createGroup(project, "Rhythm Section", {
    role: "rhythm",
    description: "The backbone rhythmic elements"
  });
  
  // Create melody group
  const melodyGroup = pipeline.createGroup(project, "Melody Section", {
    role: "melody",
    description: "Lead melodic elements"
  });
  
  // Create ambient group
  const ambientGroup = pipeline.createGroup(project, "Ambient Textures", {
    role: "texture",
    description: "Atmospheric and textural elements"
  });
  
  console.log("Created groups:", project.groups.map(g => g.name).join(", "));
  
  // Add tracks to rhythm group
  const drumsTrack = pipeline.createTrack(rhythmGroup, "Drums", "Electronic Drums", {
    description: "Electronic drum kit with 808-style sounds"
  });
  
  const bassTrack = pipeline.createTrack(rhythmGroup, "Bass", "Synth Bass", {
    description: "Deep, pulsing synthesizer bass"
  });
  
  // Add tracks to melody group
  const leadTrack = pipeline.createTrack(melodyGroup, "Lead Synth", "Analog Lead Synth", {
    description: "Main melodic synthesizer line"
  });
  
  const arpTrack = pipeline.createTrack(melodyGroup, "Arpeggiator", "Digital Arpeggiator", {
    description: "Rhythmic arpeggiated synthesizer patterns"
  });
  
  // Add tracks to ambient group
  const padTrack = pipeline.createTrack(ambientGroup, "Pad", "Atmospheric Pad", {
    description: "Lush, evolving pad sounds"
  });
  
  console.log("Created tracks for each group");
  
  // Add clips to drums track
  const drumIntroClip = pipeline.createClip(drumsTrack, "Drum Intro", 0, 8, {
    description: "Minimal drum pattern for the intro with just hi-hats and light kicks"
  });
  
  const drumVerseClip = pipeline.createClip(drumsTrack, "Drum Verse", 8, 16, {
    description: "Full drum pattern for the verse with kicks, snares, and hi-hats"
  });
  
  // Add clips to bass track
  const bassIntroClip = pipeline.createClip(bassTrack, "Bass Intro", 0, 8, {
    description: "Simple, pulsing bass pattern on the root note G"
  });
  
  const bassVerseClip = pipeline.createClip(bassTrack, "Bass Verse", 8, 16, {
    description: "Walking bass line in G minor with more movement"
  });
  
  // Add clips to lead track
  const leadVerseClip = pipeline.createClip(leadTrack, "Lead Verse", 8, 16, {
    description: "Catchy lead melody in G minor pentatonic scale"
  });
  
  // Add clips to arpeggiator track
  const arpIntroClip = pipeline.createClip(arpTrack, "Arp Intro", 0, 8, {
    description: "Gentle 16th-note arpeggios on Gm and Bb chords"
  });
  
  const arpVerseClip = pipeline.createClip(arpTrack, "Arp Verse", 8, 16, {
    description: "More complex arpeggios following Gm, Bb, Eb, D progression"
  });
  
  // Add clips to pad track
  const padIntroClip = pipeline.createClip(padTrack, "Pad Intro", 0, 16, {
    description: "Ethereal, evolving pad that slowly fades in and sustains a Gm9 chord"
  });
  
  console.log("Created clips for each track");
  
  // Save the project
  const projectFilePath = join(OUTPUT_DIR, "full-project.json");
  writeFileSync(
    projectFilePath,
    JSON.stringify(project, null, 2),
    "utf-8"
  );
  
  console.log(`Project saved to ${projectFilePath}`);
  
  // Generate MIDI for all clips
  console.log("\nGenerating MIDI for all clips...\n");
  
  // Process all clips in sequence
  for (const group of project.groups) {
    console.log(`Processing group: ${group.name}`);
    
    for (const track of group.tracks) {
      console.log(`Processing track: ${track.name}`);
      
      for (const clip of track.clips) {
        console.log(`\nGenerating clip: ${clip.name} in track: ${track.name}`);
        
        try {
          const startTime = Date.now();
          const updatedClip = await pipeline.generateClip(project, group, track, clip);
          const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
          
          console.log(`✅ Generated ${clip.name} (took ${elapsedTime}s)`);
          console.log(`Musical idea: ${updatedClip.prompt?.substring(0, 100)}...`);
        } catch (error) {
          console.error(`❌ Error generating clip ${clip.name}:`, error);
        }
      }
    }
  }
  
  // Save the updated project with generated data
  writeFileSync(
    join(OUTPUT_DIR, "full-project-generated.json"),
    JSON.stringify(project, null, 2),
    "utf-8"
  );
  
  console.log("\n✅ Full pipeline test complete!");
  console.log(`All generated MIDI files are in: ${OUTPUT_DIR}`);
}

// Create the tests directory if it doesn't exist
if (!existsSync("./tests")) {
  mkdirSync("./tests");
}

// Run the test
runFullPipelineTest().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});