import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { NFL_TEAMS } from '../src/data/nflGames.js';
import { NFL_LOGOS } from '../src/data/nflLogos.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const teamSet = new Set(NFL_TEAMS);
const entries = Object.entries(NFL_LOGOS);
const errors = [];
const contentHashes = new Map();

for (const team of NFL_TEAMS) {
  if (!Object.hasOwn(NFL_LOGOS, team)) errors.push(`Missing logo mapping: ${team}`);
}

for (const [team, publicPath] of entries) {
  if (!teamSet.has(team)) errors.push(`Unknown team in logo map: ${team}`);
  if (!publicPath.startsWith('/team-logos/nfl/')) {
    errors.push(`Logo path is outside /team-logos/nfl/: ${team} -> ${publicPath}`);
    continue;
  }

  const filePath = path.join(repoRoot, 'public', publicPath);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing logo file: ${team} -> ${publicPath}`);
    continue;
  }

  const fileBytes = fs.readFileSync(filePath);
  const signature = fileBytes.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    errors.push(`Invalid PNG file: ${team} -> ${publicPath}`);
  }

  const contentHash = crypto.createHash('sha256').update(fileBytes).digest('hex');
  const matchingTeams = contentHashes.get(contentHash) ?? [];
  matchingTeams.push(team);
  contentHashes.set(contentHash, matchingTeams);
}

const paths = entries.map(([, publicPath]) => publicPath);
const duplicatePaths = [...new Set(paths.filter((publicPath, index) => (
  paths.indexOf(publicPath) !== index
)))];
for (const publicPath of duplicatePaths) errors.push(`Duplicate logo path: ${publicPath}`);
for (const matchingTeams of contentHashes.values()) {
  if (matchingTeams.length > 1) {
    errors.push(`Duplicate logo content: ${matchingTeams.join(', ')}`);
  }
}

const logoDirectory = path.join(repoRoot, 'public', 'team-logos', 'nfl');
const installedPngs = fs.readdirSync(logoDirectory).filter(file => file.endsWith('.png'));
const mappedFiles = new Set(paths.map(publicPath => path.basename(publicPath)));
for (const filename of installedPngs) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(filename)) {
    errors.push(`Logo filename is not lowercase kebab-case: ${filename}`);
  }
  if (!mappedFiles.has(filename)) errors.push(`Unmapped logo file: ${filename}`);
}

console.log('NFL logo verification');
console.log(`Teams: ${NFL_TEAMS.length}`);
console.log(`Mappings: ${entries.length}`);
console.log(`Installed PNGs: ${installedPngs.length}`);

if (errors.length) {
  console.error('\nFAIL');
  for (const error of errors) console.error(`- ${error}`);
  globalThis.process.exitCode = 1;
} else {
  console.log('\nPASS: every team has one unique mapping to a valid local PNG.');
}
