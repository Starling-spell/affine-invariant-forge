# Finalized StudioNet proof ledger

Contract: [0xDA879F8B628C7488360fFd91d32968f1c5D02B5f](https://explorer-studio.genlayer.com/address/0xDA879F8B628C7488360fFd91d32968f1c5D02B5f)

Matching normalized source SHA-256: `c272997879d90089a853b9d35567c869adfd1eebb1f1127a2813425ead1d7a78`.

11 finalized transactions: 6 successful MAJORITY_AGREE executions, 3 expected guard-error rejections and 2 failed synthesis attempts. Failed syntheses are not theorem proofs.

| Case | Execution / consensus | Transaction |
| --- | --- | --- |
| deploy | SUCCESS / MAJORITY_AGREE | [0x3da3063ebeb18455bfe9314e71cc5e509d12a89edec1ebd4f8d903ffeb274f34](https://explorer-studio.genlayer.com/tx/0x3da3063ebeb18455bfe9314e71cc5e509d12a89edec1ebd4f8d903ffeb274f34) |
| register-counter | SUCCESS / MAJORITY_AGREE | [0xf288f630d8bc0a8b4a01eef6cd9f9ae5994102795b31664cb57cafa4b8994616](https://explorer-studio.genlayer.com/tx/0xf288f630d8bc0a8b4a01eef6cd9f9ae5994102795b31664cb57cafa4b8994616) |
| synthesize-counter | SUCCESS / MAJORITY_AGREE | [0x613e30a6552ecd6d04bc4c2caa78d21572f5dd5f95ee12d17f9198dcac1b8f9a](https://explorer-studio.genlayer.com/tx/0x613e30a6552ecd6d04bc4c2caa78d21572f5dd5f95ee12d17f9198dcac1b8f9a) |
| register-transfer | SUCCESS / MAJORITY_AGREE | [0xc24e69d2c5b8bb802fa6c143976f5d088c1ff9e6a5a892f82ea50232b013a48b](https://explorer-studio.genlayer.com/tx/0xc24e69d2c5b8bb802fa6c143976f5d088c1ff9e6a5a892f82ea50232b013a48b) |
| synthesize-transfer | SUCCESS / MAJORITY_AGREE | [0x0c4bc4a667ade0ad686112dde3f1a30cba0e103f33e82a88150392b700ae31b4](https://explorer-studio.genlayer.com/tx/0x0c4bc4a667ade0ad686112dde3f1a30cba0e103f33e82a88150392b700ae31b4) |
| register-lockstep | SUCCESS / MAJORITY_AGREE | [0x62ed63ef96dde1668b1ac4feac44d42b73ee6669d2b56a7c2eea331a4750efd0](https://explorer-studio.genlayer.com/tx/0x62ed63ef96dde1668b1ac4feac44d42b73ee6669d2b56a7c2eea331a4750efd0) |
| synthesize-lockstep | ERROR / MAJORITY_DISAGREE | [0xed50db282f5d184c8a3488b44cbbdb5fa21b4815288ea65218d0d9b9a13ab6e0](https://explorer-studio.genlayer.com/tx/0xed50db282f5d184c8a3488b44cbbdb5fa21b4815288ea65218d0d9b9a13ab6e0) |
| synthesize-lockstep-retry | ERROR / MAJORITY_DISAGREE | [0x65a3ab2b92e0f40792c0de042e8c91e1f04295b85d54f505b8f21a903770938d](https://explorer-studio.genlayer.com/tx/0x65a3ab2b92e0f40792c0de042e8c91e1f04295b85d54f505b8f21a903770938d) |
| stale-attempt | ERROR / MAJORITY_AGREE | [0x8d88c8c6f416f6c8ad9a1203631070a5281eec60ef30bc028f2ad1ab0eca0576](https://explorer-studio.genlayer.com/tx/0x8d88c8c6f416f6c8ad9a1203631070a5281eec60ef30bc028f2ad1ab0eca0576) |
| nonce-replay | ERROR / MAJORITY_AGREE | [0xe810c6f0600ef59fd1b6a5ec06496e40484f346f73b53e6b40b3d0d5d18b3671](https://explorer-studio.genlayer.com/tx/0xe810c6f0600ef59fd1b6a5ec06496e40484f346f73b53e6b40b3d0d5d18b3671) |
| invalid-initial-seed-rejected | ERROR / MAJORITY_AGREE | [0x167e3a3cf5a70688d8a5bf7b80387e8c4df22afb69c114c876ad2a538ec65ce8](https://explorer-studio.genlayer.com/tx/0x167e3a3cf5a70688d8a5bf7b80387e8c4df22afb69c114c876ad2a538ec65ce8) |

## Actual generated mathematical proofs

### counter

Problem: `d9fb3e90fa5579553556109405e7dd44d834b7d858726c6d985eea267e973506`; full problem root: `f031a2baae524debd9fd4bf6fdb5732aab9ad245fb1000abcd325230068a2b9c`.

Proof: `a0ff57d54c85418a7fd75fe4d77c221a4b194e5f866e9e142a6c4be67efdea69`; root: `239ea511faa6acc89fd7374122cc37210d7667482fe53ccb53d0aede9f480469`.

AI-generated invariant rows (`a dot x <= b`):
```json
[
  {
    "a": [
      1
    ],
    "b": 10
  },
  {
    "a": [
      -1
    ],
    "b": 0
  }
]
```

### transfer

Problem: `ab7d8556a8d93254470f3995732a6f35685505c6d185f8849cdc9cb4fd423df2`; full problem root: `8900d5ad65dfd9a37ff46b7350b93ecf5027c004972d30b16525a6cb5bf83eaa`.

Proof: `f56129bc3d8715996dbb5c87933588b6d4f492a664940d5d7002bbfabdc0bc05`; root: `0ba2fba8c7176845f41c95b27224af4eb7b9318a8cb2329f795c438dc1ae379d`.

AI-generated invariant rows (`a dot x <= b`):
```json
[
  {
    "a": [
      1,
      1
    ],
    "b": 10
  },
  {
    "a": [
      -1,
      0
    ],
    "b": 0
  }
]
```

### lockstep: NO PUBLISHED PROOF

Problem: `b4a4be3f63a2eea8c771f777da072dbee3442fe1d544d02f3f7d10b61da3f663`. Synthesis failed closed; zero artifacts were committed. This is not an unsafe-model verdict.

## Earlier failed synthesis, retained transparently

Initial deployment synthesized no theorem: first counter synthesis finalized ERROR with MAJORITY_DISAGREE. Retained here, never cited as a successful proof. Replacement deployment adds bounded checker-guided AI repair and diagnostics.

Earlier contract: [0x1febE53cDaFC12d14c1C5711fA3A2D17d5596b45](https://explorer-studio.genlayer.com/address/0x1febE53cDaFC12d14c1C5711fA3A2D17d5596b45). Its source is the earlier published revision, not the replacement deployment source.

| Earlier case | Execution / consensus | Transaction |
| --- | --- | --- |
| deploy | SUCCESS / MAJORITY_AGREE | [0x9ed0eca31faf2b353118e8cebfe221a9c9a43f231b52fdf0bd8a2538ffbdf01a](https://explorer-studio.genlayer.com/tx/0x9ed0eca31faf2b353118e8cebfe221a9c9a43f231b52fdf0bd8a2538ffbdf01a) |
| register-counter | SUCCESS / MAJORITY_AGREE | [0x1e2158fc0075b3b6ab49a36f5e6b8e952f0ae1115f6e9b5a6caecd110c2a0920](https://explorer-studio.genlayer.com/tx/0x1e2158fc0075b3b6ab49a36f5e6b8e952f0ae1115f6e9b5a6caecd110c2a0920) |
| synthesize-counter | ERROR / MAJORITY_DISAGREE | [0x9f4a54bf374555fd851ed927c11e0e6fde470586c6a1d4b2b92fb2891d353e98](https://explorer-studio.genlayer.com/tx/0x9f4a54bf374555fd851ed927c11e0e6fde470586c6a1d4b2b92fb2891d353e98) |

The recorded failed synthesis committed no theorem; the count was zero when archived. [Full earlier ledger](PRIOR_ATTEMPTS.json).

Every published initialization, preservation and safety witness was independently checked with BigInt arithmetic, then re-read unchanged from onchain state. The second dedicated test signer triggered synthesis for the first signer’s models, demonstrating permissionless synthesis; both accounts belong to the same operator, not independent humans or validators.

Read-only negative checks: a forged zero-weight induction witness and a success-label-only object returned false; wrong and cross-problem roots rejected theorem queries. These are contract view observations, not invented transaction hashes. Stale attempt, replayed nonce and invalid initial seed have separate finalized ERROR receipts above.

Local verification: 38 Python tests + 5 independent JavaScript tests; 7 SDK calldata roundtrips; pinned GenVM lint/SDK validation passed. Direct/callback tests are not distributed consensus. Live receipts are the separate integration evidence.

Scope: unbounded mathematical-integer loop safety for exactly the stored model. No actual software correspondence, termination, real service delivery, AI-agent alignment or production security is established.

Reproduce without signing: `node scripts/verify-live.mjs`. Public full witness/receipt ledger: [PROOFS.json](PROOFS.json).
