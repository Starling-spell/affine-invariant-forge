import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verify,implication} from '../scripts/algebra.mjs';
const m=JSON.parse(fs.readFileSync('examples/counter.json'));
const w=weights=>({weights,scale:1});
const proof=()=>({invariant:[{a:[1],b:10},{a:[-1],b:0}],initial:[w([1,0]),w([0,1])],step:[w([0,0,1]),w([0,1,0])],safety:[w([1,0]),w([0,1])]});
test('independent BigInt checker accepts induction',()=>assert(verify(m,proof())));
test('rejects forged induction and safety',()=>{
 const p=proof();p.step[0].weights=[1,0,0];assert.throws(()=>verify(m,p));
 const q=proof();q.safety[0].weights=[0,1];assert.throws(()=>verify(m,q));
});
test('scaled rational witness is exact',()=>{
 const p=proof();for(const f of ['initial','step','safety'])for(const w of p[f]){w.scale=7;w.weights=w.weights.map(x=>7*x);}
 assert(verify(m,p));p.step[0].weights[2]=6;assert.throws(()=>verify(m,p));
});
test('all accepted small implication witnesses survive integer counterexample search',()=>{
 let accepted=0;
 for(const a of [-2,-1,1,2])for(let b=-2;b<=2;b++)for(const c of [-2,-1,1,2])for(let d=-2;d<=2;d++)for(let weight=0;weight<4;weight++)for(let scale=1;scale<4;scale++){
  try{implication([{a:[a],b}],{a:[c],b:d},{weights:[weight],scale});}catch{continue;}
  accepted++;for(let x=-30;x<=30;x++)if(a*x<=b)assert(c*x<=d);
 }assert(accepted>100);
});
