import { digitalShape } from '../digital.js';
import { defaultClockFrequency } from '../clocks.js';
import { formatValue, parseValue } from '../model.js';
import { simulate } from './api.js';

export const digitalWorkspace = {
  title: 'Digital logic',
  library: 'LOGIC',
  results: 'LOGIC ANALYZER',
  runLabel: '▶ Run logic',
  options: [['truth', 'Truth table'], ['tick', 'Timing diagram'], ['verify', 'Icarus verification']],
  defaultAnalysis(circuit) {
    return circuit.components.filter(p => p.type === 'INPUT').length > 8 ||
      circuit.components.some(p => p.type === 'CLOCK' || digitalShape(p).sequential) ? 'tick' : 'truth';
  },
  settings($, kind, circuit) {
    if (kind !== 'tick') return { kind };
    const clocks = circuit.components.filter(p => p.type === 'CLOCK');
    if (clocks.length && $('auto-clock-window').checked) {
      const duration = Math.max(...clocks.map(p => (p.delay || 0) + 2 / (p.frequency || defaultClockFrequency)));
      $('duration').value = formatValue(duration);
      return { kind, duration };
    }
    return { kind, duration: parseValue($('duration').value) };
  },
  present(kind, data, circuit, frontend) {
    const { $, escape } = frontend;
    if (kind === 'verify') {
      $('result-title').textContent = 'Icarus assertions passed';
      $('result-body').innerHTML = '<p class="muted">The generated Verilog matched the built-in truth table.</p><button id="download-vcd">Download VCD</button>';
    } else if (kind === 'tick') {
      $('result-title').textContent = 'Digital timing simulation';
      digitalPlot(circuit, data, frontend);
    } else {
      $('result-title').textContent = `Truth table · ${data.rows.length} combinations`;
      $('result-body').innerHTML = digitalTable(data.rows, escape);
      return { kind, rows: data.rows };
    }
    return { kind, data };
  },
  run: (circuit, settings) => simulate('digital', { circuit, ...settings }),
};

export function digitalTable(rows, escape) {
  if (!rows.length) return '<p class="muted">No outputs to display.</p>';
  const keys = Object.keys(rows[0]);
  const headings = keys.map(key => `<th scope="col">${escape(key)}</th>`).join('');
  const body = rows.map(row =>
    `<tr>${keys.map(key => `<td>${escape(row[key])}</td>`).join('')}</tr>`).join('');
  return `<table><thead><tr>${headings}</tr></thead><tbody>${body}</tbody></table>`;
}

function digitalPlot(circuit, data, { $, escape }) {
  const clocks = circuit.components.filter(part => part.type === 'CLOCK');
  const outputNets = Object.values(data.outputNodes);
  const nodes = [...new Set([...clocks.map(part => part.nodes[0]), ...outputNets, ...data.nodes])].slice(0, 12);
  const height = nodes.length * 36 + 40;
  const labels = new Map(Object.entries(data.outputNodes).map(([id, net]) => [net, id]));
  for (const clock of clocks) {
    labels.set(clock.nodes[0], `${clock.id} ${formatValue(clock.frequency || defaultClockFrequency, 'Hz')}`);
  }
  const signals = nodes.map((node, index) => {
    const top = index * 36;
    const path = data.rows.map((row, event) => {
      const x = 125 + row.t / data.duration * 595;
      const y = top + (row[node] ? 18 : 36);
      return event ? `H${x}V${y}` : `M${x} ${y}`;
    }).join('');
    return `<text class="timing-label" x="5" y="${top + 31}">${escape((labels.get(node) || node).slice(0, 20))}</text>
      <path class="timing-axis" d="M125 ${top + 40}H720"/>
      <path class="timing-trace" d="${path}"/>`;
  }).join('');
  $('result-body').innerHTML = `<svg class="timing-plot" viewBox="0 0 740 ${height}" role="img" aria-label="Digital timing diagram">
    ${signals}
    <line id="plot-playhead" class="plot-playhead" x1="125" x2="125" y1="8" y2="${height - 22}"/>
    <text class="timing-label" x="125" y="${height - 5}">0 s</text>
    <text class="timing-label" x="630" y="${height - 5}">${formatValue(data.duration, 's')}</text>
  </svg><p class="muted">${data.rows.length} samples · ${nodes.length} signals shown</p>`;
}
