# VIP Scoring Tutorial

## Summary

- Deploy `vip_score` contract for scoring users.
- Share following information to Initia team for whitelisting:
  - Deployed VIP Contract Address (move chain is precompiled at `0x1`)
  - VIP Operator Address (account that will receive the VIP operating commission)
  - VIP scoring Policy (for reference, check [vip page](https://app.testnet.initia.xyz/vip))
    ```json
    // This is an example of scoring policy
    "categories": ["L2", "Social"], // categories of the Minitia
    "description": "Mint cities, collect yield, and collaborate within communities to acquire control of the planet.", // description of the Minitia
    "actions": [
      {
        "action": "Earn SILVER", // action name
        "description": "Earn SILVER by playing Civitia seasons with an active residence." // action description
      }
    ]
    ```

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
    - See [Scoring](#step-2-scoring) section for detailed information about how to score users.
    - Finalize the stage when scoring is done. (no more scoring is allowed)
3. The VIP agent will take a snapshot of the scores.
    - VIP agent is an entity that is in charge of submitting snapshots of the scores, and is selected through Initia governance.
    - VIP agent will only take snapshots of Minitias that have finalized the stage. 
    - Rewards will be distributed to the users based on the snapshot.
4. User can claim the reward.
    - User can claim the reward after the snapshot is taken.
    - User's reward will be decreased if the user not meet the minimum score for the stage.


## Interacting with the `vip_score` contract

There are three types of `vip_score` contracts for each Minitia.

- minimove: [vip-move](./minimove/README.md)
- miniwasm: [vip-cosmwasm](https://github.com/initia-labs/vip-cosmwasm/blob/14bab45bc5dbc3d3efd29ce987658489fa541d54/README.md)
- minievm: [vip-evm](https://github.com/initia-labs/vip-evm/blob/927653295803716e4aaf14c6ffa24924f664e359/README.md)

Note that the main purpose of `vip_score` is to score users based on the Minitia's scoring policy. The VIP agent does not interfere with the scoring policies, but Minitias should record the score of users on the same `vip_score` contract interface for snapshot.

> We allow modifications to the score contract, but you must follow these rules:
> - The interface and ABI must not be changed: you can add or modify functions, but you cannot change the existing interface.
> - Once finalized, the score must not be changed.
> - You can deploy it to a different address (not 0x1), but the module name must remain score. (only for move chain)


## Claiming Operator Reward

This is a guide for claiming operator reward on VIP system. 

- The operator address and bridge_id should match the information whitelisted during registration in the VIP system. 
- The operator reward must be claimed on the L1 chain, not on the L2 chain.
- All stages that can be claimed must be provided in sequence.

#### 1. Using `initia.js`

```typescript
import {
    bcs,
    LCDClient,
    MnemonicKey,
    MsgExecute,
    Wallet,
} from '@initia/initia.js';
  
async function claimOperatorVesting() {
    const lcd = new LCDClient('[rest-url]', {
      gasPrices: '0.15uinit',
      gasAdjustment: '1.5',
    });
  
    const key = new MnemonicKey({
      mnemonic: 'beauty sniff protect ...',
    });
    const wallet = new Wallet(lcd, key);

    const bridgeId = 1;
    const stages = [1,2,3]; // stages to claim
    const msgs = [
      new MsgExecute(
        key.accAddress,
        '0x1',
        'vip',
        'batch_claim_operator_reward_script',
        [],
        [
            bcs.u64().serialize(bridgeId).toBase64(),
            bcs.vector(bcs.u64()).serialize(stages).toBase64(),
        ]
      ),
    ];
  
    // sign tx
    const signedTx = await wallet.createAndSignTx({ msgs });
    // send(broadcast) tx
    lcd.tx.broadcastSync(signedTx).then(res => console.log(res));
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
# assume that claiming operator reward for stages 1,2,3
initiad tx move execute 0x1 vip batch_claim_operator_reward_script \
 --args '["u64:1", "vector<u64>:1,2,3"]' \ 
 --from [key-name] \
 --gas auto --gas-adjustment 1.5 --gas-prices 0.15uinit \
 --node [rpc-url]:[rpc-port] --chain-id [chain-id]
```
