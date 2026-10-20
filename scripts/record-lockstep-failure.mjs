import fs from 'node:fs';
import assert from 'node:assert/strict';
import {failedSynthesisReceipt,read} from './check.mjs';
const p=JSON.parse(fs.readFileSync('PROOFS.json','utf8'));
const step=process.argv[2]??'synthesize-lockstep';
const hashes={'synthesize-lockstep':'0xed50db282f5d184c8a3488b44cbbdb5fa21b4815288ea65218d0d9b9a13ab6e0',
 'synthesize-lockstep-retry':'0x65a3ab2b92e0f40792c0de042e8c91e1f04295b85d54f505b8f21a903770938d'};
assert(Object.hasOwn(hashes,step));
const entry=p.transactions.find(t=>t.step===step);assert.equal(entry.hash,hashes[step]);
assert.equal(await read(p.address,'attempt_count',[p.problems.lockstep.id]),0);
Object.assign(entry,await failedSynthesisReceipt(entry.hash),{verified:true,kind:'synthesis_failure',
 disclosure:'This bounded synthesis failed closed with ERROR and validator disagreement. No proof was stored. This is a synthesis failure, not an expected guard rejection or an unsafe-model verdict.'});
fs.writeFileSync('PROOFS.json',JSON.stringify(p,null,2)+'\n');
console.log(JSON.stringify({recorded_failure:entry.hash,status:entry.status,execution:entry.execution,consensus:entry.consensus,stored_proofs:0}));
