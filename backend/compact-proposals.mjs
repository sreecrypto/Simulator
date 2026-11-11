import { arrange } from '../src/builders.js';

// Keep the schema small enough for a model with a short context window.
export const compactFormat = {
  type: 'object',
  additionalProperties: false,
  required: ['explanation', 'circuit'],
  properties: {
    explanation: { type: 'string', maxLength: 400 },
    circuit: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'mode', 'components'],
      properties: {
        name: { type: 'string', maxLength: 120 },
        mode: { enum: ['analog', 'digital'] },
        components: {
          type: 'array', minItems: 1, maxItems: 32,
          items: {
            type: 'object', additionalProperties: false,
            required: ['id', 'type', 'nodes', 'value'],
            properties: {
              id: { type: 'string', maxLength: 24 },
              type: { enum: ['R','C','L','V','I','INPUT','CLOCK','OUTPUT','NOT','AND','OR','XOR','NAND','NOR','XNOR','DFF'] },
              nodes: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string', maxLength: 24 } },
              value: { type: 'number' },
              frequency: { type: 'number' },
            },
          },
        },
      },
    },
  },
};

export const compactInstructions = `Design circuits as JSON. Each component is {"id":"R1","type":"R","nodes":["in","out"],"value":1000}. Use unique IDs and numeric SI values. Shared node names connect pins. Analog uses R,C,L,V,I, each with two pins; ground is "0". Digital INPUT and CLOCK drive one pin; OUTPUT reads one pin; NOT has [in,out]; AND/OR/XOR/NAND/NOR/XNOR have [a,b,out]; DFF has [data,clock,q]. Use value 0 or 1 for logic inputs. Set frequency in Hz for clocks. Every digital input pin must be driven. For an analog divider connect the source between in and 0, the first resistor between in and out, and the second resistor between out and 0. Return one JSON object with explanation and circuit; circuit contains name, mode and components.`;

export function prepareCompactCircuit(circuit) {
  circuit.version = 1;
  circuit.wires = [];
  arrange(circuit);
}
