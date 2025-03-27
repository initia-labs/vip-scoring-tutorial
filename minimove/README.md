# VIP Score for MiniMove

## How to Setup

### Step 1. Deploy `vip_score` contract

Score contract for minimove is natively deployed on `0x1::vip_score`. So you don't need to deploy the contract manually.

## How to Use

#### 1. Using `initia.js`

```typescript
const score = path.join(filePath, 'vip_score.mv')
const msg = new MsgExecuteMessages(validatorAddr, [
    new MsgGovPublish(
      'init1gz9n8jnu9fgqw7vem9ud67gqjk5q4m2w0aejne', // opchild module addr
      'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d', // 0x1
      [fs.readFileSync(score, 'base64')],
      1
    )
])
```

#### 2. Using `minitiad`

You can get `code_bytes` easily by using some [tools](https://base64.guru/converter/encode/file).

```json
// msg.json
{
  "messages": [
    {
      "@type": "/initia.move.v1.MsgGovPublish",
      "authority": "init1gz9n8jnu9fgqw7vem9ud67gqjk5q4m2w0aejne",
      "sender": "init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d",
      "code_bytes": ["oRzrCwYAAAALAQAOAg4oAzb9AQSzA..."], // vip_score.mv
      "upgrade_policy": 1 // compatible policy
    }
  ]
}
```

```bash
minitiad tx opchild execute-messages ./msg.json \
  --from operator \
  --chain-id [chain-id] \
  --gas auto \
  --gas-adjustment 1.5 \
  --node [rpc-url]
```

## How to Use

### Step 1. Whitelist Deployer

This limits the deployer address that can call `vip_score` contract. This is to prevent unauthorized access to the contract.

> ❗Note❗ Same deployer can't be added more than once.

 
```rust
// vip_score.move
public entry fun add_deployer_script(chain: &signer, deployer: address) acquires ModuleStore {}
```

#### 1. Using `initia.js`

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

#### 2. Using `minitiad`

You have to add your bcs serialized `deployerAddr` in `args` field.

> For now, we can serialize bcs serialized addr using `initia.js`.
> we will soon support bcs serialization using `minitiad`.
> 
> ```typescript
> import { bcs } from "@initia/initia.js"
> console.log(bcs.address().serialize("init1wgl839zxdh5c89mvc4ps97wyx6ejjygxs4qmcx").toBase64()) // AAAAAAAAAAAAAAAAcj54lEZt6YOXbMVDAvnENrMpEQY=
> ```

```json
// msg.json
{
  "messages": [
    {
      "@type": "/initia.move.v1.MsgGovExecute",
      "authority": "init1gz9n8jnu9fgqw7vem9ud67gqjk5q4m2w0aejne",
      "sender": "init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d",
      "module_address": "0x1",
      "module_name": "vip_score",
      "function_name": "add_deployer_script",
      "type_args":[],
      "args":[
        "AAAAAAAAAAAAAAAAcj54lEZt6YOXbMVDAvnENrMpEQY=" // deployerAddr
      ]
    }
  ]
}
```

```bash
minitiad tx opchild execute-messages ./msg.json \
  --from operator \
  --chain-id [chain-id] \
  --gas auto \
  --gas-adjustment 1.5 \
  --node [rpc-url]
```

By this, `deployer` can call `vip_score` contract to score user.

### Step 2. Prepare Stage

```rust
// vip_score.move
public entry fun prepare_stage(deployer: &signer, stage: u64) acquires ModuleStore {}
```

```typescript
const msg = new MsgExecute(
    deployerAddr,
    '0x1',
    'vip_score',
    'prepare_stage',
    [],
    [bcs.u64().serialize(stage).toBase64()]
)
```

### Step 3. Scoring

There are two ways to score users.

#### 1. Integrate with a smart contract

This method integrates scoring logic with the smart contract. This is useful when the scoring logic is simple and can be done in a single transaction. 

Check the example contract. See [example](./example/1.integrate-with-contract/)

> ❗Note❗ For integrate with contract, you should call `prepare_stage` function before scoring users. You can call this function only once for each stage. This function will initialize the stage and set the stage as active. See `fun prepare_stage_script()` function in [score_helper.move](./example/1.integrate-with-contract/sources/score_helper.move)

#### 2. Update with script

This method is useful when the scoring logic is complex and requires multiple transactions. In this case, you can update all scores at once by calling `update_score_script` function.

```rust
public entry fun update_score_script(
        deployer: &signer,
        stage: u64,
        addrs: vector<address>,
        scores: vector<u64>
) acquires ModuleStore {}
```

Calling `update_score_script` function might exceed the gas limit if the number of users is too large. In this case, you can divide the users into multiple transactions. 

```typescript
const BCS_BUFFER_SIZE = 1000 * 1024 // 1MB
const msg = new MsgExecute(
    deployerAddr,
    '0x1',
    'vip_score',
    'update_score_script',
    [],
    [
        bcs.u64().serialize(stage).toBase64(),
        bcs.vector(bcs.address()).serialize(addresses, { size: BCS_BUFFER_SIZE }).toBase64(),
        bcs.vector(bcs.u64()).serialize(scores, { size: BCS_BUFFER_SIZE }).toBase64()
    ]
)
```

Check the example script to update the score. See [example](./example/2.update-with-script)


### Step 4. Finalize Stage

Finalizing the stage is the last step of the scoring process. After this, no more scoring is allowed until the next stage. Stage must be finalized in order for the VIP agent to take a snapshot of the scoring result. If not finalized, reward distribution will not happen. 

```rust
// vip_score.move
public entry fun finalize_script(deployer: &signer, stage: u64) acquires ModuleStore {}
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
