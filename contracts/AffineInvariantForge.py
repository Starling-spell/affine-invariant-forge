# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import hashlib
import json
import re
from genlayer import *

POLICY = "affine-invariant-forge-v1"


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def digest(value):
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()


def pairs(items):
    result = {}
    for key, value in items:
        if key in result:
            raise ValueError("Duplicate JSON key")
        result[key] = value
    return result


def decode(raw, limit):
    if not isinstance(raw, str) or not 1 <= len(raw.encode("utf-8")) <= limit:
        raise ValueError("JSON size")
    # Native CLI treats a bare JSON object as calldata dict, not a string.
    if raw.startswith("json:"):
        raw = raw[5:]
    return json.loads(raw, object_pairs_hook=pairs)


def keys(value, expected):
    if not isinstance(value, dict) or set(value) != set(expected):
        raise ValueError("Object fields")


def integer(value, lower, upper):
    if type(value) is not int or not lower <= value <= upper:
        raise ValueError("Integer bound")
    return value


def vector(value, size, bound):
    if not isinstance(value, list) or len(value) != size:
        raise ValueError("Vector dimension")
    return [integer(v, -bound, bound) for v in value]


def rows(value, dimension, maximum, coefficient_bound, rhs_bound):
    if not isinstance(value, list) or not 1 <= len(value) <= maximum:
        raise ValueError("Row count")
    for row in value:
        keys(row, ["a", "b"])
        vector(row["a"], dimension, coefficient_bound)
        integer(row["b"], -rhs_bound, rhs_bound)
        if not any(row["a"]):
            raise ValueError("Zero row")
    return value


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def model(raw):
    value = decode(raw, 4096)
    keys(value, ["dimension", "initial", "guard", "matrix", "offset", "safety", "seed"])
    d = integer(value["dimension"], 1, 2)
    rows(value["initial"], d, 4, 100, 10000)
    rows(value["guard"], d, 3, 100, 10000)
    rows(value["safety"], d, 2, 100, 10000)
    vector(value["offset"], d, 100)
    vector(value["seed"], d, 10000)
    if not isinstance(value["matrix"], list) or len(value["matrix"]) != d:
        raise ValueError("Matrix dimension")
    for row in value["matrix"]:
        vector(row, d, 10)
    if any(dot(r["a"], value["seed"]) > r["b"] for r in value["initial"]):
        raise ValueError("Initial seed missing")
    return value


def implication(sources, target, witness):
    """Exact nonnegative rational combination, no search and no floating point."""
    keys(witness, ["weights", "scale"])
    scale = integer(witness["scale"], 1, 1000)
    weights = witness["weights"]
    if not isinstance(weights, list) or len(weights) != len(sources):
        raise ValueError("Witness arity")
    for weight in weights:
        integer(weight, 0, 10000)
    if any(sum(weights[i] * row["a"][j] for i, row in enumerate(sources)) != scale * coefficient
           for j, coefficient in enumerate(target["a"])):
        raise ValueError("Coefficient identity")
    if sum(w * row["b"] for w, row in zip(weights, sources)) > scale * target["b"]:
        raise ValueError("Bound implication")


def check_proof(problem, proof):
    if isinstance(proof, str):
        proof = decode(proof, 12000)
    if len(canonical(proof).encode("utf-8")) > 12000:
        raise ValueError("Proof size")
    keys(proof, ["invariant", "initial", "step", "safety"])
    invariant = rows(proof["invariant"], problem["dimension"], 3, 1000, 10000)
    for field, length in [("initial", len(invariant)), ("step", len(invariant)), ("safety", len(problem["safety"]))]:
        if not isinstance(proof[field], list) or len(proof[field]) != length:
            raise ValueError("Obligation count")
    for i, row in enumerate(invariant):
        implication(problem["initial"], row, proof["initial"][i])
        transformed = {"a": [sum(row["a"][k] * problem["matrix"][k][j]
                                 for k in range(problem["dimension"])) for j in range(problem["dimension"])],
                       "b": row["b"] - dot(row["a"], problem["offset"])}
        implication(invariant + problem["guard"], transformed, proof["step"][i])
    for i, row in enumerate(problem["safety"]):
        implication(invariant, row, proof["safety"][i])
    return proof


def prompt(problem):
    return """AFFINE_INVARIANT_SYNTHESIS_V1
Synthesize an inductive invariant proving the supplied formal affine loop safe.
All states are mathematical integers with no overflow. A row {a:[...],b:B} means a dot x <= B.
Initial rows are simultaneous. Each iteration is enabled only when ALL guard rows hold;
the simultaneous assignment is x_next = matrix*x + offset. Safety must hold at every reachable
state, including the initial state and loop exits. Do not assume a guard at the initial state.
Return only JSON with exactly four fields:
{"invariant":[{"a":[...],"b":0}],"initial":[{"weights":[...],"scale":1}],
 "step":[{"weights":[...],"scale":1}],"safety":[{"weights":[...],"scale":1}]}
Choose 1 to 3 invariant inequalities. Their nonzero integer coefficient vectors have absolute
values <=1000 and rhs absolute value <=10000. No explanation, confidence, status or markdown.
Each witness has nonnegative INTEGER weights <=10000 and INTEGER scale in 1..1000.
For sources S and target T, prove sum(weights_i*S_i.a) == scale*T.a in EVERY coordinate
and sum(weights_i*S_i.b) <= scale*T.b. Equality of coefficients is mandatory, not approximate.
initial[i] uses sources initial rows, target invariant[i].
step[i] uses sources ALL invariant rows FOLLOWED BY guard rows, in that order;
target coefficients = invariant[i].a * matrix, target rhs = invariant[i].b - invariant[i].a dot offset.
safety[i] uses sources ALL invariant rows, target safety[i].
Lengths: initial and step equal invariant count; safety equals safety row count.
Weights length must equal its source count, including zero weights for unused rows.
Find a real proof; all algebra will be checked independently. Never return a success claim.
FORMAL_PROBLEM_JSON:
""" + canonical(problem)


def validate_report(report, binding, problem):
    keys(report, ["binding", "proof"])
    if canonical(report["binding"]) != canonical(binding):
        raise ValueError("Problem or attempt substitution")
    return check_proof(problem, report["proof"])


def synthesize_report(binding, problem):
    def generate():
        try:
            proof = check_proof(problem, gl.nondet.exec_prompt(prompt(problem), response_format="json"))
        except Exception:
            raise gl.vm.UserError("[LLM_ERROR] No valid algebraic witness")
        return {"binding": binding, "proof": proof}

    def validator(result):
        if not isinstance(result, gl.vm.Return):
            return False
        try:
            # Do not merely check shape, or require a second identical creative proof.
            # Recompute every coefficient identity and bound against the original problem.
            validate_report(result.calldata, binding, problem)
            return True
        except Exception:
            return False

    report = gl.vm.run_nondet_unsafe(generate, validator)
    validate_report(report, binding, problem)
    return report


def fail(message):
    raise gl.vm.UserError("[EXPECTED] " + message)


class AffineInvariantForge(gl.Contract):
    problems: TreeMap[str, str]
    proofs: TreeMap[str, str]
    attempts: TreeMap[str, u256]
    creator_counts: TreeMap[str, u256]

    def __init__(self):
        pass

    @gl.public.write
    def register(self, nonce: str, model_json: str) -> str:
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,48}", nonce):
            fail("Invalid nonce")
        try:
            problem = model(model_json)
        except Exception:
            fail("Invalid formal model")
        creator, contract = str(gl.message.sender_address), str(gl.message.contract_address)
        key = digest({"contract": contract, "creator": creator, "nonce": nonce})
        if key in self.problems:
            fail("Problem nonce used")
        count = int(self.creator_counts.get(creator, 0))
        if count >= 32:
            fail("Creator limit")
        record = {"policy": POLICY, "contract": contract, "creator": creator, "nonce": nonce,
                  "model": problem, "model_root": digest(problem)}
        record["root"] = digest(record)
        self.problems[key] = canonical(record)
        self.creator_counts[creator] = count + 1
        return key

    @gl.public.write
    def synthesize(self, problem_id: str, expected_attempt: int) -> str:
        registered = self.get_problem(problem_id)
        index = int(self.attempts.get(problem_id, 0))
        if type(expected_attempt) is not int or expected_attempt != index:
            fail("Attempt mismatch")
        if index >= 3:
            fail("Proof limit")
        binding = {"policy": POLICY, "contract": str(gl.message.contract_address), "problem": problem_id,
                   "problem_root": registered["root"], "model_root": registered["model_root"],
                   "requester": str(gl.message.sender_address), "attempt": index}
        try:
            report = synthesize_report(binding, registered["model"])
        except Exception:
            fail("Synthesis did not produce a checked proof")
        key = digest({"problem": problem_id, "attempt": index})
        record = {"status": "PROVED", "report": report}
        record["root"] = digest(record)
        self.proofs[key] = canonical(record)
        self.attempts[problem_id] = index + 1
        return key

    @gl.public.view
    def get_problem(self, problem_id: str) -> dict:
        if problem_id not in self.problems:
            fail("Unknown problem")
        return json.loads(self.problems[problem_id])

    @gl.public.view
    def get_proof(self, proof_id: str) -> dict:
        if proof_id not in self.proofs:
            fail("Unknown proof")
        return json.loads(self.proofs[proof_id])

    @gl.public.view
    def attempt_count(self, problem_id: str) -> int:
        self.get_problem(problem_id)
        return int(self.attempts.get(problem_id, 0))

    @gl.public.view
    def audit(self, problem_id: str, proof_json: str) -> bool:
        problem = self.get_problem(problem_id)["model"]
        try:
            check_proof(problem, proof_json)
            return True
        except Exception:
            return False

    @gl.public.view
    def theorem(self, proof_id: str, expected_problem_root: str, expected_proof_root: str) -> dict:
        proof = self.get_proof(proof_id)
        binding = proof["report"]["binding"]
        registered = self.get_problem(binding["problem"])
        if expected_problem_root != registered["root"] or expected_proof_root != proof["root"]:
            fail("Theorem root mismatch")
        try:
            check_proof(registered["model"], proof["report"]["proof"])
        except Exception:
            fail("Invalid stored proof")
        return {"problem_root": registered["root"], "proof_root": proof["root"],
                "model_root": registered["model_root"], "invariant": proof["report"]["proof"]["invariant"],
                "safety": registered["model"]["safety"], "semantics": "mathematical-integers-no-overflow"}
