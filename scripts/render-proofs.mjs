import fs from 'node:fs';
import assert from 'node:assert/strict';
const p=JSON.parse(fs.readFileSync('PROOFS.json','utf8'));
assert(p.final_readback_verified&&p.transactions.every(t=>t.verified&&!t.broadcast_unknown));
const base='https://explorer-studio.genlayer.com',repo='https://github.com/Starling-spell/affine-invariant-forge';
const lines=['# Finalized StudioNet proof ledger','',`Contract: [${p.address}](${base}/address/${p.address})`,
 '',`Matching normalized source SHA-256: \`${p.source.sha256}\`.`,
 '',`${p.transactions.length} finalized MAJORITY_AGREE transactions: ${p.transactions.filter(t=>t.execution==='SUCCESS').length} SUCCESS and ${p.transactions.filter(t=>t.execution==='ERROR').length} expected ERROR rejections.`,
 '', '| Case | Execution | Transaction |','| --- | --- | --- |',...p.transactions.map(t=>`| ${t.step} | ${t.execution} | [${t.hash}](${base}/tx/${t.hash}) |`),
 '', '## Actual generated mathematical proofs',''];
for(const [name,s] of Object.entries(p.problems))lines.push(`### ${name}`,'',`Problem: \`${s.problem_id}\`; full problem root: \`${s.problem.root}\`.`,
 '',`Proof: \`${s.proofs[0].id}\`; root: \`${s.proofs[0].root}\`.`,
 '', 'AI-generated invariant rows (`a dot x <= b`):','```json',JSON.stringify(s.proofs[0].report.proof.invariant,null,2),'```','');
lines.push('Every generated initialization, preservation and safety witness was independently checked with BigInt arithmetic, then re-read unchanged from onchain state. The second dedicated test signer triggered synthesis for the first signer’s models, demonstrating permissionless synthesis; both accounts belong to the same operator, not independent humans or validators.',
 '', 'Read-only negative checks: a forged zero-weight induction witness and a success-label-only object returned false; wrong and cross-problem roots rejected theorem queries. These are contract view observations, not invented transaction hashes. Stale attempt, replayed nonce and invalid initial seed have separate finalized ERROR receipts above.',
 '', 'Local verification: 36 Python tests + 4 independent JavaScript tests; 7 SDK calldata roundtrips; pinned GenVM lint/SDK validation passed. Direct/callback tests are not distributed consensus. Live receipts are the separate integration evidence.',
 '', 'Scope: unbounded mathematical-integer loop safety for exactly the stored model. No actual software correspondence, termination, real service delivery, AI-agent alignment or production security is established.',
 '', 'Reproduce without signing: `node scripts/verify-live.mjs`. Public full witness/receipt ledger: [PROOFS.json](PROOFS.json).','');
fs.writeFileSync('LIVE_PROOFS.md',lines.join('\n'));
const title='AffineInvariantForge — AI-Synthesized Inductive Safety Proofs';
const description='AffineInvariantForge is a reusable GenLayer proof-synthesis primitive for small affine loops over mathematical integers. AI invents inductive inequalities and rational implication witnesses. Validators independently recompute initialization, simultaneous-step preservation and safety consequences against the complete immutable formal model. Publication requires exact coefficient identities, nonnegative weights and positive scales—not a success label, confidence tolerance or caller summary.\n\nProblems and proofs are append-only and root-bound. Anyone can trigger bounded synthesis; stale attempts, nonce replay and cross-problem theorem reads are rejected. No graph heads, funds, privileged finalizers or consumable certificates exist.\n\nThe StudioNet demo generated checked proofs for a bounded counter and a two-variable transfer loop, with separate guard-rejection transactions. It proves the supplied mathematical model, not that deployed software implements it; termination and external reality are not asserted.';
assert(title.length<=80&&description.length<=1000);
const urls=[repo,repo+'/blob/main/contracts/AffineInvariantForge.py',repo+'/blob/main/README.md',repo+'/blob/main/LIVE_PROOFS.md',`${base}/address/${p.address}`,...p.transactions.map(t=>`${base}/tx/${t.hash}`)];
fs.writeFileSync('SUBMISSION.md',`Contribution Type: Builder → Intelligent Contracts\n\nTitle (${title.length}/80)\n\n${title}\n\nNotes / Description (${description.length}/1000)\n\n${description}\n\nEvidence URLs\n\n${urls.map(u=>'- '+u).join('\n')}\n\nExperimental and unaudited. Full models, generated witnesses, limits and negative-test distinctions are published in the proof ledger.\n`);
console.log(JSON.stringify({title_characters:title.length,description_characters:description.length,transactions:p.transactions.length}));
