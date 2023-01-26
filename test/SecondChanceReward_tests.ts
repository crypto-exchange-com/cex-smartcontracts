import { expect } from "chai";
import { utils } from "ethers/lib";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import web3 from "web3";

describe("Seed investor staking tests", function () {
  let secondChanceRewardDistributorInstance: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let tokenInstance: any;

  const DAY = 86400;

  const GetTimeStamp = async function () {
    const blocknum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blocknum);
    return block.timestamp;
  };

  const fastForward = async function (seconds: any) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  };

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const token = await ethers.getContractFactory("CryptoExchange");
    tokenInstance = await token.deploy(owner.address);

    const secondChanceRewardDistributor = await ethers.getContractFactory(
      "SecondChanceRewardDistributor"
    );
    secondChanceRewardDistributorInstance =
      await secondChanceRewardDistributor.deploy(tokenInstance.address);
    await tokenInstance.addFeeExclusion(
      secondChanceRewardDistributorInstance.address
    );
  });

  describe("Withdraw", function () {
    it("Should fail: not enough funds", async function () {
      await expect(
        secondChanceRewardDistributorInstance
          .connect(addr1)
          .withdraw(web3.utils.toWei("444000", "ether"), [
            "0x209b473e68f9cfef48a375b419b3331975ee7f04143b4d73e50849e7dbc02b09",
          ])
      ).to.be.revertedWith("Not enough funds left");
    });

    it("Should fail: no merke root set", async function () {
      await tokenInstance.transfer(
        secondChanceRewardDistributorInstance.address,
        "888000000000000000000000"
      );
      await expect(
        secondChanceRewardDistributorInstance
          .connect(addr1)
          .withdraw(1000, [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          ])
      ).to.be.revertedWith("merkle root not set");
    });

    it("Should fail: incorrect proof", async function () {
      await tokenInstance.transfer(
        secondChanceRewardDistributorInstance.address,
        "888000000000000000000000"
      );
      await secondChanceRewardDistributorInstance.setMerkleRoot(
        "0x386f109f74a187861fa7405d06f4bac61d3fdea0d71aa222cc185cd8573a4db4"
      );
      await expect(
        secondChanceRewardDistributorInstance
          .connect(addr1)
          .withdraw(1000, [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          ])
      ).to.be.revertedWith("Incorrect proof");
    });

    it("Should fail: Release not started", async function () {
      await tokenInstance.transfer(
        secondChanceRewardDistributorInstance.address,
        "888000000000000000000000"
      );
      await secondChanceRewardDistributorInstance.setMerkleRoot(
        "0x386f109f74a187861fa7405d06f4bac61d3fdea0d71aa222cc185cd8573a4db4"
      );
      await expect(
        secondChanceRewardDistributorInstance
          .connect(addr2)
          .withdraw(web3.utils.toWei("444000", "ether"), [
            "0x209b473e68f9cfef48a375b419b3331975ee7f04143b4d73e50849e7dbc02b09",
          ])
      ).to.be.revertedWith("Release has not started yet!");
    });

    it("Should succeed: no phase passed", async function () {
      await tokenInstance.transfer(
        secondChanceRewardDistributorInstance.address,
        "888000000000000000000000"
      );
      await secondChanceRewardDistributorInstance.setMerkleRoot(
        "0x386f109f74a187861fa7405d06f4bac61d3fdea0d71aa222cc185cd8573a4db4"
      );

      const releaseDate = await GetTimeStamp();
      await secondChanceRewardDistributorInstance.setReleaseDate(releaseDate);

      await secondChanceRewardDistributorInstance
        .connect(addr2)
        .withdraw(web3.utils.toWei("444000", "ether"), [
          "0x209b473e68f9cfef48a375b419b3331975ee7f04143b4d73e50849e7dbc02b09",
        ]);
      const contractBalanceAfter = await tokenInstance.balanceOf(
        secondChanceRewardDistributorInstance.address
      );
      const userBalanceAfter = await tokenInstance.balanceOf(addr2.address);

      expect(contractBalanceAfter).to.equal("888000000000000000000000");
      expect(userBalanceAfter).to.equal("0");
    });
    // todo implement test for phase 1
    it("Should succeed: first phase passed", async function () {
      await tokenInstance.transfer(
        secondChanceRewardDistributorInstance.address,
        "888000000000000000000000"
      );
      await secondChanceRewardDistributorInstance.setMerkleRoot(
        "0x386f109f74a187861fa7405d06f4bac61d3fdea0d71aa222cc185cd8573a4db4"
      );

      const releaseDate = await GetTimeStamp();
      await secondChanceRewardDistributorInstance.setReleaseDate(releaseDate);
      await fastForward(40 * DAY);

      await secondChanceRewardDistributorInstance
        .connect(addr2)
        .withdraw(web3.utils.toWei("444000", "ether"), [
          "0x209b473e68f9cfef48a375b419b3331975ee7f04143b4d73e50849e7dbc02b09",
        ]);
      const contractBalanceAfter = await tokenInstance.balanceOf(
        secondChanceRewardDistributorInstance.address
      );
      const userBalanceAfter = await tokenInstance.balanceOf(addr2.address);

      expect(contractBalanceAfter).to.equal("843600000000000000000000");
      expect(userBalanceAfter).to.equal("44400000000000000000000");
    });

    it("Should succeed: second phase passed", async function () {
      await tokenInstance.transfer(
        secondChanceRewardDistributorInstance.address,
        "888000000000000000000000"
      );
      await secondChanceRewardDistributorInstance.setMerkleRoot(
        "0x386f109f74a187861fa7405d06f4bac61d3fdea0d71aa222cc185cd8573a4db4"
      );

      const releaseDate = await GetTimeStamp();
      await secondChanceRewardDistributorInstance.setReleaseDate(releaseDate);
      await fastForward(61 * DAY);

      await secondChanceRewardDistributorInstance
        .connect(addr2)
        .withdraw(web3.utils.toWei("444000", "ether"), [
          "0x209b473e68f9cfef48a375b419b3331975ee7f04143b4d73e50849e7dbc02b09",
        ]);
      const contractBalanceAfter = await tokenInstance.balanceOf(
        secondChanceRewardDistributorInstance.address
      );
      const userBalanceAfter = await tokenInstance.balanceOf(addr2.address);

      expect(contractBalanceAfter).to.equal("799200000000000000000000");
      expect(userBalanceAfter).to.equal("88800000000000000000000");
    });

    it("Should succeed: fifth phase passed", async function () {
      await tokenInstance.transfer(
        secondChanceRewardDistributorInstance.address,
        "888000000000000000000000"
      );
      await secondChanceRewardDistributorInstance.setMerkleRoot(
        "0x386f109f74a187861fa7405d06f4bac61d3fdea0d71aa222cc185cd8573a4db4"
      );

      const releaseDate = await GetTimeStamp();
      await secondChanceRewardDistributorInstance.setReleaseDate(releaseDate);
      await fastForward(151 * DAY);

      await secondChanceRewardDistributorInstance
        .connect(addr2)
        .withdraw(web3.utils.toWei("444000", "ether"), [
          "0x209b473e68f9cfef48a375b419b3331975ee7f04143b4d73e50849e7dbc02b09",
        ]);
      const contractBalanceAfter = await tokenInstance.balanceOf(
        secondChanceRewardDistributorInstance.address
      );
      const userBalanceAfter = await tokenInstance.balanceOf(addr2.address);

      expect(contractBalanceAfter).to.equal("732600000000000000000000");
      expect(userBalanceAfter).to.equal("155400000000000000000000");
    });

    it("Should succeed: withraw after each phase", async function () {
      await tokenInstance.transfer(
        secondChanceRewardDistributorInstance.address,
        "888000000000000000000000"
      );
      await secondChanceRewardDistributorInstance.setMerkleRoot(
        "0x386f109f74a187861fa7405d06f4bac61d3fdea0d71aa222cc185cd8573a4db4"
      );

      const releaseDate = await GetTimeStamp();
      await secondChanceRewardDistributorInstance.setReleaseDate(releaseDate);

      const contractBalanceBefore = await tokenInstance.balanceOf(
        secondChanceRewardDistributorInstance.address
      );
      const userBalanceBefore = await tokenInstance.balanceOf(addr2.address);

      expect(contractBalanceBefore).to.equal("888000000000000000000000");
      expect(userBalanceBefore).to.equal("0");

      for (let i = 0; i < 18; i++) {
        await fastForward(30 * DAY);
        await secondChanceRewardDistributorInstance
          .connect(addr2)
          .withdraw(web3.utils.toWei("444000", "ether"), [
            "0x209b473e68f9cfef48a375b419b3331975ee7f04143b4d73e50849e7dbc02b09",
          ]);
      }
      const contractBalanceAfter = await tokenInstance.balanceOf(
        secondChanceRewardDistributorInstance.address
      );
      const userBalanceAfter = await tokenInstance.balanceOf(addr2.address);
      expect(contractBalanceAfter).to.equal("444000000000000000000000");
      expect(userBalanceAfter).to.equal("444000000000000000000000");
    });

    it("Should succeed: all phases passed", async function () {
      await tokenInstance.transfer(
        secondChanceRewardDistributorInstance.address,
        "888000000000000000000000"
      );

      await secondChanceRewardDistributorInstance.setMerkleRoot(
        "0x386f109f74a187861fa7405d06f4bac61d3fdea0d71aa222cc185cd8573a4db4"
      );

      const contractBalanceBefore = await tokenInstance.balanceOf(
        secondChanceRewardDistributorInstance.address
      );
      const userBalanceBefore = await tokenInstance.balanceOf(addr2.address);

      const releaseDate = await GetTimeStamp();
      await secondChanceRewardDistributorInstance.setReleaseDate(releaseDate);
      await fastForward(1000 * DAY); // 1000 days is way more than the 18 phases, check to see if not more is requested

      await secondChanceRewardDistributorInstance
        .connect(addr2)
        .withdraw(web3.utils.toWei("444000", "ether"), [
          "0x209b473e68f9cfef48a375b419b3331975ee7f04143b4d73e50849e7dbc02b09",
        ]);
      const contractBalanceAfter = await tokenInstance.balanceOf(
        secondChanceRewardDistributorInstance.address
      );
      const userBalanceAfter = await tokenInstance.balanceOf(addr2.address);

      expect(contractBalanceAfter).to.equal("444000000000000000000000");
      expect(userBalanceAfter).to.equal("444000000000000000000000");

      expect(contractBalanceAfter).to.below(contractBalanceBefore);
      expect(userBalanceAfter).to.above(userBalanceBefore);
    });

    it("Should fail: already withdrew reward", async function () {
      await tokenInstance.transfer(
        secondChanceRewardDistributorInstance.address,
        "888000000000000000000000"
      );

      const releaseDate = await GetTimeStamp();
      await secondChanceRewardDistributorInstance.setReleaseDate(releaseDate);
      await fastForward(540 * DAY);
      await secondChanceRewardDistributorInstance.setMerkleRoot(
        "0x386f109f74a187861fa7405d06f4bac61d3fdea0d71aa222cc185cd8573a4db4"
      );
      await secondChanceRewardDistributorInstance
        .connect(addr2)
        .withdraw(web3.utils.toWei("444000", "ether"), [
          "0x209b473e68f9cfef48a375b419b3331975ee7f04143b4d73e50849e7dbc02b09",
        ]);

      await expect(
        secondChanceRewardDistributorInstance
          .connect(addr2)
          .withdraw(web3.utils.toWei("444000", "ether"), [
            "0x209b473e68f9cfef48a375b419b3331975ee7f04143b4d73e50849e7dbc02b09",
          ])
      ).to.be.revertedWith("Total amount already claimed");
    });
  });
});
