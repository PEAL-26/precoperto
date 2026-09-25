const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

// Keep Metro focused on mobile-owned code and platform-neutral packages. The
// automatic Expo monorepo resolver is retained; only the watch roots are narrowed.
config.watchFolders = [
  path.join(monorepoRoot, 'packages/types'),
  path.join(monorepoRoot, 'packages/schemas'),
  path.join(monorepoRoot, 'packages/utils'),
  path.join(monorepoRoot, 'packages/supabase'),
];
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
  path.join(monorepoRoot, 'node_modules'),
];

module.exports = config;
