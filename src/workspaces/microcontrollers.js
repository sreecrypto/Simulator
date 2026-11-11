import { targets, getTarget, microcontrollerProject } from '../microcontrollers.js';
import { simulate } from './api.js';

export function bindMicrocontrollers({ $, escape, guarded, download, saveSession }) {
  const source = $('cpu-source');
  const select = $('cpu-target');
  let target = 'teaching';
  let drafts = new Map();
  let runtime;
  let revision = 0;
  let pending = false;

  for (const [id, profile] of Object.entries(targets)) select.add(new Option(profile.name, id));

  const content = () => ({
    source: source.value,
    target,
    drafts: Object.fromEntries([...drafts].filter(([id]) => id !== target)),
  });
  const loaded = () => runtime?.source === source.value && runtime?.target === target;
  const hex = n => n.toString(16).padStart(2, '0').toUpperCase();

  function render() {
    const profile = getTarget(target);
    const data = loaded() ? runtime.data : null;
    $('cpu-description').textContent = profile.description;
    $('cpu-instructions').textContent = profile.instructions;
    $('cpu-memory-label').textContent = target === 'avr' ? 'Working registers' : 'Memory · addresses 0–31';
    const status = !data ? 'Assemble the program to begin.' : data.finished ? 'Program finished.' :
      data.limitReached ? 'Instruction limit reached. Reset to run again.' : `Next: ${data.next}`;
    $('cpu-status').textContent = pending ? 'Running…' : status;
    $('cpu-registers').innerHTML = data ? `<div class="registers">${Object.entries({ PC: data.pc, STEPS: data.cursor, ...data.registers }).map(([label, value]) =>
      `<div><small>${label}</small><strong>${value}</strong></div>`).join('')}</div>` : '';
    $('cpu-output').textContent = data?.output.join('\n') || 'No output yet.';
    $('cpu-memory').innerHTML = data ? `<div class="memory-grid">${data.cells.map(({ label, value }) =>
      `<div><small>${label}</small>${hex(value)}</div>`).join('')}</div>` : '';
    $('cpu-ports-panel').hidden = target === 'teaching';
    $('cpu-ports').innerHTML = Object.entries(data?.ports ?? {}).map(([label, value]) =>
      `<div class="port-value"><strong>${escape(label)} · 0x${hex(value)}</strong><code>${value.toString(2).padStart(8, '0')}</code></div>`).join('');
    $('cpu-load').disabled = pending;
    $('cpu-step').disabled = $('cpu-run').disabled = pending || !data || data.finished || data.limitReached;
  }

  async function run(steps, reset = false) {
    const request = ++revision;
    const project = { source: source.value, target };
    pending = true;
    render();
    try {
      const data = await simulate('microcontrollers', { project, steps, cursor: reset ? 0 : runtime.data.cursor });
      if (request === revision) runtime = { ...project, data };
    } catch (error) {
      if (request === revision) throw error;
    } finally {
      if (request === revision) { pending = false; render(); }
    }
  }

  source.oninput = guarded(() => { revision++; pending = false; render(); saveSession(); });
  select.onchange = guarded(() => {
    drafts.set(target, source.value);
    target = select.value;
    source.value = drafts.get(target) ?? '';
    revision++;
    pending = false;
    runtime = null;
    render();
    saveSession();
  });
  $('cpu-example').onclick = guarded(() => {
    if (source.value.trim() && source.value !== getTarget(target).example &&
        !window.confirm('Replace the current assembly with the target example?')) return;
    source.value = getTarget(target).example;
    source.oninput();
  });
  $('cpu-load').onclick = guarded(() => run(0, true));
  $('cpu-step').onclick = guarded(() => run(1));
  $('cpu-run').onclick = guarded(() => run(1000));
  $('cpu-save').onclick = () => download(`${target}-program.asm`, source.value);

  return {
    newProject: () => ({ target, source: '' }),
    content,
    snapshot: () => ({ runtime }),
    restore(project, snapshot) {
      revision++;
      pending = false;
      const next = microcontrollerProject(project);
      target = select.value = next.target;
      source.value = next.source;
      runtime = snapshot?.runtime ?? null;
      drafts = new Map(Object.entries(next.drafts ?? {}));
      render();
    },
    suspend() { revision++; pending = false; },
    save: () => $('cpu-save').click(),
  };
}
