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
  const versionFileContent = `// This will be updated automatically by the build script
export const VERSION = "${version}"; // Manual fallback version

export function getVersion(): string {
  // Try environment variable first, then use build-time version
  return process.env.NEXT_PUBLIC_APP_VERSION || VERSION;
}`;

  fs.writeFileSync(versionFilePath, versionFileContent);
  console.log(`✅ Version updated to ${version} in lib/version.ts`);
  
} catch (error) {
  console.error('❌ Failed to update version:', error.message);
  console.log('📝 Using manual version fallback');
  // Don't exit with error - let build continue with manual version
}
