/**
 * Serialize config to be used in templates
 * @param obj Config object
 * @returns Stringified config with kept function expressions
 */
export const serializeConfig = (obj: unknown): string => {
  // Stringify function body
  if (typeof obj === 'function') {
    return obj.toString()
  }

  // Run recursively on objects and arrays
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return `[${obj.map(serializeConfig).join(', ')}]`
    } else if (obj === null) {
      // To make typescript happy
      return 'null'
    } else {
      return `{${Object.entries(obj).map(([key, value]) => `${serializeConfig(key)}: ${serializeConfig(value)}`).join(', ')}}`
    }
  }

  return JSON.stringify(obj)
}
