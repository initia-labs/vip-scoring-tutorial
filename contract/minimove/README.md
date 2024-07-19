# VIP Score for MiniMove

## How to Setup

### 1. Compile

> ❗Note❗ Check the `rev = "main"` in `Move.toml`. The value should be the same as the commit hash of the movevm version. You can check your `movevm` version in minimove `go.mod` file. 

```
// go.mod
module github.com/initia-labs/minimove

go 1.22

toolchain go1.22.2

require (
    ...
	github.com/initia-labs/movevm v0.2.12
    ...
)
```

Compile the contract by running the following command:

```bash
minitiad move build
```

### 2. Deploy Contract

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

```rust
public entry fun update_score_script(
    deployer: &signer,
    stage: u64,
    addrs: vector<address>,
    scores: vector<u64>
) acquires ModuleStore {}
```

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


### Step 4. Finalize Stage

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
