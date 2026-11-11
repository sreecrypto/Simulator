export function FSMWorkspace() {
  return (
    <main id="fsm-workspace" className="special-workspace" hidden>
      <section className="special-editor">
        <span className="section-label">FINITE STATE MACHINE</span>
        <h1>State machine editor</h1>
        <p>Edit the JSON definition, then load and step it with an input event.</p>
        <label htmlFor="fsm-source">Machine definition</label>
        <textarea id="fsm-source" spellCheck="false" />
        <div className="button-row">
          <button id="fsm-load" className="primary">Load / reset machine</button>
          <button id="fsm-save">Save FSM JSON</button>
          <input id="fsm-input" defaultValue="start" aria-label="FSM input event" />
          <button id="fsm-step">Step event →</button>
        </div>
      </section>
      <section className="special-output">
        <span className="section-label">LIVE STATE</span>
        <h2 id="fsm-state">IDLE</h2>
        <div id="fsm-graph" />
        <h3>Transitions</h3>
        <div className="transition-scroll">
          <table>
            <thead>
              <tr>
                <th>From</th>
                <th>Event</th>
                <th>To</th>
                <th>Output</th>
              </tr>
            </thead>
            <tbody id="fsm-transitions" />
          </table>
        </div>
        <h3>Event log</h3>
        <pre id="fsm-log" aria-live="polite" />
      </section>
    </main>
  );
}

export function MicrocontrollerWorkspace() {
  return (
    <main id="cpu-workspace" className="special-workspace" hidden>
      <section className="special-editor">
        <h1>Microcontroller lab</h1>
        <div className="button-row target-row">
          <label htmlFor="cpu-target">Target</label>
          <select id="cpu-target" />
          <button id="cpu-example" type="button">Load example</button>
        </div>
        <p id="cpu-description" />
        <label htmlFor="cpu-source">Assembly program</label>
        <textarea id="cpu-source" spellCheck="false" />
        <div className="button-row">
          <button id="cpu-load" className="primary">Assemble / reset</button>
          <button id="cpu-step">Step instruction</button>
          <button id="cpu-run">Run up to 1,000 instructions</button>
          <button id="cpu-save">Save assembly</button>
        </div>
        <p id="cpu-instructions" className="muted" />
      </section>
      <section className="special-output">
        <h2>Execution</h2>
        <p id="cpu-status" role="status" />
        <div id="cpu-registers" />
        <section id="cpu-ports-panel" hidden>
          <h3>Port latches</h3>
          <div id="cpu-ports" />
        </section>
        <h3>Output log</h3>
        <pre id="cpu-output" aria-live="polite" />
        <h3 id="cpu-memory-label">Memory</h3>
        <div id="cpu-memory" />
      </section>
    </main>
  );
}
