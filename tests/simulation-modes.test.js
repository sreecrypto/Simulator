import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.mjs';
import { cloneExample } from '../src/examples.js';
import { defaultFSM } from '../src/fsm.js';
import { targets, microcontrollerProject } from '../src/microcontrollers.js';
import { runMicrocontroller } from '../backend/microcontrollers.mjs';
import { icarusAvailable, verifyWithIcarus } from '../backend/icarus.mjs';

test('workspace API routes run all four modes with independent inputs', async () => {
  const server = createServer({ engineCheck: async () => false });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const call = async (mode, input, status = 200) => {
      const response = await fetch(`${base}/api/${mode}/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
      });
      const result = await response.json();
      assert.equal(response.status, status, JSON.stringify(result));
      return result.data;
    };
    const divider = cloneExample('divider');
    assert.equal((await call('analog', { circuit: divider, options: { kind: 'dc' } })).nodes.out, 2.5);
    assert.equal((await call('digital', { circuit: cloneExample('halfadder'), kind: 'truth' })).rows.length, 4);
    await call('digital', { circuit: divider, kind: 'truth' }, 400);

    const { state } = await call('fsm', { machine: defaultFSM, action: 'reset' });
    assert.equal(state, 'IDLE');
    assert.deepEqual(await call('fsm', { machine: defaultFSM, action: 'step', state, input: 'start' }),
      { state: 'RUN', output: 'busy' });

    const project = { target: 'avr', source: targets.avr.example };
    const partial = await call('microcontrollers', { project, steps: 3 });
    assert.equal(partial.ports.PORTB, 0);
    const final = await call('microcontrollers', { project, cursor: partial.cursor, steps: 2 });
    assert.equal(final.ports.PORTB, 8);
    assert.equal(final.finished, true);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('microcontroller targets preserve old projects, wrap bytes and branch independently', () => {
  const old = { source: targets.teaching.example };
  assert.equal(microcontrollerProject(old).target, 'teaching');
  assert.deepEqual(runMicrocontroller({ project: old, steps: 100 }).output, [8]);

  const avr = { target: 'avr', source: 'ldi r16, 0xFF\ninc r16\nbreq done\nldi r16, 99\ndone: out PORTB, r16\nbreak' };
  const avrResult = runMicrocontroller({ project: avr, steps: 10 });
  assert.equal(avrResult.ports.PORTB, 0);
  assert.equal(avrResult.cursor, 5);
  assert.throws(() => runMicrocontroller({ project: { ...avr, source: 'ldi r0, 5' } }), /16 to 31/);

  const mcs = { target: '8051', source: 'mov A, #0xFF\nadd A, #2\njnz done\nmov A, #99\ndone: mov P1, A' };
  const mcsResult = runMicrocontroller({ project: mcs, steps: 10 });
  assert.deepEqual(mcsResult.registers, { ACC: 1, CARRY: 1 });
  assert.equal(mcsResult.ports.P1, 1);
  assert.equal(mcsResult.cursor, 4);
  assert.throws(() => runMicrocontroller({ project: mcs, cursor: 10001 }), /instruction count/);
  assert.throws(() => microcontrollerProject({ ...mcs, target: '__proto__' }), /Unknown microcontroller/);
});

test('Icarus adapter verifies a generated circuit and returns VCD', async t => {
  if (!await icarusAvailable()) return t.skip('Working Icarus and vvp executables are required.');
  const result = await verifyWithIcarus(cloneExample('halfadder'));
  assert.equal(result.passed, true);
  assert.match(result.vcd, /\$enddefinitions/);
});
