/**
 * MIDI Hex Validator
 * 
 * Uses an LLM to validate and analyze MIDI hex data
 */
import { generate } from "bunlib";
import { writeFile } from "node:fs/promises";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

// The system prompt for MIDI validation
const VALIDATION_SYSTEM_PROMPT = `You are a MIDI protocol expert who can analyze, validate, and debug MIDI files represented in hex format.

Analyze the provided MIDI hex data for technical correctness according to the MIDI specification.
Focus on these critical aspects:
1. Header structure (MThd and MTrk chunks)
2. Proper pairing of note-on and note-off events
3. Correct track length values
4. Presence of end-of-track markers
5. Proper delta time values
6. Appropriate program change events

Provide a detailed assessment that:
- Identifies any structural or logical errors
- Explains why each issue is problematic
- Recommends specific fixes for each issue

Be extremely precise, technical, and thorough in your analysis.`;

/**
 * Validate MIDI hex data using an LLM
 * 
 * @param midiHex - MIDI data in hex format
 * @param outputPath - Optional path to save validation results
 * @returns Validation analysis
 */
export async function validateMidiHex(
  midiHex: string, 
  outputPath?: string
): Promise<string> {
  console.log("Validating MIDI hex data with LLM...");
  
  try {
    // Format the hex data for analysis
    const userPrompt = `Please analyze the following MIDI hex data for correctness and identify any issues:

\`\`\`
${midiHex}
\`\`\`

Specifically check:
1. Are note-on (9n) events properly paired with note-off (8n) events?
2. Are delta times used correctly?
3. Is the header structure valid?
4. Are program change events present?
5. Are there any other issues that would prevent proper playback?

Provide specific recommendations for fixing any problems.`;

    // Call the LLM for validation
    console.log("Requesting LLM validation...");
    const response = await generate(
      VALIDATION_SYSTEM_PROMPT,
      userPrompt,
      { provider: "mistral", model: "mistral-large-latest" },
      { temperature: 0.2 }
    );
    
    const analysis = response.text;
    
    // Save the analysis if outputPath is provided
    if (outputPath) {
      // Ensure the directory exists
      const dir = dirname(outputPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      // Create formatted output
      const formattedOutput = `
================ MIDI VALIDATION REPORT ================
${analysis}
================ END OF REPORT ================
`;
      
      await writeFile(outputPath, formattedOutput, "utf-8");
      console.log(`MIDI validation report saved to ${outputPath}`);
    }
    
    return analysis;
  } catch (error) {
    console.error("Error validating MIDI hex data:", error);
    throw error;
  }
}

// Run as standalone script if called directly
if (require.main === module) {
  // Check if a file path is provided
  if (process.argv.length < 3) {
    console.error('Please provide a MIDI hex string or file with hex data');
    console.error('Usage: bun run validate-midi-hex.ts "4D 54 68 64..."');
    process.exit(1);
  }
  
  // Get the hex data from command line arguments
  const midiHex = process.argv[2];
  
  // Optional output path
  const outputPath = process.argv[3];
  
  // Run validation
  validateMidiHex(midiHex, outputPath)
    .then(analysis => {
      console.log("\nMIDI Validation Analysis:");
      console.log(analysis);
    })
    .catch(error => {
      console.error('Error running MIDI validation:', error);
    });
}