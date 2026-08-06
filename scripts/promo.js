#!/usr/bin/env node
/**
 * Renders the Chrome Web Store artwork from `src/promo` into `store/promo`.
 *
 * Boots the promo Vite server, screenshots each format with headless Chrome,
 * and converts the two listing screenshots to JPEG (the store README requires
 * `.jpg` there; Chrome can only write PNG).
 *
 * Usage:
 *   node scripts/promo.js              # every target
 *   node scripts/promo.js screenshot-1 # one target, by filename stem
 */
import { execFile } from 'node:child_process';
import { accessSync, constants, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createServer } from 'vite';

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'store/promo');

const MIN_BYTES = 12 * 1024;
const CAPTURE_TIMEOUT_MS = 90_000;
const CAPTURE_ATTEMPTS = 3;
const JPEG_QUALITY = 92;

/** Five screenshots is the Chrome Web Store maximum; order matches the listing. */
const TARGETS = [
  { file: 'screenshot-1.jpg', query: 'shot=popup', width: 1280, height: 800 },
  { file: 'screenshot-2.jpg', query: 'shot=overlay', width: 1280, height: 800 },
  { file: 'screenshot-3.jpg', query: 'shot=providers', width: 1280, height: 800 },
  { file: 'screenshot-4.jpg', query: 'shot=badge', width: 1280, height: 800 },
  { file: 'screenshot-5.jpg', query: 'shot=privacy', width: 1280, height: 800 },
  { file: 'marquee.png', query: 'format=marquee', width: 1400, height: 560 },
  { file: 'small-tile.png', query: 'format=tile', width: 440, height: 280 },
];

const CHROME_CANDIDATES = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ],
};

function findChrome() {
  const candidates = [process.env.CHROME_PATH, ...(CHROME_CANDIDATES[process.platform] ?? [])];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error(
    'Could not find Chrome. Set CHROME_PATH to a Chrome or Chromium binary and run again.',
  );
}

/** `sips` on macOS, ImageMagick anywhere else. */
async function toJpeg(pngPath, jpegPath) {
  const attempts =
    process.platform === 'darwin'
      ? [
          [
            'sips',
            [
              '-s',
              'format',
              'jpeg',
              '-s',
              'formatOptions',
              String(JPEG_QUALITY),
              pngPath,
              '--out',
              jpegPath,
            ],
          ],
        ]
      : [
          ['magick', [pngPath, '-quality', String(JPEG_QUALITY), jpegPath]],
          ['convert', [pngPath, '-quality', String(JPEG_QUALITY), jpegPath]],
        ];

  for (const [command, args] of attempts) {
    try {
      await run(command, args);
      return;
    } catch {
      continue;
    }
  }

  throw new Error('no JPEG converter found (install ImageMagick, or run this on macOS)');
}

async function shoot(chrome, baseUrl, target, output) {
  await run(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${target.width},${target.height}`,
      '--virtual-time-budget=5000',
      `--screenshot=${output}`,
      `${baseUrl}?${target.query}`,
    ],
    { timeout: CAPTURE_TIMEOUT_MS, killSignal: 'SIGKILL' },
  );

  const { size } = statSync(output);
  if (size < MIN_BYTES) {
    throw new Error(`rendered blank (${Math.round(size / 1024)} KB)`);
  }
}

async function capture(chrome, baseUrl, target) {
  const final = resolve(outDir, target.file);
  const staging = resolve(tmpdir(), `promo-${target.file.replace(/\.\w+$/, '')}.png`);
  let lastError;

  for (let attempt = 1; attempt <= CAPTURE_ATTEMPTS; attempt += 1) {
    rmSync(staging, { force: true });
    try {
      await shoot(chrome, baseUrl, target, staging);
      rmSync(final, { force: true });
      if (target.file.endsWith('.jpg')) {
        await toJpeg(staging, final);
        rmSync(staging, { force: true });
      } else {
        renameSync(staging, final);
      }
      return statSync(final).size;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(`${target.file}: ${lastError}`);
}

async function main() {
  const chrome = findChrome();
  const only = process.argv[2];
  const targets = only ? TARGETS.filter((target) => target.file.startsWith(only)) : TARGETS;
  if (!targets.length) {
    throw new Error(`Unknown target "${only}". Known: ${TARGETS.map((t) => t.file).join(', ')}`);
  }

  const server = await createServer({
    configFile: resolve(root, 'vite.promo.config.ts'),
    server: { port: 0, strictPort: false, open: false },
  });
  await server.listen();
  const baseUrl = server.resolvedUrls?.local?.[0];
  if (!baseUrl) throw new Error('Vite did not report a local URL');

  mkdirSync(outDir, { recursive: true });
  const failures = [];

  try {
    for (const target of targets) {
      try {
        const size = await capture(chrome, baseUrl, target);
        console.log(
          `  ${target.file.padEnd(18)} ${target.width}×${target.height}  ${Math.round(size / 1024)} KB`,
        );
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
    }
  } finally {
    await server.close();
  }

  console.log(`\nWrote ${targets.length - failures.length}/${targets.length} files to store/promo`);

  if (failures.length) {
    console.error(`\n${failures.length} capture(s) failed after ${CAPTURE_ATTEMPTS} attempts:`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
