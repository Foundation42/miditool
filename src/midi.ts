/**
 * MIDI utilities for the music generation pipeline
 */
import { writeFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Convert a hex string to a Uint8Array
 * 
 * @param hexString - String of hex values (e.g. "4D 54 68 64 00 00 00 06")
 * @returns Uint8Array of bytes
 */
export function hexToBytes(hexString: string): Uint8Array {
  // Remove any whitespace or special characters
  const cleanHex = hexString.replace(/[\s\n]+/g, "");
  
  // Check if the string has an odd number of characters
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Hex string must have an even number of characters");
  }
  
  // Parse the hex string into bytes
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byteValue = parseInt(cleanHex.substr(i, 2), 16);
    if (isNaN(byteValue)) {
      throw new Error(`Invalid hex sequence at position ${i}: ${cleanHex.substr(i, 2)}`);
    }
    bytes[i / 2] = byteValue;
  }
  
  return bytes;
}

/**
 * Convert a Uint8Array to a hex string
 * 
 * @param bytes - Uint8Array of bytes
 * @returns String of hex values separated by spaces
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join(" ");
}

/**
 * Check if a byte array is a valid MIDI file
 * 
 * @param bytes - Uint8Array of MIDI data
 * @returns True if valid MIDI, false otherwise
 */
export function isValidMidi(bytes: Uint8Array): boolean {
  // MIDI files should start with MThd
  if (bytes.length < 4) return false;
  
  const header = new Uint8Array(bytes.slice(0, 4));
  const headerStr = String.fromCharCode(...header);
  
  return headerStr === "MThd";
}

/**
 * Save MIDI data to a file
 * 
 * @param midiData - MIDI data as Uint8Array
 * @param filePath - Path to save the file
 */
export async function saveMidiFile(midiData: Uint8Array, filePath: string): Promise<string> {
  try {
    // Ensure the directory exists
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Check that we have valid MIDI data
    if (!isValidMidi(midiData)) {
      throw new Error("Invalid MIDI data");
    }
    
    // Write the MIDI file
    await writeFile(filePath, midiData);
    console.log(`MIDI file saved to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Error saving MIDI file:", error);
    throw error;
  }
}

/**
 * Create a simple MIDI file with a single note
 * 
 * This can be used for testing when no real MIDI data is available
 * 
 * @returns Uint8Array with a simple MIDI file
 */
export function createTestMidiFile(): Uint8Array {
  // A very basic MIDI file with a single C4 note
  const midiHex = `
    4D 54 68 64 00 00 00 06 00 01 00 01 01 E0 
    4D 54 72 6B 00 00 00 14 
    00 90 3C 64 
    83 60 80 3C 00 
    00 FF 2F 00
  `;
  
  return hexToBytes(midiHex);
}