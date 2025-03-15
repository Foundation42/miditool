/**
 * Generate a simple, loud test melody MIDI file
 */
import { hexToBytes, saveMidiFile } from "../src/midi";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Output directory
const OUTPUT_DIR = "./output/test-audio";

// Create output directory if it doesn't exist
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate a simple piano melody MIDI file
 */
async function generateTestMelody() {
  console.log("Generating test melody MIDI file...");
  
  // This is a MIDI file with a C major scale played on Piano (program 0)
  // It has high velocity (127) to ensure it's loud enough to hear
  const midiHex = `
    4D 54 68 64 00 00 00 06 00 01 00 02 01 E0
    
    4D 54 72 6B 00 00 00 14
    00 FF 58 04 04 02 18 08
    00 FF 51 03 07 A1 20
    00 FF 2F 00
    
    4D 54 72 6B 00 00 00 7F
    00 C0 00
    00 FF 04 0E 50 69 61 6E 6F 20 4D 65 6C 6F 64 79 00
    
    00 90 3C 7F
    60 80 3C 00
    
    00 90 3E 7F
    60 80 3E 00
    
    00 90 40 7F
    60 80 40 00
    
    00 90 41 7F
    60 80 41 00
    
    00 90 43 7F
    60 80 43 00
    
    00 90 45 7F
    60 80 45 00
    
    00 90 47 7F
    60 80 47 00
    
    00 90 48 7F
    60 80 48 00
    
    00 90 4C 7F
    83 60 80 4C 00
    
    00 FF 2F 00
  `;
  
  // Convert hex to binary
  const midiBytes = hexToBytes(midiHex);
  
  // Save the MIDI file
  const outputPath = join(OUTPUT_DIR, "piano-melody.mid");
  await saveMidiFile(midiBytes, outputPath);
  
  console.log(`✅ Generated test melody: ${outputPath}`);
  console.log("To play with timidity:");
  console.log(`timidity -A100 ${outputPath}`);
  console.log("\nTo play with fluidsynth:");
  console.log(`fluidsynth -i /usr/share/soundfonts/FluidR3_GM.sf2 ${outputPath}`);
}

// Run the generator
generateTestMelody().catch(error => {
  console.error("Error generating test melody:", error);
  process.exit(1);
});