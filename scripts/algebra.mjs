import assert from 'node:assert/strict';
// Independent BigInt checker: build a full weighted augmented row and compare the target.
export function implication(sources,target,witness){
 assert(Number.isSafeInteger(witness.scale)&&witness.scale>0&&witness.scale<=1000);
 assert(Array.isArray(witness.weights)&&witness.weights.length===sources.length);
 assert(witness.weights.every(x=>Number.isSafeInteger(x)&&x>=0&&x<=10000));
 const combined=Array(target.a.length+1).fill(0n);
 sources.forEach((r,i)=>[...r.a,r.b].forEach((v,j)=>combined[j]+=BigInt(v)*BigInt(witness.weights[i])));
 const scaled=[...target.a,target.b].map(v=>BigInt(v)*BigInt(witness.scale));
 combined.slice(0,-1).forEach((v,j)=>assert.equal(v,scaled[j]));assert(combined.at(-1)<=scaled.at(-1));
}
export function verify(problem,proof){
 assert.equal(Object.keys(proof).sort().join(','),'initial,invariant,safety,step');
 assert(proof.invariant.length>=1&&proof.invariant.length<=3);
 assert.equal(proof.initial.length,proof.invariant.length);assert.equal(proof.step.length,proof.invariant.length);
 assert.equal(proof.safety.length,problem.safety.length);
 proof.invariant.forEach((row,i)=>{
  assert.equal(Object.keys(row).sort().join(','),'a,b');assert.equal(row.a.length,problem.dimension);
  assert(row.a.every(x=>Number.isSafeInteger(x)&&Math.abs(x)<=1000)&&row.a.some(x=>x!==0));
  assert(Number.isSafeInteger(row.b)&&Math.abs(row.b)<=10000);
  implication(problem.initial,row,proof.initial[i]);
  const coefficients=problem.matrix[0].map((_,j)=>problem.matrix.reduce((s,r,k)=>s+row.a[k]*r[j],0));
  const bound=row.b-row.a.reduce((s,v,k)=>s+v*problem.offset[k],0);
  implication([...proof.invariant,...problem.guard],{a:coefficients,b:bound},proof.step[i]);
 });
 problem.safety.forEach((r,i)=>implication(proof.invariant,r,proof.safety[i]));return true;
}
