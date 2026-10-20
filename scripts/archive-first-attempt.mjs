import fs from 'node:fs';
import assert from 'node:assert/strict';
import {rpc,read} from './check.mjs';
const p=JSON.parse(fs.readFileSync('PROOFS.json','utf8'));
assert.equal(p.transactions.length,3);
assert.equal(p.transactions[2].hash,'0x9f4a54bf374555fd851ed927c11e0e6fde470586c6a1d4b2b92fb2891d353e98');
assert(!fs.existsSync('PRIOR_ATTEMPTS.json'));
for(const entry of p.transactions){
 assert(entry.hash&&!entry.broadcast_unknown);
 const t=await rpc('eth_getTransactionByHash',[entry.hash]);
 assert.equal(t.status,'FINALIZED');
 const leader=t.consensus_data.leader_receipt.find(x=>x.mode==='leader');
 entry.status=t.status;entry.execution=leader.execution_result;entry.consensus=t.result_name;
 entry.verified=true;entry.committed=entry.execution==='SUCCESS'&&entry.consensus==='MAJORITY_AGREE';
}
assert.equal(p.transactions[2].committed,false);
const id=p.problems.counter.id;assert.equal(await read(p.address,'attempt_count',[id]),0);
p.disclosure='Initial deployment synthesized no theorem: first counter synthesis finalized ERROR with MAJORITY_DISAGREE. Retained here, never cited as a successful proof. Replacement deployment adds bounded checker-guided AI repair and diagnostics.';
fs.writeFileSync('PRIOR_ATTEMPTS.json',JSON.stringify(p,null,2)+'\n');
fs.writeFileSync('PROOFS.json',JSON.stringify({network:p.network,chain_id:p.chain_id,accounts:p.accounts,transactions:[],problems:{},observations:{},prior_attempts:'PRIOR_ATTEMPTS.json'},null,2)+'\n');
console.log(JSON.stringify({archived_deployment:p.address,finalized_prior_transactions:3,committed_mathematical_proofs:0}));
