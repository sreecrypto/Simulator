export function Header() {
  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Circuit Studio home">
          <span className="brand-mark">⌁</span>
          <span>CIRCUIT<span className="brand-light">STUDIO</span><small>OPEN ELECTRONICS WORKBENCH</small></span>
        </a>
        <span className="version">LOCAL / v0.3.1</span>
        <div className="top-actions">
          <button id="import">↥ Open project</button>
          <button id="save">↧ Save JSON</button>
          <button id="open-resources">Resources</button>
          <button id="help">? Guide</button>
        </div>
      </header>
      <nav className="modules" aria-label="Workspace modules">
        <button className="module active" data-module="analog">◉ <span>Analog circuits</span><small>RLC · MNA</small></button>
        <button className="module" data-module="digital">⌘ <span>Digital logic</span><small>GATES · TIMING</small></button>
        <button className="module" data-module="fsm">◎ <span>State machines</span><small>FSM DESIGNER</small></button>
        <button className="module" data-module="cpu">▦ <span>Microcontrollers</span><small>TEACHING · AVR · 8051</small></button>
      </nav>
      <section className="workspace-bar" aria-label="Open workspaces">
        <div className="workspace-caption">PROJECTS <span id="workspace-total" /></div>
        <div id="workspace-tabs" role="tablist" aria-label="Workspace tabs" />
        <div className="workspace-actions">
          <button id="new-workspace" title="New workspace in current module">＋ New</button>
          <button id="duplicate-workspace" title="Duplicate workspace">⧉</button>
          <button id="reopen-workspace" title="Reopen last closed workspace">↶</button>
          <button id="export-session" title="Download all open workspaces">⇩ Bundle</button>
        </div>
      </section>
    </>
  );
}

export function Footer() {
  return (
    <>
      <footer className="bottom-bar">
        <span><span className="tiny-dot" /> LOCAL WORKSPACE</span>
        <span id="footer-count">0 components</span>
        <span>Editable components · SPICE resources · Verilog export</span>
      </footer>
      <div id="toast" role="status" hidden />
      <input id="file-input" type="file" accept=".json,.asm,application/json" hidden />
    </>
  );
}
