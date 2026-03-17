import fs from 'fs';

// Read the file
const filePath = './server/intakeStateMachine.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Find all return statements in processIntakeMessage function that aren't already wrapped
// Pattern: return { assistantMessage: "...", ...}
// Replace with: const response = { assistantMessage: "...", ...}; addToMessageHistory(state, "assistant", response.assistantMessage); return response;

// Split content by lines
const lines = content.split('\n');
const result = [];
let inProcessFunction = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Track if we're inside processIntakeMessage
  if (line.includes('export function processIntakeMessage')) {
    inProcessFunction = true;
    braceCount = 0;
  }
  
  if (inProcessFunction) {
    // Count braces to know when function ends
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;
    
    if (braceCount === 0 && line.includes('}')) {
      inProcessFunction = false;
    }
  }
  
  // Check if this is a return statement that needs wrapping
  if (inProcessFunction && line.trim().startsWith('return {') && !lines[i-1]?.includes('const response =')) {
    // This return needs wrapping
    const indent = line.match(/^(\s*)/)[1];
    
    // Find the closing brace of this return statement
    let returnLines = [line];
    let returnBraceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    let j = i + 1;
    
    while (returnBraceCount > 0 && j < lines.length) {
      returnLines.push(lines[j]);
      returnBraceCount += (lines[j].match(/{/g) || []).length;
      returnBraceCount -= (lines[j].match(/}/g) || []).length;
      j++;
    }
    
    // Replace "return {" with "const response = {"
    returnLines[0] = returnLines[0].replace('return {', 'const response = {');
    
    // Add the wrapped lines
    result.push(...returnLines);
    result.push(`${indent}addToMessageHistory(state, "assistant", response.assistantMessage);`);
    result.push(`${indent}return response;`);
    
    // Skip the lines we already processed
    i = j - 1;
  } else {
    result.push(line);
  }
}

// Write back
fs.writeFileSync(filePath, result.join('\n'), 'utf-8');
console.log('✅ Wrapped all return statements with message tracking');
