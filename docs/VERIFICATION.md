# Verification · v0.3

Node.js 22.20.0, built-in test runner. **35 tests pass; 2 optional native-engine integration tests are skipped.** All project JavaScript passes syntax checks.

## Automated checks

- Analytic DC divider, branch-current direction, RC exponential transient and AC cutoff/phase, RLC steady state, singular/floating circuits.
- Original and legacy catalog validation; one visible R/C/L family each; driven digital blocks, arithmetic, mux, encoder, DFF, FSM and CPU behavior.
- Function-generator waveform samples, phase, duty, offsets, delays, finite bursts, AM/FM and sweep finiteness, deterministic noise, arbitrary-wave validation and PWL serialization.
- A 50 Ω voltage source driving 50 Ω produces half its unloaded amplitude.
- Rotation/mirror coordinates; group duplication preserves internal connections and separates copied external nets.
- Imported linear `.subckt` validation, real built-in solve, JSON roundtrip and self-contained SPICE export. Nonlinear devices reject the linear engine instead of being ignored.
- Resource command/include rejection, public-address checks, private-address/HTTP download blocking, ngspice real/complex raw result parsing.
- Local HTTP access restrictions and mocked copilot repair behavior.
- Mocked missing-model tool workflow: search → resource download → parsed model association → complete circuit → real built-in DC/transient smoke checks.
- Verilog/testbench generation and exhaustive half-adder assertion content.

## Browser checks

- Blank startup canvas, with previous saved project tabs preserved and no automatic suggestions.
- One resistor family; right-click changed a resistor from 1 kΩ to 4.7 kΩ.
- Right-click rotation produced transformed pins and a 90° body transform. Multiple-copy duplication created the requested two copies.
- Function-generator dialog: 2 kHz sine, 10 Vpp, 1 V offset, 90° phase, 50 Ω source resistance; preview showed -4 V to +6 V over 1 ms and settings applied.
- External fixture `.lib` imported through the file chooser, became a placeable model, and produced 500 mV from a 1 V source in the browser's built-in solver.
- Live Verilog and testbench populated for the existing 8-bit ALU, with the bench correctly labeled smoke stimulus.
- v0.3.1: visible pointer-following wire preview, highlighted source, green destination snapping, click completion, drag/release completion, Escape cancellation and clean workspace switching. Completed net counts decreased as expected; no browser errors appeared. Route and nearest-port selection also have focused unit tests. Component hit regions were narrowed to avoid covering adjacent ports.
- Prior workspace switching, autosave/bundle, analog/digital/FSM/CPU checks remain covered by the existing tests.

`docs/preview.jpg` shows the plain workbench. `docs/generator.jpg` shows the verified generator configuration.

## Limits

No ngspice executable is installed here; native nonlinear execution is unverified. The adapter's netlist and raw result handling are tested, not full LTspice compatibility. No real Ollama model or live Firecrawl REST search was invoked during application testing; those HTTP paths use mocks. External vendor models and provider availability vary.

The installed Icarus Verilog is 0.9.7. Its backend fails even for a minimal module, so it cannot provide a meaningful HDL compilation result. The optional integration test requires a working Icarus 10+ installation and automatically compiles/runs generated designs for all digital block families there. Local generation checks passed; real HDL compilation has not been verified. GitHub CI is configured to install modern Icarus and ngspice and exercise both optional integration tests when the user pushes the repository; that CI job has not been run here.

Large analog runs still use dense solvers on the browser main thread. Waveform resolution is fixed and can alias fast signals. Generic semiconductor/op-amp models are educational, not calibrated manufacturer models. Smoke tests do not prove functional requirements or physical circuit safety/performance.
