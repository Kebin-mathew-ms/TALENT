/**
 * Utility to extract clean, multi-line formatted source code from raw code strings or JSON code maps.
 */
export const extractDisplayCode = (rawCode, currentQuestionId = null) => {
  if (!rawCode) return '// No code recorded';

  let code = rawCode;

  // 1. If code is a JSON string or stringified JSON object map (e.g., {"5": "function..."})
  if (typeof code === 'string' && (code.trim().startsWith('{') || code.trim().startsWith('"'))) {
    try {
      const parsed = JSON.parse(code);
      if (typeof parsed === 'string') {
        code = parsed;
        // Handle double-stringified JSON if applicable
        if (typeof code === 'string' && (code.trim().startsWith('{') || code.trim().startsWith('"'))) {
          try {
            const inner = JSON.parse(code);
            if (typeof inner === 'object' && inner !== null) code = inner;
            else if (typeof inner === 'string') code = inner;
          } catch (err) {}
        }
      }

      if (typeof code === 'object' && code !== null) {
        if (currentQuestionId && code[currentQuestionId]) {
          code = code[currentQuestionId];
        } else {
          // If currentQuestionId is not specified or not in map, extract code for first available question
          const keys = Object.keys(code);
          if (keys.length > 0) {
            code = code[keys[0]];
          }
        }
      }
    } catch (e) {
      // Ignore parse failure, proceed with raw string
    }
  }

  // 2. Unescape escaped literal newlines (\n), tabs (\t), or quotes (\")
  if (typeof code === 'string') {
    if (code.includes('\\n')) {
      code = code.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, '  ').replace(/\\"/g, '"');
    }
    // Remove wrapping double quotes if whole string was quoted JSON string
    if (code.startsWith('"') && code.endsWith('"')) {
      code = code.slice(1, -1);
    }
  }

  return typeof code === 'string' ? code : JSON.stringify(code, null, 2);
};
