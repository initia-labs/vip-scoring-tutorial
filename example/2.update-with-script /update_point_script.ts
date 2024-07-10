import {  LCDClient, MnemonicKey, MsgExecute, Wallet, bcs } from '@initia/initia.js'
export const BCS_BUFFER_SIZE = 1000 * 1024 // 1MB
interface ScoreMap {
  [address: string]: number
}
export function SplitUpdateScoreScript(deployer: string, contracAddr = '0x1', stage: string, addr2Score: ScoreMap) {

  const txs: MsgExecute[] = []
  const addr2ScoreArr = Object.entries(addr2Score)
  // split the addr2ScoreArr into chunks because of the tx gas limit (0)
  const CHUNK_LENGTH = 10000
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
  const scores: ScoreMap = {}
  for (let i = 2; i <= 10000; i++) {
    const address = `0x${i.toString(16)}`
    scores[address] = i
  }
  const mnemonic = /* your deployer mnemonic */ 

  // make wallet with mnemonic
  const wallet = new Wallet(
    new LCDClient('https://lcd.stonemove-16.initia.xyz', { gasPrices: '0umin', gasAdjustment: '1.75' }),
    new MnemonicKey({ mnemonic /* use your mnemonic*/ })
  )
  // ex. stage = 123 / addr2Score = { '0xeeff357ea5c1a4e7bc11b2b17ff2dc2dcca69750bfef1e1ebcaccf8c8018175b': 1000 }
  const msgs = SplitUpdateScoreScript(wallet.key.accAddress, '0x1', '123', scores)
  // should make multiple transactions with only one msg because of the tx gas limit
  for (let i = 0; i < msgs.length; i++) {
    // create the transactions with only one msg with 20_000_000 gas
    const signedTx = await wallet.createAndSignTx({
      msgs: [msgs[i]], gas: "20000000unit"
    })
    // broadcast the transaction
    const tx = await wallet.lcd.tx.broadcast(signedTx)
    console.log(tx.txhash)
    console.log(tx.gas_used)

  }
}

update_score()

// register_deployer()