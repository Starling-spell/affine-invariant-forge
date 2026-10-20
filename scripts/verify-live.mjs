import fs from 'node:fs';
import assert from 'node:assert/strict';
import {rpc,receipt,source,state,read,denied,canonical} from './check.mjs';
try{
 const p=JSON.parse(fs.readFileSync('PROOFS.json','utf8'));
 assert(p.final_readback_verified);assert.equal(await rpc('eth_chainId',[]),'0xf22f');
 assert.equal(canonical(await source(p.address)),canonical(p.source));
 for(const t of p.transactions){
  assert(t.hash&&!t.broadcast_unknown&&t.verified);
  const result=await receipt(t.hash,t.expected,t.expected_message);assert.equal(result.execution,t.execution);assert.equal(result.consensus,t.consensus);
  const tx=await rpc('eth_getTransactionByHash',[t.hash]);
  assert.equal((tx.from_address??tx.from).toLowerCase(),t.signer.toLowerCase());
  assert.equal((tx.to_address??tx.to).toLowerCase(),p.address.toLowerCase());
  console.log(JSON.stringify({verified_step:t.step,status:result.status,execution:result.execution}));
  await new Promise(r=>setTimeout(r,2200));
 }
 for(const stored of Object.values(p.problems)){
  const current=await state(p.address,stored.problem_id);assert.equal(canonical(current),canonical(stored));assert.equal(current.count,1);
  const proof=current.proofs[0],forged=structuredClone(proof.report.proof);
  forged.step[0].weights=forged.step[0].weights.map(()=>0);
  assert.equal(await read(p.address,'audit',[current.problem_id,canonical(forged)]),false);
  assert(await denied(p.address,'theorem',[proof.id,'f'.repeat(64),proof.root]));
 }
 const counter=p.problems.counter.proofs[0];
 assert(await denied(p.address,'theorem',[counter.id,p.problems.transfer.problem.root,counter.root]));
 assert(Object.values(p.observations).every(v=>v===true));
 console.log(JSON.stringify({verified:true,address:p.address,finalized_transactions:p.transactions.length,
  mathematical_proofs:Object.keys(p.problems).length,source_sha256:p.source.sha256}));
}catch{console.error('Sanitized live verification failure; no writes were attempted');process.exitCode=1;}
