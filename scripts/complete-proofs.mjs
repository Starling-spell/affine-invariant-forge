import fs from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {getAddress} from 'viem';
import {rpc,receipt,source,state,read,denied,digest,canonical} from './check.mjs';
const file='PROOFS.json',account={name:'studio-proof-deployer',address:'0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42'};
const reviewer={name:'fairresolve-demo',address:'0x34346773A22564cBCc5F1D67d1C1F9f196DAEA35'};
for(const a of [account,reviewer])a.address=getAddress(a.address.toLowerCase());
let p=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):
 {network:'studionet',chain_id:61999,accounts:[account,reviewer],transactions:[],problems:{},observations:{}};
const save=()=>fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');p.final_readback_verified=false;save();
function broadcast(args,signer,onHash){return new Promise((resolve,reject)=>{
 const proc=spawn(process.execPath,['--dns-result-order=ipv4first','scripts/run-cli.cjs',...args],{windowsHide:true,
  env:{...process.env,FORGE_TEST_ACCOUNT:signer.name},stdio:['ignore','pipe','pipe']});
 let carry='';proc.stderr.resume();proc.stdout.on('data',chunk=>{carry+=chunk.toString();const lines=carry.split(/\r?\n/);carry=lines.pop();
  for(const line of lines)if(/^BROADCAST_HASH 0x[0-9a-fA-F]{64}$/.test(line))onHash(line.split(' ')[1]);});
 proc.on('error',()=>reject(Error('CLI launch failed')));proc.on('close',resolve);
});}
async function tx(step,args,signer=account,expected='SUCCESS',message){
 let entry=p.transactions.find(t=>t.step===step);
 if(!entry){entry={step,signer:signer.address,expected,verified:false,broadcast_unknown:true,cli_arguments:args,...(message?{expected_message:message}:{})};p.transactions.push(entry);save();
  await broadcast(args,signer,hash=>{entry.hash=hash;delete entry.broadcast_unknown;save();console.log(step+' '+hash);});}
 if(!entry.hash)throw Error('Unknown broadcast outcome; inspect signer history before rebroadcast');
 Object.assign(entry,await receipt(entry.hash,expected,message),{verified:true});save();
 console.log(JSON.stringify({step,status:entry.status,execution:entry.execution,consensus:entry.consensus}));
 if(expected==='SUCCESS'&&!entry.committed)throw Error('Consensus disagreement: no state committed');return entry;
}
try{
 assert.equal(await rpc('eth_chainId',[]),'0xf22f');
 const deployed=await tx('deploy',['deploy','--contract','contracts/AffineInvariantForge.py']);p.address=deployed.address;p.source=await source(p.address);save();
 for(const name of ['counter','transfer','lockstep']){
  const model=JSON.parse(fs.readFileSync('examples/'+name+'.json','utf8'));
  await tx('register-'+name,['write',p.address,'register','--args',name+'-v1','json:'+canonical(model)]);
  const id=digest({contract:p.address,creator:account.address,nonce:name+'-v1'});
  p.problems[name]={id};save();
  const initial=p.transactions.find(t=>t.step==='synthesize-'+name);
  const step=initial?.kind==='synthesis_failure'?'synthesize-'+name+'-retry':'synthesize-'+name;
  const knownFailure=p.transactions.find(t=>t.step===step)?.kind==='synthesis_failure';
  if(!knownFailure)await tx(step,['write',p.address,'synthesize','--args',id,'0'],reviewer);
  const verified=await state(p.address,id);assert.equal(verified.count,knownFailure?0:1);
  assert.equal(canonical(verified.problem.model),canonical(model));p.problems[name]=verified;save();
 }
 const id=p.problems.counter.problem_id;
 await tx('stale-attempt',['write',p.address,'synthesize','--args',id,'0'],reviewer,'ERROR','Attempt mismatch');
 await tx('nonce-replay',['write',p.address,'register','--args','counter-v1','json:'+canonical(p.problems.counter.problem.model)],account,'ERROR','Problem nonce used');
 const invalid=structuredClone(p.problems.counter.problem.model);invalid.seed=[1];
 await tx('invalid-initial-seed-rejected',['write',p.address,'register','--args','bad-seed-v1','json:'+canonical(invalid)],account,'ERROR','Invalid formal model');
 const proof=p.problems.counter.proofs[0],forged=structuredClone(proof.report.proof);
 forged.step[0].weights=forged.step[0].weights.map(()=>0);
 assert.equal(await read(p.address,'audit',[id,canonical(forged)]),false);p.observations.forged_step_rejected=true;
 assert.equal(await read(p.address,'audit',[id,'{"status":"PROVED"}']),false);p.observations.claim_only_rejected=true;
 assert(await denied(p.address,'theorem',[proof.id,'f'.repeat(64),proof.root]));p.observations.wrong_problem_root_denied=true;
 assert(await denied(p.address,'theorem',[proof.id,p.problems.counter.problem.root,'f'.repeat(64)]));p.observations.wrong_proof_root_denied=true;
 assert(await denied(p.address,'theorem',[proof.id,p.problems.transfer.problem.root,proof.root]));p.observations.cross_problem_denied=true;
 assert(await denied(p.address,'get_problem',[digest({contract:p.address,creator:account.address,nonce:'bad-seed-v1'})]));p.observations.invalid_model_not_stored=true;
 for(const name of ['counter','transfer','lockstep']){
  const before=p.problems[name],current=await state(p.address,before.problem_id);
  assert.equal(canonical(before),canonical(current));p.problems[name]=current;
 }
 p.source=await source(p.address);assert(p.transactions.every(t=>t.verified&&!t.broadcast_unknown));
 p.final_readback_verified=true;save();console.log(JSON.stringify({complete:true,address:p.address,proofs:Object.values(p.problems).reduce((n,x)=>n+x.count,0),transactions:p.transactions.length}));
}catch{console.error('Sanitized proof workflow stopped; inspect recorded hashes/state before retry');process.exitCode=1;}
