# VIP Scoring Tutorial

## Introduction
In VIP, a scoring system exists in order to distribute esINIT rewards to the users based on their activities in a Minitia.

VIP scoring process is as follows:

1. Whitelist a Minitia on VIP system
    - Minitias are whitelisted through a whitelisting proposal on Initia's governance.
    - The information required to whitelist a Minitia are `bridge`, `contract`, and `operator` addresses. (see [vip.move](https://github.com/initia-labs/movevm/blob/cbb9e0d2d903b79fd0d2bcfed1aa01c7503ca98c/precompile/modules/initia_stdlib/sources/vip/vip.move#L868))
2. Minitias score users based on their activities on each stage.
    - The scoring policy is determined completely by Minitias.
    - Initia provides `vip_score` contracts as default. (e.g. [vip_score.move](https://github.com/initia-labs/movevm/blob/main/precompile/modules/minitia_stdlib/sources/vip/score.move) for minimove)
    - For scoring user, Minitia should whitelist `deployer` address on `vip_score` contract.
    - The `deployer` could call `vip_score` contract to score users.
    - See [Scoring](#Scoring) section for detailed information about how to score users.
    - Finalize the stage when scoring is done. (no more scoring is allowed)
3. The VIP agent will take a snapshot of the scores.
    - The agent will take a snapshot only for Minitias that have finalized the stage.
    - Rewards will be distributed to the users based on the snapshot.
4. User can claim the reward.
    - User can claim the reward after the snapshot is taken.
    - User's reward will be decreased if the user not meet the minimum score for the stage.


## Interacting with the `vip_score` contract

This example is for `minimove` L2. If you are using other vm, check following:

- miniwasm: [vip-cosmwasm](https://github.com/initia-labs/vip-cosmwasm)
- minievm: [vip-evm](https://github.com/initia-labs/vip-evm)

Note that the main purpose of `vip_score` is to score users based on the Minitia's scoring policy. The VIP agent does not interfere with the scoring policies, but Minitias should record the score of users on the same `vip_score` contract interface for snapshot.

### Whitelist Deployer

This limits the deployer address that can call `vip_score` contract. This is to prevent unauthorized access to the contract.

```rust
// vip_score.move
public entry fun add_deployer_script(chain: &signer, deployer: address) acquires ModuleStore {
    check_chain_permission(chain);
    let module_store = borrow_global_mut<ModuleStore>(@minitia_std);
    ///
    /// ....
    ///
}
```

You can add a deployer address to the whitelist by calling `add_deployer_script` function. This function is only callable by the chain.

```typescript
const msg = new MsgExecuteMessages(validatorAddr, [
    new MsgGovExecute(
      'init1gz9n8jnu9fgqw7vem9ud67gqjk5q4m2w0aejne', // opchild module addr
      'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d', // 0x1
      '0x1',
      'vip_score',
      'add_deployer_script',
      [],
      [bcs.address().serialize(deployerAddr).toBase64()]
    )
])
```

By this, `deployer` can call `vip_score` contract to score user.

### Scoring

There are two ways to score users.

#### 1. Integrate with Contract

This method integrates scoring logic with the contract. This is useful when the scoring logic is simple and can be done in a single transaction. Check the example contract. See [example](./example/1.integrate-with-contract/)

#### 2. Update with script

This method is useful when the scoring logic is complex and requires multiple transactions. In this case, you can update all scores at once by calling `update_score_script` function.

```rust
public entry fun update_score_script(
        deployer: &signer,
        stage: u64,
        addrs: vector<address>,
        scores: vector<u64>
) acquires ModuleStore {
    assert!(
        vector::length(&addrs) == vector::length(&scores),
        error::invalid_argument(ENOT_MATCH_LENGTH)
    );
    prepare_stage(deployer, stage);

    vector::enumerate_ref(
        &addrs,
        |i, addr| {
            update_score(
                deployer,
                *addr,
                stage,
                *vector::borrow(&scores, i),
            );
        }
    );
}
```


Update the score by calling `update_score_script` function will exceed the gas limit if the number of users is too large. In this case, you can divide the users into multiple transactions. Check the example script to update the score. See [example](./example/2.update-with-script/)


### Finalize Stage

This is the last step of the scoring process. After this, no more scoring is allowed. If the stage is not finalized, the VIP agent will not take a snapshot of the scoring result.

```rust
// vip_score.move
public entry fun finalize_script(deployer: &signer, stage: u64) acquires ModuleStore {
    check_deployer_permission(deployer);
    let module_store = borrow_global_mut<ModuleStore>(@minitia_std);
    ///
    /// ....
    ///
}
```

```typescript
const msg = new MsgExecute(
    deployerAddr,
    '0x1',
    'vip_score',
    'finalize_script',
    [],
    [bcs.u64().serialize(stage).toBase64()]
)
```



