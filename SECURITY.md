# Security boundaries

Experimental, unaudited, test-network code. Do not use for funds, safety-critical control, contract authorization, regulatory compliance or claims about deployed software.

The theorem concerns exactly the stored formal model under mathematical integer semantics. It does not establish correct translation from code, machine arithmetic, array bounds outside the model, concurrency, actual execution, termination, real-world service delivery or agent alignment. A publisher can prove a toy model unrelated to its product; consumers must independently establish correspondence. Names and model hashes do not establish that correspondence.

The trusted computing base includes this parser and proof checker, GenVM integer semantics, storage integrity and GenLayer consensus. AI need not be honest for algebraic soundness: incorrect witnesses cannot satisfy the mandatory identities. Checker implementation bugs remain possible. Model/provider faults or hostile consensus can deny liveness; no heuristic fallback publishes an unchecked result. Independent BigInt checks and adversarial tests reduce implementation risk, not eliminate it.

The validator receives the complete original numeric model, not the leader's summary. No natural-language problem instruction is accepted. Every integer rejects booleans/floats. Dimensions/counts/coefficients/weights/scales and serialized bytes are bounded; keys and witness lengths are exact; duplicate JSON keys are rejected. Multipliers are nonnegative and scales strictly positive. A checked initial seed prevents vacuous empty-initial proofs. An unsatisfiable guard legitimately has no enabled successor; it does not remove initial safety obligations.

Problem/creator/contract/nonces, exact problem/model roots, requester, attempt indexes and proof roots prevent substitution. Permissionless synthesis appends; it cannot change an existing problem/proof or consume a credential. Successful proof count is capped at three per problem, creator registrations at 32. These are resource bounds, not Sybil resistance. A third party can occupy a proof slot only by publishing a valid proof; this is documented public-bounty behavior, not private job ownership.

No token operations, wallet exports, external calls from a published theorem, dynamic evaluation, privileged upgrade or global emergency pause. All onchain inputs/artifacts are public. Private or personal data should not be supplied.

Report a reproducible issue through the repository's security reporting channel or a minimal issue without secrets. Deployment source is immutable; a checker correction needs a new explicit deployment and consumer root/address update. Never silently reinterpret old artifacts.
