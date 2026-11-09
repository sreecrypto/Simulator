const part=(id,type,x,y,nodes,value=1,other={})=>({id,type,x,y,nodes,value,...other});
export const examples={
  lowpass:{version:1,name:'RC low-pass filter',mode:'analog',components:[part('V1','V',180,210,['in','0'],5,{wave:'pulse',frequency:100}),part('R1','R',400,150,['in','out'],1000),part('C1','C',620,270,['out','0'],1e-6)],wires:[]},
  divider:{version:1,name:'5 V voltage divider',mode:'analog',components:[part('V1','V',160,220,['in','0'],5),part('R1','R',390,150,['in','out'],10000),part('R2','R',610,260,['out','0'],10000)],wires:[]},
  rlc:{version:1,name:'RLC step response',mode:'analog',components:[part('V1','V',140,210,['in','0'],5),part('R1','R',340,140,['in','n1'],100),part('L1','L',540,140,['n1','out'],0.01),part('C1','C',730,270,['out','0'],1e-6)],wires:[]},
  halfadder:{version:1,name:'Half adder',mode:'digital',components:[part('A','INPUT',140,140,['a'],0),part('B','INPUT',140,330,['b'],1),part('X1','XOR',420,140,['a','b','sum']),part('G1','AND',420,330,['a','b','carry']),part('SUM','OUTPUT',730,140,['sum']),part('CARRY','OUTPUT',730,330,['carry'])],wires:[]},
  flipflop:{version:1,name:'D flip-flop',mode:'digital',components:[part('D','INPUT',140,150,['d'],1),part('CLK','CLOCK',140,330,['clk']),part('FF1','DFF',430,230,['d','clk','q']),part('Q','OUTPUT',740,230,['q'])],wires:[]}
};
export const cloneExample=key=>structuredClone(examples[key]);
