import ast
import copy
import hashlib
import itertools
import json
from pathlib import Path
import re
from types import SimpleNamespace
import pytest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'contracts/AffineInvariantForge.py'
HELPERS = [n for n in ast.parse(SOURCE.read_text()).body if isinstance(n, (ast.FunctionDef, ast.Assign))]


def namespace(gl=None):
    ns = {'hashlib': hashlib, 'json': json, 're': re, 'gl': gl}
    exec(compile(ast.Module(body=HELPERS, type_ignores=[]), str(SOURCE), 'exec'), ns)
    return ns


NS = namespace()


def problem(name='counter'):
    return NS['model']((ROOT / 'examples' / (name + '.json')).read_text())


def w(weights, scale=1):
    return {'weights': weights, 'scale': scale}


def good():
    return {'invariant': [{'a': [1], 'b': 10}, {'a': [-1], 'b': 0}],
            'initial': [w([1, 0]), w([0, 1])],
            'step': [w([0, 0, 1]), w([0, 1, 0])],
            'safety': [w([1, 0]), w([0, 1])]}


def transfer():
    return {'invariant': [{'a': [1, 1], 'b': 10}, {'a': [-1, 0], 'b': 0}],
            'initial': [w([1, 0, 1, 0]), w([0, 1, 0, 0])],
            'step': [w([1, 0, 0]), w([0, 0, 1])],
            'safety': [w([1, 0]), w([0, 1])]}


def test_good_one_and_two_dimensional_proofs():
    assert NS['check_proof'](problem(), good()) == good()
    assert NS['check_proof'](problem('transfer'), transfer()) == transfer()


def test_fractional_witness_and_different_valid_creative_proof():
    p = good()
    for field in ('initial', 'step', 'safety'):
        for witness in p[field]:
            witness['weights'] = [v * 7 for v in witness['weights']]
            witness['scale'] = 7
    assert NS['check_proof'](problem(), p) == p


@pytest.mark.parametrize('change', [
    lambda p: p['invariant'][0].update(b=9),
    lambda p: p['step'][0].update(weights=[1, 0, 0]),
    lambda p: p['safety'][0].update(weights=[0, 1]),
    lambda p: p['initial'][1].update(weights=[1, 0]),
    lambda p: p['step'][0].update(weights=[-1, 0, 2]),
    lambda p: p['step'][0].update(scale=0),
    lambda p: p['step'][0].update(scale=True),
    lambda p: p['step'][0].update(weights=[0, 0, 1.0]),
    lambda p: p['step'][0].update(weights=[0, 1]),
    lambda p: p['invariant'][0].update(a=[0]),
    lambda p: p['invariant'][0].update(a=[True]),
    lambda p: p.update(confidence=1),
    lambda p: p['safety'].pop(),
])
def test_forged_and_malformed_proofs_fail_closed(change):
    p = good()
    change(p)
    with pytest.raises((ValueError, TypeError)):
        NS['check_proof'](problem(), p)


def test_step_offset_is_not_ignored():
    m = problem()
    m['offset'] = [2]
    with pytest.raises(ValueError):
        NS['check_proof'](m, good())


def test_simultaneous_matrix_coordinates_are_not_ignored():
    m = problem('transfer')
    m['matrix'][0][1] = 1
    with pytest.raises(ValueError):
        NS['check_proof'](m, transfer())


def test_initial_safety_not_conditioned_on_guard():
    m = problem()
    m['initial'][0]['b'] = 11
    m['initial'][1]['b'] = -11
    m['seed'] = [11]
    with pytest.raises(ValueError):
        NS['check_proof'](m, good())


@pytest.mark.parametrize('change', [
    lambda m: m.update(seed=[1]),
    lambda m: m.update(dimension=True),
    lambda m: m.update(dimension=3),
    lambda m: m.update(matrix=[[True]]),
    lambda m: m.update(matrix=[[1, 0]]),
    lambda m: m.update(initial=[]),
    lambda m: m.update(guard=[]),
    lambda m: m.update(safety=[]),
    lambda m: m.update(offset=[101]),
    lambda m: m['initial'][0].update(a=[0]),
])
def test_invalid_models_rejected(change):
    m = problem()
    change(m)
    with pytest.raises(ValueError):
        NS['model'](json.dumps(m))


def test_duplicate_keys_and_json_size():
    assert NS['model']('json:' + json.dumps(problem())) == problem()
    with pytest.raises(ValueError):
        NS['decode']('{"x":1,"x":2}', 100)
    with pytest.raises(ValueError):
        NS['decode'](' ' * 4097, 4096)


def test_small_implications_have_no_counterexamples():
    accepted = 0
    for a, b, coefficient, rhs, weight, scale in itertools.product([-2, -1, 1, 2], range(-2, 3),
            [-2, -1, 1, 2], range(-2, 3), range(4), range(1, 4)):
        try:
            NS['implication']([{'a': [a], 'b': b}], {'a': [coefficient], 'b': rhs}, w([weight], scale))
        except ValueError:
            continue
        accepted += 1
        assert all(coefficient * x <= rhs for x in range(-20, 21) if a * x <= b)
    assert accepted > 100


def test_trajectory_and_all_box_invariant_states():
    m, p = problem('transfer'), transfer()
    for x, y in itertools.product(range(-25, 26), repeat=2):
        if all(sum(a * z for a, z in zip(row['a'], [x, y])) <= row['b'] for row in p['invariant']):
            assert all(sum(a * z for a, z in zip(row['a'], [x, y])) <= row['b'] for row in m['safety'])
            if x >= 1:
                assert x - 1 >= 0 and (x - 1) + (y + 1) <= 10


def test_actual_validator_checks_witness_not_another_identical_model_output():
    class Return:
        def __init__(self, value):
            self.calldata = value
    class UserError(Exception):
        pass
    binding = {'problem': 'one'}
    calls = []
    def run(generate, validator):
        result = generate()
        calls.append('generate')
        assert validator(Return(copy.deepcopy(result)))
        corrupt = copy.deepcopy(result)
        corrupt['proof']['step'][0]['weights'] = [1, 0, 0]
        assert not validator(Return(corrupt))
        corrupt = copy.deepcopy(result)
        corrupt['binding']['problem'] = 'other'
        assert not validator(Return(corrupt))
        assert not validator(object())
        return result
    fake = SimpleNamespace(vm=SimpleNamespace(Return=Return, UserError=UserError, run_nondet_unsafe=run),
                           nondet=SimpleNamespace(exec_prompt=lambda *a, **k: good()))
    ns = namespace(fake)
    assert ns['synthesize_report'](binding, problem())['proof'] == good()
    assert calls == ['generate']


def test_post_consensus_forgery_is_rechecked():
    class UserError(Exception):
        pass
    fake = SimpleNamespace(vm=SimpleNamespace(UserError=UserError, run_nondet_unsafe=lambda *a:
                           {'binding': {}, 'proof': good()}))
    with pytest.raises(ValueError):
        namespace(fake)['synthesize_report']({'problem': 'correct'}, problem())


def test_direct_lifecycle_replay_and_root_binding(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = direct_deploy(str(SOURCE))
    direct_vm.sender = direct_alice
    pid = c.register('counter', json.dumps(problem()))
    direct_vm.mock_llm('.*AFFINE_INVARIANT_SYNTHESIS_V1.*', json.dumps(good()))
    direct_vm.sender = direct_bob
    proof_id = c.synthesize(pid, 0)
    record, registered = c.get_proof(proof_id), c.get_problem(pid)
    assert c.attempt_count(pid) == 1
    assert c.theorem(proof_id, registered['root'], record['root'])['semantics'] == 'mathematical-integers-no-overflow'
    assert c.audit(pid, json.dumps(good()))
    forged = good()
    forged['step'][0]['weights'] = [1, 0, 0]
    assert not c.audit(pid, json.dumps(forged))
    with direct_vm.expect_revert('Attempt mismatch'):
        c.synthesize(pid, 0)
    with direct_vm.expect_revert('Theorem root mismatch'):
        c.theorem(proof_id, 'f' * 64, record['root'])
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert('Problem nonce used'):
        c.register('counter', json.dumps(problem()))
    assert c.get_proof(proof_id) == record


def test_direct_bad_ai_no_proof_or_reserved_attempt(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(str(SOURCE))
    direct_vm.sender = direct_alice
    pid = c.register('unsafe-model', json.dumps(problem()))
    direct_vm.mock_llm('.*AFFINE_INVARIANT_SYNTHESIS_V1.*', json.dumps({'status': 'PROVED'}))
    with direct_vm.expect_revert('Synthesis did not produce a checked proof'):
        c.synthesize(pid, 0)
    assert c.attempt_count(pid) == 0


def test_direct_three_proofs_bounded_and_no_overwrite(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(str(SOURCE))
    direct_vm.sender = direct_alice
    pid = c.register('three', json.dumps(problem()))
    direct_vm.mock_llm('.*AFFINE_INVARIANT_SYNTHESIS_V1.*', json.dumps(good()))
    ids = [c.synthesize(pid, i) for i in range(3)]
    assert len(set(ids)) == 3
    with direct_vm.expect_revert('Proof limit'):
        c.synthesize(pid, 3)
    assert c.attempt_count(pid) == 3
