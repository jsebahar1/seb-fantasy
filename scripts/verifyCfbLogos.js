import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { TEAMS } from '../src/data/cfbGames.js';
import { CFB_LOGOS } from '../src/data/cfbLogos.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const realTeams = TEAMS.filter(team => team !== 'FCS');
const realTeamSet = new Set(realTeams);
const entries = Object.entries(CFB_LOGOS);
const errors = [];
const contentHashes = new Map();

for (const team of realTeams) {
  if (!Object.hasOwn(CFB_LOGOS, team)) errors.push(`Missing logo mapping: ${team}`);
}

for (const [team, publicPath] of entries) {
  if (!realTeamSet.has(team)) errors.push(`Unknown or excluded team in logo map: ${team}`);
  if (!publicPath.startsWith('/team-logos/cfb/')) {
    errors.push(`Logo path is outside /team-logos/cfb/: ${team} -> ${publicPath}`);
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

const logoDirectory = path.join(repoRoot, 'public', 'team-logos', 'cfb');
const installedPngs = fs.readdirSync(logoDirectory).filter(file => file.endsWith('.png'));
const mappedFiles = new Set(paths.map(publicPath => path.basename(publicPath)));
for (const filename of installedPngs) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(filename)) {
    errors.push(`Logo filename is not lowercase kebab-case: ${filename}`);
  }
  if (!mappedFiles.has(filename)) errors.push(`Unmapped logo file: ${filename}`);
}

console.log('NCAA logo verification');
console.log(`Real teams: ${realTeams.length}`);
console.log(`Mappings: ${entries.length}`);
console.log(`Installed PNGs: ${installedPngs.length}`);
console.log(`FCS mapped: ${Object.hasOwn(CFB_LOGOS, 'FCS') ? 'yes' : 'no (intentional)'}`);

if (errors.length) {
  console.error('\nFAIL');
  for (const error of errors) console.error(`- ${error}`);
  globalThis.process.exitCode = 1;
} else {
  console.log('\nPASS: every real team has one unique mapping to a valid local PNG.');
}
