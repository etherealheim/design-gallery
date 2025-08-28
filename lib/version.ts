// This will be updated automatically by the build script
export const VERSION = "v55"; // Auto-updated from GitHub deployments

export function getVersion(): string {
  // Try environment variable first, then use build-time version
  const envVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  const finalVersion = envVersion || VERSION;
  
  // Debug logging (only in development)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔢 Version check - ENV:', envVersion, 'FALLBACK:', VERSION, 'FINAL:', finalVersion);
  }
  
  return finalVersion;
}