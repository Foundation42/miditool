/**
 * Generate a verified, standards-compliant MIDI file for testing
 */
import * as MidiWriter from 'midi-writer-js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

// Output directory for good MIDI files
const OUTPUT_DIR = "./output/good-midi";

// Create output directory if it doesn't exist
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Create a proper MIDI file with a piano track playing a C major scale
 */
async function generateGoodMidi() {
  console.log("Generating a standards-compliant MIDI file...");
  
  // Create a track
  const track = new MidiWriter.Track();
  
  // Add tempo (120 BPM)
  track.setTempo(120);
  
  // Add an instrument - Piano
  track.addEvent(new MidiWriter.ProgramChangeEvent({
    instrument: 0, // Piano
    channel: 1
  }));
  
  // Add notes - C major scale with high velocity
  const scale = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
  
  scale.forEach((note) => {
    track.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: "4", // Quarter note
      velocity: 100, // Loud
      channel: 1
    }));
  });
  
  // Create a chord
  const chord = new MidiWriter.NoteEvent({
    pitch: ["C4", "E4", "G4"],  // C major chord
    duration: "2",              // Half note
    velocity: 100,              // Loud
    channel: 1
  });
  
  track.addEvent(chord);
  
  // Create the MIDI writer with the track
  const writer = new MidiWriter.Writer([track]);
  
  // Build the MIDI file
  const data = writer.buildFile();
  
  // Save the file
  const outputPath = join(OUTPUT_DIR, "piano-scale.mid");
  await writeFile(outputPath, Buffer.from(data));
  
  console.log(`✅ Generated good MIDI file: ${outputPath}`);
  console.log("\nTo play with fluidsynth:");
  console.log(`fluidsynth -i /usr/share/soundfonts/FluidR3_GM.sf2 ${outputPath}`);
  console.log("\nTo play with timidity:");
  console.log(`timidity -A100 ${outputPath}`);
}

// Run the generator
generateGoodMidi().catch(error => {
  console.error("Error generating MIDI file:", error);
});