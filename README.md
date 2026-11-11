# Circuit Studio · v0.3.1

A local electronics workbench with analog, digital, FSM, and microcontroller workspaces, separate simulation APIs, and an optional MCP companion.

![Blank workbench](docs/preview.jpg)

## Run

Install Node.js 22 or newer, then run from this folder:

```sh
npm ci
npm start
```

Open **http://127.0.0.1:3000**. Stop with Ctrl+C. The Node server builds the React JSX and CSS with esbuild and serves both from localhost. Use `npm run dev` and refresh the browser after editing the frontend. Use `npm run build` to check the build or produce the static assets in `dist/`. The simulator APIs are served by `server.mjs`.

```sh
node --test
node scripts/check.mjs
```

For optional engine and AI settings, copy `.env.example` to `.env` and edit it. The server loads the project’s `.env` at startup. Environment variables already set in the shell take precedence.

## Plain canvas and editable components

New installations start with an empty circuit and closed tool panels. There are no example cards, copilot greetings, or startup suggestions. **Components**, **Copilot**, **Results**, and **Verilog + TB** open tools when requested. Existing saved documents are preserved; the first v0.3 launch adds a blank tab, and subsequent launches restore the saved active document.

There is **one resistor, capacitor and inductor family each**, with editable values. Old valued presets remain readable in older projects but do not appear in the library. See [docs/CATALOG.md](docs/CATALOG.md) for the actual component families and engine requirements.

- **Right-click** a component for values/connections, rotate 90°, horizontal/vertical mirroring, multiple-copy duplication, and deletion. Double-click opens properties.
- **Shift-click** to select several components; drag to move the selection. Ctrl+A selects the circuit, R rotates, Ctrl+D duplicates, Delete removes. Undo/redo restores circuit edits.
- Duplication keeps connections inside the copied selection, assigns new external net names, and keeps ground shared. Choose 1–32 copies, subject to the 256-component document limit.
- Wheel zoom follows the cursor. **＋ / −**, **Fit**, and **Arrange** remain available. Drag empty canvas to pan. The camera can zoom out to a much larger area; component centers can be placed within a 20,000-unit canvas.
- Matching node names connect electrically; ground is `0`. Click a port and move the pointer to see a live wire preview. Nearby destination ports snap and turn green. Click the destination, or drag from the first port and release over the destination, to connect. Escape or clicking the starting port again cancels. Ground remains ground regardless of click order. To disconnect a pin, give it a new net name in properties.
- Values accept `4.7k`, `100n`, `1u` and `1meg`. `m`/`M` means milli; use `meg` for mega.

Each document supports up to 256 placed components. Up to 24 workspaces can be open. New, duplicate, close/reopen and bundle import/export remain available. Definitions autosave in this browser; circuit histories, runtime state, results and chat stay separate during tab switching and reset on reload. Download files/bundles for durable backups. Nothing commits, pushes or publishes automatically.

## SPICE component families

The library includes passives, independent sources, controlled sources, diode/zener/LED, NPN/PNP, NMOS/PMOS, N/P JFET, switches, generic op-amp/comparator, coupled-winding transformer, mutual inductance, behavioral sources, transmission line, ground and voltage probe.

These are **independent standard SPICE families and generic educational models**, not a copy of LTspice's complete manufacturer library or schematic assets. The application does not import `.asc` schematics or encrypted/proprietary models. Manufacturer-specific components can be added through compatible model resources. This follows the `.model` / `.subckt` approach documented in [Analog Devices' LTspice model import guide](https://www.analog.com/en/resources/technical-articles/ltspice-how-to-import-third-party-models.html).

### Built-in engine

R/C/L, independent V/I, E/G controlled sources, original linear blocks and simple imported linear subcircuits run without external software. DC operating point, backward-Euler transient and AC magnitude/phase are supported. Ground and probes are annotations. Analog blocks expand before analysis.

The built-in solver is linear and limited to 256 expanded MNA unknowns. It cannot simulate semiconductor physics, nonlinear behavioral expressions, mutual inductance or transmission lines. Those parts fail clearly instead of being silently ignored.

### Optional ngspice engine

Install ngspice separately and put it on PATH, or set an executable path in `.env`:

```text
NGSPICE_BIN=C:\Spice64\bin\ngspice_con.exe
```

Restart and select **ngspice** in the engine menu. The server exports a self-contained netlist, runs ngspice batch mode in a temporary directory, and reads ASCII raw results back into the same plot/table UI. A run is limited to 30 seconds; results are limited to 30 MB. The adapter uses the [official batch/raw-file interface](https://ngspice.sourceforge.io/docs/ngspice-manual.pdf).

**ngspice is not bundled or installed on the development machine.** Its netlist generation, result parser and HTTP integration were checked; real nonlinear engine execution remains unverified here. Generic models are approximate. Compatibility depends on the imported SPICE dialect and model syntax; arbitrary LTspice models are not guaranteed to work in ngspice.

## Function generator

Place a Voltage / function generator (or current source), right-click it, and choose **Function generator**.

![Function generator](docs/generator.jpg)

Controls include:

- DC, sine, square, triangle, sawtooth, pulse, deterministic noise, and arbitrary normalized time/level waveforms.
- Frequency, peak or peak-to-peak amplitude, DC offset, phase, duty cycle and triangle symmetry.
- Start delay, rise/fall times, finite burst cycles, linear/log frequency sweep, AM depth, FM deviation and modulation frequency.
- Output enable and source resistance. Use 50 Ω for a typical generator output or 0 for an ideal source; actual load voltage depends on the circuit. Current-source resistance is modeled as a parallel output resistance.
- Live waveform preview. Place multiple independent sources for multiple channels.

The model does not reproduce every manufacturer's instrument controls, physical bandwidth, jitter, calibration, distortion or trigger I/O. Sweeps are one-shot, bursts end at offset, and arbitrary points repeat at the selected frequency. Pulse amplitude is its low-to-high height; bipolar wave amplitudes use peak or peak-to-peak. Generator controls are ignored when inappropriate to the waveform (for example modulation on DC).

Transient uses zero capacitor voltage and inductor current initial conditions, 400 fixed backward-Euler steps in the UI (engine API supports 2–2,000), and starts at the first timestep. Choose a duration that resolves the source frequency; fast signals can alias. AC graphs show absolute dBV from 10 Hz to 1 MHz; with one 1 V source this equals transfer gain. CSV includes phase. Complex SPICE waveforms export as sampled PWL data over the selected/default analysis duration; external results can differ near sampled edges.

## Extensions and external resources

Open **Resources** to:

1. Import self-contained `.lib`, `.mod`, `.cir`, `.sp`, `.txt` model files or JSON model packs.
2. Download a plaintext model from a public HTTPS URL. GitHub blob links are converted to raw links.
3. Register source URLs for copilot retrieval without first installing the model.
4. Search model sources by part number/manufacturer and choose a source URL to inspect/download.
5. Export installed resource packs.

`.model` entries and `.subckt` headers create named components with the source's exact pin order. Placing a model embeds its text and provenance in the circuit JSON/bundle. Imported models appear in the library under **Imported models**. The fixture [examples/resources/linear-divider.lib](examples/resources/linear-divider.lib) demonstrates a linear imported part that runs in the built-in engine.

Model packs are data, **not executable browser extensions**. The parser rejects control scripts, file include/load commands and unsupported directives. Imports are limited to 20 resources / 2 MB per circuit and 300 KB per resource. ZIP archives and dependent include trees must be extracted/flattened into self-contained model text first. Manufacturer download terms and license metadata remain attached when supplied; the app does not infer redistribution rights or guarantee a vendor model's accuracy.

The downloader permits public HTTPS only, pins a DNS-checked public address, checks redirects and limits response size/time. `.param`/`.func` and nonlinear subcircuits generally require ngspice. The built-in importer expands basic R/C/L/V/I/E/G subcircuits with simple numeric/default parameters, up to eight nested levels.

Model search uses [Firecrawl's official search API](https://docs.firecrawl.dev/features/search). Anonymous allowance may be limited; optionally configure `FIRECRAWL_API_KEY` for your account. Set `MODEL_SEARCH_ENABLED=0` to disable discovery. Component search terms are sent to that provider; circuits and model files are not uploaded for search. The connected Firecrawl plugin in the development chat does not automatically provide credentials to this application.

## Copilot and missing components

Start [Ollama](https://ollama.com/), then open **Copilot → Local AI · Ollama**. The workbench checks Ollama's installed models and displays the connected model name. The default address is `http://127.0.0.1:11434`. Set `OLLAMA_MODEL` in `.env` to choose a specific installed model, such as `TinyLlama:latest`. Leave the value empty to discover a local model automatically. The project does not download models.

For cloud circuit generation, add your own API keys to the local, Git-ignored `.env` and restart the server:

```dotenv
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-4-carbon
XAI_API_KEY=your_xai_api_key
GROK_MODEL=grok-4.7
GROQ_API_KEY=your_groqcloud_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

Choose **Gemini · Google API**, **Grok · xAI API**, or **Groq · GroqCloud API** in Copilot. Configure any provider on its own. For Groq, use a model with [JSON Object Mode](https://console.groq.com/docs/structured-outputs). The server keeps the keys out of the frontend. Each cloud request shares the prompt and catalog context with the selected provider and may use API credits. Check **Include current circuit and registered model sources** when you want the provider to extend an existing circuit.

Cloud providers can accept specifications up to 12,000 characters. For a larger design, describe the stages, pin or bus widths, clock and reset behavior, source values, and expected outputs. Copilot requests a structured circuit and lays it out automatically. It can retry once with a validation diagnostic. The workbench supports up to 256 components per project. Split larger or mixed-signal designs into separately testable stages. A passed check means the circuit could run under the simulator's checks. Compare waveforms or outputs with your requirements before relying on the design.

The model gets relevant component definitions and any attached project context. For missing parts it can request a model search, select candidate URLs, download up to three models, receive parsed pin definitions, and construct a circuit using them. The server binds model names to imported library definitions, validates the circuit, runs available smoke checks, and permits one diagnostic repair. The flow is bounded to four model calls, one search and three downloads per request. Model calls time out after 90 seconds for Ollama or 180 seconds for a cloud provider.

Downloads are installed as circuit data; they do not execute model-generated code or shell commands. Search results remain untrusted source material. A compatible model must actually be retrieved and parsed. If ngspice is missing, nonlinear proposals are explicitly labeled **simulation pending**, rather than verified.

The external-model search and import flow is covered by tests with mocked upstream responses and a real built-in linear solve. TinyLlama uses a compact structured response for simple projects on a blank canvas. If a model's proposal fails validation and the prompt matches a built-in design, Copilot can offer that recipe as a separate preview. Model quality, source availability, format compatibility and the installed engine determine which requests succeed. Smoke checks do not prove circuit specifications or physical hardware correctness.

The optional deterministic Parametric builder mode still supports larger predefined families (ALUs, ripple adders, counters, decoders, active filters and bridges), without startup suggestions or example cards.

## Live Verilog and testbench

Open **Verilog + TB** in a digital workspace. Both panes regenerate when the schematic changes; download both `.v` files together.

- Basic gates, DFFs and all catalog digital block families have structural/behavioral Verilog mappings.
- Input and CLOCK symbols become input ports; OUTPUT symbols become output ports. Bit vectors use little-endian pin order.
- Combinational circuits with at most 8 inputs get exhaustive simulation-derived assertions.
- Sequential and larger circuits get a clearly labeled smoke-stimulus bench; add design-specific assertions before relying on it.
- Analog SPICE components cannot be translated into ordinary digital Verilog; the panel reports this rather than emitting misleading code.

With a working modern Icarus installation:

```sh
iverilog -g2012 -s circuit_tb -o circuit.out your-circuit.v your-circuit_tb.v
vvp circuit.out
```

This produces `circuit.vcd`. The development machine's Icarus 0.9.7 backend crashes even on a minimal module; compilation validation is therefore skipped locally, with that reason recorded. The test suite automatically compiles/runs every digital catalog block when Icarus 10+ is available.

## Other workspaces and files

| Workspace | Interface | Local API |
| --- | --- | --- |
| Analog | SPICE export, engine selection, DC/AC/transient plots and voltage probes | `POST /api/analog/run` |
| Digital | Truth tables, timed clocks, Verilog export and optional Icarus verification | `POST /api/digital/run` |
| FSM | JSON editor, transition table, active state and event log | `POST /api/fsm/run` |
| Microcontrollers | Target selector, assembly editor, instruction stepping, registers and port latches | `POST /api/microcontrollers/run` |

The digital workspace's **Icarus verification** analysis runs generated Verilog assertions for combinational circuits with up to eight inputs. On success it offers a VCD download. It requires working Icarus and vvp executables that support SystemVerilog 2012. Set `IVERILOG_BIN` and `VVP_BIN` if they are outside PATH. Built-in digital timing is zero-delay and uses each clock's configured frequency.

**Microcontrollers** includes the original teaching CPU, an ATmega328P AVR assembly subset, and an MCS-51 assembly subset. Choose a target, type assembly or select **Load example**, and use **Assemble / reset** before stepping or running. The AVR and 8051 views show port register values in hex and binary. These profiles model selected instructions and register latches. They have no peripheral timing, interrupt emulation, compiled firmware loading, or schematic pin co-simulation. **Save JSON** preserves the target and drafts. **Save assembly** exports the active source, and **Open project** accepts JSON and `.asm` files. Raw assembly imports use the current microcontroller target, or the teaching CPU from another mode.

## Local MCP companion

Start the Node server with `node server.mjs`. Install the optional Python MCP dependencies (Python 3.10+):

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements-mcp.txt
```

On macOS and Linux use `.venv/bin/python`. Add a stdio server entry in your MCP client with the absolute path to that interpreter as the command and the absolute path to `mcp_server.py` as its first argument:

```json
{
  "mcpServers": {
    "circuit-studio": {
      "command": "C:/path/to/Simulator/.venv/Scripts/python.exe",
      "args": ["C:/path/to/Simulator/mcp_server.py"]
    }
  }
}
```

The companion exposes `simulator_status`, `simulate_analog`, `simulate_digital`, `simulate_fsm` and `simulate_microcontroller`. It calls the same simulation API as the browser on `127.0.0.1`. If you change the Node `PORT`, set `CIRCUIT_STUDIO_PORT` to the same value in your MCP client configuration. MCP traces may be sampled for display. Use the workbench CSV or VCD export for complete results. See the [Python MCP SDK v1 documentation](https://py.sdk.modelcontextprotocol.io/v1/).

This project uses a local browser UI, a Node HTTP backend, and Python stdio for MCP. The analog native adapter uses ngspice. Tauri packaging, remote workers, LTspice execution, and full firmware emulation with Renode or simavr are future integrations.

Important files:

```text
index.html                                   React mount document
src/ui/                                      React workspace views, dialogs and UI styles
scripts/build-frontend.mjs                   Node/esbuild JSX and CSS build
backend/ollama.mjs                           Local model discovery and chat adapter
backend/cloud-copilot.mjs                    Gemini and Grok API adapters and structured output
src/app.js                                  Shared schematic editor and workspace tabs
src/workspaces/                             Mode-specific browser controllers and result views
backend/                                    Separate simulation handlers and Icarus adapter
mcp_server.py                               Local stdio tools for all four simulation modes
src/catalog.js                              Editable families and legacy ID compatibility
src/model.js / src/analog.js / src/digital.js Validation, export and built-in engines
src/waveforms.js                            Generator validation, sampling and SPICE sources
src/transforms.js                           Rotation, mirrors, isolated multiple copies
src/resources.js                            Model parser and linear subcircuit expansion
server-resources.mjs                        HTTPS downloader and model discovery
ngspice.mjs                                 Optional batch simulator and raw result parser
server.mjs                                  Local HTTP and bounded copilot tool workflow
src/verilog.js                              Digital design + testbench generator
src/workspaces.js                           Saved document definitions and bundles
tests/                                      Numerical, model, UI-core and HTTP tests
examples/                                   Editable fixtures and saved circuits
docs/CATALOG.md                             Visible component families and pin order
docs/VERIFICATION.md                         What was checked and what remains unverified
```

Regenerate catalog docs/examples with `node scripts/export-catalog.mjs`. The source is ready for your own Git review/commit/push; `.env`, runtime files and `release/` are ignored. The app never pushes or publishes. MIT license; no affiliation with LTspice, Deeds, Flux, Ollama or model suppliers.
