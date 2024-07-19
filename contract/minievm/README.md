# VIP Score for MiniEVM

## Compile

```bash
npm run compile
```

## Test

```bash
npm run test
```

## Constructor

Set sender to default member of allowList.

```solidity
constructor() {
    allowList[msg.sender] = true;
}
```

## External functions

All functions can only be executed by addresses that are in the allow list.

### `prepareStage`

Initialize Stage

```solidity
function prepareStage(uint64 stage) external
```

### `finalizeStage`

Finalize stage. Once stage finalized, can't change score of that stage anymore.

```solidity
function finalizeStage(uint64 stage) external
```

### `increaseScore`

Increase score.

```solidity
function increaseScore(uint64 stage, address addr, uint64 amount) external
```

### `decreaseScore`

Decrease score.

```solidity
function decreaseScore(uint64 stage, address addr, uint64 amount) external
```

### `updateScore`

Update the score by setting it to the given amount.

```solidity
function updateScore(uint64 stage, address addr, uint64 amount) external
```

### `updateScores`

Update several scores at once.

```solidity
function updateScores(uint64 stage, address[] calldata addrs, uint64[] calldata amounts) external
```

### `addAllowList`

Add new address to allow list

```solidity
function addAllowList(address addr) external
```

### `removeAllowList`

Remove address from allow list

```solidity
function removeAllowList(address addr) external
```

## Public storage

### `stages`

mapping of stage Info

```solidity
struct StageInfo {
    uint64 stage;
    uint64 totalScore;
    bool isFinalized;
}

mapping(uint64 => StageInfo) public stages;
```

### `scores`

mapping of user score

```solidity
struct ScoreResponse {
    address addr;
    uint64 amount;
    uint64 index;
}

mapping(uint64 => mapping(address => Score)) public scores; // stage => address => score
```

## View functions

### `getScores`

Get scores

```solidity
function getScores(uint64 stage, uint64 offset, uint8 limit) public view returns (ScoreResponse[] memory)
```

Response type

```solidity
struct ScoreResponse {
    address addr;
    uint64 amount;
    uint64 index;
}
```
