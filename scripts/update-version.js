#!/usr/bin/env node

/**
 * Updates the version number in lib/version.ts based on git commit count
 * Run this script during build or deployment to automatically update version
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

try {
  // Get commit count from git
  const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
  const version = `v${commitCount}`;
  
  console.log(`Updating version to: ${version}`);
  
  // Update lib/version.ts
  const versionFilePath = path.join(__dirname, '..', 'lib', 'version.ts');
  const versionFileContent = `// Get version from git commit count
// This will be replaced at build time with the actual version
export function getVersion(): string {
  // In development, you can set this manually or use an environment variable
  // In production, this should be replaced by your build process
  if (typeof window !== 'undefined' && (window as any).__APP_VERSION__) {
    return (window as any).__APP_VERSION__
  }
  
  // Auto-updated version based on git commit count
  return "${version}"
}

// Export as default for convenience
export default getVersion`;

  fs.writeFileSync(versionFilePath, versionFileContent);
  console.log(`✅ Version updated to ${version} in lib/version.ts`);
  
} catch (error) {
  console.error('❌ Failed to update version:', error.message);
  process.exit(1);
}
