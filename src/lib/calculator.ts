export function evaluateExpression(expression: string): string {
  try {
    // Replace visual operators with JS operators
    let sanitized = expression
      .replace(/Ã/g, '*')
      .replace(/Ã·/g, '/')
      .replace(/â/g, '-');
      
    // Handle percentages ending the expression: e.g., "50+50%" -> "50+(50*0.5)"
    // Basic implementation: replace "X%" with "(X/100)"
    sanitized = sanitized.replace(/([0-9.]+)%/g, '($1/100)');

    // Very basic safe-ish evaluation for strict math expressions
    // Only allow numbers and basic math operators
    if (!/^[0-9+\-*/(). ]+$/.test(sanitized)) {
      throw new Error("Invalid characters");
    }

    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${sanitized}`)();
    
    // Format to avoid long decimals (e.g. 0.1 + 0.2 = 0.30000000000000004)
    if (typeof result !== 'number' || !isFinite(result)) return 'Error';
    
    const formatted = parseFloat(result.toFixed(10)).toString();
    return formatted;
  } catch (err) {
    return 'Error';
  }
}
