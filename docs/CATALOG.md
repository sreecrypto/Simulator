# Component families — v0.3

Analog components are editable families: one resistor, capacitor and inductor entry each. Values are set in component properties. Legacy valued presets remain readable in old project files but are hidden from the library. Generic nonlinear and advanced SPICE families require an installed ngspice engine. Manufacturer models can be imported separately; the LTspice library itself is not bundled.

Digital buses use separate pins, bit 0 first. Subtractor CARRY means borrow. Priority encoders select the highest numbered asserted input. Counter RESET is active-high asynchronous; ENABLE gates rising-edge updates. Registers and shifts update on rising edges. Clock inputs must be driven.

## Analog / electronic — 28 entries

| ID | Component | Category | Pins (ordered) | Engine |
| --- | --- | --- | --- | --- |
| resistor | Resistor | Passive components | A, B | Built-in |
| capacitor | Capacitor | Passive components | A, B | Built-in |
| inductor | Inductor | Passive components | A, B | Built-in |
| voltage | Voltage / function generator | Sources | +, − | Built-in |
| current | Current source | Sources | +, − | Built-in |
| vcvs | Voltage-controlled voltage source | Controlled sources | OUT+, OUT−, IN+, IN− | Built-in |
| vccs | Voltage-controlled current source | Controlled sources | OUT+, OUT−, IN+, IN− | Built-in |
| ground | Ground | Connections | GND | Built-in |
| probe | Voltage probe | Connections | NET | Built-in |
| diode | Diode | Semiconductors & ICs | A, K | ngspice |
| zener | Zener diode | Semiconductors & ICs | A, K | ngspice |
| led | LED | Semiconductors & ICs | A, K | ngspice |
| npn | NPN transistor | Semiconductors & ICs | C, B, E | ngspice |
| pnp | PNP transistor | Semiconductors & ICs | C, B, E | ngspice |
| nmos | N-channel MOSFET | Semiconductors & ICs | D, G, S, B | ngspice |
| pmos | P-channel MOSFET | Semiconductors & ICs | D, G, S, B | ngspice |
| njfet | N-channel JFET | Semiconductors & ICs | D, G, S | ngspice |
| pjfet | P-channel JFET | Semiconductors & ICs | D, G, S | ngspice |
| switch | Voltage-controlled switch | Semiconductors & ICs | A, B, CTRL+, CTRL− | ngspice |
| opamp | Generic op-amp (supply-limited) | Semiconductors & ICs | IN+, IN−, V+, V−, OUT | ngspice |
| comparator | Generic comparator | Semiconductors & ICs | IN+, IN−, V+, V−, OUT | ngspice |
| transformer | Transformer (coupled windings) | Semiconductors & ICs | P+, P−, S+, S− | ngspice |
| cccs | Current-controlled current source | Advanced SPICE | OUT+, OUT− | ngspice |
| ccvs | Current-controlled voltage source | Advanced SPICE | OUT+, OUT− | ngspice |
| coupling | Mutual inductance | Advanced SPICE | Inductor reference fields | ngspice |
| behavioral_v | Behavioral voltage source | Advanced SPICE | +, − | ngspice |
| behavioral_i | Behavioral current source | Advanced SPICE | +, − | ngspice |
| transmission_line | Lossless transmission line | Advanced SPICE | IN+, IN−, OUT+, OUT− | ngspice |

## Digital / logic — 281 entries

| ID | Component | Category | Pins (ordered) | Engine |
| --- | --- | --- | --- | --- |
| logic_input | Logic input | Essentials | OUT | Built-in |
| logic_output | Logic output | Essentials | IN | Built-in |
| logic_clock | Clock | Essentials | OUT | Built-in |
| logic_not | Inverter | Essentials | IN, OUT | Built-in |
| logic_and | AND gate | Essentials | A, B, Y | Built-in |
| logic_or | OR gate | Essentials | A, B, Y | Built-in |
| logic_xor | XOR gate | Essentials | A, B, Y | Built-in |
| logic_nand | NAND gate | Essentials | A, B, Y | Built-in |
| logic_nor | NOR gate | Essentials | A, B, Y | Built-in |
| logic_xnor | XNOR gate | Essentials | A, B, Y | Built-in |
| logic_dff | D flip-flop | Essentials | D, CLK, Q | Built-in |
| and_2 | 2-input AND | Gates | I0, I1, Y | Built-in |
| and_3 | 3-input AND | Gates | I0, I1, I2, Y | Built-in |
| and_4 | 4-input AND | Gates | I0, I1, I2, I3, Y | Built-in |
| and_5 | 5-input AND | Gates | I0, I1, I2, I3, I4, Y | Built-in |
| and_6 | 6-input AND | Gates | I0, I1, I2, I3, I4, I5, Y | Built-in |
| and_7 | 7-input AND | Gates | I0, I1, I2, I3, I4, I5, I6, Y | Built-in |
| and_8 | 8-input AND | Gates | I0, I1, I2, I3, I4, I5, I6, I7, Y | Built-in |
| and_9 | 9-input AND | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, Y | Built-in |
| and_10 | 10-input AND | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, Y | Built-in |
| and_11 | 11-input AND | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, Y | Built-in |
| and_12 | 12-input AND | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, Y | Built-in |
| or_2 | 2-input OR | Gates | I0, I1, Y | Built-in |
| or_3 | 3-input OR | Gates | I0, I1, I2, Y | Built-in |
| or_4 | 4-input OR | Gates | I0, I1, I2, I3, Y | Built-in |
| or_5 | 5-input OR | Gates | I0, I1, I2, I3, I4, Y | Built-in |
| or_6 | 6-input OR | Gates | I0, I1, I2, I3, I4, I5, Y | Built-in |
| or_7 | 7-input OR | Gates | I0, I1, I2, I3, I4, I5, I6, Y | Built-in |
| or_8 | 8-input OR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, Y | Built-in |
| or_9 | 9-input OR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, Y | Built-in |
| or_10 | 10-input OR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, Y | Built-in |
| or_11 | 11-input OR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, Y | Built-in |
| or_12 | 12-input OR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, Y | Built-in |
| xor_2 | 2-input XOR | Gates | I0, I1, Y | Built-in |
| xor_3 | 3-input XOR | Gates | I0, I1, I2, Y | Built-in |
| xor_4 | 4-input XOR | Gates | I0, I1, I2, I3, Y | Built-in |
| xor_5 | 5-input XOR | Gates | I0, I1, I2, I3, I4, Y | Built-in |
| xor_6 | 6-input XOR | Gates | I0, I1, I2, I3, I4, I5, Y | Built-in |
| xor_7 | 7-input XOR | Gates | I0, I1, I2, I3, I4, I5, I6, Y | Built-in |
| xor_8 | 8-input XOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, Y | Built-in |
| xor_9 | 9-input XOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, Y | Built-in |
| xor_10 | 10-input XOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, Y | Built-in |
| xor_11 | 11-input XOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, Y | Built-in |
| xor_12 | 12-input XOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, Y | Built-in |
| nand_2 | 2-input NAND | Gates | I0, I1, Y | Built-in |
| nand_3 | 3-input NAND | Gates | I0, I1, I2, Y | Built-in |
| nand_4 | 4-input NAND | Gates | I0, I1, I2, I3, Y | Built-in |
| nand_5 | 5-input NAND | Gates | I0, I1, I2, I3, I4, Y | Built-in |
| nand_6 | 6-input NAND | Gates | I0, I1, I2, I3, I4, I5, Y | Built-in |
| nand_7 | 7-input NAND | Gates | I0, I1, I2, I3, I4, I5, I6, Y | Built-in |
| nand_8 | 8-input NAND | Gates | I0, I1, I2, I3, I4, I5, I6, I7, Y | Built-in |
| nand_9 | 9-input NAND | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, Y | Built-in |
| nand_10 | 10-input NAND | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, Y | Built-in |
| nand_11 | 11-input NAND | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, Y | Built-in |
| nand_12 | 12-input NAND | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, Y | Built-in |
| nor_2 | 2-input NOR | Gates | I0, I1, Y | Built-in |
| nor_3 | 3-input NOR | Gates | I0, I1, I2, Y | Built-in |
| nor_4 | 4-input NOR | Gates | I0, I1, I2, I3, Y | Built-in |
| nor_5 | 5-input NOR | Gates | I0, I1, I2, I3, I4, Y | Built-in |
| nor_6 | 6-input NOR | Gates | I0, I1, I2, I3, I4, I5, Y | Built-in |
| nor_7 | 7-input NOR | Gates | I0, I1, I2, I3, I4, I5, I6, Y | Built-in |
| nor_8 | 8-input NOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, Y | Built-in |
| nor_9 | 9-input NOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, Y | Built-in |
| nor_10 | 10-input NOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, Y | Built-in |
| nor_11 | 11-input NOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, Y | Built-in |
| nor_12 | 12-input NOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, Y | Built-in |
| xnor_2 | 2-input XNOR | Gates | I0, I1, Y | Built-in |
| xnor_3 | 3-input XNOR | Gates | I0, I1, I2, Y | Built-in |
| xnor_4 | 4-input XNOR | Gates | I0, I1, I2, I3, Y | Built-in |
| xnor_5 | 5-input XNOR | Gates | I0, I1, I2, I3, I4, Y | Built-in |
| xnor_6 | 6-input XNOR | Gates | I0, I1, I2, I3, I4, I5, Y | Built-in |
| xnor_7 | 7-input XNOR | Gates | I0, I1, I2, I3, I4, I5, I6, Y | Built-in |
| xnor_8 | 8-input XNOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, Y | Built-in |
| xnor_9 | 9-input XNOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, Y | Built-in |
| xnor_10 | 10-input XNOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, Y | Built-in |
| xnor_11 | 11-input XNOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, Y | Built-in |
| xnor_12 | 12-input XNOR | Gates | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, Y | Built-in |
| adder_1 | 1-bit adder | Arithmetic & buses | A0, B0, Y0, CARRY | Built-in |
| subtractor_1 | 1-bit subtractor | Arithmetic & buses | A0, B0, Y0, CARRY | Built-in |
| comparator_1 | 1-bit comparator | Arithmetic & buses | A0, B0, LT, EQ, GT | Built-in |
| increment_1 | 1-bit increment | Arithmetic & buses | A0, Y0 | Built-in |
| decrement_1 | 1-bit decrement | Arithmetic & buses | A0, Y0 | Built-in |
| negate_1 | 1-bit negate | Arithmetic & buses | A0, Y0 | Built-in |
| parity_1 | 1-bit parity | Arithmetic & buses | A0, ODD, EVEN | Built-in |
| buffer_1 | 1-bit buffer | Arithmetic & buses | A0, Y0 | Built-in |
| invert_1 | 1-bit invert | Arithmetic & buses | A0, Y0 | Built-in |
| andbus_1 | 1-bit andbus | Arithmetic & buses | A0, B0, Y0 | Built-in |
| orbus_1 | 1-bit orbus | Arithmetic & buses | A0, B0, Y0 | Built-in |
| xorbus_1 | 1-bit xorbus | Arithmetic & buses | A0, B0, Y0 | Built-in |
| mux2_1 | 1-bit 2:1 multiplexer | Routing | A0, B0, SEL, Y0 | Built-in |
| demux2_1 | 1-bit 1:2 demultiplexer | Routing | D0, SEL, A0, B0 | Built-in |
| register_1 | 1-bit D register | Sequential | D0, CLK, Q0 | Built-in |
| counter_1 | 1-bit up counter | Sequential | CLK, RESET, ENABLE, Q0 | Built-in |
| shift_1 | 1-bit shift register | Sequential | DATA, CLK, RESET, Q0 | Built-in |
| adder_2 | 2-bit adder | Arithmetic & buses | A0, A1, B0, B1, Y0, Y1, CARRY | Built-in |
| subtractor_2 | 2-bit subtractor | Arithmetic & buses | A0, A1, B0, B1, Y0, Y1, CARRY | Built-in |
| comparator_2 | 2-bit comparator | Arithmetic & buses | A0, A1, B0, B1, LT, EQ, GT | Built-in |
| increment_2 | 2-bit increment | Arithmetic & buses | A0, A1, Y0, Y1 | Built-in |
| decrement_2 | 2-bit decrement | Arithmetic & buses | A0, A1, Y0, Y1 | Built-in |
| negate_2 | 2-bit negate | Arithmetic & buses | A0, A1, Y0, Y1 | Built-in |
| parity_2 | 2-bit parity | Arithmetic & buses | A0, A1, ODD, EVEN | Built-in |
| buffer_2 | 2-bit buffer | Arithmetic & buses | A0, A1, Y0, Y1 | Built-in |
| invert_2 | 2-bit invert | Arithmetic & buses | A0, A1, Y0, Y1 | Built-in |
| andbus_2 | 2-bit andbus | Arithmetic & buses | A0, A1, B0, B1, Y0, Y1 | Built-in |
| orbus_2 | 2-bit orbus | Arithmetic & buses | A0, A1, B0, B1, Y0, Y1 | Built-in |
| xorbus_2 | 2-bit xorbus | Arithmetic & buses | A0, A1, B0, B1, Y0, Y1 | Built-in |
| mux2_2 | 2-bit 2:1 multiplexer | Routing | A0, A1, B0, B1, SEL, Y0, Y1 | Built-in |
| demux2_2 | 2-bit 1:2 demultiplexer | Routing | D0, D1, SEL, A0, A1, B0, B1 | Built-in |
| register_2 | 2-bit D register | Sequential | D0, D1, CLK, Q0, Q1 | Built-in |
| counter_2 | 2-bit up counter | Sequential | CLK, RESET, ENABLE, Q0, Q1 | Built-in |
| shift_2 | 2-bit shift register | Sequential | DATA, CLK, RESET, Q0, Q1 | Built-in |
| adder_3 | 3-bit adder | Arithmetic & buses | A0, A1, A2, B0, B1, B2, Y0, Y1, Y2, CARRY | Built-in |
| subtractor_3 | 3-bit subtractor | Arithmetic & buses | A0, A1, A2, B0, B1, B2, Y0, Y1, Y2, CARRY | Built-in |
| comparator_3 | 3-bit comparator | Arithmetic & buses | A0, A1, A2, B0, B1, B2, LT, EQ, GT | Built-in |
| increment_3 | 3-bit increment | Arithmetic & buses | A0, A1, A2, Y0, Y1, Y2 | Built-in |
| decrement_3 | 3-bit decrement | Arithmetic & buses | A0, A1, A2, Y0, Y1, Y2 | Built-in |
| negate_3 | 3-bit negate | Arithmetic & buses | A0, A1, A2, Y0, Y1, Y2 | Built-in |
| parity_3 | 3-bit parity | Arithmetic & buses | A0, A1, A2, ODD, EVEN | Built-in |
| buffer_3 | 3-bit buffer | Arithmetic & buses | A0, A1, A2, Y0, Y1, Y2 | Built-in |
| invert_3 | 3-bit invert | Arithmetic & buses | A0, A1, A2, Y0, Y1, Y2 | Built-in |
| andbus_3 | 3-bit andbus | Arithmetic & buses | A0, A1, A2, B0, B1, B2, Y0, Y1, Y2 | Built-in |
| orbus_3 | 3-bit orbus | Arithmetic & buses | A0, A1, A2, B0, B1, B2, Y0, Y1, Y2 | Built-in |
| xorbus_3 | 3-bit xorbus | Arithmetic & buses | A0, A1, A2, B0, B1, B2, Y0, Y1, Y2 | Built-in |
| mux2_3 | 3-bit 2:1 multiplexer | Routing | A0, A1, A2, B0, B1, B2, SEL, Y0, Y1, Y2 | Built-in |
| demux2_3 | 3-bit 1:2 demultiplexer | Routing | D0, D1, D2, SEL, A0, A1, A2, B0, B1, B2 | Built-in |
| register_3 | 3-bit D register | Sequential | D0, D1, D2, CLK, Q0, Q1, Q2 | Built-in |
| counter_3 | 3-bit up counter | Sequential | CLK, RESET, ENABLE, Q0, Q1, Q2 | Built-in |
| shift_3 | 3-bit shift register | Sequential | DATA, CLK, RESET, Q0, Q1, Q2 | Built-in |
| adder_4 | 4-bit adder | Arithmetic & buses | A0, A1, A2, A3, B0, B1, B2, B3, Y0, Y1, Y2, Y3, CARRY | Built-in |
| subtractor_4 | 4-bit subtractor | Arithmetic & buses | A0, A1, A2, A3, B0, B1, B2, B3, Y0, Y1, Y2, Y3, CARRY | Built-in |
| comparator_4 | 4-bit comparator | Arithmetic & buses | A0, A1, A2, A3, B0, B1, B2, B3, LT, EQ, GT | Built-in |
| increment_4 | 4-bit increment | Arithmetic & buses | A0, A1, A2, A3, Y0, Y1, Y2, Y3 | Built-in |
| decrement_4 | 4-bit decrement | Arithmetic & buses | A0, A1, A2, A3, Y0, Y1, Y2, Y3 | Built-in |
| negate_4 | 4-bit negate | Arithmetic & buses | A0, A1, A2, A3, Y0, Y1, Y2, Y3 | Built-in |
| parity_4 | 4-bit parity | Arithmetic & buses | A0, A1, A2, A3, ODD, EVEN | Built-in |
| buffer_4 | 4-bit buffer | Arithmetic & buses | A0, A1, A2, A3, Y0, Y1, Y2, Y3 | Built-in |
| invert_4 | 4-bit invert | Arithmetic & buses | A0, A1, A2, A3, Y0, Y1, Y2, Y3 | Built-in |
| andbus_4 | 4-bit andbus | Arithmetic & buses | A0, A1, A2, A3, B0, B1, B2, B3, Y0, Y1, Y2, Y3 | Built-in |
| orbus_4 | 4-bit orbus | Arithmetic & buses | A0, A1, A2, A3, B0, B1, B2, B3, Y0, Y1, Y2, Y3 | Built-in |
| xorbus_4 | 4-bit xorbus | Arithmetic & buses | A0, A1, A2, A3, B0, B1, B2, B3, Y0, Y1, Y2, Y3 | Built-in |
| mux2_4 | 4-bit 2:1 multiplexer | Routing | A0, A1, A2, A3, B0, B1, B2, B3, SEL, Y0, Y1, Y2, Y3 | Built-in |
| demux2_4 | 4-bit 1:2 demultiplexer | Routing | D0, D1, D2, D3, SEL, A0, A1, A2, A3, B0, B1, B2, B3 | Built-in |
| register_4 | 4-bit D register | Sequential | D0, D1, D2, D3, CLK, Q0, Q1, Q2, Q3 | Built-in |
| counter_4 | 4-bit up counter | Sequential | CLK, RESET, ENABLE, Q0, Q1, Q2, Q3 | Built-in |
| shift_4 | 4-bit shift register | Sequential | DATA, CLK, RESET, Q0, Q1, Q2, Q3 | Built-in |
| adder_5 | 5-bit adder | Arithmetic & buses | A0, A1, A2, A3, A4, B0, B1, B2, B3, B4, Y0, Y1, Y2, Y3, Y4, CARRY | Built-in |
| subtractor_5 | 5-bit subtractor | Arithmetic & buses | A0, A1, A2, A3, A4, B0, B1, B2, B3, B4, Y0, Y1, Y2, Y3, Y4, CARRY | Built-in |
| comparator_5 | 5-bit comparator | Arithmetic & buses | A0, A1, A2, A3, A4, B0, B1, B2, B3, B4, LT, EQ, GT | Built-in |
| increment_5 | 5-bit increment | Arithmetic & buses | A0, A1, A2, A3, A4, Y0, Y1, Y2, Y3, Y4 | Built-in |
| decrement_5 | 5-bit decrement | Arithmetic & buses | A0, A1, A2, A3, A4, Y0, Y1, Y2, Y3, Y4 | Built-in |
| negate_5 | 5-bit negate | Arithmetic & buses | A0, A1, A2, A3, A4, Y0, Y1, Y2, Y3, Y4 | Built-in |
| parity_5 | 5-bit parity | Arithmetic & buses | A0, A1, A2, A3, A4, ODD, EVEN | Built-in |
| buffer_5 | 5-bit buffer | Arithmetic & buses | A0, A1, A2, A3, A4, Y0, Y1, Y2, Y3, Y4 | Built-in |
| invert_5 | 5-bit invert | Arithmetic & buses | A0, A1, A2, A3, A4, Y0, Y1, Y2, Y3, Y4 | Built-in |
| andbus_5 | 5-bit andbus | Arithmetic & buses | A0, A1, A2, A3, A4, B0, B1, B2, B3, B4, Y0, Y1, Y2, Y3, Y4 | Built-in |
| orbus_5 | 5-bit orbus | Arithmetic & buses | A0, A1, A2, A3, A4, B0, B1, B2, B3, B4, Y0, Y1, Y2, Y3, Y4 | Built-in |
| xorbus_5 | 5-bit xorbus | Arithmetic & buses | A0, A1, A2, A3, A4, B0, B1, B2, B3, B4, Y0, Y1, Y2, Y3, Y4 | Built-in |
| mux2_5 | 5-bit 2:1 multiplexer | Routing | A0, A1, A2, A3, A4, B0, B1, B2, B3, B4, SEL, Y0, Y1, Y2, Y3, Y4 | Built-in |
| demux2_5 | 5-bit 1:2 demultiplexer | Routing | D0, D1, D2, D3, D4, SEL, A0, A1, A2, A3, A4, B0, B1, B2, B3, B4 | Built-in |
| register_5 | 5-bit D register | Sequential | D0, D1, D2, D3, D4, CLK, Q0, Q1, Q2, Q3, Q4 | Built-in |
| counter_5 | 5-bit up counter | Sequential | CLK, RESET, ENABLE, Q0, Q1, Q2, Q3, Q4 | Built-in |
| shift_5 | 5-bit shift register | Sequential | DATA, CLK, RESET, Q0, Q1, Q2, Q3, Q4 | Built-in |
| adder_6 | 6-bit adder | Arithmetic & buses | A0, A1, A2, A3, A4, A5, B0, B1, B2, B3, B4, B5, Y0, Y1, Y2, Y3, Y4, Y5, CARRY | Built-in |
| subtractor_6 | 6-bit subtractor | Arithmetic & buses | A0, A1, A2, A3, A4, A5, B0, B1, B2, B3, B4, B5, Y0, Y1, Y2, Y3, Y4, Y5, CARRY | Built-in |
| comparator_6 | 6-bit comparator | Arithmetic & buses | A0, A1, A2, A3, A4, A5, B0, B1, B2, B3, B4, B5, LT, EQ, GT | Built-in |
| increment_6 | 6-bit increment | Arithmetic & buses | A0, A1, A2, A3, A4, A5, Y0, Y1, Y2, Y3, Y4, Y5 | Built-in |
| decrement_6 | 6-bit decrement | Arithmetic & buses | A0, A1, A2, A3, A4, A5, Y0, Y1, Y2, Y3, Y4, Y5 | Built-in |
| negate_6 | 6-bit negate | Arithmetic & buses | A0, A1, A2, A3, A4, A5, Y0, Y1, Y2, Y3, Y4, Y5 | Built-in |
| parity_6 | 6-bit parity | Arithmetic & buses | A0, A1, A2, A3, A4, A5, ODD, EVEN | Built-in |
| buffer_6 | 6-bit buffer | Arithmetic & buses | A0, A1, A2, A3, A4, A5, Y0, Y1, Y2, Y3, Y4, Y5 | Built-in |
| invert_6 | 6-bit invert | Arithmetic & buses | A0, A1, A2, A3, A4, A5, Y0, Y1, Y2, Y3, Y4, Y5 | Built-in |
| andbus_6 | 6-bit andbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, B0, B1, B2, B3, B4, B5, Y0, Y1, Y2, Y3, Y4, Y5 | Built-in |
| orbus_6 | 6-bit orbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, B0, B1, B2, B3, B4, B5, Y0, Y1, Y2, Y3, Y4, Y5 | Built-in |
| xorbus_6 | 6-bit xorbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, B0, B1, B2, B3, B4, B5, Y0, Y1, Y2, Y3, Y4, Y5 | Built-in |
| mux2_6 | 6-bit 2:1 multiplexer | Routing | A0, A1, A2, A3, A4, A5, B0, B1, B2, B3, B4, B5, SEL, Y0, Y1, Y2, Y3, Y4, Y5 | Built-in |
| demux2_6 | 6-bit 1:2 demultiplexer | Routing | D0, D1, D2, D3, D4, D5, SEL, A0, A1, A2, A3, A4, A5, B0, B1, B2, B3, B4, B5 | Built-in |
| register_6 | 6-bit D register | Sequential | D0, D1, D2, D3, D4, D5, CLK, Q0, Q1, Q2, Q3, Q4, Q5 | Built-in |
| counter_6 | 6-bit up counter | Sequential | CLK, RESET, ENABLE, Q0, Q1, Q2, Q3, Q4, Q5 | Built-in |
| shift_6 | 6-bit shift register | Sequential | DATA, CLK, RESET, Q0, Q1, Q2, Q3, Q4, Q5 | Built-in |
| adder_7 | 7-bit adder | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, B0, B1, B2, B3, B4, B5, B6, Y0, Y1, Y2, Y3, Y4, Y5, Y6, CARRY | Built-in |
| subtractor_7 | 7-bit subtractor | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, B0, B1, B2, B3, B4, B5, B6, Y0, Y1, Y2, Y3, Y4, Y5, Y6, CARRY | Built-in |
| comparator_7 | 7-bit comparator | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, B0, B1, B2, B3, B4, B5, B6, LT, EQ, GT | Built-in |
| increment_7 | 7-bit increment | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, Y0, Y1, Y2, Y3, Y4, Y5, Y6 | Built-in |
| decrement_7 | 7-bit decrement | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, Y0, Y1, Y2, Y3, Y4, Y5, Y6 | Built-in |
| negate_7 | 7-bit negate | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, Y0, Y1, Y2, Y3, Y4, Y5, Y6 | Built-in |
| parity_7 | 7-bit parity | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, ODD, EVEN | Built-in |
| buffer_7 | 7-bit buffer | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, Y0, Y1, Y2, Y3, Y4, Y5, Y6 | Built-in |
| invert_7 | 7-bit invert | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, Y0, Y1, Y2, Y3, Y4, Y5, Y6 | Built-in |
| andbus_7 | 7-bit andbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, B0, B1, B2, B3, B4, B5, B6, Y0, Y1, Y2, Y3, Y4, Y5, Y6 | Built-in |
| orbus_7 | 7-bit orbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, B0, B1, B2, B3, B4, B5, B6, Y0, Y1, Y2, Y3, Y4, Y5, Y6 | Built-in |
| xorbus_7 | 7-bit xorbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, B0, B1, B2, B3, B4, B5, B6, Y0, Y1, Y2, Y3, Y4, Y5, Y6 | Built-in |
| mux2_7 | 7-bit 2:1 multiplexer | Routing | A0, A1, A2, A3, A4, A5, A6, B0, B1, B2, B3, B4, B5, B6, SEL, Y0, Y1, Y2, Y3, Y4, Y5, Y6 | Built-in |
| demux2_7 | 7-bit 1:2 demultiplexer | Routing | D0, D1, D2, D3, D4, D5, D6, SEL, A0, A1, A2, A3, A4, A5, A6, B0, B1, B2, B3, B4, B5, B6 | Built-in |
| register_7 | 7-bit D register | Sequential | D0, D1, D2, D3, D4, D5, D6, CLK, Q0, Q1, Q2, Q3, Q4, Q5, Q6 | Built-in |
| counter_7 | 7-bit up counter | Sequential | CLK, RESET, ENABLE, Q0, Q1, Q2, Q3, Q4, Q5, Q6 | Built-in |
| shift_7 | 7-bit shift register | Sequential | DATA, CLK, RESET, Q0, Q1, Q2, Q3, Q4, Q5, Q6 | Built-in |
| adder_8 | 8-bit adder | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, B0, B1, B2, B3, B4, B5, B6, B7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, CARRY | Built-in |
| subtractor_8 | 8-bit subtractor | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, B0, B1, B2, B3, B4, B5, B6, B7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, CARRY | Built-in |
| comparator_8 | 8-bit comparator | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, B0, B1, B2, B3, B4, B5, B6, B7, LT, EQ, GT | Built-in |
| increment_8 | 8-bit increment | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| decrement_8 | 8-bit decrement | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| negate_8 | 8-bit negate | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| parity_8 | 8-bit parity | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, ODD, EVEN | Built-in |
| buffer_8 | 8-bit buffer | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| invert_8 | 8-bit invert | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| andbus_8 | 8-bit andbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, B0, B1, B2, B3, B4, B5, B6, B7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| orbus_8 | 8-bit orbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, B0, B1, B2, B3, B4, B5, B6, B7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| xorbus_8 | 8-bit xorbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, B0, B1, B2, B3, B4, B5, B6, B7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| mux2_8 | 8-bit 2:1 multiplexer | Routing | A0, A1, A2, A3, A4, A5, A6, A7, B0, B1, B2, B3, B4, B5, B6, B7, SEL, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| demux2_8 | 8-bit 1:2 demultiplexer | Routing | D0, D1, D2, D3, D4, D5, D6, D7, SEL, A0, A1, A2, A3, A4, A5, A6, A7, B0, B1, B2, B3, B4, B5, B6, B7 | Built-in |
| register_8 | 8-bit D register | Sequential | D0, D1, D2, D3, D4, D5, D6, D7, CLK, Q0, Q1, Q2, Q3, Q4, Q5, Q6, Q7 | Built-in |
| counter_8 | 8-bit up counter | Sequential | CLK, RESET, ENABLE, Q0, Q1, Q2, Q3, Q4, Q5, Q6, Q7 | Built-in |
| shift_8 | 8-bit shift register | Sequential | DATA, CLK, RESET, Q0, Q1, Q2, Q3, Q4, Q5, Q6, Q7 | Built-in |
| adder_12 | 12-bit adder | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, CARRY | Built-in |
| subtractor_12 | 12-bit subtractor | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, CARRY | Built-in |
| comparator_12 | 12-bit comparator | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, LT, EQ, GT | Built-in |
| increment_12 | 12-bit increment | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11 | Built-in |
| decrement_12 | 12-bit decrement | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11 | Built-in |
| negate_12 | 12-bit negate | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11 | Built-in |
| parity_12 | 12-bit parity | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, ODD, EVEN | Built-in |
| buffer_12 | 12-bit buffer | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11 | Built-in |
| invert_12 | 12-bit invert | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11 | Built-in |
| andbus_12 | 12-bit andbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11 | Built-in |
| orbus_12 | 12-bit orbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11 | Built-in |
| xorbus_12 | 12-bit xorbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11 | Built-in |
| mux2_12 | 12-bit 2:1 multiplexer | Routing | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, SEL, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11 | Built-in |
| demux2_12 | 12-bit 1:2 demultiplexer | Routing | D0, D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, SEL, A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11 | Built-in |
| register_12 | 12-bit D register | Sequential | D0, D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, CLK, Q0, Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11 | Built-in |
| counter_12 | 12-bit up counter | Sequential | CLK, RESET, ENABLE, Q0, Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11 | Built-in |
| shift_12 | 12-bit shift register | Sequential | DATA, CLK, RESET, Q0, Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11 | Built-in |
| adder_16 | 16-bit adder | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15, CARRY | Built-in |
| subtractor_16 | 16-bit subtractor | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15, CARRY | Built-in |
| comparator_16 | 16-bit comparator | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, LT, EQ, GT | Built-in |
| increment_16 | 16-bit increment | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15 | Built-in |
| decrement_16 | 16-bit decrement | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15 | Built-in |
| negate_16 | 16-bit negate | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15 | Built-in |
| parity_16 | 16-bit parity | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, ODD, EVEN | Built-in |
| buffer_16 | 16-bit buffer | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15 | Built-in |
| invert_16 | 16-bit invert | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15 | Built-in |
| andbus_16 | 16-bit andbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15 | Built-in |
| orbus_16 | 16-bit orbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15 | Built-in |
| xorbus_16 | 16-bit xorbus | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15 | Built-in |
| mux2_16 | 16-bit 2:1 multiplexer | Routing | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, SEL, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15 | Built-in |
| demux2_16 | 16-bit 1:2 demultiplexer | Routing | D0, D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, D13, D14, D15, SEL, A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, B0, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15 | Built-in |
| register_16 | 16-bit D register | Sequential | D0, D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, D13, D14, D15, CLK, Q0, Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q13, Q14, Q15 | Built-in |
| counter_16 | 16-bit up counter | Sequential | CLK, RESET, ENABLE, Q0, Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q13, Q14, Q15 | Built-in |
| shift_16 | 16-bit shift register | Sequential | DATA, CLK, RESET, Q0, Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q13, Q14, Q15 | Built-in |
| decoder_1 | 1-to-2 decoder | Encoders & decoders | A0, Y0, Y1 | Built-in |
| encoder_1 | 2-to-1 priority encoder | Encoders & decoders | I0, I1, Y0, VALID | Built-in |
| decoder_2 | 2-to-4 decoder | Encoders & decoders | A0, A1, Y0, Y1, Y2, Y3 | Built-in |
| encoder_2 | 4-to-2 priority encoder | Encoders & decoders | I0, I1, I2, I3, Y0, Y1, VALID | Built-in |
| decoder_3 | 3-to-8 decoder | Encoders & decoders | A0, A1, A2, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| encoder_3 | 8-to-3 priority encoder | Encoders & decoders | I0, I1, I2, I3, I4, I5, I6, I7, Y0, Y1, Y2, VALID | Built-in |
| decoder_4 | 4-to-16 decoder | Encoders & decoders | A0, A1, A2, A3, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15 | Built-in |
| encoder_4 | 16-to-4 priority encoder | Encoders & decoders | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, I12, I13, I14, I15, Y0, Y1, Y2, Y3, VALID | Built-in |
| decoder_5 | 5-to-32 decoder | Encoders & decoders | A0, A1, A2, A3, A4, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15, Y16, Y17, Y18, Y19, Y20, Y21, Y22, Y23, Y24, Y25, Y26, Y27, Y28, Y29, Y30, Y31 | Built-in |
| encoder_5 | 32-to-5 priority encoder | Encoders & decoders | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, I12, I13, I14, I15, I16, I17, I18, I19, I20, I21, I22, I23, I24, I25, I26, I27, I28, I29, I30, I31, Y0, Y1, Y2, Y3, Y4, VALID | Built-in |
| decoder_6 | 6-to-64 decoder | Encoders & decoders | A0, A1, A2, A3, A4, A5, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13, Y14, Y15, Y16, Y17, Y18, Y19, Y20, Y21, Y22, Y23, Y24, Y25, Y26, Y27, Y28, Y29, Y30, Y31, Y32, Y33, Y34, Y35, Y36, Y37, Y38, Y39, Y40, Y41, Y42, Y43, Y44, Y45, Y46, Y47, Y48, Y49, Y50, Y51, Y52, Y53, Y54, Y55, Y56, Y57, Y58, Y59, Y60, Y61, Y62, Y63 | Built-in |
| encoder_6 | 64-to-6 priority encoder | Encoders & decoders | I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, I12, I13, I14, I15, I16, I17, I18, I19, I20, I21, I22, I23, I24, I25, I26, I27, I28, I29, I30, I31, I32, I33, I34, I35, I36, I37, I38, I39, I40, I41, I42, I43, I44, I45, I46, I47, I48, I49, I50, I51, I52, I53, I54, I55, I56, I57, I58, I59, I60, I61, I62, I63, Y0, Y1, Y2, Y3, Y4, Y5, VALID | Built-in |
| rotate_left_2 | 2-bit rotate left | Arithmetic & buses | A0, A1, Y0, Y1 | Built-in |
| rotate_right_2 | 2-bit rotate right | Arithmetic & buses | A0, A1, Y0, Y1 | Built-in |
| rotate_left_3 | 3-bit rotate left | Arithmetic & buses | A0, A1, A2, Y0, Y1, Y2 | Built-in |
| rotate_right_3 | 3-bit rotate right | Arithmetic & buses | A0, A1, A2, Y0, Y1, Y2 | Built-in |
| rotate_left_4 | 4-bit rotate left | Arithmetic & buses | A0, A1, A2, A3, Y0, Y1, Y2, Y3 | Built-in |
| rotate_right_4 | 4-bit rotate right | Arithmetic & buses | A0, A1, A2, A3, Y0, Y1, Y2, Y3 | Built-in |
| rotate_left_5 | 5-bit rotate left | Arithmetic & buses | A0, A1, A2, A3, A4, Y0, Y1, Y2, Y3, Y4 | Built-in |
| rotate_right_5 | 5-bit rotate right | Arithmetic & buses | A0, A1, A2, A3, A4, Y0, Y1, Y2, Y3, Y4 | Built-in |
| rotate_left_6 | 6-bit rotate left | Arithmetic & buses | A0, A1, A2, A3, A4, A5, Y0, Y1, Y2, Y3, Y4, Y5 | Built-in |
| rotate_right_6 | 6-bit rotate right | Arithmetic & buses | A0, A1, A2, A3, A4, A5, Y0, Y1, Y2, Y3, Y4, Y5 | Built-in |
| rotate_left_7 | 7-bit rotate left | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, Y0, Y1, Y2, Y3, Y4, Y5, Y6 | Built-in |
| rotate_right_7 | 7-bit rotate right | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, Y0, Y1, Y2, Y3, Y4, Y5, Y6 | Built-in |
| rotate_left_8 | 8-bit rotate left | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| rotate_right_8 | 8-bit rotate right | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7 | Built-in |
| rotate_left_9 | 9-bit rotate left | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8 | Built-in |
| rotate_right_9 | 9-bit rotate right | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8 | Built-in |
| rotate_left_10 | 10-bit rotate left | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9 | Built-in |
| rotate_right_10 | 10-bit rotate right | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9 | Built-in |
| rotate_left_11 | 11-bit rotate left | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10 | Built-in |
| rotate_right_11 | 11-bit rotate right | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10 | Built-in |
| rotate_left_12 | 12-bit rotate left | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11 | Built-in |
| rotate_right_12 | 12-bit rotate right | Arithmetic & buses | A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11 | Built-in |
