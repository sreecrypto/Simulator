import { build } from 'esbuild';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { basename, join, resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function buildFrontend({ dev = false } = {}) {
  const result = await build({
    absWorkingDir: root,
    entryPoints: { workbench: 'src/ui/main.jsx' },
    outdir: 'assets',
    bundle: true,
    platform: 'browser',
    format: 'esm',
    jsx: 'automatic',
    target: 'es2022',
    define: { 'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production') },
    minify: !dev,
    write: false,
  });
  return new Map(result.outputFiles.map(file => [basename(file.path), file.contents]));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = await buildFrontend();
  const assets = join(root, 'dist', 'assets');
  await mkdir(assets, { recursive: true });
  await copyFile(join(root, 'index.html'), join(root, 'dist', 'index.html'));
  await Promise.all([...files].map(([name, contents]) => writeFile(join(assets, name), contents)));
  console.log('Built the React frontend and CSS in dist/.');
}
