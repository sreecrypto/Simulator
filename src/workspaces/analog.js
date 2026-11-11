import { formatValue, parseValue } from '../model.js';
import { simulate } from './api.js';

export const analogWorkspace = {
  title: 'Analog circuit',
  library: 'SPICE',
  results: 'VOLTAGE RESPONSE',
  runLabel: '▶ Run analysis',
  options: [['transient', 'Transient'], ['dc', 'Operating point'], ['ac', 'AC sweep']],
  defaultAnalysis: () => 'transient',
  settings($, kind) {
    return {
      engine: $('engine').value,
      options: { kind, ...(kind === 'transient' ? { duration: parseValue($('duration').value), steps: 400 } : {}) },
    };
  },
  present(kind, data, _circuit, frontend) {
    const { $, escape } = frontend;
    const result = { kind, data };
    if (kind === 'dc') {
      result.rows = Object.entries(data.nodes).map(([node, voltage]) => ({ node, voltage }));
      $('result-title').textContent = 'DC operating point';
      const values = result.rows.filter(({ node }) => node !== '0');
      $('result-body').innerHTML = `<div class="value-pills">${values.map(({ node, voltage }) =>
        `<div class="value-pill">V(${escape(node)})<strong>${formatValue(voltage, 'V')}</strong></div>`).join('')}</div>`;
    } else {
      $('result-title').textContent = kind === 'ac' ? 'AC frequency response' : 'Transient response';
      analogPlot(result, frontend);
    }
    return result;
  },
  run: (circuit, settings) => simulate('analog', { circuit, ...settings }),
};

export function analogPlot(result, { $, escape }) {
  const probe = $('probe').value;
  const ac = result.kind === 'ac';
  const points = result.data.rows.map(row => [
    ac ? Math.log10(row.f) : row.t,
    ac ? 20 * Math.log10(Math.max(row[probe]?.magnitude, 1e-20)) : row[probe],
  ]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (!points.length) {
    $('result-body').textContent = 'No voltage samples for this probe.';
    return;
  }
  const xmin = points[0][0], xmax = points.at(-1)[0];
  let ymin = Infinity, ymax = -Infinity;
  for (const [, y] of points) {
    ymin = Math.min(ymin, y);
    ymax = Math.max(ymax, y);
  }
  const margin = ymax - ymin < 1e-10 ? 1 : (ymax - ymin) * .1;
  ymin -= margin;
  ymax += margin;
  const xSpan = xmax - xmin || 1;
  const ySpan = ymax - ymin;
  const path = points.map(([x, y], i) =>
    `${i ? 'L' : 'M'}${(54 + (x - xmin) / xSpan * 650).toFixed(2)} ${(162 - (y - ymin) / ySpan * 140).toFixed(2)}`).join(' ');
  const axis = [0, .25, .5, .75, 1].map(k =>
    `<path class="axis" d="M54 ${22 + k * 140}H704"/><text x="2" y="${26 + k * 140}">${formatValue(ymax - k * ySpan)}</text>`).join('');
  const label = value => ac ? formatValue(10 ** value, 'Hz') : formatValue(value, 's');
  const playhead = '<line id="plot-playhead" class="plot-playhead" x1="54" x2="54" y1="18" y2="165"/>';
  $('result-body').innerHTML = `<svg class="plot" viewBox="0 0 730 190" role="img" aria-label="${escape(probe)} ${ac ? 'AC magnitude in dBV' : 'voltage over time'}">
    ${axis}<path class="trace" d="${path}"/>${ac ? '' : playhead}
    <text x="54" y="185">${label(xmin)}</text><text x="640" y="185">${label(xmax)}</text>
  </svg><div class="plot-caption"><span>V(${escape(probe)}) · ${ac ? 'dBV · logarithmic frequency' : 'volts · time'}</span></div>`;
}
