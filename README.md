# VIP Scoring Tutorial

## Summary

- Deploy `vip_score` contract for scoring users.
- Share following information to Initia team for whitelisting:
  - VIP Contract Address
  - VIP Operator Address (account that will receive the VIP operating commission)
  - Update `profile.json` on [initia-registry](https://github.com/initia-labs/initia-registry) for VIP scoring Policy (for reference, check [vip page](https://app.testnet.initia.xyz/vip))
    ```json
    // This is an example of profile.json
    {
      "$schema": "../../profile.schema.json",
      "name": "yominet",
      "pretty_name": "Kamigotchi",
      "category": "Gaming",
      "l2": true,
      "description": "The first economically independent virtual world living onchain. Home to the Kamigotchi.",
      "summary": "Economically independent, onchain virtual world",
      "color": "#42F771",
      "status": "live",
      "vip": {
        "actions": [
          {
            "title": "Complete Quest",
            "description": "Completing VIP quests in-game for each epoch."
          }
        ]
      },
      "social": {
        "website": "https://playtest.kamigotchi.io"
      }
    }
    ```

## Introduction
In VIP, a scoring system exists in order to distribute esINIT rewards to the users based on their activities in a Minitia.

VIP scoring process is as follows:

1. Whitelist a Minitia on VIP system
    - Rollups are whitelisted through a whitelisting proposal on Initia's governance.
    - The information required to whitelist a Minitia are `bridge`, `contract`, and `operator` addresses.
2. Rollups score users based on their activities on each stage.
    - The scoring policy is determined completely by Rollups.
    - Initia provides `vip_score` contracts as default.
    - For scoring user, Minitia should whitelist `deployer` address on `vip_score` contract.
    - The `deployer` could call `vip_score` contract to score users.
    - See [Scoring](#step-2-scoring) section for detailed information about how to score users.
    - Finalize the stage when scoring is done. (no more scoring is allowed)
3. The VIP agent will take a snapshot of the scores.
    - VIP agent is an entity that is in charge of submitting snapshots of the scores, and is selected through Initia governance.
    - VIP agent will only take snapshots of Rollups that have finalized the stage. 
    - Rewards will be distributed to the users based on the snapshot.
4. User can claim the reward.
    - User can claim the reward after the snapshot is taken.
    - User's reward will be decreased if the user not meet the minimum score for the stage.


## Interacting with the `vip_score` contract

There are three types of `vip_score` contracts for each Minitia.

- minimove: [vip-score-move](https://github.com/initia-labs/vip-score-move.git)
- miniwasm: [vip-score-wasm](https://github.com/initia-labs/vip-score-wasm.git)
- minievm: [vip-score-evm](https://github.com/initia-labs/vip-score-evm.git)

Note that the main purpose of `vip_score` is to score users based on the Minitia's scoring policy. The VIP agent does not interfere with the scoring policies, but Rollups should record the score of users on the same `vip_score` contract interface for snapshot.

> We allow modifications to the score contract, but you must follow these rules:
> - The interface and ABI must not be changed: you can add or modify functions, but you cannot change the existing interface.
> - Once finalized, the score must not be changed.
> - You can deploy it to a different address (not 0x1), but the module name must remain score. (only for move chain)


## Claiming Operator Reward

This is a guide for claiming operator reward on VIP system. 

- The operator address and bridge_id should match the information whitelisted during registration in the VIP system. 
- The operator reward must be claimed on the L1 chain, not on the L2 chain.
- The operator should provide the version to claim the reward.

> Version is used to distinguish the operator vesting position when the operator is deregistered and registered again. Version is increased by 1 when the operator is registered again and starts from 1.

#### 1. Using `initia.js`

```typescript
import {
    bcs,
    RESTClient,
    MnemonicKey,
    MsgExecute,
    Wallet,
} from '@initia/initia.js';
  
async function claimOperatorVesting() {
    const rest = new RESTClient('[rest-url]', {
      gasPrices: '0.015uinit',
      gasAdjustment: '1.5',
    });
  
    const key = new MnemonicKey({
      mnemonic: 'beauty sniff protect ...',
    });
    const wallet = new Wallet(rest, key);

    const bridgeId = 1;
    const version = 1; // version to claim
    const msgs = [
      new MsgExecute(
        key.accAddress,
        '0x1',
        'vip',
        'batch_claim_operator_reward_script',
        [],
        [
            bcs.u64().serialize(bridgeId).toBase64(),
            bcs.u64().serialize(version).toBase64(),
        ]
      ),
    ];
  
    // sign tx
    const signedTx = await wallet.createAndSignTx({ msgs });
    // broadcast tx
    rest.tx.broadcastSync(signedTx).then(res => console.log(res));
    // {
    //   height: 0,
    //   txhash: '0F2B255EE75FBA407267BB57A6FF3E3349522DA6DBB31C0356DB588CC3933F37',
    //   raw_log: '[]'
    // }
}
  
claimOperatorVesting();
```

#### 2. Using `initiad`

```shell
# assume that claiming operator reward for version 1 on bridge_id 1
initiad tx move execute 0x1 vip batch_claim_operator_reward_script \
 --args '["u64:1", "u64:1"]' \ 
 --from [key-name] \
 --gas auto --gas-adjustment 1.5 --gas-prices 0.15uinit \
 --node [rpc-url]:[rpc-port] --chain-id [chain-id]
```
