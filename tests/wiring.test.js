import test from 'node:test';
import assert from 'node:assert/strict';
import {wirePath,nearestPort} from '../src/wiring.js';
test('live wire preview uses the same orthogonal route as completed connections',()=>{
  assert.equal(wirePath([100,120],[300,240]),'M100 120H200V240H300');
  assert.equal(wirePath([300,240],[100,120]),'M300 240H200V120H100');
});
test('wire snapping picks the nearest port within tolerance and excludes its origin',()=>{
  const ports=[{id:'R1',index:0,point:[100,100]},{id:'R1',index:1,point:[200,100]},{id:'R2',index:0,point:[208,110]}];
  assert.equal(nearestPort(ports,[202,101],12).id,'R1');
  assert.equal(nearestPort(ports,[100,100],12,{id:'R1',index:0}),null);
  assert.equal(nearestPort(ports,[500,500],12),null);
  assert.equal(nearestPort(ports,[208,110],12).id,'R2');
});
