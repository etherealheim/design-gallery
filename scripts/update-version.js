#!/usr/bin/env node

/**
 * Updates the version number in lib/version.ts based on GitHub deployments count
 * Run this script during build or deployment to automatically update version
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Fetch version from GitHub API
async function getVersionFromGitHub() {
  try {
    const https = require('https');
    
    console.log('🔍 Fetching deployment count from GitHub API...');
    
    // Fetch all deployments by paginating through results
    let allDeployments = [];
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages && page <= 5) { // Limit to 5 pages (150 deployments) to avoid infinite loop
      const url = `https://api.github.com/repos/etherealheim/design-gallery/deployments?page=${page}&per_page=100`;
      
      const deployments = await new Promise((resolve, reject) => {
        const options = {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'design-gallery-build'
          }
        };
        
        https.get(url, options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              if (res.statusCode === 200) {
                const pageDeployments = JSON.parse(data);
                console.log(`📄 Page ${page}: Found ${pageDeployments.length} deployments`);
                resolve(pageDeployments);
              } else {
                reject(new Error(`GitHub API responded with status: ${res.statusCode}`));
              }
            } catch (parseError) {
              reject(new Error(`Failed to parse GitHub API response: ${parseError.message}`));
            }
          });
        }).on('error', (error) => {
          reject(new Error(`GitHub API request failed: ${error.message}`));
        });
      });
      
      if (deployments.length === 0) {
        hasMorePages = false;
      } else {
        allDeployments = allDeployments.concat(deployments);
        page++;
        if (deployments.length < 100) {
          hasMorePages = false; // Last page
        }
      }
    }
    
    const version = `v${allDeployments.length}`;
    console.log(`✅ GitHub API: Found ${allDeployments.length} total deployments`);
    return version;
    
  } catch (error) {
    throw new Error(`GitHub API error: ${error.message}`);
  }
}

// Fallback to git commit count
function getVersionFromGit() {
  try {
    const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
    const version = `v${commitCount}`;
    console.log(`📦 Git fallback: Found ${commitCount} commits`);
    return version;
  } catch (error) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

async function updateVersion() {
  let version;
  
  try {
    // Try GitHub API first
    version = await getVersionFromGitHub();
  } catch (githubError) {
    console.warn('⚠️  GitHub API failed:', githubError.message);
    
    try {
      // Fallback to git
      version = getVersionFromGit();
    } catch (gitError) {
      console.warn('⚠️  Git also failed:', gitError.message);
      console.log('📝 Using manual version fallback');
      return; // Exit without error - let build continue with manual version
    }
  }
  
  console.log(`Updating version to: ${version}`);
  
  // Update lib/version.ts
  const versionFilePath = path.join(__dirname, '..', 'lib', 'version.ts');
  const versionFileContent = `// This will be updated automatically by the build script
export const VERSION = "${version}"; // Auto-updated from GitHub deployments

export function getVersion(): string {
  // Try environment variable first, then use build-time version
  const envVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  const finalVersion = envVersion || VERSION;
  
  // Debug logging (only in development)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔢 Version check - ENV:', envVersion, 'FALLBACK:', VERSION, 'FINAL:', finalVersion);
  }
  
  return finalVersion;
}`;

  fs.writeFileSync(versionFilePath, versionFileContent);
  console.log(`✅ Version updated to ${version} in lib/version.ts`);
}

// Run the update
updateVersion().catch((error) => {
  console.error('❌ Version update failed:', error.message);
  console.log('📝 Build will continue with existing version');
});
