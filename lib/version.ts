// Get version from git commit count
// This will be replaced at build time with the actual version
export function getVersion(): string {
  // In development, you can set this manually or use an environment variable
  // In production, this should be replaced by your build process
  if (typeof window !== 'undefined' && (window as any).__APP_VERSION__) {
    return (window as any).__APP_VERSION__
  }
  
  // Auto-updated version based on git commit count
  return "v76"
}

// Export as default for convenience
export default getVersion