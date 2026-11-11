import { defaultFSM, validateFSM } from '../fsm.js';
import { simulate } from './api.js';

export function bindFSM({ $, escape, guarded, download, saveSession }) {
  const source = $('fsm-source');
  const input = $('fsm-input');
  let runtime;
  let revision = 0;
  let pending = false;

  function render() {
    const machine = runtime?.machine;
    $('fsm-state').textContent = runtime?.state ?? 'Unloaded';
    $('fsm-graph').innerHTML = (machine?.states ?? []).map(state =>
      `<span class="state-card ${state === runtime.state ? 'current' : ''}">${escape(state)}</span>`).join('');
    $('fsm-transitions').innerHTML = (machine?.transitions ?? []).map(t =>
      `<tr${t.from === runtime.state ? ' class="active-transition"' : ''}><td>${escape(t.from)}</td><td>${escape(t.input)}</td><td>${escape(t.to)}</td><td>${escape(t.output)}</td></tr>`).join('');
    $('fsm-log').textContent = runtime?.log.join('\n') ?? '';
    $('fsm-load').disabled = pending;
    $('fsm-step').disabled = pending || !runtime || source.value !== runtime.source;
  }

  async function run(action) {
    const request = ++revision;
    const currentSource = source.value;
    const machine = action === 'reset' ? validateFSM(JSON.parse(currentSource)) : runtime.machine;
    pending = true;
    render();
    try {
      const event = input.value;
      const result = await simulate('fsm', { action, machine, state: runtime?.state, input: event });
      if (request !== revision) return;
      if (action === 'reset') {
        runtime = { machine, source: currentSource, state: result.state, log: [`Reset → ${result.state}`] };
      } else {
        const entry = `${runtime.state} — ${event} / ${result.output} → ${result.state}`;
        runtime = { ...runtime, state: result.state, log: [...runtime.log.slice(-99), entry] };
      }
    } catch (error) {
      if (request === revision) throw error;
    } finally {
      if (request === revision) { pending = false; render(); }
    }
  }

  source.oninput = guarded(() => { revision++; pending = false; render(); saveSession(); });
  $('fsm-load').onclick = guarded(() => run('reset'));
  $('fsm-step').onclick = guarded(() => run('step'));
  $('fsm-save').onclick = guarded(() => {
    const machine = validateFSM(JSON.parse(source.value));
    download('state-machine.json', JSON.stringify(machine, null, 2), 'application/json');
  });

  return {
    newProject: () => ({ source: JSON.stringify(defaultFSM, null, 2) }),
    content: () => ({ source: source.value }),
    snapshot: () => ({ runtime, input: input.value }),
    restore(content, snapshot) {
      revision++;
      pending = false;
      source.value = content.source;
      input.value = snapshot?.input ?? '';
      runtime = snapshot?.runtime ?? null;
      if (!snapshot) {
        try {
          const machine = validateFSM(JSON.parse(content.source));
          runtime = { machine, source: content.source, state: machine.initial, log: [`Reset → ${machine.initial}`] };
          input.value = machine.transitions.find(t => t.from === machine.initial)?.input ?? '';
        } catch { /* Leave invalid drafts editable. */ }
      }
      render();
    },
    suspend() { revision++; pending = false; },
    save: () => $('fsm-save').click(),
  };
}
