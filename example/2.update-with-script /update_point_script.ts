import {  LCDClient, MnemonicKey, MsgExecute, Wallet, bcs } from '@initia/initia.js'
interface ScoreMap {
  [address: string]: number
}

const BCS_BUFFER_SIZE = 1000 * 1024 // 1MB
export function SplitUpdateScoreScript(deployer: string, contracAddr = '0x1', stage: string, addr2Score: ScoreMap) {

  const txs: MsgExecute[] = []
  const addr2ScoreArr = Object.entries(addr2Score)
  // split the addr2ScoreArr into chunks because of the tx gas limit (0)
  const CHUNK_LENGTH = 150
  for (let i = 0; i < addr2ScoreArr.length; i += CHUNK_LENGTH) {
    const addrs: string[] = []
    const scores: number[] = []
    const addr2ScoreArr_s = addr2ScoreArr.slice(i, i + CHUNK_LENGTH)
    addr2ScoreArr_s.forEach(([addr, s]) => {
      addrs.push(addr)
      scores.push(s)
    })

    txs.push(
      new MsgExecute(
        deployer,
        contracAddr,
        'vip_score',
        'update_score_script',
        [],
        [
          bcs.u64().serialize(stage).toBase64(),
          bcs.vector(bcs.address()).serialize(addrs, { size: BCS_BUFFER_SIZE }).toBase64(),
          bcs.vector(bcs.u64()).serialize(scores, { size: BCS_BUFFER_SIZE }).toBase64()
        ]
      )
    )
  }

  return txs
}
async function update_score() {
  // mock data for the scores
  const scores: ScoreMap = {}
  for (let i = 2; i <= 100000; i++) {
    const address = `0x${i.toString(16)}`
    scores[address] = i
  }
  
  const mnemonic = "/* your deployer mnemonic */";

  // make wallet with mnemonic
  const wallet = new Wallet(
    new LCDClient('https://lcd.stonemove-16.initia.xyz', { gasPrices: '0umin', gasAdjustment: '1.75' }),
    new MnemonicKey({ mnemonic /* use your mnemonic*/ })
  )
  const sequence = await wallet.sequence()
  // ex. stage = 123 / addr2Score = { '0xeeff357ea5c1a4e7bc11b2b17ff2dc2dcca69750bfef1e1ebcaccf8c8018175b': 1000 }
  const msgs = SplitUpdateScoreScript(wallet.key.accAddress, '0x1', '123', scores)
  // should make multiple transactions with only one msg because of the tx gas limit
  const TIMEOUT = 10_000
  for (let i = sequence; i < sequence + msgs.length; i++) {
    // create the transactions with only one msg
    const signedTx = await wallet.createAndSignTx({
      msgs: [msgs[i]],
      sequence: i
    })
    // broadcast the transaction
    await wallet.lcd.tx.broadcast(signedTx, TIMEOUT)
  }
}

update_score()