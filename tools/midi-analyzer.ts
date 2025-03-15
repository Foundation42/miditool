/**
 * MIDI Analyzer Tool
 * 
 * Validates MIDI files and displays their content in a readable format
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { parseArrayBuffer } from 'midi-json-parser';
import * as MidiWriter from 'midi-writer-js';

// GM instrument names for reference
const GM_INSTRUMENTS = [
  // Piano (0-7)
  'Acoustic Grand Piano', 'Bright Acoustic Piano', 'Electric Grand Piano', 'Honky-tonk Piano',
  'Electric Piano 1', 'Electric Piano 2', 'Harpsichord', 'Clavinet',
  // Chromatic Percussion (8-15)
  'Celesta', 'Glockenspiel', 'Music Box', 'Vibraphone',
  'Marimba', 'Xylophone', 'Tubular Bells', 'Dulcimer',
  // Organ (16-23)
  'Drawbar Organ', 'Percussive Organ', 'Rock Organ', 'Church Organ',
  'Reed Organ', 'Accordion', 'Harmonica', 'Tango Accordion',
  // Guitar (24-31)
  'Acoustic Guitar (nylon)', 'Acoustic Guitar (steel)', 'Electric Guitar (jazz)', 'Electric Guitar (clean)',
  'Electric Guitar (muted)', 'Overdriven Guitar', 'Distortion Guitar', 'Guitar Harmonics',
  // Bass (32-39)
  'Acoustic Bass', 'Electric Bass (finger)', 'Electric Bass (pick)', 'Fretless Bass',
  'Slap Bass 1', 'Slap Bass 2', 'Synth Bass 1', 'Synth Bass 2',
  // Strings (40-47)
  'Violin', 'Viola', 'Cello', 'Contrabass',
  'Tremolo Strings', 'Pizzicato Strings', 'Orchestral Harp', 'Timpani',
  // Ensemble (48-55)
  'String Ensemble 1', 'String Ensemble 2', 'Synth Strings 1', 'Synth Strings 2',
  'Choir Aahs', 'Voice Oohs', 'Synth Choir', 'Orchestra Hit',
  // Brass (56-63)
  'Trumpet', 'Trombone', 'Tuba', 'Muted Trumpet',
  'French Horn', 'Brass Section', 'Synth Brass 1', 'Synth Brass 2',
  // Reed (64-71)
  'Soprano Sax', 'Alto Sax', 'Tenor Sax', 'Baritone Sax',
  'Oboe', 'English Horn', 'Bassoon', 'Clarinet',
  // Pipe (72-79)
  'Piccolo', 'Flute', 'Recorder', 'Pan Flute',
  'Blown Bottle', 'Shakuhachi', 'Whistle', 'Ocarina',
  // Synth Lead (80-87)
  'Lead 1 (square)', 'Lead 2 (sawtooth)', 'Lead 3 (calliope)', 'Lead 4 (chiff)',
  'Lead 5 (charang)', 'Lead 6 (voice)', 'Lead 7 (fifths)', 'Lead 8 (bass + lead)',
  // Synth Pad (88-95)
  'Pad 1 (new age)', 'Pad 2 (warm)', 'Pad 3 (polysynth)', 'Pad 4 (choir)',
  'Pad 5 (bowed)', 'Pad 6 (metallic)', 'Pad 7 (halo)', 'Pad 8 (sweep)',
  // Synth Effects (96-103)
  'FX 1 (rain)', 'FX 2 (soundtrack)', 'FX 3 (crystal)', 'FX 4 (atmosphere)',
  'FX 5 (brightness)', 'FX 6 (goblins)', 'FX 7 (echoes)', 'FX 8 (sci-fi)',
  // Ethnic (104-111)
  'Sitar', 'Banjo', 'Shamisen', 'Koto',
  'Kalimba', 'Bagpipe', 'Fiddle', 'Shanai',
  // Percussive (112-119)
  'Tinkle Bell', 'Agogo', 'Steel Drums', 'Woodblock',
  'Taiko Drum', 'Melodic Tom', 'Synth Drum', 'Reverse Cymbal',
  // Sound Effects (120-127)
  'Guitar Fret Noise', 'Breath Noise', 'Seashore', 'Bird Tweet',
  'Telephone Ring', 'Helicopter', 'Applause', 'Gunshot'
];

// Output directory for fixed files
const OUTPUT_DIR = "./output/midi-analysis";

// Create output directory if it doesn't exist
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Analyze a MIDI file and print detailed information
 * 
 * @param filePath - Path to the MIDI file
 */
async function analyzeMidiFile(filePath: string) {
  console.log(`Analyzing MIDI file: ${filePath}`);
  
  try {
    // Read the MIDI file
    console.log(`Reading file: ${filePath}`);
    const fileData = await readFile(filePath);
    console.log(`File size: ${fileData.length} bytes`);
    
    // Basic validation - MIDI files should start with "MThd"
    if (fileData.length < 4) {
      console.error("File is too small to be a valid MIDI file");
      return;
    }
    
    const header = fileData.slice(0, 4).toString('ascii');
    console.log(`File header: ${header}`);
    
    if (header !== 'MThd') {
      console.error("Not a valid MIDI file - missing MThd header");
      const hexHeader = Buffer.from(fileData.slice(0, 16)).toString('hex');
      console.log(`First 16 bytes: ${hexHeader}`);
      console.log("Attempting to fix the file...");
      return;
    }
    
    // Parse the MIDI file
    console.log("Parsing MIDI data...");
    const midiData = await parseArrayBuffer(fileData.buffer);
    
    // Basic MIDI info
    console.log(`\nMIDI Format: ${midiData.format}`);
    console.log(`Division: ${midiData.division} ticks per quarter note`);
    console.log(`Number of tracks: ${midiData.tracks.length}`);
    
    // Analyze each track
    midiData.tracks.forEach((track, index) => {
      console.log(`\n----- Track ${index + 1} -----`);
      
      // Count events
      let noteEvents = 0;
      let programChangeEvents = 0;
      let programNumbers = new Set<number>();
      let metaEvents = 0;
      
      // Track the instruments used
      let instrumentsUsed = new Set<number>();
      
      // Analyze events
      track.forEach(event => {
        if ('noteOn' in event) {
          noteEvents++;
        }
        if ('noteOff' in event) {
          noteEvents++;
        }
        if ('programChange' in event) {
          programChangeEvents++;
          const program = event.programChange.programNumber;
          programNumbers.add(program);
          instrumentsUsed.add(program);
        }
        if ('meta' in event) {
          metaEvents++;
        }
      });
      
      // Print event counts
      console.log(`Total events: ${track.length}`);
      console.log(`Note events: ${noteEvents}`);
      console.log(`Program changes: ${programChangeEvents}`);
      console.log(`Meta events: ${metaEvents}`);
      
      // Print instruments used
      if (instrumentsUsed.size > 0) {
        console.log('\nInstruments used:');
        instrumentsUsed.forEach(program => {
          console.log(`  Program ${program}: ${GM_INSTRUMENTS[program] || 'Unknown instrument'}`);
        });
      } else {
        console.log('No program changes found - using default instrument (Piano)');
      }
      
      // Check for issues
      if (programChangeEvents === 0) {
        console.log('\n⚠️ Warning: No program change events found in this track');
        console.log('   This could cause problems with playback as the default instrument will be used');
      }
      
      if (noteEvents === 0) {
        console.log('\n⚠️ Warning: No note events found in this track');
      }
    });
    
    // Check for potential issues
    const hasNoteEvents = midiData.tracks.some(track => 
      track.some(event => 'noteOn' in event || 'noteOff' in event)
    );
    
    const hasProgramChanges = midiData.tracks.some(track => 
      track.some(event => 'programChange' in event)
    );
    
    const hasEndOfTrack = midiData.tracks.every(track => 
      track.some(event => 
        'meta' in event && event.meta.type === 'endOfTrack'
      )
    );
    
    // Print summary with potential issues
    console.log('\n----- Summary -----');
    
    if (!hasNoteEvents) {
      console.log('❌ ERROR: No note events found in any track! This MIDI file will not produce sound.');
    }
    
    if (!hasProgramChanges) {
      console.log('⚠️ WARNING: No program change events found. Default instrument (piano) will be used.');
    }
    
    if (!hasEndOfTrack) {
      console.log('⚠️ WARNING: Not all tracks have an End of Track meta event.');
    }
    
    // Overall validation
    if (hasNoteEvents && hasEndOfTrack) {
      console.log('✅ MIDI file appears to be valid.');
    } else {
      console.log('❌ MIDI file has potential issues that may affect playback.');
    }
    
    // Offer to create a fixed version if there are issues
    if (!hasProgramChanges || !hasEndOfTrack) {
      console.log('\nWould you like to create a fixed version of this MIDI file? Run:');
      console.log(`bun run fix-midi ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error analyzing MIDI file: ${error}`);
    console.error('This may not be a valid MIDI file or it could be corrupted.');
  }
}

// Check if file path is provided
if (process.argv.length < 3) {
  console.error('Please provide a MIDI file path');
  console.error('Usage: bun run midi-analyzer.ts <path-to-midi-file>');
  process.exit(1);
}

// Get the file path from command line arguments
const filePath = process.argv[2];

// Run the analyzer
analyzeMidiFile(filePath).catch(error => {
  console.error('Error running MIDI analyzer:', error);
});