export function WorkbenchDialogs() {
  return (
    <>
      <dialog id="guide">
        <div className="dialog-heading">
          <h2>Your electronics workbench</h2>
          <button id="close-guide" aria-label="Close guide">✕</button>
        </div>
        <p>Open Components to place a component family. Right-click or double-click a part to edit its value and connections. Shift-click selects groups; the context menu supports rotation, mirrors, copies and deletion.</p>
        <p><strong>Wiring:</strong> click Connect pins, then two pins to assign a shared net name. All matching node names connect electrically, including ground node 0. Lines show shared nets. Delete a connection by editing a pin's node name.</p>
        <p><strong>Analysis:</strong> R, C, L, voltage and current sources support DC, transient and AC. Transient uses zero energy initial conditions and backward Euler. AC treats every independent source value as its real phasor amplitude; one source is recommended for transfer measurements.</p>
        <p><strong>Digital:</strong> click INPUT components to toggle 0/1. Run creates a truth table; Tick advances clocks and D flip-flops.</p>
        <p><strong>Assistant:</strong> smart builders support arithmetic circuits, counters, shift registers, decoders, active filters, bridges and the original starter circuits. Local AI requires Ollama plus OLLAMA_MODEL in the server environment. Proposals replace the current circuit only when you click Apply. Undo restores the previous circuit.</p>
        <p>Advanced semiconductor models require an installed ngspice engine. Resources imports self-contained SPICE models and data packs. Verilog + TB exports digital designs. Full LTspice library compatibility, PCB layout and mixed-signal co-simulation are not implemented. See README.md for setup and limits.</p>
      </dialog>
      <div id="context-menu" className="context-menu" role="menu" hidden>
        <strong id="context-title" />
        <button role="menuitem" data-action="edit">Edit values / connections…</button>
        <button role="menuitem" data-action="generator" id="context-generator">Function generator…</button>
        <button role="menuitem" data-action="rotate">Rotate 90° <kbd>R</kbd></button>
        <button role="menuitem" data-action="mirror-x">Mirror horizontally</button>
        <button role="menuitem" data-action="mirror-y">Mirror vertically</button>
        <button role="menuitem" data-action="duplicate">Duplicate / multiple copies… <kbd>Ctrl+D</kbd></button>
        <button role="menuitem" data-action="delete" className="danger">Delete <kbd>Del</kbd></button>
      </div>
      <dialog id="properties-dialog">
        <div className="dialog-heading">
          <h2>Component properties</h2>
          <button id="close-properties" aria-label="Close properties">✕</button>
        </div>
        <div id="property-body" />
      </dialog>
      <dialog id="duplicate-dialog">
        <form id="duplicate-form">
          <h2>Duplicate selected components</h2>
          <p>Copies keep connections within the selection and use fresh external net names. Ground remains shared.</p>
          <label>Number of copies <input id="copy-count" type="number" min="1" max="32" defaultValue="1" required /></label>
          <div className="button-row">
            <button className="primary" type="submit">Create copies</button>
            <button id="cancel-duplicate" type="button">Cancel</button>
          </div>
        </form>
      </dialog>
      <dialog id="generator-dialog" className="wide-dialog">
        <div className="dialog-heading">
          <h2 id="generator-title">Function generator</h2>
          <button id="close-generator" aria-label="Close generator">✕</button>
        </div>
        <svg id="generator-preview" viewBox="0 0 720 175" role="img" aria-label="Function generator waveform preview" />
        <div id="generator-range" />
        <form id="generator-form">
          <div className="generator-grid">
            <label>
              Waveform
              <select name="wave">
                {['dc', 'sine', 'square', 'triangle', 'sawtooth', 'pulse', 'noise', 'arbitrary'].map(wave =>
                  <option key={wave}>{wave}</option>
                )}
              </select>
            </label>
            <label>Frequency (Hz)<input name="frequency" defaultValue="1k" required /></label>
            <label>Amplitude / DC level<input name="amplitude" defaultValue="1" required /></label>
            <label>
              Amplitude unit
              <select name="amplitudeMode">
                <option value="peak">Peak / pulse height</option>
                <option value="vpp">Peak-to-peak</option>
              </select>
            </label>
            <label>DC offset<input name="offset" defaultValue="0" /></label>
            <label>Phase (degrees)<input name="phase" defaultValue="0" /></label>
            <label>Duty cycle (%)<input name="duty" defaultValue="50" /></label>
            <label>Triangle symmetry (%)<input name="symmetry" defaultValue="50" /></label>
            <label>Start delay (s)<input name="delay" defaultValue="0" /></label>
            <label>Rise time (s)<input name="rise" defaultValue="0" /></label>
            <label>Fall time (s)<input name="fall" defaultValue="0" /></label>
            <label>Burst cycles (0 = continuous)<input name="burstCycles" defaultValue="0" /></label>
            <label>
              Frequency sweep
              <select name="sweep">
                <option>off</option>
                <option>linear</option>
                <option>log</option>
              </select>
            </label>
            <label>Sweep stop (Hz)<input name="sweepStop" defaultValue="10k" /></label>
            <label>Sweep duration (s)<input name="sweepTime" defaultValue="1" /></label>
            <label>
              Modulation
              <select name="modulation">
                <option>off</option>
                <option>am</option>
                <option>fm</option>
              </select>
            </label>
            <label>Modulation frequency (Hz)<input name="modFrequency" defaultValue="100" /></label>
            <label>AM depth (%)<input name="modDepth" defaultValue="50" /></label>
            <label>FM deviation (Hz)<input name="deviation" defaultValue="100" /></label>
            <label>Source resistance (Ω, 0 = ideal)<input name="sourceResistance" defaultValue="0" /></label>
          </div>
          <label className="pwl-label">
            Arbitrary normalized [time, level] points
            <textarea name="points" rows="2" defaultValue="[[0,-1],[0.5,1],[1,-1]]" />
          </label>
          <div className="button-row">
            <label className="output-toggle"><input name="outputEnabled" type="checkbox" defaultChecked /> Output enabled</label>
            <button className="primary" type="submit">Apply generator settings</button>
          </div>
          <p id="generator-error" role="status" />
          <p className="muted">Independent sources provide multiple channels. Amplitude is unloaded; source resistance changes voltage under load. Sweep is one-shot, burst ends at offset, and noise is deterministic. These are modeled controls, without a physical instrument's bandwidth or calibration.</p>
        </form>
      </dialog>
      <dialog id="resources-dialog" className="wide-dialog">
        <div className="dialog-heading">
          <h2>Extensions &amp; model resources</h2>
          <button id="close-resources" aria-label="Close resources">✕</button>
        </div>
        <p id="resource-engine" className="muted" />
        <button id="import-resource-file">Import SPICE model / data pack</button>
        <input id="resource-file" type="file" accept=".lib,.mod,.cir,.sp,.txt,.json" hidden />
        <form id="resource-form" className="resource-fetch">
          <label>Resource name<input id="resource-name" maxLength="120" /></label>
          <label>Direct HTTPS model URL<input id="resource-url" type="url" placeholder="https://…/model.lib" required /></label>
          <div className="button-row">
            <button id="fetch-resource" className="primary">Download &amp; install</button>
            <button id="register-resource-source" type="button">Register source for AI</button>
          </div>
        </form>
        <p className="muted">Import self-contained .model / .subckt text or JSON model packs. Control scripts, executable plugins and external include commands are rejected. Pin order follows the model definition. Source URLs are also available to the copilot for missing-model retrieval.</p>
        <form id="resource-search-form" className="resource-fetch">
          <label>Find a missing component model<input id="resource-query" maxLength="200" placeholder="Part number and manufacturer" required /></label>
          <button id="search-models" className="primary">Search model sources</button>
        </form>
        <div id="resource-search-results" />
        <div id="resource-sources" className="button-row" />
        <div id="resource-list" />
      </dialog>
      <section id="hdl-panel" className="hdl-panel" hidden>
        <div className="dialog-heading">
          <h2>Live Verilog + testbench</h2>
          <div>
            <button id="download-verilog">Download both .v files</button>
            <button id="close-hdl" aria-label="Close Verilog panel">✕</button>
          </div>
        </div>
        <p id="hdl-status" />
        <div className="hdl-editors">
          <label>Design · circuit_dut<textarea id="verilog-code" readOnly spellCheck="false" /></label>
          <label>Testbench · circuit_tb<textarea id="testbench-code" readOnly spellCheck="false" /></label>
        </div>
      </section>
    </>
  );
}
