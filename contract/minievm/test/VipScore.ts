import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("VipScore", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const VipScore = await hre.ethers.getContractFactory("VipScore");
    const vipScore = await VipScore.deploy();

    return { vipScore, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Owner must be include in allow list", async function () {
      const { vipScore, owner } = await loadFixture(deployOneYearLockFixture);
      expect(await vipScore.allowList(owner)).to.equal(true);
    });
  });

  describe("EndToEnd", function () {
    it("InnerEndToEnd", async function () {
      const { vipScore, owner, otherAccount } = await loadFixture(
        deployOneYearLockFixture
      );

      // prepare stage
      await expect(vipScore.prepareStage(0)).to.be.revertedWithCustomError(
        vipScore,
        "ZeroStage"
      );

      await expect(
        vipScore.connect(otherAccount).prepareStage(1)
      ).to.be.revertedWithCustomError(vipScore, "PermissionDenied");

      await vipScore.prepareStage(1);
      expect(await vipScore.stages(1)).to.eql([1n, 0n, false]);

      // increase score
      await expect(
        vipScore.connect(otherAccount).increaseScore(1, otherAccount, 100)
      ).to.be.revertedWithCustomError(vipScore, "PermissionDenied");

      await expect(
        vipScore.increaseScore(2, otherAccount, 100)
      ).to.be.revertedWithCustomError(vipScore, "StageNotFound(uint64)");

      await vipScore.increaseScore(1, otherAccount, 100);
      expect(await vipScore.stages(1)).to.eql([1n, 100n, false]);
      expect((await vipScore.scores(1, otherAccount)).amount).to.equals(100n);

      // decrease score
      await expect(
        vipScore.connect(otherAccount).decreaseScore(1, otherAccount, 50)
      ).to.be.revertedWithCustomError(vipScore, "PermissionDenied");

      await expect(
        vipScore.decreaseScore(2, otherAccount, 50)
      ).to.be.revertedWithCustomError(vipScore, "StageNotFound(uint64)");

      await vipScore.decreaseScore(1, otherAccount, 50);
      expect(await vipScore.stages(1)).to.eql([1n, 50n, false]);
      expect((await vipScore.scores(1, otherAccount)).amount).to.equals(50n);

      // update score
      await expect(
        vipScore.connect(otherAccount).updateScore(1, otherAccount, 200)
      ).to.be.revertedWithCustomError(vipScore, "PermissionDenied");

      await expect(
        vipScore.updateScore(2, otherAccount, 200)
      ).to.be.revertedWithCustomError(vipScore, "StageNotFound(uint64)");

      await vipScore.updateScore(1, otherAccount, 200);
      expect(await vipScore.stages(1)).to.eql([1n, 200n, false]);
      expect((await vipScore.scores(1, otherAccount)).amount).to.equals(200n);

      // update scores
      await expect(
        vipScore
          .connect(otherAccount)
          .updateScores(1, [otherAccount, owner], [100, 500])
      ).to.be.revertedWithCustomError(vipScore, "PermissionDenied");

      await expect(
        vipScore.updateScores(2, [otherAccount, owner], [100, 500])
      ).to.be.revertedWithCustomError(vipScore, "StageNotFound(uint64)");

      await expect(
        vipScore.updateScores(1, [otherAccount, owner], [100])
      ).to.be.revertedWithCustomError(
        vipScore,
        "AddrsAndAmountsLengthMistmatch"
      );

      await vipScore.updateScores(1, [otherAccount, owner], [100, 500]);
      expect(await vipScore.stages(1)).to.eql([1n, 600n, false]);
      expect((await vipScore.scores(1, otherAccount)).amount).to.equals(100n);
      expect((await vipScore.scores(1, owner)).amount).to.equals(500n);

      // finalize stage
      await expect(
        vipScore.connect(otherAccount).finalizeStage(1)
      ).to.be.revertedWithCustomError(vipScore, "PermissionDenied");

      await vipScore.finalizeStage(1);
      expect(await vipScore.stages(1)).to.eql([1n, 600n, true]);

      // test getScores
      expect(await vipScore.getScores(1, 0, 5)).to.eql([
        [otherAccount.address, 100n, 1n],
        [owner.address, 500n, 2n],
        ["0x0000000000000000000000000000000000000000", 0n, 0n],
        ["0x0000000000000000000000000000000000000000", 0n, 0n],
        ["0x0000000000000000000000000000000000000000", 0n, 0n],
      ]);

      // try to update finalized stage
      expect(
        vipScore.increaseScore(1, otherAccount, 100)
      ).to.be.revertedWithCustomError(vipScore, "StageFinalized(uint64)");
      expect(
        vipScore.decreaseScore(1, otherAccount, 100)
      ).to.be.revertedWithCustomError(vipScore, "StageFinalized(uint64)");
      expect(
        vipScore.updateScore(1, otherAccount, 100)
      ).to.be.revertedWithCustomError(vipScore, "StageFinalized(uint64)");
      expect(
        vipScore.updateScores(1, [otherAccount], [100])
      ).to.be.revertedWithCustomError(vipScore, "StageFinalized(uint64)");

      // add/remove allow list
      await vipScore.addAllowList(otherAccount);
      expect(await vipScore.allowList(otherAccount)).to.equal(true);

      await vipScore.removeAllowList(otherAccount);
      expect(await vipScore.allowList(otherAccount)).to.equal(false);
    });
  });
});
