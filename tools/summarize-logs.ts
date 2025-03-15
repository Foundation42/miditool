/**
 * Summarize Log Files with LLM
 * 
 * This tool uses an LLM to read log files and create human-friendly summaries
 */
import { generate } from "bunlib";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";

const SUMMARIZE_SYSTEM_PROMPT = `You are an expert at analyzing and summarizing technical log files.
Your task is to analyze the provided log content and create a concise, human-friendly summary.

Focus on these aspects:
1. Identify the main purpose or context of the log
2. Extract the most important information, events, or errors
3. Summarize any technical issues or successful operations
4. Provide key metrics or statistics if present

Format your response as follows:
- START with a one-line summary of what the log represents
- Include a "Key Findings" section with bullet points of the most important details
- If errors are present, include a "Issues" section with explanations
- If metrics are present, include a "Metrics" section
- Add a "Recommendations" section if you can provide helpful suggestions based on the log content

Keep your summary concise and focus on information that would be most valuable to a developer or engineer.`;

/**
 * Summarize log file content using an LLM
 * 
 * @param logContent - The content of the log file to summarize
 * @returns A human-friendly summary of the log file
 */
async function summarizeLogContent(logContent: string): Promise<string> {
  console.log("Generating log summary...");
  
  try {
    // If the log content is too large, truncate it
    const maxLogLength = 15000; // Characters
    const truncatedLog = logContent.length > maxLogLength 
      ? logContent.substring(0, maxLogLength) + "\n[... log truncated due to size ...]"
      : logContent;
    
    // Prepare the prompt
    const userPrompt = `Please summarize the following log content:

\`\`\`
${truncatedLog}
\`\`\`

Create a concise summary that highlights the most important information.`;

    // Call the LLM
    const response = await generate(
      SUMMARIZE_SYSTEM_PROMPT,
      userPrompt,
      { provider: "mistral", model: "mistral-large-latest" },
      { temperature: 0.3 }
    );
    
    return response.text;
  } catch (error) {
    console.error("Error summarizing log content:", error);
    return "Error generating summary. See console for details.";
  }
}

/**
 * Summarize a log file and optionally save the summary
 * 
 * @param logFilePath - Path to the log file
 * @param outputPath - Optional path to save the summary
 * @returns The generated summary
 */
export async function summarizeLogFile(
  logFilePath: string,
  outputPath?: string
): Promise<string> {
  try {
    // Check if the file exists
    if (!existsSync(logFilePath)) {
      throw new Error(`Log file not found: ${logFilePath}`);
    }
    
    // Read the log file
    console.log(`Reading log file: ${logFilePath}`);
    const logContent = await readFile(logFilePath, "utf-8");
    
    // Generate summary
    const summary = await summarizeLogContent(logContent);
    
    // Save the summary if outputPath is provided
    if (outputPath) {
      await writeFile(outputPath, summary, "utf-8");
      console.log(`Summary saved to: ${outputPath}`);
    }
    
    return summary;
  } catch (error) {
    console.error("Error processing log file:", error);
    throw error;
  }
}

// Run as standalone script if called directly
if (require.main === module) {
  // Check for help flag first
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Log Summarization Tool');
    console.log('---------------------');
    console.log('This tool summarizes log files to create human-friendly reports.');
    console.log('');
    console.log('Usage: bun run summarize-logs.ts <path-to-log-file> [output-path]');
    console.log('');
    console.log('Arguments:');
    console.log('  <path-to-log-file>: Path to the log file to summarize');
    console.log('  [output-path]: Optional path to save the summary (defaults to <input-file>.summary.txt)');
    console.log('');
    console.log('Examples:');
    console.log('  bun run summarize-logs.ts logs/validation.log');
    console.log('  bun run summarize-logs.ts logs/validation.log summary.txt');
    process.exit(0);
  }
  
  // Check if a file path is provided
  if (process.argv.length < 3) {
    console.error('Please provide a log file path to summarize');
    console.error('Usage: bun run summarize-logs.ts <path-to-log-file> [output-path]');
    console.error('Run with --help for more information');
    process.exit(1);
  }
  
  // Get the log file path from command line arguments
  const logFilePath = process.argv[2];
  
  // Default output path adds .summary.txt to the original file name
  const defaultOutputPath = logFilePath + '.summary.txt';
  
  // Get output path from command line arguments or use default
  const outputPath = process.argv[3] || defaultOutputPath;
  
  // Run summarization
  summarizeLogFile(logFilePath, outputPath)
    .then(summary => {
      console.log("\nLog Summary:");
      console.log(summary);
    })
    .catch(error => {
      console.error('Error summarizing log file:', error);
      process.exit(1);
    });
}