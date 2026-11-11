import {analogTypes,digitalTypes,pins,validateCircuit,parseValue,formatValue,spice} from './model.js';
import {evaluateDigital,digitalShape} from './digital.js';
import {examples,cloneExample} from './examples.js';
import {recipe} from './assistant.js';
import {validateFSM} from './fsm.js';
import {microcontrollerProject} from './microcontrollers.js';
import {analogWorkspace,analogPlot} from './workspaces/analog.js';
import {digitalWorkspace,digitalTable} from './workspaces/digital.js';
import {bindFSM} from './workspaces/fsm.js';
import {bindMicrocontrollers} from './workspaces/microcontrollers.js';
import {catalogFor,catalogById,componentSpec,instantiate,registerResources} from './catalog.js';
import {arrange} from './builders.js';
import {validateSession,makeDocument,duplicateDocument} from './workspaces.js';
import {verifyProposal} from './verification.js';
import {waveforms,sampleGenerator} from './waveforms.js';
import {transformPoint,duplicateParts} from './transforms.js';
import {parseResource,validateResources} from './resources.js';
import {generateVerilog} from './verilog.js';
import {wirePath,nearestPort} from './wiring.js';
import {defaultClockFrequency,nextClockTime} from './clocks.js';
import {selectionRectangle,intersectsSelection} from './selection.js';

const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={R:'Resistor',C:'Capacitor',L:'Inductor',V:'Voltage source',I:'Current source',E:'Voltage amplifier',G:'Transconductance',INPUT:'Logic input',OUTPUT:'Logic output',CLOCK:'Clock',NOT:'NOT gate',AND:'AND gate',OR:'OR gate',XOR:'XOR gate',NAND:'NAND gate',NOR:'NOR gate',XNOR:'XNOR gate',DFF:'D flip-flop'};
const glyphs={R:'∿',C:'⊣⊢',L:'∩∩',V:'⊕',I:'↑',INPUT:'01',OUTPUT:'◉',CLOCK:'▁▔',NOT:'▷',AND:'&',OR:'≥1',XOR:'=1',NAND:'!&',NOR:'!≥',XNOR:'!=',DFF:'D'};
let circuit={version:1,name:'Untitled circuit',mode:'analog',components:[],wires:[]}, selected=null, history=[],future=[],tool='select',firstPin=null,lastResult=null,digitalMemory={},tick=0;
let module='analog',drag=null;
let aiStatus=null,camera=null,session=null;
const liveDocuments=new Map();let closedDocuments=[];
let multiSelection=new Set(),ngspiceReady=false,resourceLibrary=[],resourceSources=[];
let wirePointer=null,wireTarget=null,wireGesture=null;
let digitalTime=0,spaceHeld=false,playbackFrame=null,playbackIndex=0,playbackPosition=0,playbackLast=null;
const selectionLayer=document.createElementNS('http://www.w3.org/2000/svg','g');selectionLayer.id='selection-layer';selectionLayer.setAttribute('pointer-events','none');$('schematic').append(selectionLayer);
const wireLayer=document.createElementNS('http://www.w3.org/2000/svg','g');wireLayer.id='wire-preview-layer';wireLayer.setAttribute('pointer-events','none');$('schematic').append(wireLayer);
function clearWire(){firstPin=null;wirePointer=null;wireTarget=null;wireGesture=null;renderWirePreview();}
function renderWirePreview(){
  document.querySelectorAll('#schematic .wire-start, #schematic .wire-target').forEach(p=>p.classList.remove('wire-start','wire-target'));
  $('schematic').classList.toggle('connecting-wire',!!firstPin);
  if(!firstPin){wireLayer.replaceChildren();return;}
  const part=circuit.components.find(p=>p.id===firstPin.id),start=part&&pinPositions(part)[firstPin.index];
  if(!start){firstPin=null;wireLayer.replaceChildren();return;}
  const origin=document.querySelector(`#schematic [data-part="${firstPin.id}"][data-pin="${firstPin.index}"]`);origin?.classList.add('wire-start');
  const end=wireTarget?.point||wirePointer||start;
  if(wireTarget)document.querySelector(`#schematic [data-part="${wireTarget.id}"][data-pin="${wireTarget.index}"]`)?.classList.add('wire-target');
  const path=wirePath(start,end),matrix=$('schematic').getScreenCTM(),unit=matrix?1/Math.hypot(matrix.a,matrix.b):1;
  wireLayer.innerHTML=`<path class="wire-preview-halo" d="${path}"/><path class="wire-preview ${wireTarget?'snapped':''}" d="${path}"/><circle class="wire-preview-end ${wireTarget?'snapped':''}" cx="${end[0]}" cy="${end[1]}" r="${5*unit}"/>`;
}
function moveWire(e){
  const point=svgPoint(e),matrix=$('schematic').getScreenCTM(),unit=matrix?1/Math.hypot(matrix.a,matrix.b):1;
  wirePointer=[point.x,point.y];
  wireTarget=nearestPort(circuit.components.flatMap(p=>pinPositions(p).map((point,index)=>({id:p.id,index,point}))),wirePointer,12*unit,firstPin);
  if(wireGesture&&Math.hypot(e.clientX-wireGesture.x,e.clientY-wireGesture.y)>5)wireGesture.moved=true;
  renderWirePreview();
}
try{resourceLibrary=validateResources(JSON.parse(localStorage.getItem('circuit-studio-resources')||'[]'));registerResources(resourceLibrary);resourceSources=JSON.parse(localStorage.getItem('circuit-studio-resource-sources')||'[]');}catch{/* Damaged resources are not installed. */}
try {const saved=localStorage.getItem('circuit-studio-project');if(saved)circuit=validateCircuit(JSON.parse(saved));}catch{/* Corrupt storage leaves the starter intact. */}
module=circuit.mode;
let toastTimer;
function toast(message) {$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6000);}
function guarded(fn){return (...args)=>{try{const result=fn(...args);if(result?.then)result.catch(e=>toast(e.message));return result;}catch(e){toast(e.message);}};}
function persist(){try{localStorage.setItem('circuit-studio-project',JSON.stringify(circuit));saveSession();}catch{toast('Browser storage is full or unavailable. Export workspaces to keep your work.');}}
function remember(){history.push(JSON.stringify(circuit));if(history.length>60)history.shift();future=[];}
function invalidate(){stopPlayback();clearWire();lastResult=null;digitalMemory={};tick=0;digitalTime=0;$('playback-controls').hidden=true;$('sample-values').replaceChildren();$('result-title').textContent='Ready to simulate';$('result-body').innerHTML='<div class="empty-result">Circuit changed. Run to update the results.</div>';}
function changed(){validateCircuit(circuit);invalidate();persist();render();}
function applyCircuit(next){validateCircuit(next);if(next.resources?.length)try{installResources(next.resources);}catch{toast('Models remain embedded in this circuit; the shared resource library is full or has a name conflict.');}if(module!==next.mode){createWorkspace(next.mode,next);return;}remember();circuit=structuredClone(next);selected=null;firstPin=null;camera=null;module=circuit.mode;changed();showModule();}
function download(name,text,type='text/plain') {const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
const filename=()=>circuit.name.replace(/[^a-z0-9_-]+/gi,'-').toLowerCase()||'circuit';
const schematicModes={analog:analogWorkspace,digital:digitalWorkspace};
const frontend={$,escape,guarded,download,saveSession};
const specialModes={fsm:bindFSM(frontend),cpu:bindMicrocontrollers(frontend)};
let chatThread=null;
function activeDocument(){return session?.documents.find(d=>d.id===session.activeId);}
function captureDocument(){
  const doc=activeDocument();if(!doc)return;
  doc.kind=module;
  if(['analog','digital'].includes(module)){doc.content=structuredClone(circuit);doc.name=circuit.name;}
  else {doc.content=specialModes[module].content();}
  liveDocuments.set(doc.id,{circuit:structuredClone(circuit),history:[...history],future:[...future],selected,lastResult,digitalMemory:structuredClone(digitalMemory),tick,digitalTime,playbackIndex,playbackPosition,autoWindow:$('auto-clock-window').checked,camera:camera?{...camera}:null,chatThread,resultHTML:$('result-body').innerHTML,resultTitle:$('result-title').textContent,analysis:$('analysis').value,probe:$('probe').value,duration:$('duration').value,engine:$('engine').value,special:specialModes[module]?.snapshot()});
}
function saveSession(){if(!session)return;captureDocument();localStorage.setItem('circuit-studio-workspaces-v1',JSON.stringify(session));renderTabs();}
function renderTabs(){
  if(!session)return;
  $('workspace-tabs').innerHTML=session.documents.map(d=>`<div class="workspace-tab ${d.id===session.activeId?'active':''}"><button data-open="${d.id}" role="tab" aria-selected="${d.id===session.activeId}" title="${escape(d.name)}"><span class="tab-kind">${{analog:'◉',digital:'⌘',fsm:'◎',cpu:'▦'}[d.kind]}</span><span>${escape(d.name||'Untitled')}</span></button><button data-close="${d.id}" aria-label="Close ${escape(d.name)}">×</button></div>`).join('');
  $('workspace-total').textContent=`${session.documents.length} open`;
}
function restoreDocument(doc){
  stopPlayback();selectionLayer.replaceChildren();
  specialModes[module]?.suspend();
  const live=liveDocuments.get(doc.id);module=doc.kind;selected=null;firstPin=null;camera=null;drag=null;multiSelection.clear();
  history=live?.history||[];future=live?.future||[];lastResult=live?.lastResult||null;digitalMemory=live?.digitalMemory||{};tick=live?.tick||0;camera=live?.camera||null;
  digitalTime=live?.digitalTime||0;playbackIndex=live?.playbackIndex||0;playbackPosition=live?.playbackPosition||0;$('auto-clock-window').checked=live?.autoWindow??true;
  if(['analog','digital'].includes(module))circuit=structuredClone(validateCircuit(doc.content));else if(live)circuit=structuredClone(live.circuit);
  specialModes[module]?.restore(doc.content,live?.special);
  chatThread=live?.chatThread||document.createElement('div');chatThread.className='chat-thread';$('chat').replaceChildren(chatThread);
  $('duration').value=live?.duration??'10m';
  $('engine').value=live?.engine??'builtin';
  $('analysis').value='';
  render();if(live){$('result-body').innerHTML=live.resultHTML;$('result-title').textContent=live.resultTitle;$('analysis').value=live.analysis;$('probe').value=live.probe;}else{$('result-title').textContent='Simulation';$('result-body').replaceChildren();}
  updateAnalysisControls();
  setupPlayback(false);showModule();
}
function openWorkspace(id,capture=true){
  if(capture)captureDocument();const doc=session.documents.find(d=>d.id===id);if(!doc)return;session.activeId=id;restoreDocument(doc);saveSession();
}
function createWorkspace(kind=module,preset=null){
  if(session.documents.length>=24)throw new Error('Up to 24 workspaces can be open. Export or close a tab first.');
  captureDocument();
  const content=preset||(schematicModes[kind]?{version:1,name:`Untitled ${kind} ${session.documents.filter(d=>d.kind===kind).length+1}`,mode:kind,components:[],wires:[]}:specialModes[kind].newProject());
  const doc=makeDocument(kind,content);session.documents.push(doc);openWorkspace(doc.id,false);
}
function canvasBounds(){
  const coords=circuit.components.flatMap(p=>[[p.x,p.y],...pinPositions(p)].flatMap(([x,y])=>[[x-140,y-90],[x+140,y+90]]));
  const x=Math.min(0,...coords.map(p=>p[0])),y=Math.min(0,...coords.map(p=>p[1]));
  return {x,y,width:Math.max(900,...coords.map(p=>p[0]-x+60)),height:Math.max(480,...coords.map(p=>p[1]-y+60))};
}
function zoom(factor,anchor=null){const old=camera||canvasBounds(),width=Math.max(120,Math.min(200000,old.width*factor)),height=old.height*width/old.width;const a=anchor||{x:old.x+old.width/2,y:old.y+old.height/2};camera={x:a.x+(old.x-a.x)*width/old.width,y:a.y+(old.y-a.y)*height/old.height,width,height};renderCanvas();}

function localPinPositions(p){
  if(['GROUND','PROBE'].includes(p.type))return [[p.x,p.y-30]];
  if(p.nodes.length===2&&circuit.mode==='analog')return [[p.x-55,p.y],[p.x+55,p.y]];
  if(p.type==='BLOCK'||circuit.mode==='analog'&&p.nodes.length!==2){
    const shape=circuit.mode==='digital'?digitalShape(p):{inputs:Math.ceil(p.nodes.length/2)};
    const left=shape.inputs,right=p.nodes.length-left;
    return p.nodes.map((_,i)=>i<left?[p.x-85,p.y+(i-(left-1)/2)*19]:[p.x+85,p.y+(i-left-(right-1)/2)*19]);
  }
  if(p.type==='INPUT'||p.type==='CLOCK')return [[p.x+55,p.y]];
  if(p.type==='OUTPUT')return [[p.x-55,p.y]];
  if(p.type==='NOT')return [[p.x-55,p.y],[p.x+55,p.y]];
  return [[p.x-55,p.y-15],[p.x-55,p.y+15],[p.x+55,p.y]];
}
function pinPositions(p){return localPinPositions(p).map(point=>transformPoint(p,point));}
function symbol(p) {
  const {x,y}=p;
  if(p.type==='GROUND')return `<path d="M${x} ${y-30}v35m-23 0h46m-37 8h28m-20 8h12"/>`;
  if(p.type==='PROBE')return `<path d="M${x} ${y-30}v20"/><circle class="body" cx="${x}" cy="${y+6}" r="18"/><text x="${x}" y="${y+11}" text-anchor="middle" fill="#617a98" stroke="none" font-size="15">V</text>`;
  if(p.type==='BLOCK'||circuit.mode==='analog'&&!['R','C','L','V','I','D'].includes(p.type)){
    const positions=localPinPositions(p),height=Math.max(72,...positions.map(([,py])=>Math.abs(py-y)*2+30));
    const spec=componentSpec(p),name=spec?.name||labels[p.type]||p.type;
    return `<rect class="body block-body" x="${x-78}" y="${y-height/2}" width="156" height="${height}" rx="10"/><text class="block-name" x="${x}" y="${y+3}" text-anchor="middle" stroke="none">${escape(name.length>24?name.slice(0,22)+'…':name)}</text><text class="block-kind" x="${x}" y="${y+20}" text-anchor="middle" stroke="none">${circuit.mode==='digital'?'BEHAVIORAL BLOCK':'LINEAR MODEL'}</text>`;
  }
  const line=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1}H${x2}"/>`;
  if(p.type==='R')return `<path d="M${x-55} ${y}h20l6 -10 10 20 10 -20 10 20 10 -20 6 10h28"/>`;
  if(p.type==='C')return `<path d="M${x-55} ${y}h47m0 -18v36m16 -36v36m0 -18h47"/>`;
  if(p.type==='L')return `<path d="M${x-55} ${y}h18c0 -22 18 -22 18 0c0 -22 18 -22 18 0c0 -22 18 -22 18 0c0 -22 18 -22 18 0h20"/>`;
  if(p.type==='D')return `<path d="M${x-55} ${y}h35m40 0h35M${x-20} ${y-18}l40 18 -40 18zM${x+20} ${y-20}v40"/>`;
  if(['V','I'].includes(p.type))return `<path d="M${x-55} ${y}h30m50 0h30"/><circle class="body" cx="${x}" cy="${y}" r="25"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="#3b7655" stroke="none" font-size="20">${p.type==='I'?'→':p.wave==='sine'?'∿':'+ −'}</text>`;
  const input=p.type==='INPUT',value=input?p.value:p.type==='CLOCK'?'CLK':p.type==='OUTPUT'?'OUT':p.type==='DFF'?'D / Q':p.type;
  return `<rect class="body" x="${x-40}" y="${y-27}" width="80" height="54" rx="${input||p.type==='OUTPUT'?24:8}"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="#3b7655" stroke="none" font-size="${input?21:12}">${value}</text>`;
}
function renderCanvas(){
  const bounds=canvasBounds();const view=camera||bounds;$('schematic').setAttribute('viewBox',`${view.x} ${view.y} ${view.width} ${view.height}`);
  const nets=new Map();
  for(const p of circuit.components)pinPositions(p).forEach((xy,i)=>{const n=p.nodes[i];if(!nets.has(n))nets.set(n,[]);nets.get(n).push(xy);});
  $('net-layer').innerHTML=[...nets].map(([name,points])=> {
    if(name==='0')return points.map(([x,y])=>`<path class="net" d="M${x} ${y}v25m-12 0h24m-19 5h14m-10 5h6"/><text class="net-label" x="${x+14}" y="${y+29}">0</text>`).join('');
    if(points.length<2)return '';
    const [start,...rest]=points;
    return rest.map(end=>`<path class="net" data-net="${escape(name)}" d="${wirePath(start,end)}"/>`).join('');
  }).join('');
  $('component-layer').innerHTML=circuit.components.map(p=> {
    const units={R:'Ω',C:'F',L:'H',V:'V',I:'A'};
    const spec=componentSpec(p),isBlock=p.type==='BLOCK'||circuit.mode==='analog'&&!['R','C','L','V','I','D'].includes(p.type),positions=pinPositions(p),extent=isBlock?Math.max(50,...positions.map(([,py])=>Math.abs(py-p.y)+24)):30;
    const subtitle=isBlock?(spec?.category||'Controlled source'):circuit.mode==='analog'?formatValue(p.value,units[p.type]):p.type==='INPUT'?'click to toggle':p.type==='CLOCK'?`${formatValue(p.frequency||defaultClockFrequency,'Hz')} · ${p.duty??50}%`:labels[p.type];
    const transform=`translate(${p.x} ${p.y}) rotate(${p.rotation||0}) scale(${p.mirrorX?-1:1} ${p.mirrorY?-1:1}) translate(${-p.x} ${-p.y})`;
    return `<g class="component ${selected===p.id||multiSelection.has(p.id)?'selected-part':''}" data-id="${p.id}"><rect class="component-hit" x="${p.x-(isBlock?78:45)}" y="${p.y-extent-30}" width="${isBlock?156:90}" height="${extent*2+65}" fill="transparent" stroke="none" pointer-events="all"/><g transform="${transform}" fill="none" stroke="#4c8069" stroke-width="2">${symbol(p)}</g><text class="component-label" text-anchor="middle" x="${p.x}" y="${p.y-extent-14}">${escape(p.id)}</text><text class="component-value" text-anchor="middle" x="${p.x}" y="${p.y+extent+18}">${escape(subtitle)}</text>${positions.map(([x,y],i)=>`<circle class="pin" data-pin="${i}" data-part="${p.id}" cx="${x}" cy="${y}" r="5"/><text class="pin-label" x="${x}" y="${y-8}" text-anchor="middle">${escape(isBlock?(spec?.pinNames[i]||'P'+i):p.nodes[i])}</text>`).join('')}</g>`;
  }).join('');
  renderWirePreview();
  paintSimulationSample();
}
function renderLibrary(){
  const query=$('search').value.toLowerCase();
  const library=catalogFor(circuit.mode),category=$('category').value;
  const categories=[...new Set(library.map(c=>c.category))];
  $('category').innerHTML='<option value="all">All categories</option>'+categories.map(c=>`<option>${escape(c)}</option>`).join('');
  if(categories.includes(category))$('category').value=category;
  const found=library.filter(c=>($('category').value==='all'||c.category===$('category').value)&&`${c.name} ${c.category} ${c.id}`.toLowerCase().includes(query));
  $('library-count').textContent=`${found.length} / ${library.length} components`;
  $('parts').innerHTML=found.length?found.map(c=>`<button class="part-button" data-catalog="${c.id}" title="${escape(c.description)}"><span class="part-symbol">${glyphs[c.type]||'▦'}</span><span class="part-name">${escape(c.name)}<small>${escape(c.category)} · ${c.pinNames.length} pins${c.support==='ngspice'?' · ngspice':c.resource?' · imported':''}</small></span><span class="part-add">+</span></button>`).join(''):'<div class="library-empty">No components match your search.</div>';
  $('examples').replaceChildren();
}
function renderInspector(){
  const p=circuit.components.find(p=>p.id===selected);
  if(!p){$('inspector').innerHTML='<p class="muted">Select a component to edit its values and connections.</p>';return;}
  const spec=componentSpec(p),fields=p.nodes.map((n,i)=>`<label>${escape(spec?.pinNames[i]||'Pin '+(i+1))}<input name="node${i}" value="${escape(n)}" required maxlength="24" title="Same node names are electrically connected"></label>`).join('');
  const source=['V','I'].includes(p.type);
  $('inspector').innerHTML=`${spec?`<div class="inspector-model"><strong>${escape(spec.name)}</strong><p>${escape(spec.description)}</p></div>`:''}<form id="part-form"><label>Reference<input name="id" value="${p.id}" required maxlength="24"></label>${circuit.mode==='analog'&&!['BLOCK','X','D','Q','M','J','S'].includes(p.type)?`<label>${source?'Value / amplitude':'SI value'}<input name="value" value="${formatValue(p.value)}" required></label>`:p.type==='INPUT'?`<label>Value<select name="value"><option ${p.value===0?'selected':''}>0</option><option ${p.value===1?'selected':''}>1</option></select></label>`:''}${p.modelName?`<label>Model<input name="modelName" value="${escape(p.modelName)}"></label>`:''}${['F','H','W'].includes(p.type)?`<label>Control source<input name="control" value="${escape(p.control||'V1')}"></label>`:''}${['BV','BI'].includes(p.type)?`<label>Expression<input name="expression" value="${escape(p.expression||'0')}"></label>`:''}${fields}${source?'<button type="button" id="open-generator">Function generator settings…</button>':''}<button class="primary" type="submit">Update component</button><button type="button" class="danger" id="delete-part">Delete ${p.id}</button></form>`;
  if(p.type==='K')$('part-form').insertAdjacentHTML('afterbegin',`<label>Inductor 1<input name="inductor1" value="${escape(p.inductor1||'L1')}"></label><label>Inductor 2<input name="inductor2" value="${escape(p.inductor2||'L2')}"></label>`);
  if(p.type==='T')$('part-form').insertAdjacentHTML('afterbegin',`<label>Delay (s)<input name="delay" value="${p.delay||1e-6}"></label>`);
  if(p.type==='CLOCK')$('part-form').insertAdjacentHTML('afterbegin',`<label>Frequency (Hz)<input name="frequency" value="${formatValue(p.frequency||defaultClockFrequency)}" required></label><label>Duty cycle (%)<input name="duty" value="${p.duty??50}" required></label><label>Phase (degrees)<input name="phase" value="${p.phase||0}"></label><label>Start delay (s)<input name="delay" value="${formatValue(p.delay||0)}"></label>`);
  $('part-form').onsubmit=guarded(e=>{
    e.preventDefault();const values=new FormData(e.currentTarget);const next=structuredClone(circuit);const target=next.components.find(v=>v.id===selected);
    target.id=values.get('id').trim();target.nodes=p.nodes.map((_,i)=>values.get('node'+i).trim());
    if(values.has('value'))target.value=parseValue(values.get('value'));
    for(const key of ['modelName','control','expression','inductor1','inductor2'])if(values.has(key))target[key]=values.get(key).trim();
    if(values.has('delay'))target.delay=parseValue(values.get('delay'));
    for(const key of ['frequency','duty','phase'])if(values.has(key))target[key]=parseValue(values.get(key));
    validateCircuit(next);remember();circuit=next;selected=target.id;changed();if($('properties-dialog').open)$('properties-dialog').close();
  });
  $('delete-part').onclick=()=>{remember();circuit.components=circuit.components.filter(v=>v.id!==selected);selected=null;changed();if($('properties-dialog').open)$('properties-dialog').close();};
  if(source)$('open-generator').onclick=()=>openGenerator(p.id);
}
function render(){
  const mode=schematicModes[circuit.mode];
  $('project-name').value=circuit.name;$('mode-label').textContent=mode.title;
  $('mode-library').textContent=mode.library;$('mode-results').textContent=mode.results;$('run').textContent=mode.runLabel;
  $('circuit-workspace').dataset.mode=circuit.mode;
  $('footer-count').textContent=`${circuit.components.length} components · ${new Set(circuit.components.flatMap(p=>p.nodes)).size} nets`;
  const priorAnalysis=$('analysis').value;
  $('analysis').replaceChildren(...mode.options.map(([value,label])=>new Option(label,value)));
  const defaultAnalysis=mode.defaultAnalysis(circuit);
  $('analysis').value=mode.options.some(([value])=>value===priorAnalysis)?priorAnalysis:defaultAnalysis;
  if(circuit.mode==='digital'&&defaultAnalysis==='tick'&&$('analysis').value==='truth')$('analysis').value='tick';
  updateAnalysisControls();
  const previous=$('probe').value;
  $('probe').innerHTML=[...new Set(circuit.components.flatMap(p=>p.nodes))].filter(n=>n!=='0').map(n=>`<option value="${escape(n)}">${escape(n)}</option>`).join('');
  if([...$('probe').options].some(o=>o.value===previous))$('probe').value=previous;else if([...$('probe').options].some(o=>o.value==='out'))$('probe').value='out';
  $('undo').disabled=!history.length;$('redo').disabled=!future.length;
  renderLibrary();renderCanvas();renderInspector();updateHDL();
}
function updateAnalysisControls(){
  const analog=circuit.mode==='analog',kind=$('analysis').value;
  $('spice').hidden=$('engine').hidden=$('probe-label').hidden=!analog;
  $('toggle-hdl').hidden=analog;
  $('duration-label').hidden=analog?kind!=='transient':kind!=='tick';
  $('clock-window-label').hidden=analog||kind!=='tick';
  if(analog)$('hdl-panel').hidden=true;
}
function showModule(){
  $('circuit-workspace').hidden=!['analog','digital'].includes(module);$('fsm-workspace').hidden=module!=='fsm';$('cpu-workspace').hidden=module!=='cpu';
  document.querySelectorAll('.module').forEach(b=>b.classList.toggle('active',b.dataset.module===module));
  if(specialModes[module]){
    $('hdl-panel').hidden=true;
    $('footer-count').textContent=activeDocument()?.name??'';
  }
  $('open-resources').hidden=module!=='analog';
  $('save').textContent='↧ Save JSON';
  renderTabs();
}
function switchModule(next){
  const existing=session?.documents.find(d=>d.kind===next);
  if(existing)openWorkspace(existing.id);else createWorkspace(next);
}
function addPart(libraryId){
  if(circuit.components.length>=256)throw new Error('A workspace supports up to 256 components.');
  const spec=catalogById.get(libraryId);if(!spec||spec.mode!==circuit.mode)throw new Error('Choose a component from this workspace library.');
  const type=spec.type==='BLOCK'?'U':spec.type==='GROUND'?'GND':spec.type==='PROBE'?'P':spec.type;
  remember();let i=1;while(circuit.components.some(p=>p.id===type+i))i++;
  const id=type+i,n=circuit.components.length;
  if(spec.resource)circuit.resources=[...new Map([...(circuit.resources||[]),spec.resource].map(r=>[r.id||r.spice,r])).values()];
  const view=camera||canvasBounds(),part=instantiate(spec,id,Math.max(100,Math.min(19900,Math.round((view.x+view.width/2+(n%3-1)*140)/20)*20)),Math.max(100,Math.min(19900,Math.round((view.y+view.height/2)/20)*20))),minY=Math.min(...pinPositions(part).map(p=>p[1]));
  if(minY<90)part.y+=90-minY;
  if(['V','I','GROUND'].includes(part.type))part.nodes[part.nodes.length-1]='0';
  circuit.components.push(part);
  selected=id;changed();
}
function connectPin(partId,index){
  if(!firstPin){firstPin={id:partId,index};wirePointer=pinPositions(circuit.components.find(p=>p.id===partId))[index];wireTarget=null;$('canvas-hint').textContent='Move to another port, then click or release to connect · Esc cancels';renderWirePreview();return;}
  if(firstPin.id===partId&&firstPin.index===index){clearWire();$('canvas-hint').textContent='Connection cancelled. Click a port to start again.';return;}
  const a=circuit.components.find(p=>p.id===firstPin.id),b=circuit.components.find(p=>p.id===partId);
  if(!a||!b){clearWire();return;}
  const old=b.nodes[index],next=old==='0'||a.nodes[firstPin.index]==='0'?'0':a.nodes[firstPin.index];
  const replaced=next==='0'?(old==='0'?a.nodes[firstPin.index]:old):old;
  if(replaced!==next){remember();for(const p of circuit.components)p.nodes=p.nodes.map(n=>n===replaced?next:n);changed();}
  clearWire();$('canvas-hint').textContent=`Connected net ${next}. Click another pair of pins to connect.`;
}
function svgPoint(e){const point=$('schematic').createSVGPoint();point.x=e.clientX;point.y=e.clientY;return point.matrixTransform($('schematic').getScreenCTM().inverse());}
$('schematic').addEventListener('pointerdown',guarded(e=>{
  if(e.button!==0&&e.button!==1)return;
  if(e.button===1||spaceHeld||tool==='pan'){e.preventDefault();const point=svgPoint(e);drag={pan:true,start:point,matrix:$('schematic').getScreenCTM().inverse(),camera:{...(camera||canvasBounds())}};$('schematic').setPointerCapture(e.pointerId);return;}
  $('context-menu').hidden=true;
  const pin=e.target.closest('[data-pin]');
  if(pin){const starting=!firstPin;connectPin(pin.dataset.part,Number(pin.dataset.pin));if(starting){wireGesture={x:e.clientX,y:e.clientY,moved:false};$('schematic').setPointerCapture(e.pointerId);}return;}
  if(firstPin){moveWire(e);if(wireTarget)connectPin(wireTarget.id,wireTarget.index);return;}
  const component=e.target.closest('[data-id]');
  if(!component){selected=null;const point=svgPoint(e);drag={box:true,start:point,base:e.shiftKey?new Set(multiSelection):new Set(),moved:false};if(!e.shiftKey)multiSelection.clear();$('schematic').setPointerCapture(e.pointerId);renderCanvas();renderInspector();return;}
  selected=component.dataset.id;const p=circuit.components.find(p=>p.id===selected);
  if(e.shiftKey){if(multiSelection.has(selected))multiSelection.delete(selected);else multiSelection.add(selected);renderCanvas();return;}
  if(!multiSelection.has(selected))multiSelection=new Set([selected]);
  if(tool==='wire'){renderInspector();return;}
  const start=svgPoint(e);drag={id:p.id,start,x:p.x,y:p.y,snapshot:JSON.stringify(circuit),positions:circuit.components.filter(p=>multiSelection.has(p.id)).map(p=>({id:p.id,x:p.x,y:p.y})),moved:false};
  $('schematic').setPointerCapture(e.pointerId);renderCanvas();renderInspector();
}));
$('schematic').addEventListener('pointermove',e=>{
  if(firstPin){moveWire(e);return;}
  if(!drag)return;const point=svgPoint(e),p=circuit.components.find(p=>p.id===drag.id);
  if(drag.box){
    const box=selectionRectangle(drag.start,point);drag.moved=box.width>3||box.height>3;multiSelection=new Set(drag.base);
    for(const part of circuit.components){const pins=localPinPositions(part),height=Math.max(35,...pins.map(([,y])=>Math.abs(y-part.y)+16)),width=part.type==='BLOCK'||part.nodes.length>2?80:45;const corners=[[-width,-height],[width,height],[-width,height],[width,-height]].map(([x,y])=>transformPoint(part,[part.x+x,part.y+y]));const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);const bounds={x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};if(intersectsSelection(box,bounds))multiSelection.add(part.id);}
    document.querySelectorAll('#schematic .component').forEach(part=>part.classList.toggle('selected-part',multiSelection.has(part.dataset.id)));
    selectionLayer.innerHTML=`<rect class="selection-box" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"/>`;
    $('canvas-hint').textContent=`${multiSelection.size} components selected · Drag any selected component to move the group`;
    return;
  }
  if(drag.pan){const pos=$('schematic').createSVGPoint();pos.x=e.clientX;pos.y=e.clientY;const local=pos.matrixTransform(drag.matrix);camera={...drag.camera,x:drag.camera.x+drag.start.x-local.x,y:drag.camera.y+drag.start.y-local.y};renderCanvas();return;}
  if(Math.hypot(point.x-drag.start.x,point.y-drag.start.y)<4&&!drag.moved)return;
  drag.moved=true;for(const original of drag.positions){const item=circuit.components.find(p=>p.id===original.id);item.x=Math.max(100,Math.min(20000,Math.round((original.x+point.x-drag.start.x)/20)*20));item.y=Math.max(100,Math.min(20000,Math.round((original.y+point.y-drag.start.y)/20)*20));}renderCanvas();
});
function finishDrag(){
  if(!drag)return;const current=drag;drag=null;
  if(current.box){selectionLayer.replaceChildren();if(!current.moved)multiSelection=new Set(current.base);selected=[...multiSelection][0]||null;renderCanvas();renderInspector();return;}
  if(current.pan)return;
  if(current.moved){history.push(current.snapshot);future=[];persist();render();}
  else {
    const p=circuit.components.find(p=>p.id===current.id);
    if(p?.type==='INPUT'&&multiSelection.size===1){stopPlayback();lastResult=null;remember();p.value=1-p.value;persist();render();runDigitalTick(false);}
  }
}
$('schematic').addEventListener('pointerup',guarded(e=>{if(firstPin&&wireGesture){moveWire(e);const target=wireTarget,moved=wireGesture.moved;wireGesture=null;if(moved&&target)connectPin(target.id,target.index);return;}finishDrag();}));
$('schematic').addEventListener('pointercancel',guarded(()=>{clearWire();finishDrag();}));
$('parts').onclick=guarded(e=>{const b=e.target.closest('[data-catalog]');if(b)addPart(b.dataset.catalog);});
$('examples').onclick=guarded(e=>{const b=e.target.closest('[data-example]');if(b)applyCircuit(cloneExample(b.dataset.example));});
$('search').oninput=renderLibrary;
$('category').onchange=renderLibrary;
document.querySelectorAll('.module').forEach(b=>b.onclick=()=>switchModule(b.dataset.module));
let nameSnapshot=null;
$('project-name').onfocus=()=>{nameSnapshot=JSON.stringify(circuit);};
$('project-name').oninput=guarded(e=>{circuit.name=e.target.value;persist();});
$('project-name').onblur=()=>{if(nameSnapshot&&JSON.parse(nameSnapshot).name!==circuit.name){history.push(nameSnapshot);future=[];}nameSnapshot=null;$('undo').disabled=!history.length;};
function setTool(next){tool=next;clearWire();$('select-tool').classList.toggle('selected',next==='select');$('pan-tool').classList.toggle('selected',next==='pan');$('wire-tool').classList.toggle('selected',next==='wire');$('canvas-hint').textContent=next==='wire'?'Click or drag between ports · Live preview snaps to nearby ports · Esc cancels':next==='pan'?'Drag to pan · Wheel to zoom':'Drag empty canvas to box-select · Shift adds to selection · Hold Space to pan';}
$('select-tool').onclick=()=>setTool('select');$('wire-tool').onclick=()=>setTool('wire');
$('pan-tool').onclick=()=>setTool('pan');
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();spaceHeld=true;$('schematic').classList.add('panning');}});
document.addEventListener('keyup',e=>{if(e.code==='Space'){spaceHeld=false;$('schematic').classList.remove('panning');}});
window.addEventListener('blur',()=>{spaceHeld=false;$('schematic').classList.remove('panning');});
$('undo').onclick=()=>{if(!history.length)return;future.push(JSON.stringify(circuit));circuit=JSON.parse(history.pop());selected=null;module=circuit.mode;changed();showModule();};
$('redo').onclick=()=>{if(!future.length)return;history.push(JSON.stringify(circuit));circuit=JSON.parse(future.pop());selected=null;module=circuit.mode;invalidate();persist();render();showModule();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){setTool('select');$('context-menu').hidden=true;}if(!['analog','digital'].includes(module)||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();$('undo').click();}if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();$('redo').click();}});
$('save').onclick=guarded(()=>{
  if(module==='cpu'){
    download('microcontroller-project.json',JSON.stringify({kind:'microcontroller',...specialModes.cpu.content()},null,2),'application/json');
    return;
  }
  if(module==='fsm'){specialModes.fsm.save();return;}
  download(filename()+'.json',JSON.stringify(circuit,null,2),'application/json');
});
$('spice').onclick=guarded(()=>download(filename()+'.cir',spice(circuit)));
$('import').onclick=()=>$('file-input').click();
$('file-input').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>10000000)throw new Error('Project file must be smaller than 10 MB.');const contents=await file.text();if(/\.asm$/i.test(file.name)){const target=module==='cpu'?specialModes.cpu.content().target:'teaching';createWorkspace('cpu',microcontrollerProject({target,source:contents}));return;}const parsed=JSON.parse(contents);if(parsed.kind==='microcontroller'){createWorkspace('cpu',microcontrollerProject(parsed));}else if(parsed.documents){validateSession(parsed);if(session.documents.length+parsed.documents.length>24)throw new Error('Close some tabs before importing this bundle (24 open maximum).');captureDocument();let active;for(const d of parsed.documents){const next=makeDocument(d.kind,d.content,d.name);session.documents.push(next);if(d.id===parsed.activeId)active=next.id;}openWorkspace(active,false);}else if(parsed.states&&parsed.transitions){validateFSM(parsed);createWorkspace('fsm',{source:JSON.stringify(parsed,null,2)});}else{validateCircuit(parsed);createWorkspace(parsed.mode,parsed);}toast('Opened in a new workspace.');}catch(error){toast(error.message);}finally{e.target.value='';}};

function currentSample(){if(!lastResult)return null;if(lastResult.kind==='dc')return lastResult.data.nodes;if(['tick','transient'].includes(lastResult.kind)&&lastResult.data?.rows)return lastResult.data.rows[playbackIndex]||lastResult.data.rows[0];return lastResult.data?.nets||null;}
function paintSimulationSample(){
  const row=currentSample();
  document.querySelectorAll('#net-layer .net[data-net]').forEach(path=>{const value=row?.[path.dataset.net];path.classList.toggle('logic-high',circuit.mode==='digital'&&value===1);path.classList.toggle('logic-low',circuit.mode==='digital'&&value===0);path.classList.toggle('analog-active',circuit.mode==='analog'&&Number.isFinite(value));});
  for(const part of circuit.components){const element=document.querySelector(`#component-layer [data-id="${part.id}"]`);if(!element)continue;let label=element.querySelector('.simulation-value');const value=circuit.mode==='digital'?row?.[part.nodes.at(-1)]:Number.isFinite(row?.[part.nodes[0]])?(row[part.nodes[0]]-(row[part.nodes[1]]||0)):undefined;element.classList.toggle('logic-high',circuit.mode==='digital'&&value===1);element.classList.toggle('logic-low',circuit.mode==='digital'&&value===0);if(!Number.isFinite(value)){label?.remove();continue;}if(!label){label=document.createElementNS('http://www.w3.org/2000/svg','text');label.setAttribute('class','simulation-value');label.setAttribute('text-anchor','middle');element.append(label);}label.setAttribute('x',part.x);label.setAttribute('y',Math.max(part.y+70,...pinPositions(part).map(([,y])=>y+36)));label.textContent=circuit.mode==='digital'?String(value):formatValue(value,'V');}
  if(row){const selected=selectedSignals();$('sample-values').innerHTML=selected.map(n=>`<div class="sample-value"><span>${escape(n)}</span><strong>${circuit.mode==='digital'?row[n]??'—':Number.isFinite(row[n])?formatValue(row[n],'V'):'—'}</strong></div>`).join('');}else $('sample-values').replaceChildren();
  const playable=lastResult?.data?.rows&&['tick','transient'].includes(lastResult.kind);if(playable){const rows=lastResult.data.rows,index=Math.max(0,Math.min(rows.length-1,playbackIndex)),sample=rows[index];$('playback-time').textContent=`t = ${formatValue(sample.t,'s')}`;$('playback-position').value=String(index);const cursor=$('plot-playhead');if(cursor){const t0=lastResult.kind==='tick'?0:rows[0].t,span=rows.at(-1).t-t0||1,x=(lastResult.kind==='tick'?125:54)+(sample.t-t0)/span*(lastResult.kind==='tick'?595:650);cursor.setAttribute('x1',x);cursor.setAttribute('x2',x);}}
}
function selectedSignals(){if(!lastResult)return [];if(circuit.mode==='digital')return [...new Set([...circuit.components.filter(p=>p.type==='CLOCK').map(p=>p.nodes[0]),...circuit.components.filter(p=>p.type==='OUTPUT').map(p=>p.nodes[0])])].slice(0,12);return [...new Set([$('probe').value,...circuit.components.filter(p=>p.type==='PROBE').map(p=>p.nodes[0])])].filter(Boolean).slice(0,8);}
function stopPlayback(){if(playbackFrame!==null)cancelAnimationFrame(playbackFrame);playbackFrame=null;playbackLast=null;if($('play-pause'))$('play-pause').textContent='▶ Play';}
function setupPlayback(autoplay=true){
  stopPlayback();const rows=lastResult?.data?.rows,playable=rows&&rows.length>1&&['tick','transient'].includes(lastResult.kind);$('playback-controls').hidden=!playable;
  if(playable){$('playback-position').max=String(rows.length-1);playbackIndex=Math.min(playbackIndex,rows.length-1);paintSimulationSample();if(autoplay)startPlayback();}else paintSimulationSample();
}
function startPlayback(){
  if(!lastResult?.data?.rows||playbackFrame!==null)return;$('play-pause').textContent='Ⅱ Pause';
  function frame(now){const rows=lastResult.data.rows,total=rows.at(-1).t,start=rows[0].t;const elapsed=playbackLast===null?0:(now-playbackLast)/1000;playbackLast=now;playbackPosition+=elapsed/4*Number($('playback-speed').value);if(playbackPosition>1)playbackPosition%=1;const time=start+(total-start)*playbackPosition;let low=0,high=rows.length-1;while(low<high){const mid=Math.ceil((low+high)/2);if(rows[mid].t<=time)low=mid;else high=mid-1;}playbackIndex=low;paintSimulationSample();playbackFrame=requestAnimationFrame(frame);}
  playbackFrame=requestAnimationFrame(frame);
}
function runDigitalTick(advance=true){stopPlayback();if(advance){tick++;digitalTime=nextClockTime(circuit.components,digitalTime);}const data=evaluateDigital(circuit,{},digitalMemory,tick,digitalTime);digitalMemory=data.memory;lastResult={kind:'tick',rows:[{time:formatValue(digitalTime,'s'),...data.outputs,...data.nets}],data};$('result-title').textContent=`Logic evaluation · ${formatValue(digitalTime,'s')}`;$('result-body').innerHTML=digitalTable(lastResult.rows,escape);$('playback-controls').hidden=true;paintSimulationSample();}
$('run').onclick=guarded(async()=>{
  const kind=$('analysis').value,mode=schematicModes[circuit.mode];
  const settings=mode.settings($,kind,circuit);
  const origin=session.activeId,snapshot=JSON.stringify(circuit);
  stopPlayback();document.body.classList.add('results-open');$('toggle-results').setAttribute('aria-pressed','true');playbackIndex=0;playbackPosition=0;
  $('playback-controls').hidden=true;
  lastResult=null;$('result-title').textContent='Check circuit and analysis settings';$('result-body').innerHTML='<p class="muted">No results yet. If simulation fails, correct the reported error and run again.</p>';
  paintSimulationSample();
  $('run').disabled=true;
  let data;
  try{data=await mode.run(circuit,settings);}
  finally{$('run').disabled=false;}
  if(session.activeId!==origin||JSON.stringify(circuit)!==snapshot||$('analysis').value!==kind)return;
  lastResult=mode.present(kind,data,circuit,frontend);
  setupPlayback(kind==='tick'||kind==='transient');
});
$('analysis').onchange=updateAnalysisControls;
$('result-body').addEventListener('click',e=>{
  if(e.target.id==='download-vcd'&&lastResult?.kind==='verify')download(filename()+'.vcd',lastResult.data.vcd);
});
$('probe').onchange=()=>{if(lastResult&&['transient','ac'].includes(lastResult.kind)){analogPlot(lastResult,frontend);paintSimulationSample();}};
$('csv').onclick=guarded(()=>{
  if(!lastResult)throw new Error('Run a simulation before exporting results.');
  if(lastResult.kind==='verify')throw new Error('Use Download VCD for Icarus results.');
  let rows=lastResult.rows;
  if(lastResult.kind==='transient')rows=lastResult.data.rows;
  if(lastResult.kind==='tick'&&lastResult.data?.rows)rows=lastResult.data.rows;
  if(lastResult.kind==='ac')rows=lastResult.data.rows.map(r=>Object.fromEntries([['frequency_hz',r.f],...lastResult.data.nodes.flatMap(n=>[[n+'_magnitude_v',r[n].magnitude],[n+'_phase_deg',r[n].phase]])]));
  const keys=Object.keys(rows[0]||{}),cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
  download(filename()+'-results.csv',[keys.map(cell).join(','),...rows.map(r=>keys.map(k=>cell(r[k])).join(','))].join('\n'),'text/csv');
});
$('play-pause').onclick=()=>{if(playbackFrame!==null)stopPlayback();else startPlayback();};
$('step-sample').onclick=()=>{stopPlayback();const rows=lastResult?.data?.rows;if(!rows)return;playbackIndex=(playbackIndex+1)%rows.length;playbackPosition=(rows[playbackIndex].t-rows[0].t)/(rows.at(-1).t-rows[0].t||1);paintSimulationSample();};
$('reset-playback').onclick=()=>{stopPlayback();playbackIndex=0;playbackPosition=0;paintSimulationSample();};
$('playback-position').oninput=()=>{stopPlayback();const rows=lastResult?.data?.rows;if(!rows)return;playbackIndex=Number($('playback-position').value);playbackPosition=(rows[playbackIndex].t-rows[0].t)/(rows.at(-1).t-rows[0].t||1);paintSimulationSample();};

function message(text,role='bot',root=chatThread){const div=document.createElement('div');div.className='chat-message '+role;div.textContent=text;root.append(div);$('chat').scrollTop=$('chat').scrollHeight;}
function proposalCard(proposal,root=chatThread,originId=session.activeId){
  message(proposal.explanation,'bot',root);const card=document.createElement('div');card.className='proposal';const title=document.createElement('strong');title.textContent=`${proposal.circuit.name} · ${proposal.circuit.components.length} components`;card.append(title);
  if(proposal.model){
    const source=document.createElement('p');
    source.className='muted';
    source.textContent=`${providerNames[proposal.provider]} · ${proposal.model}`;
    card.append(source);
  }
  const report=document.createElement('p');report.className='proposal-validation';report.textContent=proposal.verification?.summary||'Schema validated · simulation available after applying';card.append(report);
  const button=document.createElement('button');button.className='primary';button.textContent='Apply to canvas →';button.onclick=guarded(()=>{if(session.documents.some(d=>d.id===originId))openWorkspace(originId);else {createWorkspace(proposal.circuit.mode,proposal.circuit);return;}applyCircuit(proposal.circuit);button.disabled=true;button.textContent='Applied · use Undo to restore';toast('Circuit applied. Run a simulation to inspect it.');});card.append(button);
  const newTab=document.createElement('button');newTab.textContent='Open in new workspace ↗';newTab.onclick=guarded(()=>createWorkspace(proposal.circuit.mode,proposal.circuit));card.append(newTab);root.append(card);$('chat').scrollTop=$('chat').scrollHeight;
}
const providerNames={ollama:'Ollama',gemini:'Gemini',grok:'Grok',groq:'Groq'};
const cloudMode=mode=>Object.hasOwn(providerNames,mode)&&mode!=='ollama';
$('assistant-form').onsubmit=async e=>{
  e.preventDefault();
  if($('send').disabled)return;
  const prompt=$('prompt').value.trim();
  if(!prompt)return;
  const mode=$('ai-mode').value,originId=session.activeId,root=chatThread;
  const includeCircuit=!cloudMode(mode)||$('ai-include-circuit').checked;
  const context=includeCircuit?{circuit:structuredClone(circuit),resourceSources}:{};
  message(prompt,'user',root);$('prompt').value='';$('send').disabled=true;
  $('assistant-form').setAttribute('aria-busy','true');
  $('send').textContent='…';
  try{
    let proposal;
    if(mode==='recipe'){proposal=recipe(prompt);proposal.verification=verifyProposal(proposal.circuit);}
    else {
      const provider=mode==='local'?'ollama':mode;
      const response=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,provider,...context})});
      proposal=await response.json();
      if(!response.ok){
        if(session.activeId===originId&&!$('prompt').value)$('prompt').value=prompt;
        message(proposal.error||'Assistant request failed.','bot',root);
        if(proposal.code==='INVALID_PROPOSAL'){
          try{
            const fallback=recipe(prompt);
            fallback.verification=verifyProposal(fallback.circuit);
            const button=document.createElement('button');
            button.textContent='Preview matching offline recipe';
            button.onclick=()=>{proposalCard(fallback,root,originId);button.remove();};
            root.append(button);
            $('chat').scrollTop=$('chat').scrollHeight;
          }catch{/* This prompt does not match a runnable offline recipe. */}
        }
        return;
      }
    }
    validateCircuit(proposal.circuit);proposalCard(proposal,root,originId);
  }catch(error){
    if(session.activeId===originId&&!$('prompt').value)$('prompt').value=prompt;
    message(error.message,'bot',root);
  }finally{
    $('send').disabled=false;
    $('send').textContent='↑';
    $('assistant-form').removeAttribute('aria-busy');
  }
};
document.querySelectorAll('[data-prompt]').forEach(button=>button.onclick=()=>{$('prompt').value=button.dataset.prompt;$('assistant-form').requestSubmit();});
function renderAssistantStatus(){
  const mode=$('ai-mode').value;
  const recipes=mode==='recipe',cloud=cloudMode(mode);
  $('cloud-options').hidden=!cloud;
  $('prompt').maxLength=cloud?12000:4000;
  $('composer-label').textContent=recipes?'OFFLINE RECIPE BUILDER':cloud?`${providerNames[mode].toUpperCase()} · CLOUD API`:'OLLAMA · LOCAL MODEL';
  if(cloud){
    const status=aiStatus?.providers?.[mode];
    $('ai-status').textContent=status?.configured?`Configured · ${status.model}`:
      status?`Set ${status.keyVar} in .env and restart to use ${providerNames[mode]}.`:
        aiStatus?.unavailable?'Could not check provider configuration. Check the local server.':'Checking provider configuration…';
  }else{
    $('ai-status').textContent=recipes?'Offline recipes are ready.':
      aiStatus?.ai?`Connected · ${aiStatus.model}`:aiStatus?.aiError||'Checking Ollama…';
  }
}
async function refreshAssistantStatus(){
  try{
    const response=await fetch('/api/status');
    if(!response.ok)throw new Error();
    aiStatus=await response.json();
    ngspiceReady=aiStatus.ngspice;
    renderResources();
  }catch{aiStatus={unavailable:true,aiError:'Could not check Ollama. Check the local server and try again.'};}
  renderAssistantStatus();
}
$('ai-mode').onchange=()=>{
  $('ai-include-circuit').checked=false;
  renderAssistantStatus();
  if($('ai-mode').value!=='recipe')refreshAssistantStatus();
};
renderAssistantStatus();
refreshAssistantStatus();
$('help').onclick=()=>$('guide').showModal();$('close-guide').onclick=()=>$('guide').close();

function openProperties(){if(!selected)return;renderInspector();$('property-body').replaceChildren(...$('inspector').childNodes);$('properties-dialog').showModal();}
function selectionIds(){return multiSelection.size?[...multiSelection]:selected?[selected]:[];}
function componentAction(action){
  const ids=selectionIds();if(!ids.length)return;
  if(action==='edit'){openProperties();return;}
  if(action==='generator'){openGenerator(selected);return;}
  if(action==='duplicate'){ $('copy-count').value='1';$('duplicate-dialog').showModal();return;}
  remember();
  if(action==='delete'){circuit.components=circuit.components.filter(p=>!ids.includes(p.id));selected=null;multiSelection.clear();}
  else for(const p of circuit.components.filter(p=>ids.includes(p.id))){if(action==='rotate')p.rotation=((p.rotation||0)+90)%360;if(action==='mirror-x')p.mirrorX=!p.mirrorX;if(action==='mirror-y')p.mirrorY=!p.mirrorY;}
  changed();
}
$('schematic').addEventListener('contextmenu',guarded(e=>{
  e.preventDefault();const component=e.target.closest('[data-id]');if(!component)return;
  selected=component.dataset.id;if(!multiSelection.has(selected))multiSelection=new Set([selected]);
  const p=circuit.components.find(p=>p.id===selected);$('context-title').textContent=multiSelection.size>1?`${multiSelection.size} selected`:p.id;
  $('context-generator').hidden=!['V','I'].includes(p.type);$('context-menu').hidden=false;$('context-menu').style.left=Math.max(8,Math.min(window.innerWidth-230,e.clientX))+'px';$('context-menu').style.top=Math.max(8,Math.min(window.innerHeight-310,e.clientY))+'px';renderCanvas();
}));
$('schematic').addEventListener('dblclick',guarded(e=>{const p=e.target.closest('[data-id]');if(p){selected=p.dataset.id;openProperties();}}));
$('schematic').addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.15:1/1.15,svgPoint(e));},{passive:false});
$('context-menu').onclick=guarded(e=>{const button=e.target.closest('[data-action]');if(button){$('context-menu').hidden=true;componentAction(button.dataset.action);}});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#context-menu'))$('context-menu').hidden=true;});
document.addEventListener('keydown',guarded(e=>{if(!['analog','digital'].includes(module)||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(e.key==='Delete'){e.preventDefault();componentAction('delete');}if(e.key.toLowerCase()==='r'&&!e.ctrlKey&&!e.metaKey)componentAction('rotate');if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();componentAction('duplicate');}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){e.preventDefault();multiSelection=new Set(circuit.components.map(p=>p.id));renderCanvas();}}));
$('close-properties').onclick=()=>$('properties-dialog').close();
$('duplicate-form').onsubmit=guarded(e=>{e.preventDefault();const result=duplicateParts(circuit,selectionIds(),Number($('copy-count').value));validateCircuit(result.circuit);remember();circuit=result.circuit;multiSelection=new Set(result.ids);selected=result.ids[0];changed();$('duplicate-dialog').close();});
$('cancel-duplicate').onclick=()=>$('duplicate-dialog').close();
let generatorId=null;
function generatorData(){
  const f=new FormData($('generator-form')),wave=f.get('wave'),entered=parseValue(f.get('amplitude')),value=f.get('amplitudeMode')==='vpp'&&!['dc','pulse'].includes(wave)?entered/2:entered;
  const part={...circuit.components.find(p=>p.id===generatorId),wave,value,outputEnabled:f.get('outputEnabled')==='on',sweep:f.get('sweep'),modulation:f.get('modulation')};
  for(const key of ['frequency','offset','phase','duty','symmetry','delay','rise','fall','burstCycles','sweepStop','sweepTime','modFrequency','modDepth','deviation','sourceResistance'])part[key]=parseValue(f.get(key)||'0');
  if(wave==='arbitrary')part.points=JSON.parse(f.get('points'));return part;
}
function previewGenerator(){try{const p=generatorData(),samples=sampleGenerator(p,2/(p.frequency||1000),300),values=samples.map(v=>v[1]);let min=Math.min(...values),max=Math.max(...values);if(max-min<1e-9){min-=1;max+=1;}const path=samples.map(([t,v],i)=>`${i?'L':'M'}${20+i/300*680} ${150-(v-min)/(max-min)*125}`).join(' ');$('generator-preview').innerHTML=`<path class="generator-axis" d="M20 25H700M20 87H700M20 150H700"/><path class="generator-trace" d="${path}"/>`;$('generator-range').textContent=`${formatValue(min,p.type==='I'?'A':'V')} … ${formatValue(max,p.type==='I'?'A':'V')} · ${formatValue(2/(p.frequency||1000),'s')} shown`;$('generator-error').textContent='';}catch(error){$('generator-error').textContent=error.message;}}
function openGenerator(id){
  const p=circuit.components.find(p=>p.id===id);if(!p||!['V','I'].includes(p.type))return;
  if($('properties-dialog').open)$('properties-dialog').close();generatorId=id;$('generator-title').textContent=`${p.id} · ${p.type==='I'?'Current source':'Function generator'}`;
  const form=$('generator-form'),defaults={wave:'dc',amplitude:p.value,amplitudeMode:'peak',frequency:1000,offset:0,phase:0,duty:50,symmetry:50,delay:0,rise:0,fall:0,burstCycles:0,sweep:'off',sweepStop:10000,sweepTime:1,modulation:'off',modFrequency:100,modDepth:50,deviation:100,sourceResistance:0};
  for(const [key,value] of Object.entries(defaults))form.elements.namedItem(key).value=key==='amplitude'?String(p.value):String(p[key]??value);
  form.elements.outputEnabled.checked=p.outputEnabled!==false;form.elements.points.value=JSON.stringify(p.points||[[0,-1],[.5,1],[1,-1]]);$('generator-dialog').showModal();previewGenerator();
}
$('generator-form').oninput=previewGenerator;
$('generator-form').onsubmit=guarded(e=>{e.preventDefault();const next=structuredClone(circuit),index=next.components.findIndex(p=>p.id===generatorId);next.components[index]=generatorData();validateCircuit(next);remember();circuit=next;changed();$('generator-dialog').close();});
$('close-generator').onclick=()=>$('generator-dialog').close();
function installResources(inputs){
  const parsed=inputs.map(parseResource),next=[...new Map([...resourceLibrary,...parsed].map(r=>[r.id,r])).values()];validateResources(next);resourceLibrary=next;registerResources(resourceLibrary);localStorage.setItem('circuit-studio-resources',JSON.stringify(resourceLibrary));renderResources();renderLibrary();
}
function renderResources(){
  $('resource-list').innerHTML=resourceLibrary.map(r=>`<article class="resource-card"><strong>${escape(r.name)}</strong><small>${r.definitions.length} models · ${escape(r.license)}</small><p>${escape(r.sourceUrl||'Local file')}</p><button data-resource="${r.id}">Export model pack</button></article>`).join('')||'<p class="muted">No external models installed.</p>';
  $('resource-engine').textContent=ngspiceReady?'ngspice engine connected.':'Built-in linear engine available. Set NGSPICE_BIN for nonlinear / full SPICE models.';
  $('resource-sources').innerHTML=resourceSources.map((s,i)=>`<button type="button" data-source-index="${i}" title="${escape(s.url)}">${escape(s.name||s.url)}</button>`).join('');
}
$('open-resources').onclick=()=>{renderResources();$('resources-dialog').showModal();};$('close-resources').onclick=()=>$('resources-dialog').close();
$('import-resource-file').onclick=()=>$('resource-file').click();
$('resource-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw new Error('Resource pack exceeds 2 MB.');const text=await file.text();if(file.name.endsWith('.json')){const pack=JSON.parse(text);installResources(pack.resources||[pack]);}else installResources([{name:file.name,spice:text}]);toast('Model resources installed. Place them from Imported models.');}catch(error){toast(error.message);}finally{e.target.value='';}};
$('resource-form').onsubmit=async e=>{e.preventDefault();const button=$('fetch-resource');button.disabled=true;try{const input={url:$('resource-url').value,name:$('resource-name').value};const response=await fetch('/api/resource',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}),result=await response.json();if(!response.ok)throw new Error(result.error);installResources([result.resource]);resourceSources=[...resourceSources.filter(s=>s.url!==input.url),input].slice(-30);localStorage.setItem('circuit-studio-resource-sources',JSON.stringify(resourceSources));toast('Downloaded and installed model resource.');}catch(error){toast(error.message);}finally{button.disabled=false;}};
$('resource-list').onclick=guarded(e=>{const b=e.target.closest('[data-resource]');if(b){const resource=resourceLibrary.find(r=>r.id===b.dataset.resource);download(resource.name.replace(/[^a-z0-9]/gi,'_')+'.json',JSON.stringify({version:1,resources:[resource]},null,2),'application/json');}});
$('register-resource-source').onclick=guarded(()=>{const url=new URL($('resource-url').value);if(url.protocol!=='https:')throw new Error('Resource sources must use HTTPS.');const source={name:$('resource-name').value,url:url.href};resourceSources=[...resourceSources.filter(s=>s.url!==source.url),source].slice(-30);localStorage.setItem('circuit-studio-resource-sources',JSON.stringify(resourceSources));renderResources();toast('Source registered for copilot model retrieval.');});
$('resource-sources').onclick=e=>{const button=e.target.closest('[data-source-index]');if(button){const source=resourceSources[Number(button.dataset.sourceIndex)];$('resource-name').value=source.name;$('resource-url').value=source.url;}};
$('resource-search-form').onsubmit=async e=>{e.preventDefault();const button=$('search-models');button.disabled=true;try{const response=await fetch('/api/resource-search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:$('resource-query').value})}),result=await response.json();if(!response.ok)throw new Error(result.error);$('resource-search-results').innerHTML=result.results.map(r=>`<article class="resource-card"><strong>${escape(r.title)}</strong><p>${escape(r.description)}</p><button type="button" data-search-url="${escape(r.url)}">Use source URL</button><small>${escape(r.url)}</small></article>`).join('')||'<p class="muted">No matching resources found.</p>';}catch(error){toast(error.message);}finally{button.disabled=false;}};
$('resource-search-results').onclick=e=>{const button=e.target.closest('[data-search-url]');if(button){$('resource-url').value=button.dataset.searchUrl;$('resource-name').value='';}};
function updateHDL(){
  if(!$('hdl-panel')||$('hdl-panel').hidden)return;
  try{const result=generateVerilog(circuit);$('verilog-code').value=result.design;$('testbench-code').value=result.testbench;$('hdl-status').textContent=result.summary;}catch(error){$('verilog-code').value='';$('testbench-code').value='';$('hdl-status').textContent=error.message;}
}
$('toggle-hdl').onclick=()=>{$('hdl-panel').hidden=!$('hdl-panel').hidden;updateHDL();};$('close-hdl').onclick=()=>$('hdl-panel').hidden=true;
$('download-verilog').onclick=guarded(()=>{const result=generateVerilog(circuit);download(filename()+'.v',result.design);download(filename()+'_tb.v',result.testbench);});
for(const [id,css] of [['toggle-library','library-open'],['toggle-copilot','copilot-open'],['toggle-results','results-open']])$(id).onclick=()=>{
  const open=document.body.classList.toggle(css);
  $(id).setAttribute('aria-pressed',String(open));
  if(id==='toggle-copilot'&&open&&$('ai-mode').value!=='recipe')refreshAssistantStatus();
};
$('workspace-tabs').onclick=guarded(e=>{const open=e.target.closest('[data-open]'),close=e.target.closest('[data-close]');if(open)openWorkspace(open.dataset.open);if(close){captureDocument();const id=close.dataset.close,doc=session.documents.find(d=>d.id===id);closedDocuments.push(doc);session.documents=session.documents.filter(d=>d.id!==id);if(!session.documents.length)createWorkspace('analog');else openWorkspace(id===session.activeId?session.documents.at(-1).id:session.activeId,false);}});
$('new-workspace').onclick=guarded(()=>createWorkspace());
$('duplicate-workspace').onclick=guarded(()=>{if(session.documents.length>=24)throw new Error('Maximum 24 open workspaces.');captureDocument();const doc=duplicateDocument(activeDocument());session.documents.push(doc);openWorkspace(doc.id,false);});
$('reopen-workspace').onclick=guarded(()=>{if(!closedDocuments.length)throw new Error('No closed workspace to reopen in this session.');if(session.documents.length>=24)throw new Error('Maximum 24 open workspaces.');captureDocument();const doc=closedDocuments.pop();session.documents.push(doc);openWorkspace(doc.id,false);});
$('export-session').onclick=guarded(()=>{saveSession();download('circuit-studio-workspaces.json',JSON.stringify(session,null,2),'application/json');});
$('fit-canvas').onclick=()=>{camera=null;renderCanvas();};$('zoom-in').onclick=()=>zoom(.75);$('zoom-out').onclick=()=>zoom(1.33);
$('arrange-canvas').onclick=guarded(()=>{remember();arrange(circuit);camera=null;changed();});
window.addEventListener('beforeunload',()=>{try{saveSession();}catch{/* The export button remains available if storage is full. */}});
try{const stored=localStorage.getItem('circuit-studio-workspaces-v1');if(stored)session=validateSession(JSON.parse(stored));}catch{toast('Saved workspace data could not be opened; recovered the last circuit instead.');}
if(!session){const initial=makeDocument(circuit.mode,circuit);session={version:1,documents:[initial],activeId:initial.id};}
if(!localStorage.getItem('circuit-studio-v3-started')){const active=session.documents.find(d=>d.id===session.activeId),alreadyBlank=active?.kind==='analog'&&active.content.components.length===0;if(!alreadyBlank&&session.documents.length<24){const blank=makeDocument('analog',{version:1,name:'Untitled circuit',mode:'analog',components:[],wires:[]});session.documents.push(blank);session.activeId=blank.id;}localStorage.setItem('circuit-studio-v3-started','1');}
openWorkspace(session.activeId,false);



