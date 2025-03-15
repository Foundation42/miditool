/**
 * MIDI Track Length Fixer 
 * 
 * Fixes track length issues in MIDI files by recalculating and adjusting track lengths
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

/**
 * Find the index of a pattern in a buffer
 * 
 * @param buffer - Buffer to search in
 * @param pattern - Pattern to search for
 * @param start - Starting index (default: 0)
 * @returns Index of the pattern or -1 if not found
 */
function findPattern(buffer: Buffer, pattern: number[], start = 0): number {
  for (let i = start; i <= buffer.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (buffer[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

/**
 * Find all occurrences of a pattern in a buffer
 * 
 * @param buffer - Buffer to search in
 * @param pattern - Pattern to search for
 * @returns Array of indices where the pattern was found
 */
function findAllPatterns(buffer: Buffer, pattern: number[]): number[] {
  const results: number[] = [];
  let start = 0;
  let index: number;
  
  while ((index = findPattern(buffer, pattern, start)) !== -1) {
    results.push(index);
    start = index + 1;
  }
  
  return results;
}

/**
 * Fix track lengths in a MIDI file
 * 
 * @param inputPath - Path to the MIDI file to fix
 * @param outputPath - Path to save the fixed MIDI file (defaults to inputPath + '.fixed.mid')
 * @returns Path to the fixed MIDI file
 */
export async function fixMidiTrackLengths(
  inputPath: string,
  outputPath?: string
): Promise<string> {
  console.log(`Fixing track lengths in MIDI file: ${inputPath}`);
  
  try {
    // Set default output path if not provided
    if (!outputPath) {
      // Use the same directory, but add '.fixed.mid' to the filename
      const dir = dirname(inputPath);
      const file = basename(inputPath);
      outputPath = join(dir, `${file}.fixed.mid`);
    }
    
    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Read the MIDI file
    const midiData = await readFile(inputPath);
    
    // Find all MTrk chunks
    const mtrkPositions = findAllPatterns(midiData, [0x4D, 0x54, 0x72, 0x6B]);
    
    if (mtrkPositions.length === 0) {
      throw new Error("No MTrk chunks found in MIDI file");
    }
    
    // Create a new buffer to hold the fixed MIDI data
    const fixedMidiData = Buffer.from(midiData);
    
    // Fix each track length
    for (let i = 0; i < mtrkPositions.length; i++) {
      const trackStartPos = mtrkPositions[i];
      const lengthPos = trackStartPos + 4; // Position of length bytes
      const contentStartPos = trackStartPos + 8; // Position of track data start
      
      // Find the end of this track
      // If this is the last track, end is end of file, otherwise it's the start of the next track
      const trackEndPos = i < mtrkPositions.length - 1 
        ? mtrkPositions[i + 1] 
        : midiData.length;
      
      // Calculate the actual track length
      const actualLength = trackEndPos - contentStartPos;
      
      // Check if the track ends with an end-of-track marker
      const hasEndOfTrack = trackEndPos >= 3 && 
        midiData[trackEndPos - 3] === 0xFF && 
        midiData[trackEndPos - 2] === 0x2F && 
        midiData[trackEndPos - 1] === 0x00;
      
      if (!hasEndOfTrack && i === mtrkPositions.length - 1) {
        console.log(`  Track ${i + 1} is missing end-of-track marker, will append one`);
        
        // We'll add the marker when writing the file
      }
      
      // Read the current track length
      const currentLength = midiData.readUInt32BE(lengthPos);
      
      console.log(`Track ${i + 1}:`);
      console.log(`  Current length: ${currentLength}`);
      console.log(`  Actual length: ${actualLength}`);
      
      // Check if the length needs to be fixed
      if (currentLength !== actualLength) {
        console.log(`  Fixing track length from ${currentLength} to ${actualLength}`);
        
        // Write the correct length to the fixed data
        fixedMidiData.writeUInt32BE(actualLength, lengthPos);
      } else {
        console.log(`  Track length is correct`);
      }
    }
    
    // Check if we need to append an end-of-track marker to the last track
    const lastTrackPos = mtrkPositions[mtrkPositions.length - 1];
    const hasEndOfTrack = fixedMidiData.length >= 3 && 
      fixedMidiData[fixedMidiData.length - 3] === 0xFF && 
      fixedMidiData[fixedMidiData.length - 2] === 0x2F && 
      fixedMidiData[fixedMidiData.length - 1] === 0x00;
    
    let finalData = fixedMidiData;
    
    if (!hasEndOfTrack) {
      console.log("Adding missing end-of-track marker to the file");
      
      // Create a new buffer with the end-of-track marker appended
      finalData = Buffer.alloc(fixedMidiData.length + 3);
      fixedMidiData.copy(finalData, 0);
      
      // Append the end-of-track marker
      finalData[fixedMidiData.length] = 0xFF;
      finalData[fixedMidiData.length + 1] = 0x2F;
      finalData[fixedMidiData.length + 2] = 0x00;
      
      // Update the track length for the last track if needed
      const lengthPos = lastTrackPos + 4;
      const contentStartPos = lastTrackPos + 8;
      const actualLength = (finalData.length - contentStartPos);
      finalData.writeUInt32BE(actualLength, lengthPos);
    }
    
    // Save the fixed MIDI file
    await writeFile(outputPath, finalData);
    console.log(`✅ Fixed MIDI file saved to: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error(`Error fixing MIDI track lengths:`, error);
    throw error;
  }
}

// Run as a standalone script if called directly
if (require.main === module) {
  // Check if a file path is provided
  if (process.argv.length < 3) {
    console.error('Please provide a MIDI file path');
    console.error('Usage: bun run midi-track-fixer.ts <path-to-midi-file> [output-path]');
    process.exit(1);
  }
  
  // Get the file paths from command line arguments
  const inputPath = process.argv[2];
  const outputPath = process.argv.length > 3 ? process.argv[3] : undefined;
  
  // Run the fixer
  fixMidiTrackLengths(inputPath, outputPath).catch(error => {
    console.error('Error running MIDI track fixer:', error);
    process.exit(1);
  });
}