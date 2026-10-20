import fs from 'node:fs';
import assert from 'node:assert/strict';
const p=JSON.parse(fs.readFileSync('PROOFS.json','utf8'));
assert(p.final_readback_verified&&p.transactions.every(t=>t.verified&&!t.broadcast_unknown));
assert.deepEqual(Object.keys(p.problems).sort(),['counter','lockstep','transfer']);
const base='https://explorer-studio.genlayer.com',repo='https://github.com/Starling-spell/affine-invariant-forge';
const lines=['# Finalized StudioNet proof ledger','',`Contract: [${p.address}](${base}/address/${p.address})`,
 '',`Matching normalized source SHA-256: \`${p.source.sha256}\`.`,
 '',`${p.transactions.length} finalized MAJORITY_AGREE transactions: ${p.transactions.filter(t=>t.execution==='SUCCESS').length} SUCCESS and ${p.transactions.filter(t=>t.execution==='ERROR').length} expected ERROR rejections.`,
 '', '| Case | Execution | Transaction |','| --- | --- | --- |',...p.transactions.map(t=>`| ${t.step} | ${t.execution} | [${t.hash}](${base}/tx/${t.hash}) |`),
 '', '## Actual generated mathematical proofs',''];
for(const [name,s] of Object.entries(p.problems))lines.push(`### ${name}`,'',`Problem: \`${s.problem_id}\`; full problem root: \`${s.problem.root}\`.`,
 '',`Proof: \`${s.proofs[0].id}\`; root: \`${s.proofs[0].root}\`.`,
 '', 'AI-generated invariant rows (`a dot x <= b`):','```json',JSON.stringify(s.proofs[0].report.proof.invariant,null,2),'```','');
if(p.prior_attempts){
 const prior=JSON.parse(fs.readFileSync(p.prior_attempts,'utf8'));
 lines.push('## Earlier failed synthesis, retained transparently','',prior.disclosure,
  '',`Earlier contract: [${prior.address}](${base}/address/${prior.address}). Its source is the earlier published revision, not the replacement deployment source.`,
  '', '| Earlier case | Execution / consensus | Transaction |','| --- | --- | --- |',
  ...prior.transactions.map(t=>`| ${t.step} | ${t.execution} / ${t.consensus} | [${t.hash}](${base}/tx/${t.hash}) |`),
  '', 'No theorem was committed on that deployment. [Full earlier ledger](PRIOR_ATTEMPTS.json).','');
}
lines.push('Every generated initialization, preservation and safety witness was independently checked with BigInt arithmetic, then re-read unchanged from onchain state. The second dedicated test signer triggered synthesis for the first signer’s models, demonstrating permissionless synthesis; both accounts belong to the same operator, not independent humans or validators.',
 '', 'Read-only negative checks: a forged zero-weight induction witness and a success-label-only object returned false; wrong and cross-problem roots rejected theorem queries. These are contract view observations, not invented transaction hashes. Stale attempt, replayed nonce and invalid initial seed have separate finalized ERROR receipts above.',
 '', 'Local verification: 38 Python tests + 5 independent JavaScript tests; 7 SDK calldata roundtrips; pinned GenVM lint/SDK validation passed. Direct/callback tests are not distributed consensus. Live receipts are the separate integration evidence.',
 '', 'Scope: unbounded mathematical-integer loop safety for exactly the stored model. No actual software correspondence, termination, real service delivery, AI-agent alignment or production security is established.',
 '', 'Reproduce without signing: `node scripts/verify-live.mjs`. Public full witness/receipt ledger: [PROOFS.json](PROOFS.json).','');
fs.writeFileSync('LIVE_PROOFS.md',lines.join('\n'));
const title='AffineInvariantForge — AI-Synthesized Inductive Safety Proofs';
const description='AffineInvariantForge synthesizes inductive safety proofs for small affine integer loops. AI invents invariants and rational implication witnesses; validators independently check exact initialization, simultaneous-step preservation and safety identities against the complete immutable model. A confidence score or success label cannot replace these checks.\n\nPermissionless synthesis appends root-bound proofs with bounded checker-guided repair. Stale attempts, nonce replay, forged witnesses and cross-problem theorem reads fail closed. No graph heads, funds, privileged finalizers or consumable certificates exist.\n\nStudioNet proofs cover a bounded counter, a transfer loop and a lockstep loop requiring invented relational strengthening. The repository includes 43 local tests, an independent BigInt checker, finalized receipts and the disclosed earlier failed synthesis. The theorem concerns exactly the supplied mathematical model—not deployed software correspondence, termination or external service delivery.';
assert(title.length<=80&&description.length<=1000);
const urls=[repo,repo+'/blob/main/contracts/AffineInvariantForge.py',repo+'/blob/main/README.md',repo+'/blob/main/LIVE_PROOFS.md',`${base}/address/${p.address}`,...p.transactions.map(t=>`${base}/tx/${t.hash}`)];
fs.writeFileSync('SUBMISSION.md',`Contribution Type: Builder → Intelligent Contracts\n\nTitle (${title.length}/80)\n\n${title}\n\nNotes / Description (${description.length}/1000)\n\n${description}\n\nEvidence URLs\n\n${urls.map(u=>'- '+u).join('\n')}\n\nExperimental and unaudited. Full models, generated witnesses, limits and negative-test distinctions are published in the proof ledger.\n`);
console.log(JSON.stringify({title_characters:title.length,description_characters:description.length,transactions:p.transactions.length}));
