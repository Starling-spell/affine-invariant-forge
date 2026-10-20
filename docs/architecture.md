# Architecture and proof argument

Let `I` be the conjunction of invented invariant rows. Every initial witness proves `Init => I`. Each step witness proves `I and Guard => I(Mx+c)`. Mathematical induction therefore places every reachable state in `I`, including loop-exit states. Safety witnesses prove `I => Safety`. No loop termination assumption is necessary.

For nonnegative rational weights `lambda_i=w_i/q`, each source `a_i*x<=b_i` implies `sum(lambda_i*a_i)*x<=sum(lambda_i*b_i)`. Exact coefficient equality and an upper bound no greater than the target bound establish each desired implication. The checker rejects an invalid identity even if every model endorses its narrative. These witnesses prove implications over reals, so they are sound but incomplete for integer-only properties.

Generation is an actual `gl.nondet.exec_prompt` inside `run_nondet_unsafe`. Validators do not duplicate a deterministic graph update or just check a JSON enum: they reconstruct every initialization, affine substitution and safety obligation against the immutable original model. Non-comparative verification is appropriate because alternate invariants and multiplier decompositions can prove the same theorem. Requiring identical independently generated coefficients would harm liveness without improving exact proof soundness. Post-consensus execution repeats the complete checker before append-only storage.

Failure means no proof, not an unsafe judgment. There is no `UNKNOWN => PROVED`, confidence interval, tolerance crossing, fake source-fetch claim or fabricated consensus-conflict record.

## Proof matrix

| Property | Local evidence | Intended live evidence |
| --- | --- | --- |
| Consequential AI synthesis | Mocked generation + actual callback | Two real generated proof artifacts |
| Exact soundness obligations | Forged initial/step/safety, negative/scaled weights | Independent BigInt recheck of actual generated witnesses |
| Non-vacuous initial states | Bad seed and empty rows | Rejected invalid model registration |
| Identity/replay binding | Stale attempts, nonce and wrong roots | Finalized guard-error receipts and root-bound read guards |
| No cross-problem theorem | Binding tamper callback | Counter proof queried with transfer problem root rejected |
| Persistence | No overwrite tests | Repeated unchanged problem/proof readback |
| Matching deployment | Runner pin + linter | Actual deployed-source SHA comparison |

The intended column is not a claim of execution. [LIVE_PROOFS.md](../LIVE_PROOFS.md) records only verified receipts and actual observations. All demo accounts belong to one operator; they are not independent humans or validator identities.
