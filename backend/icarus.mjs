import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { generateVerilog } from '../src/verilog.js';

const execute = promisify(execFile);
const compiler = () => process.env.IVERILOG_BIN || 'iverilog';
const runtime = () => process.env.VVP_BIN || 'vvp';

export async function icarusAvailable() {
  try {
    const options = { timeout: 5000, windowsHide: true };
    await Promise.all([
      execute(compiler(), ['-g2012', '-V'], options),
      execute(runtime(), ['-V'], options),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function verifyWithIcarus(circuit) {
  const generated = generateVerilog(circuit);
  if (!generated.checked) throw new Error('Icarus verification requires a combinational circuit with at most eight inputs.');

  const root = resolve(tmpdir());
  const folder = await mkdtemp(join(root, 'circuit-studio-hdl-'));
  const options = { cwd: folder, timeout: 15000, maxBuffer: 1024 * 1024, windowsHide: true };
  try {
    await Promise.all([
      writeFile(join(folder, 'design.v'), generated.design),
      writeFile(join(folder, 'testbench.v'), generated.testbench),
    ]);
    await execute(compiler(), ['-g2012', '-s', 'circuit_tb', '-o', 'circuit.vvp', 'design.v', 'testbench.v'], options);
    const { stdout } = await execute(runtime(), ['circuit.vvp'], options);
    if (!stdout.includes('PASS: exhaustive combinational assertions')) throw new Error('Testbench did not finish its assertions.');
    const path = join(folder, 'circuit.vcd');
    if ((await stat(path)).size > 2_000_000) throw new Error('VCD trace exceeds 2 MB.');
    return { passed: true, summary: generated.summary, vcd: await readFile(path, 'utf8') };
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('Install a working Icarus Verilog toolchain or set IVERILOG_BIN and VVP_BIN.');
    throw new Error(`Icarus verification failed: ${String(error.stderr || error.stdout || error.message).slice(-1800)}`);
  } finally {
    if (dirname(resolve(folder)) === root && basename(folder).startsWith('circuit-studio-hdl-')) {
      await rm(folder, { recursive: true, force: true });
    }
  }
}
