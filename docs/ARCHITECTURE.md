# Architecture · v0.3

Circuit Studio is a dependency-free browser ES-module application with a local Node HTTP server. Built-in linear and digital simulation run in the browser. Optional model search/download, Ollama calls and ngspice processes run on the server.

## Circuit and model contracts

Circuit JSON remains version 1: `{version:1,name,mode,components,wires:[],resources?:[]}`. Placed parts have a unique reference, type, center position, ordered net names, SI value, optional `libraryId`, and optional generator/model/transform properties. `rotation` is a multiple of 90; `mirrorX` and `mirrorY` are booleans. Transformed pin coordinates drive rendered net paths while the electrical node order remains unchanged.

`catalog.js` keeps legacy preset IDs readable but hides them from the current analog library. Current analog entries are editable families. `registerResources` creates stable content-hashed imported library IDs; documents embed the resources they use so a model does not depend on another browser's library storage.

Resources contain name, source URL, license metadata and plaintext SPICE. `resources.js` accepts constrained `.model` / `.subckt` definitions and rejects executable/control/include directives. Model names, types and ordered pins are checked. Simple linear subcircuits expand to R/C/L/V/I/E/G components; advanced expressions and nonlinear devices require ngspice. Missing definitions are errors, not simulated placeholders.

## Engines

- `analog.js` uses modified nodal analysis with pivoting for small linear networks. DC, zero-energy fixed-step backward Euler and complex AC are supported. Unsupported devices fail explicitly.
- `waveforms.js` defines the source waveform used by preview and built-in simulation, plus direct SIN/PULSE or sampled PWL export. Source resistance expands to a series resistor for voltage sources or parallel resistor for current sources.
- `ngspice.mjs` creates a checked temporary directory, writes a self-contained netlist, invokes the configured executable with `execFile` (no shell), bounds execution/output, parses ASCII raw vectors and removes the owned temporary directory. Installation and model dialect compatibility are external prerequisites.
- `digital.js` iterates binary combinational logic to a fixed point, rejects undriven/multiply driven nets and updates state elements from a common snapshot.
- `verilog.js` maps the same digital families to HDL and emits exhaustive small combinational assertions or clearly labeled smoke stimulus. Analog models do not produce digital HDL.

## Workspaces and editor

The application stores 1–24 open document definitions in browser storage and exports them as bundles. Source definitions survive reload; live caches keep history, simulation state, results, camera and copilot threads isolated while switching documents. Legacy single-circuit storage remains a recovery/migration source.

New v0.3 users start with a blank circuit and closed component/copilot/results panels. Existing saved tabs are retained. Context menus operate on the selected component set. `transforms.js` handles coordinate transforms and duplicates groups with fresh external nets, preserving internal connectivity and ground.

## External resources and copilot tools

`server-resources.mjs` pins DNS-validated public HTTPS destinations, checks redirects and bounds responses. It can also call Firecrawl's documented search endpoint with a bounded component query. User-supplied source URLs and fetched content remain data, not instructions.

The copilot receives relevant library definitions and can request one model search and up to three downloads. Parsed model definitions are sent back with exact pin orders. It then returns a complete circuit, which is validated and smoke-tested by an available engine. One diagnostic repair is allowed, within four model calls total. Nonlinear models are marked pending if ngspice is unavailable. No generated shell/JavaScript code is executed.

The server binds to loopback, restricts Host/Origin and serves only UI source assets. Environment files and repository metadata are not served. This is a local application; remote/multi-user hosting would require authentication, quotas and isolation.

## Boundaries

LTspice assets, full manufacturer libraries, `.asc` import, encrypted models, PCB design, analog-to-digital co-simulation and physical verification are not implemented. Resource dependencies must be self-contained. Model search, import and compilation are separate stages, and each can fail independently.
