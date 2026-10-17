// Packs the built game (dist/) + the Electron shell into release/TriggerPoem-win32-x64/TriggerPoem.exe and a zip.
// usage: npm run exe
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { packager } from '@electron/packager';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const keep = /^\/(package\.json$|dist(\/|$)|electron(\/|$))/;
const [outDir] = await packager({
  dir: root,
  out: path.join(root, 'release'),
  name: 'TriggerPoem',
  executableName: 'TriggerPoem',
  platform: 'win32',
  arch: 'x64',
  overwrite: true,
  asar: true,
  icon: path.join(root, 'electron', 'icon.ico'),
  ignore: (p) => p !== '' && !keep.test(p),
  win32metadata: { ProductName: 'Trigger Poem', FileDescription: '相对希望的少女扣击诗', CompanyName: 'Trigger Poem' },
});
const zip = path.join(root, 'release', 'TriggerPoem-win64.zip');
fs.rmSync(zip, { force: true });
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zip}' -CompressionLevel Optimal"`, { stdio: 'inherit' });
const mb = (p) => (fs.statSync(p).size / 1048576).toFixed(1) + ' MB';
console.log(`exe: ${path.join(outDir, 'TriggerPoem.exe')}`);
console.log(`zip: ${zip} (${mb(zip)})`);
