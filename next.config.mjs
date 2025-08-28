import { execSync } from 'child_process';

// Get version from GitHub deployments API or fallback
async function getAppVersionFromGitHub() {
  try {
    const { default: fetch } = await import('node-fetch');
    
    // GitHub API to get deployments count
    const response = await fetch('https://api.github.com/repos/etherealheim/design-gallery/deployments', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'design-gallery-build'
      }
    });
    
    if (response.ok) {
      const deployments = await response.json();
      const version = `v${deployments.length}`;
      console.log(`✅ GitHub API: Version set to ${version} (${deployments.length} deployments)`);
      return version;
    } else {
      throw new Error(`GitHub API responded with status: ${response.status}`);
    }
  } catch (error) {
    console.warn('Could not fetch from GitHub API:', error.message);
    
    // Fallback to git commit count
    try {
      const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
      const version = `v${commitCount}`;
      console.log(`📦 Git fallback: Version set to ${version}`);
      return version;
    } catch (gitError) {
      console.warn('Git also failed, using manual fallback version');
      return 'v83';
    }
  }
}

// Synchronous wrapper for Next.js config
function getAppVersion() {
  // We can't use async in Next.js config directly, so we'll use the git method
  // and let the build script handle GitHub API
  try {
    const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
    const version = `v${commitCount}`;
    console.log(`Next.js build: Version set to ${version}`);
    return version;
  } catch (error) {
    console.warn('Could not get git commit count in next.config.mjs, using fallback version');
    return 'v83';
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed env injection of NEXT_PUBLIC_APP_VERSION. The app now reads the
  // version from lib/version.ts which is written by scripts/update-version.js
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
}

export default nextConfig