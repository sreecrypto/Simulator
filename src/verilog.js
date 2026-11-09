import {validateCircuit} from './model.js';
import {componentSpec} from './catalog.js';
import {digitalShape,truthTable} from './digital.js';
const id=s=>'n_'+s.replace(/[^A-Za-z0-9_]/g,'_');
const concat=items=>items.length===1?items[0]:`{${[...items].reverse().join(', ')}}`;
export function generateVerilog(circuit){
  validateCircuit(circuit);if(circuit.mode!=='digital')throw new Error('Verilog describes digital circuits. Analog SPICE devices require analog simulation.');
  const inputs=circuit.components.filter(p=>['INPUT','CLOCK'].includes(p.type)),outputs=circuit.components.filter(p=>p.type==='OUTPUT');
  const portIn=p=>'in_'+p.id,portOut=p=>'out_'+p.id;
  const lines=['`timescale 1ns/1ps','// Generated from Circuit Studio. Ideal binary behavior; no hardware timing constraints.','module circuit_dut (', [...inputs.map(p=>`  input wire ${portIn(p)}`),...outputs.map(p=>`  output wire ${portOut(p)}`)].join(',\n'),');'];
  const nets=[...new Set(circuit.components.flatMap(p=>p.nodes))];for(const net of nets)lines.push(`wire ${id(net)};`);
  const driven=new Set();for(const p of circuit.components){const shape=digitalShape(p);for(const net of p.nodes.slice(shape.inputs)){if(driven.has(net))throw new Error(`Multiple drivers on ${net}.`);driven.add(net);}}
  for(const p of circuit.components)if(p.nodes.some(n=>!driven.has(n)))throw new Error(`Undriven net on ${p.id}.`);
  for(const p of inputs)lines.push(`assign ${id(p.nodes[0])} = ${portIn(p)};`);
  for(const p of outputs)lines.push(`assign ${portOut(p)} = ${id(p.nodes[0])};`);
  for(const p of circuit.components.filter(p=>!['INPUT','OUTPUT','CLOCK'].includes(p.type))){
    const shape=digitalShape(p),v=p.nodes.slice(0,shape.inputs).map(id),out=p.nodes.slice(shape.inputs).map(id),m=componentSpec(p)?.model;
    const assign=(expr)=>lines.push(`assign ${concat(out)} = ${expr};`);
    const gate=(name)=>{const op={AND:'&',OR:'|',XOR:'^',NAND:'&',NOR:'|',XNOR:'^',NOT:'~'}[name];const value=name==='NOT'?`~${v[0]}`:`(${v.join(' '+op+' ')})`;return ['NAND','NOR','XNOR'].includes(name)?`~${value}`:value;};
    if(p.type!=='BLOCK'&&p.type!=='DFF'){assign(gate(p.type));continue;}
    if(p.type==='DFF'){const q='q_'+p.id;lines.push(`reg ${q} = 1'b0;`,`always @(posedge ${v[1]}) ${q} <= ${v[0]};`,`assign ${out[0]} = ${q};`);continue;}
    const w=m.width,a=concat(v.slice(0,w)),b=concat(v.slice(w,2*w)),y=concat(out),state='q_'+p.id;
    switch(m.family){
      case 'gate':assign(gate(m.gate));break;
      case 'adder':assign(`{1'b0, ${a}} + {1'b0, ${b}}`);break;
      case 'subtractor':lines.push(`assign ${concat(out.slice(0,w))} = ${a} - ${b};`,`assign ${out[w]} = ${a} < ${b};`);break;
      case 'comparator':lines.push(`assign ${out[0]} = ${a} < ${b};`,`assign ${out[1]} = ${a} == ${b};`,`assign ${out[2]} = ${a} > ${b};`);break;
      case 'increment':assign(`${a} + ${w}'d1`);break;
      case 'decrement':assign(`${a} - ${w}'d1`);break;
      case 'negate':assign(`-${a}`);break;
      case 'buffer':assign(a);break;
      case 'invert':assign(`~${a}`);break;
      case 'andbus':assign(`${a} & ${b}`);break;
      case 'orbus':assign(`${a} | ${b}`);break;
      case 'xorbus':assign(`${a} ^ ${b}`);break;
      case 'parity':lines.push(`assign ${out[0]} = ^${a};`,`assign ${out[1]} = ~^${a};`);break;
      case 'mux':assign(`${v.at(-1)} ? ${b} : ${a}`);break;
      case 'demux':lines.push(`assign ${concat(out.slice(0,w))} = ${v.at(-1)} ? ${w}'d0 : ${a};`,`assign ${concat(out.slice(w))} = ${v.at(-1)} ? ${a} : ${w}'d0;`);break;
      case 'decoder':out.forEach((n,i)=>lines.push(`assign ${n} = (${a} == ${w}'d${i});`));break;
      case 'encoder':{let expression=`${w}'d0`;v.forEach((n,i)=>{expression=`${n} ? ${w}'d${i} : (${expression})`;});lines.push(`assign ${concat(out.slice(0,w))} = ${expression};`,`assign ${out[w]} = |${concat(v)};`);break;}
      case 'rotate':assign(concat(m.direction==='left'?[v.at(-1),...v.slice(0,-1)]:[...v.slice(1),v[0]]));break;
      case 'register':lines.push(`reg [${w-1}:0] ${state} = 0;`,`always @(posedge ${v[w]}) ${state} <= ${a};`,`assign ${y} = ${state};`);break;
      case 'counter':lines.push(`reg [${w-1}:0] ${state} = 0;`,`always @(posedge ${v[0]} or posedge ${v[1]}) begin`,`  if (${v[1]}) ${state} <= 0;`,`  else if (${v[2]}) ${state} <= ${state} + 1'b1;`,'end',`assign ${y} = ${state};`);break;
      case 'shift':lines.push(`reg [${w-1}:0] ${state} = 0;`,`always @(posedge ${v[1]} or posedge ${v[2]}) begin`,`  if (${v[2]}) ${state} <= 0;`,`  else ${state} <= (${state} << 1) | ${v[0]};`,'end',`assign ${y} = ${state};`);break;
      default:throw new Error(`Verilog export is not implemented for ${m.family}.`);
    }
  }
  lines.push('endmodule','');
  const tb=['`timescale 1ns/1ps','module circuit_tb;',...inputs.map(p=>`reg ${portIn(p)} = 0;`),...outputs.map(p=>`wire ${portOut(p)};`),`circuit_dut dut (${[...inputs.map(p=>`.${portIn(p)}(${portIn(p)})`),...outputs.map(p=>`.${portOut(p)}(${portOut(p)})`)].join(', ')});`,'initial begin','  $dumpfile("circuit.vcd");','  $dumpvars(0, circuit_tb);'];
  let checked=false;
  try{const rows=truthTable(circuit);if(inputs.length<=8){for(const row of rows){for(const p of inputs)tb.push(`  ${portIn(p)} = 1'b${row[p.id]};`);tb.push('  #10;');for(const p of outputs)tb.push(`  if (${portOut(p)} !== 1'b${row[p.id]}) $fatal(1, "Mismatch: ${p.id}");`);}checked=true;}}catch{/* Sequential and large-input circuits use a clearly labeled smoke bench. */}
  if(!checked){tb.push('  // Smoke stimulus only: add assertions for your design requirements.');for(let cycle=0;cycle<16;cycle++){for(const [i,p] of inputs.entries())tb.push(`  ${portIn(p)} = 1'b${p.type==='CLOCK'?cycle%2:(cycle>>Math.min(i,3))&1};`);tb.push('  #10;');}}
  tb.push(`  $display("${checked?'PASS: exhaustive combinational assertions':'DONE: smoke stimulus only'}");`,'  $finish;','end','endmodule','');
  return {design:lines.join('\n'),testbench:tb.join('\n'),checked,summary:checked?'Exhaustive combinational testbench (up to 8 inputs).':'Sequential / large-input smoke testbench. Add specification assertions.'};
}
