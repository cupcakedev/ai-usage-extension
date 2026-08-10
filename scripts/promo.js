#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { accessSync, constants, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createServer } from 'vite';

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const LOCALES = [
  'am',
  'ar',
  'bg',
  'bn',
  'ca',
  'cs',
  'da',
  'de',
  'el',
  'en',
  'en_GB',
  'es',
  'es_419',
  'et',
  'fa',
  'fi',
  'fil',
  'fr',
  'gu',
  'he',
  'hi',
  'hr',
  'hu',
  'id',
  'it',
  'ja',
  'kn',
  'ko',
  'lt',
  'lv',
  'ml',
  'mr',
  'ms',
  'nl',
  'no',
  'pl',
  'pt_BR',
  'pt_PT',
  'ro',
  'ru',
  'sk',
  'sl',
  'sr',
  'sv',
  'sw',
  'ta',
  'te',
  'th',
  'tr',
  'uk',
  'vi',
  'zh_CN',
  'zh_TW',
];

const MIN_BYTES = 12 * 1024;
const CAPTURE_TIMEOUT_MS = 90_000;
const CAPTURE_ATTEMPTS = 3;
const JPEG_QUALITY = 92;

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

async function shoot(chrome, baseUrl, target, locale, output) {
  await run(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${target.width},${target.height}`,
      '--virtual-time-budget=5000',
      `--screenshot=${output}`,
      `${baseUrl}?locale=${locale}&${target.query}`,
    ],
    { timeout: CAPTURE_TIMEOUT_MS, killSignal: 'SIGKILL' },
  );

  const { size } = statSync(output);
  if (size < MIN_BYTES) {
    throw new Error(`rendered blank (${Math.round(size / 1024)} KB)`);
  }
}

async function capture(chrome, baseUrl, target, locale, outDir) {
  const final = resolve(outDir, target.file);
  const staging = resolve(tmpdir(), `promo-${locale}-${target.file.replace(/\.\w+$/, '')}.png`);
  let lastError;

  for (let attempt = 1; attempt <= CAPTURE_ATTEMPTS; attempt += 1) {
    rmSync(staging, { force: true });
    try {
      await shoot(chrome, baseUrl, target, locale, staging);
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

  throw new Error(`${locale}/${target.file}: ${lastError}`);
}

async function main() {
  const chrome = findChrome();
  const [localeArg, targetArg] = process.argv.slice(2);

  const locales = localeArg ? LOCALES.filter((locale) => locale === localeArg) : LOCALES;
  if (!locales.length) {
    throw new Error(`Unknown locale "${localeArg}". Known: ${LOCALES.join(', ')}`);
  }

  const targets = targetArg
    ? TARGETS.filter((target) => target.file.startsWith(targetArg))
    : TARGETS;
  if (!targets.length) {
    throw new Error(
      `Unknown target "${targetArg}". Known: ${TARGETS.map((t) => t.file).join(', ')}`,
    );
  }

  const server = await createServer({
    configFile: resolve(root, 'vite.promo.config.ts'),
    server: { port: 0, strictPort: false, open: false },
  });
  await server.listen();
  const baseUrl = server.resolvedUrls?.local?.[0];
  if (!baseUrl) throw new Error('Vite did not report a local URL');

  const failures = [];

  try {
    for (const locale of locales) {
      const outDir = resolve(root, 'store', locale, 'promo');
      mkdirSync(outDir, { recursive: true });

      const sizes = [];
      for (const target of targets) {
        try {
          sizes.push(await capture(chrome, baseUrl, target, locale, outDir));
        } catch (error) {
          failures.push(error instanceof Error ? error.message : String(error));
        }
      }

      const total = Math.round(sizes.reduce((sum, size) => sum + size, 0) / 1024);
      console.log(`  ${locale.padEnd(6)} ${sizes.length}/${targets.length} files  ${total} KB`);
    }
  } finally {
    await server.close();
  }

  const written = targets.length * locales.length - failures.length;
  console.log(`\nWrote ${written} files across ${locales.length} locales`);

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
