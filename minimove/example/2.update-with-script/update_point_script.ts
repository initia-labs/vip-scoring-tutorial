import { MnemonicKey, MsgExecute, Wallet, bcs } from "@initia/initia.js";
import { config } from "config";

/// use the update_score function to update the score of the users
async function update_score() {
  // make wallet with mnemonic
  const wallet = new Wallet(
    config.l1lcd,
    new MnemonicKey({ mnemonic: config.DEPLOYER /* use your mnemonic*/ })
  );
  // ex. stage = 123 addr2Score = { '0xeeff357ea5c1a4e7bc11b2b17ff2dc2dcca69750bfef1e1ebcaccf8c8018175b': 1000 }
  const msgs = await MsgUpdateScoreScript(wallet.key.accAddress, "0x1", "123", {
    "0xeeff357ea5c1a4e7bc11b2b17ff2dc2dcca69750bfef1e1ebcaccf8c8018175b": 1000,
  });
  // should make multiple transactions with only one msg because of the tx gas limit
  const TIMEOUT = 10_000;
  for (let i = 0; i < msgs.length; i++) {
    // create the transactions with only one msg
    const signedTx = await wallet.createAndSignTx({
      msgs: [msgs[i]],
      sequence: i,
    });
    // broadcast the transaction
    await wallet.lcd.tx.broadcast(signedTx, TIMEOUT);
  }
}

export const BCS_BUFFER_SIZE = 1000 * 1024 // 1MB
interface ScoreMap {
  [address: string]: number;
}

const MOVE_ADDRESS_BYTES = 66 * 2; // ex. "0xeeff357ea5c1a4e7bc11b2b17ff2dc2dcca69750bfef1e1ebcaccf8c8018175b"
export async function MsgUpdateScoreScript(
  deployer: string,
  contracAddr = "0x1",
  stage: string,
  addr2Score: ScoreMap
) {
  const msgs: MsgExecute[] = [];
  const addr2ScoreArr = Object.entries(addr2Score);
  // split the array into chunks of BCS_BUFFER_SIZE(1MB)
  const CHUNK_LENGTH = Math.floor(BCS_BUFFER_SIZE / MOVE_ADDRESS_BYTES);
  for (let i = 0; i < addr2ScoreArr.length; i += CHUNK_LENGTH) {
    const addrs: string[] = [];
    const scores: number[] = [];
    const addr2ScoreArr_s = addr2ScoreArr.slice(i, i + CHUNK_LENGTH);
    addr2ScoreArr_s.forEach(([addr, s]) => {
      addrs.push(addr);
      scores.push(s);
    });

    msgs.push(
      new MsgExecute(
        deployer,
        contracAddr,
        "vip_score",
        "update_score_script",
        [],
        [
          bcs.u64().serialize(stage).toBase64(),
          bcs
            .vector(bcs.address())
            .serialize(addrs, { size: BCS_BUFFER_SIZE })
            .toBase64(),
          bcs
            .vector(bcs.u64())
            .serialize(scores, { size: BCS_BUFFER_SIZE })
            .toBase64(),
        ]
      )
    );
  }

  return msgs;
}
