/**
 * Compare MIDI files for debugging
 * 
 * This tool compares a known-good MIDI file with an LLM-generated one
 * to identify potential issues
 */
import { readFile } from 'node:fs/promises';

/**
 * Load and compare MIDI files
 * 
 * @param goodMidiPath - Path to a known good MIDI file
 * @param testMidiPath - Path to test MIDI file
 */
async function compareMidiFiles(goodMidiPath: string, testMidiPath: string) {
  console.log(`Comparing known good MIDI: ${goodMidiPath}`);
  console.log(`With test MIDI: ${testMidiPath}`);
  
  try {
    // Read the MIDI files
    const goodMidiData = await readFile(goodMidiPath);
    const testMidiData = await readFile(testMidiPath);
    
    console.log(`\nFile sizes:`);
    console.log(`Good MIDI: ${goodMidiData.length} bytes`);
    console.log(`Test MIDI: ${testMidiData.length} bytes`);
    
    // Check headers
    const goodHeader = goodMidiData.slice(0, 14);
    const testHeader = testMidiData.slice(0, 14);
    
    console.log(`\nHeader comparison (first 14 bytes):`);
    console.log(`Good header: ${toHexString(goodHeader)}`);
    console.log(`Test header: ${toHexString(testHeader)}`);
    console.log(`Headers match: ${compareBuffers(goodHeader, testHeader)}`);
    
    // Find MThd marker in both files
    const mthdIndexGood = findMThdIndex(goodMidiData);
    const mthdIndexTest = findMThdIndex(testMidiData);
    
    console.log(`\nMThd position:`);
    console.log(`Good MIDI: ${mthdIndexGood}`);
    console.log(`Test MIDI: ${mthdIndexTest}`);
    
    // Find MTrk markers in both files
    const mtrkIndicesGood = findAllMTrkIndices(goodMidiData);
    const mtrkIndicesTest = findAllMTrkIndices(testMidiData);
    
    console.log(`\nMTrk positions:`);
    console.log(`Good MIDI: ${mtrkIndicesGood.join(', ')}`);
    console.log(`Test MIDI: ${mtrkIndicesTest.join(', ')}`);
    
    // Check for ASCII vs binary encoding issues
    const possibleAsciiEncoding = checkForAsciiEncoding(testMidiData);
    if (possibleAsciiEncoding) {
      console.log(`\n⚠️ WARNING: Test MIDI file may be ASCII encoded instead of binary`);
      console.log(`This would explain playback issues`);
    }
    
    // Check track chunk length values
    const trackLengthsGood = extractTrackLengths(goodMidiData, mtrkIndicesGood);
    const trackLengthsTest = extractTrackLengths(testMidiData, mtrkIndicesTest);
    
    console.log(`\nTrack chunk lengths:`);
    console.log(`Good MIDI: ${trackLengthsGood.join(', ')}`);
    console.log(`Test MIDI: ${trackLengthsTest.join(', ')}`);
    
    // Find events in both files
    console.log(`\nRandom sampling of bytes after track headers:`);
    if (mtrkIndicesGood.length > 0) {
      const goodSample = goodMidiData.slice(mtrkIndicesGood[0] + 8, mtrkIndicesGood[0] + 16);
      console.log(`Good MIDI track 1 sample: ${toHexString(goodSample)}`);
    }
    
    if (mtrkIndicesTest.length > 0) {
      const testSample = testMidiData.slice(mtrkIndicesTest[0] + 8, mtrkIndicesTest[0] + 16);
      console.log(`Test MIDI track 1 sample: ${toHexString(testSample)}`);
    }
    
    console.log(`\nOverall assessment:`);
    if (mthdIndexGood === 0 && mthdIndexTest === 0 && mtrkIndicesGood.length > 0 && mtrkIndicesTest.length > 0) {
      if (possibleAsciiEncoding) {
        console.log(`❌ The test MIDI file appears to be ASCII encoded rather than binary.`);
        console.log(`This is likely why it cannot be played.`);
      } else {
        console.log(`✅ Basic MIDI structure looks correct. The issue might be with specific events.`);
      }
    } else {
      console.log(`❌ The test MIDI file appears to have structural issues with headers.`);
    }
  } catch (error) {
    console.error(`Error comparing MIDI files:`, error);
  }
}

/**
 * Find the index of MThd in a buffer
 */
function findMThdIndex(buffer: Buffer): number {
  const pattern = Buffer.from([0x4D, 0x54, 0x68, 0x64]); // "MThd"
  return bufferIndexOf(buffer, pattern);
}

/**
 * Find all indices of MTrk in a buffer
 */
function findAllMTrkIndices(buffer: Buffer): number[] {
  const pattern = Buffer.from([0x4D, 0x54, 0x72, 0x6B]); // "MTrk"
  const indices: number[] = [];
  let index = bufferIndexOf(buffer, pattern);
  
  while (index !== -1) {
    indices.push(index);
    index = bufferIndexOf(buffer, pattern, index + 1);
  }
  
  return indices;
}

/**
 * Find binary pattern in buffer (similar to String.indexOf)
 */
function bufferIndexOf(buffer: Buffer, pattern: Buffer, start = 0): number {
  for (let i = start; i <= buffer.length - pattern.length; i++) {
    let found = true;
    for (let j = 0; j < pattern.length; j++) {
      if (buffer[i + j] !== pattern[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

/**
 * Convert buffer to hex string for display
 */
function toHexString(buffer: Buffer): string {
  return Array.from(buffer)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join(' ');
}

/**
 * Compare two buffers for equality
 */
function compareBuffers(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Check if the file might be ASCII encoded
 */
function checkForAsciiEncoding(buffer: Buffer): boolean {
  // Check if the first 100 bytes are all in ASCII printable range or common control chars
  const sampleSize = Math.min(100, buffer.length);
  let asciiCount = 0;
  
  for (let i = 0; i < sampleSize; i++) {
    // Check if byte is in ASCII range (0-127) and not a binary control code
    // except for common ones like CR, LF, tab, etc.
    const b = buffer[i];
    if ((b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13) {
      asciiCount++;
    }
  }
  
  // If most bytes look like ASCII, it might be ASCII encoded
  return (asciiCount / sampleSize) > 0.8;
}

/**
 * Extract track chunk lengths from MIDI file
 */
function extractTrackLengths(buffer: Buffer, trackIndices: number[]): number[] {
  return trackIndices.map(index => {
    // Track length is a 4-byte value after MTrk
    if (index + 8 <= buffer.length) {
      return (buffer[index + 4] << 24) | 
             (buffer[index + 5] << 16) | 
             (buffer[index + 6] << 8) | 
             buffer[index + 7];
    }
    return -1; // Invalid length
  });
}

// Check if file paths are provided
if (process.argv.length < 4) {
  console.error('Please provide paths to both MIDI files');
  console.error('Usage: bun run compare-midi.ts <good-midi-path> <test-midi-path>');
  process.exit(1);
}

// Get the file paths from command line arguments
const goodMidiPath = process.argv[2];
const testMidiPath = process.argv[3];

// Run the comparison
compareMidiFiles(goodMidiPath, testMidiPath).catch(error => {
  console.error('Error running MIDI comparison:', error);
});