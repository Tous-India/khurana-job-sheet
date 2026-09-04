import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // A parent directory (/Users/mac/Documents/Tous) also has a lockfile, so
  // Turbopack would otherwise infer the wrong workspace root.
  turbopack: {
    root: __dirname,
  },
  // Next 16 writes AGENTS.md/CLAUDE.md into the repo root on each dev start.
  agentRules: false,
}

export default nextConfig
