# Remaining work after v0.3

| Area | Implemented foundation | Remaining capabilities |
| --- | --- | --- |
| Analog | Editable families, linear built-in engine, optional ngspice adapter, generic nonlinear model export | Real-engine compatibility matrix; calibrated manufacturer models; adaptive built-in solver; parameter sweeps; noise; FFT and measurements |
| Schematics | Shared-net editor, transforms, group selection/copies, right-click properties, pan/zoom, fit/arrange | Arbitrary wire routing, explicit junctions, box selection, hierarchical sheets, richer symbols, ERC |
| Signal sources | Standard waveforms, arbitrary points, burst/sweep/AM/FM, output impedance | Hardware-specific instrument emulation, trigger/sync terminals, calibration, nonideal bandwidth/jitter/distortion |
| External resources | Self-contained model/data packs, public HTTPS retrieval, search, provenance and pin mapping | ZIP/include-tree dependency resolution; richer model dialect support; curated licensed model registries; plugin API versioning |
| Copilot | Missing-model search/download/install tools, schema checks and available-engine smoke checks, bounded repair | Real-model end-to-end evaluations, full requirement assertions, tool-based incremental editing, physical design verification |
| Digital / HDL | Binary behavioral blocks and live Verilog/testbench export | Modern-compiler validation on every release; packed-bus editor, RAM/ROM, X/Z logic, delays, timing diagrams, HDL import |
| Mixed signal | Separate analog and digital engines | ADC/DAC bridge parts and event synchronization; ordinary digital Verilog cannot encode analog device models |
| Projects | 24 tabs, autosaved definitions, per-tab live caches, portable bundles | Durable runtime checkpoints, cloud sync, collaboration and revision history |
| PCB / compatibility | SPICE netlists and own versioned JSON | PCB document model, footprints, routing, DRC, fabrication export, LTspice .asc import and tested vendor-format interoperability |

This project does not claim complete LTspice, Deeds or Flux compatibility. Search results, parsed models, successful simulations and hardware correctness are distinct milestones.
