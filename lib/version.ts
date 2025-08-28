// This will be updated automatically by the build script
export const VERSION = "v49"; // Auto-updated from GitHub deployments

export function getVersion(): string {
  // Try environment variable first, then use build-time version
  return process.env.NEXT_PUBLIC_APP_VERSION || VERSION;
}