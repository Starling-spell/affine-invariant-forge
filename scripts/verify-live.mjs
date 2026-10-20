import fs from 'node:fs';
import assert from 'node:assert/strict';
import {rpc,receipt,source,state,read,denied,canonical,sha,digest} from './check.mjs';
try{
 const p=JSON.parse(fs.readFileSync('PROOFS.json','utf8'));
 assert(p.final_readback_verified);assert.equal(await rpc('eth_chainId',[]),'0xf22f');
 assert.deepEqual(Object.keys(p.problems).sort(),['counter','lockstep','transfer']);
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
 for(const [name,stored] of Object.entries(p.problems)){
  const current=await state(p.address,stored.problem_id);assert.equal(canonical(current),canonical(stored));assert.equal(current.count,1);
  assert.equal(canonical(current.problem.model),canonical(JSON.parse(fs.readFileSync('examples/'+name+'.json','utf8'))));
  const proof=current.proofs[0],forged=structuredClone(proof.report.proof);
  forged.step[0].weights=forged.step[0].weights.map(()=>0);
  assert.equal(await read(p.address,'audit',[current.problem_id,canonical(forged)]),false);
  assert(await denied(p.address,'theorem',[proof.id,'f'.repeat(64),proof.root]));
  assert(await denied(p.address,'theorem',[proof.id,current.problem.root,'f'.repeat(64)]));
 }
 const counter=p.problems.counter.proofs[0];
 assert(await denied(p.address,'theorem',[counter.id,p.problems.transfer.problem.root,counter.root]));
 assert(await denied(p.address,'get_problem',[digest({contract:p.address,creator:p.accounts[0].address,nonce:'bad-seed-v1'})]));
 assert(Object.values(p.observations).every(v=>v===true));
 if(p.prior_attempts){
  const prior=JSON.parse(fs.readFileSync(p.prior_attempts,'utf8'));
  for(const entry of prior.transactions){
   const t=await rpc('eth_getTransactionByHash',[entry.hash]);assert.equal(t.status,'FINALIZED');
   const leader=t.consensus_data.leader_receipt.find(x=>x.mode==='leader');
   assert.equal(leader.execution_result,entry.execution);assert.equal(t.result_name,entry.consensus);
   await new Promise(r=>setTimeout(r,2200));
  }
  const oldCode=Buffer.from(await rpc('gen_getContractCode',[prior.address]),'base64').toString('utf8').replace(/\r\n/g,'\n').trimEnd()+'\n';
  assert.equal(sha(oldCode),prior.source.sha256);
  assert.equal(await read(prior.address,'attempt_count',[prior.problems.counter.id]),0);
 }
 console.log(JSON.stringify({verified:true,address:p.address,finalized_transactions:p.transactions.length,
  mathematical_proofs:Object.keys(p.problems).length,source_sha256:p.source.sha256}));
}catch{console.error('Sanitized live verification failure; no writes were attempted');process.exitCode=1;}
