export function SchematicWorkspace() {
  return (
    <main id="circuit-workspace" className="workbench">
      <aside className="library">
        <div className="library-heading">
          <span className="section-label">COMPONENT LIBRARY</span>
          <span id="mode-library" className="library-live">SPICE</span>
        </div>
        <label className="search-label">
          <span>⌕</span>
          <input id="search" placeholder="Search components…" aria-label="Search components" />
        </label>
        <select id="category" aria-label="Component category">
          <option value="all">All categories</option>
        </select>
        <div id="library-count" className="library-count" />
        <div id="parts" />
        <div className="library-bottom" hidden>
          <div id="examples" />
        </div>
      </aside>
      <section className="editor">
        <div className="editor-header">
          <div>
            <span className="breadcrumb">WORKSPACE / <span id="mode-label">ANALOG</span></span>
            <input id="project-name" aria-label="Project name" defaultValue="Untitled circuit" maxLength="120" />
          </div>
          <span className="status-dot">Local project</span>
        </div>
        <div className="toolbar">
          <button id="toggle-library" aria-pressed="false">Components</button>
          <button id="toggle-copilot" aria-pressed="false">Copilot</button>
          <button id="toggle-results" aria-pressed="false">Results</button>
          <button id="toggle-hdl">Verilog + TB</button>
          <button id="select-tool" className="selected">↖ Select</button>
          <button id="pan-tool">✥ Pan</button>
          <button id="wire-tool">⌁ Connect pins</button>
          <button id="undo" title="Undo Ctrl+Z">↶ Undo</button>
          <button id="redo" title="Redo Ctrl+Y">↷ Redo</button>
          <button id="fit-canvas" title="Fit circuit to canvas">Fit</button>
          <button id="zoom-in" aria-label="Zoom in">＋</button>
          <button id="zoom-out" aria-label="Zoom out">−</button>
          <button id="arrange-canvas" title="Arrange components in rows">Arrange</button>
          <span className="toolbar-spacer" />
          <button id="spice">Export SPICE</button>
          <select id="engine" aria-label="Simulation engine">
            <option value="builtin">Built-in</option>
            <option value="ngspice">ngspice</option>
          </select>
          <select id="analysis" aria-label="Analysis type">
            <option value="transient">Transient</option>
            <option value="dc">Operating point</option>
            <option value="ac">AC sweep</option>
          </select>
          <button className="primary" id="run">▶ Run simulation</button>
        </div>
        <div className="canvas-wrap">
          <svg id="schematic" viewBox="0 0 900 480" role="img" aria-label="Interactive circuit schematic">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="#d4ded9" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <g id="net-layer" />
            <g id="component-layer" />
          </svg>
          <div className="canvas-caption">
            <span id="canvas-hint">Drag to select · Shift adds · Space + drag to pan · Wheel to zoom</span>
            <span>GRID 20 · SI UNITS</span>
          </div>
        </div>
        <section className="results">
          <div className="result-heading">
            <div>
              <span id="mode-results" className="section-label">SIMULATION RESULTS</span>
              <h2 id="result-title">Ready to simulate</h2>
            </div>
            <div className="result-controls">
              <label id="duration-label">Window <input id="duration" defaultValue="10m" aria-label="Simulation time window in seconds" /></label>
              <label id="clock-window-label" hidden><input id="auto-clock-window" type="checkbox" defaultChecked /> Auto clocks</label>
              <label id="probe-label">Probe <select id="probe" aria-label="Voltage probe" /></label>
              <button id="csv">↧ CSV</button>
            </div>
          </div>
          <div id="playback-controls" className="playback-controls" hidden>
            <div className="playback-buttons">
              <button id="play-pause">▶ Play</button>
              <button id="step-sample">Step →</button>
              <button id="reset-playback">↺</button>
              <select id="playback-speed" aria-label="Trace playback speed" defaultValue="1">
                <option value="0.25">0.25×</option>
                <option value="0.5">0.5×</option>
                <option value="1">1×</option>
                <option value="2">2×</option>
              </select>
              <span id="playback-time" />
            </div>
            <input id="playback-position" type="range" min="0" max="1" defaultValue="0" aria-label="Simulation playback position" />
            <small>Trace playback · 4 s per window at 1×</small>
          </div>
          <div id="result-body" className="result-body">
            <div className="empty-result">Run your circuit to inspect its response.</div>
          </div>
          <div id="sample-values" className="sample-values" aria-live="off" />
        </section>
      </section>
      <aside className="assistant-panel">
        <div className="assistant-title">
          <span className="assistant-icon">✧</span>
          <div>
            <h2>Circuit copilot</h2>
            <span>BUILD. EXPLORE. UNDERSTAND.</span>
          </div>
          <span className="tiny-dot" />
        </div>
        <div className="assistant-settings">
          <label className="assistant-mode">
            Assistant mode
            <select id="ai-mode">
              <option value="local">Local AI · Ollama</option>
              <option value="gemini">Gemini · Google API</option>
              <option value="grok">Grok · xAI API</option>
              <option value="groq">Groq · GroqCloud API</option>
              <option value="recipe">Parametric builder</option>
            </select>
          </label>
          <span id="ai-status" className="muted" role="status" />
          <div id="cloud-options" className="cloud-options" hidden>
            <p>Sending a request shares your prompt with the selected provider and may use API credits.</p>
            <label><input id="ai-include-circuit" type="checkbox" /> Include current circuit and registered model sources</label>
          </div>
        </div>
        <div id="chat" className="chat" aria-live="polite" />
        <form id="assistant-form">
          <label htmlFor="prompt" className="sr-only">Describe your circuit</label>
          <textarea id="prompt" placeholder="Describe a circuit to build…" rows="3" maxLength="4000" required />
          <div className="composer-footer">
            <span id="composer-label">PARAMETRIC CIRCUIT BUILDER</span>
            <button type="submit" id="send" className="primary" aria-label="Send circuit request">↑</button>
          </div>
        </form>
        <div className="assistant-footer">Generated circuits need engineering review.</div>
        <section className="inspector">
          <div className="section-label">COMPONENT INSPECTOR</div>
          <div id="inspector">
            <p className="muted">Select a component to edit its values and connections.</p>
          </div>
        </section>
      </aside>
    </main>
  );
}
