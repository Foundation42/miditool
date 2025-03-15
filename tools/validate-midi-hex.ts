/**
 * MIDI Hex Validator
 * 
 * Uses an LLM to validate and analyze MIDI hex data
 */
import { generate } from "bunlib";
import { writeFile } from "node:fs/promises";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

// System prompts for MIDI validation
const QUICK_VALIDATION_SYSTEM_PROMPT = `You are a MIDI protocol expert who quickly validates MIDI files in hex format.

Analyze the provided MIDI hex data for technical correctness according to the MIDI specification.
Focus on these critical aspects:
1. Header structure (MThd and MTrk chunks)
2. Proper pairing of note-on and note-off events
3. Correct track length values
4. Presence of end-of-track markers
5. Proper delta time values

Your response MUST ONLY contain "VALID" if the MIDI is valid, or "INVALID" if any issues are found.
Do not provide any explanation, just "VALID" or "INVALID".`;

const DETAILED_VALIDATION_SYSTEM_PROMPT = `You are a MIDI protocol expert who can analyze, validate, and debug MIDI files represented in hex format.

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
 * Quick validation of MIDI hex data to determine if it's valid
 * 
 * @param midiHex - MIDI data in hex format
 * @returns Boolean indicating if the MIDI data is valid
 */
export async function quickValidateMidiHex(midiHex: string): Promise<boolean> {
  console.log("Quick validation of MIDI hex data...");
  
  try {
    // Format the hex data for quick analysis
    const userPrompt = `Is this MIDI hex data valid? Reply ONLY with "VALID" or "INVALID".

\`\`\`
${midiHex}
\`\`\``;

    // Call the LLM for quick validation
    const response = await generate(
      QUICK_VALIDATION_SYSTEM_PROMPT,
      userPrompt,
      { provider: "mistral", model: "mistral-large-latest" },
      { temperature: 0.1 }
    );
    
    const result = response.text.trim().toUpperCase();
    return result === "VALID";
  } catch (error) {
    console.error("Error during quick MIDI validation:", error);
    return false; // Fail-safe: if validation errors out, consider it invalid
  }
}

/**
 * Detailed validation of MIDI hex data using an LLM
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
    // First perform quick validation
    const isValid = await quickValidateMidiHex(midiHex);
    
    if (isValid) {
      const validMessage = "MIDI data passed quick validation. No issues detected.";
      
      // Save the quick result if outputPath is provided
      if (outputPath) {
        const formattedOutput = `
================ MIDI VALIDATION REPORT ================
${validMessage}
================ END OF REPORT ================
`;
        
        // Ensure the directory exists
        const dir = dirname(outputPath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        
        await writeFile(outputPath, formattedOutput, "utf-8");
        console.log(`MIDI validation report saved to ${outputPath}`);
      }
      
      return validMessage;
    }
    
    // If quick validation failed, proceed with detailed validation
    console.log("Quick validation identified issues. Performing detailed validation...");
    
    // Format the hex data for detailed analysis
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

    // Call the LLM for detailed validation
    console.log("Requesting detailed LLM validation...");
    const response = await generate(
      DETAILED_VALIDATION_SYSTEM_PROMPT,
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
    console.error('Options:');
    console.error('  --quick: Only perform quick validation (faster)');
    console.error('  --output=<path>: Save validation report to the specified path');
    process.exit(1);
  }
  
  // Get the hex data from command line arguments
  const midiHex = process.argv[2];
  
  // Parse options
  const options = process.argv.slice(3);
  const quickMode = options.includes('--quick');
  const outputPath = options.find(opt => opt.startsWith('--output='))?.split('=')[1];
  
  // Run validation
  if (quickMode) {
    quickValidateMidiHex(midiHex)
      .then(isValid => {
        console.log("\nQuick MIDI Validation Result:");
        console.log(isValid ? "✅ VALID" : "❌ INVALID");
      })
      .catch(error => {
        console.error('Error running quick MIDI validation:', error);
      });
  } else {
    validateMidiHex(midiHex, outputPath)
      .then(analysis => {
        console.log("\nMIDI Validation Analysis:");
        console.log(analysis);
      })
      .catch(error => {
        console.error('Error running MIDI validation:', error);
      });
  }
}