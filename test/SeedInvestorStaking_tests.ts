import { expect } from "chai";
import { keccak256 } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";

const fastForward = async function (seconds: any) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
};

describe("Seed investor staking tests", function () {
  let cexTokenInstance: any;
  let mockTokenInstance: any;
  let stakingContractInstance: any;
  let testTokenInstance: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  const DAY = 86400;

  beforeEach(async function () {
    const cexToken = await ethers.getContractFactory("CryptoExchange");
    [owner, addr1, addr2] = await ethers.getSigners();
    cexTokenInstance = await cexToken.deploy(addr1.address);

    const testToken = await ethers.getContractFactory("TestTokenOne");
    testTokenInstance = await testToken.deploy();

    const stakingContract = await ethers.getContractFactory(
      "SeedInvestorStaking"
    );
    stakingContractInstance = await stakingContract.deploy(
      cexTokenInstance.address
    );

    await cexTokenInstance.addFeeExclusion(stakingContractInstance.address);
    await cexTokenInstance.addFeeExclusion(owner.address);
    await cexTokenInstance.addFeeExclusion(addr1.address);
    await cexTokenInstance.addFeeExclusion(addr2.address);

    const mockToken = await ethers.getContractFactory("CryptoExchange");
    mockTokenInstance = await mockToken.deploy(addr1.address);
    await mockTokenInstance.addFeeExclusion(stakingContractInstance.address);
  });

  describe("Constructor & Settings", function () {
    it("should set token on constructor", async function () {
      expect(await stakingContractInstance.Token()).to.equal(
        cexTokenInstance.address
      );
    });

    it("should set owner on constructor", async function () {
      expect(await stakingContractInstance.owner()).to.equal(owner.address);
    });
  });

  describe("Function permissions", function () {
    const rewardValue = "1000000000000000000";

    beforeEach(async () => {
      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        rewardValue
      );
      expect(
        await cexTokenInstance.balanceOf(stakingContractInstance.address)
      ).to.equal(rewardValue);
    });

    it("only owner can call notifyRewardAmount", async function () {
      await expect(
        stakingContractInstance.connect(addr1).notifyRewardAmount(rewardValue)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await stakingContractInstance.notifyRewardAmount(rewardValue);
    });

    it("only owner address can call setRewardsDuration", async function () {
      await expect(
        stakingContractInstance.connect(addr1).setRewardsDuration(70)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await stakingContractInstance.setRewardsDuration(70);
    });
  });

  describe("External Rewards Recovery", function () {
    const amount = "5000000000000000000000";

    beforeEach(async () => {
      await cexTokenInstance.transfer(stakingContractInstance.address, amount);
      expect(
        await cexTokenInstance.balanceOf(stakingContractInstance.address)
      ).to.equal(amount);

      await testTokenInstance.transfer(stakingContractInstance.address, amount);
      expect(
        await testTokenInstance.balanceOf(stakingContractInstance.address)
      ).to.equal(amount);

      await mockTokenInstance.transfer(stakingContractInstance.address, amount);
      expect(
        await mockTokenInstance.balanceOf(stakingContractInstance.address)
      ).to.equal(amount);
    });

    it("only owner can call recoverERC20", async function () {
      await expect(
        stakingContractInstance
          .connect(addr1)
          .recoverERC20(cexTokenInstance.address, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert if trying to recover more reward tokens than available", async function () {
      await expect(
        stakingContractInstance.recoverERC20(cexTokenInstance.address, amount)
      ).to.be.revertedWith("Cannot withdraw more than rewards available");
    });

    it("should retrieve token from StakingRewards and reduce contracts balance", async function () {
      await stakingContractInstance.notifyRewardAmount(amount);
      await stakingContractInstance.recoverERC20(
        testTokenInstance.address,
        amount
      );
      expect(
        await testTokenInstance.balanceOf(stakingContractInstance.address)
      ).to.equal(0);
    });

    it("should retrieve token from StakingRewards and and increase owners balance", async function () {
      await stakingContractInstance.notifyRewardAmount(amount);
      await stakingContractInstance.recoverERC20(
        testTokenInstance.address,
        amount
      );
      expect(await testTokenInstance.balanceOf(owner.address)).to.equal(
        "888000000000000000000000000"
      );
    });

    it("should emit Recovered event", async function () {
      await stakingContractInstance.notifyRewardAmount(amount);
      await expect(
        stakingContractInstance.recoverERC20(testTokenInstance.address, amount)
      )
        .to.emit(stakingContractInstance, "Recovered")
        .withArgs(testTokenInstance.address, amount);
    });

    it("should retrieve foreign token from StakingRewards and reduce contracts balance", async function () {
      await stakingContractInstance.recoverERC20(
        testTokenInstance.address,
        amount
      );
      expect(
        await testTokenInstance.balanceOf(stakingContractInstance.address)
      ).to.equal(0);
    });

    it("should retrieve foreign token from StakingRewards and and increase owners balance", async function () {
      await stakingContractInstance.recoverERC20(
        testTokenInstance.address,
        amount
      );
      expect(await testTokenInstance.balanceOf(owner.address)).to.equal(
        "888000000000000000000000000"
      );
    });

    it("foreign should emit Recovered event", async function () {
      await expect(
        stakingContractInstance.recoverERC20(testTokenInstance.address, amount)
      )
        .to.emit(stakingContractInstance, "Recovered")
        .withArgs(testTokenInstance.address, amount);
    });
  });

  describe("lastTimeRewardApplicable()", function () {
    it("should return 0", async function () {
      expect(await stakingContractInstance.lastTimeRewardApplicable()).to.equal(
        0
      );
    });

    describe("when updated", function () {
      it("should equal current timestamp", async function () {
        await cexTokenInstance.transfer(
          stakingContractInstance.address,
          "1000000000000000000"
        );
        await stakingContractInstance.notifyRewardAmount("1000000000000000000");

        const cur = (
          await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
        ).timestamp;
        const lastTimeReward =
          await stakingContractInstance.lastTimeRewardApplicable();
        expect(cur.toString()).to.equal(lastTimeReward.toString());
      });
    });
  });

  describe("rewardPerToken()", function () {
    it("should return 0", async function () {
      expect(await stakingContractInstance.rewardPerToken()).to.equal(0);
    });

    it("should be > 0", async () => {
      const totalToStake = "100000000000000000000";
      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance
        .connect(addr1)
        .stake(totalToStake, [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);

      const totalStaked = await stakingContractInstance.totalStaked();
      expect(totalStaked).to.be.gt(0);

      const rewardValue = "5000000000000000000000";
      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        rewardValue
      );
      await stakingContractInstance.notifyRewardAmount(rewardValue);

      await ethers.provider.send("evm_increaseTime", [DAY]);
      await ethers.provider.send("evm_mine", []);

      const rewardPerToken = await stakingContractInstance.rewardPerToken();
      expect(rewardPerToken).to.be.gt(0);
    });
  });

  describe("stake()", function () {
    it("staking increases staking balance", async function () {
      const totalToStake = "100000000000000000000";
      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);

      const initialStakeBal = await stakingContractInstance.balanceOf(
        addr1.address
      );
      const initialLpBal = await cexTokenInstance.balanceOf(addr1.address);

      await stakingContractInstance
        .connect(addr1)
        .stake(totalToStake, [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);

      const postStakeBal = await stakingContractInstance.balanceOf(
        addr1.address
      );
      const postLpBal = await cexTokenInstance.balanceOf(addr1.address);

      expect(postLpBal).to.be.lt(initialLpBal);
      expect(postStakeBal).to.be.gt(initialStakeBal);
    });

    it("cannot stake 0", async function () {
      await expect(
        stakingContractInstance.stake("0", [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ])
      ).to.be.revertedWith("Cannot stake 0");
    });

    it("cannot stake wihtout approval of token", async function () {
      await expect(
        stakingContractInstance.stake("100000000000000000000", [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ])
      ).to.be.revertedWith("Transfer of token has not been approved");
    });
  });

  describe("earned()", function () {
    it("should be 0 when not staking", async function () {
      expect(await stakingContractInstance.earned(addr1.address)).to.equal(0);
    });

    it("should be > 0 when staking", async function () {
      const totalToStake = "100000000000000000000";
      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance
        .connect(addr1)
        .stake(totalToStake, [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);

      const rewardValue = "5000000000000000000000";
      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        rewardValue
      );
      await stakingContractInstance.notifyRewardAmount(rewardValue);

      await fastForward(DAY);

      const earned = await stakingContractInstance.earned(addr1.address);
      expect(earned).to.be.gt(0);
    });

    it("rewardRate should increase if new rewards come before DURATION ends", async function () {
      const totalToDistribute = "5000000000000000000000";

      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      const rewardRateInitial = await stakingContractInstance.rewardRate();

      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      const rewardRateLater = await stakingContractInstance.rewardRate();

      expect(rewardRateInitial).to.be.gt(0);
      expect(rewardRateLater).to.be.gt(rewardRateInitial);
    });

    it("rewards token balance should rollover after DURATION", async function () {
      const totalToStake = "100000000000000000000";
      const totalToDistribute = "5000000000000000000000";

      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance
        .connect(addr1)
        .stake(totalToStake, [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);

      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 7);
      const earnedFirst = await stakingContractInstance.earned(addr1.address);

      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 7);
      const earnedSecond = await stakingContractInstance.earned(addr1.address);

      expect(earnedFirst.add(earnedFirst)).to.equal(earnedSecond);
    });
  });

  describe("getReward()", () => {
    it("should increase rewards token balance", async () => {
      const totalToStake = "100000000000000000000";
      const totalToDistribute = "5000000000000000000000";

      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance
        .connect(addr1)
        .stake(totalToStake, [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);

      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY);

      const initialRewardBal = await cexTokenInstance.balanceOf(addr1.address);
      const initialEarnedBal = await stakingContractInstance.earned(
        addr1.address
      );
      await stakingContractInstance.connect(addr1).getReward();
      const postRewardBal = await cexTokenInstance.balanceOf(addr1.address);
      const postEarnedBal = await stakingContractInstance.earned(addr1.address);

      expect(postEarnedBal).to.be.lt(initialEarnedBal);
      expect(postRewardBal).to.be.gt(initialRewardBal);
    });
  });

  describe("setRewardsDuration()", function () {
    const sevenDays = DAY * 7;
    const seventyDays = DAY * 70;

    it("should increase rewards duration before starting distribution", async function () {
      const defaultDuration = await stakingContractInstance.rewardsDuration();
      expect(defaultDuration).to.equal(sevenDays);

      await stakingContractInstance.setRewardsDuration(seventyDays);
      const newDuration = await stakingContractInstance.rewardsDuration();
      expect(newDuration).to.equal(seventyDays);
    });

    it("should revert when setting setRewardsDuration before the period has finished", async function () {
      const totalToStake = "100000000000000000000";
      const totalToDistribute = "5000000000000000000000";

      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance
        .connect(addr1)
        .stake(totalToStake, [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);

      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY);

      await expect(
        stakingContractInstance.setRewardsDuration(seventyDays)
      ).to.be.revertedWith(
        "Previous rewards period must be complete before changing the duration for the new period"
      );
    });

    it("should update when setting setRewardsDuration after the period has finished", async function () {
      const totalToStake = "100000000000000000000";
      const totalToDistribute = "5000000000000000000000";

      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance
        .connect(addr1)
        .stake(totalToStake, [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);

      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 8);

      await expect(stakingContractInstance.setRewardsDuration(seventyDays))
        .to.emit(stakingContractInstance, "RewardsDurationUpdated")
        .withArgs(seventyDays);

      const newDuration = await stakingContractInstance.rewardsDuration();
      expect(newDuration).to.equal(seventyDays);

      await stakingContractInstance.notifyRewardAmount(totalToDistribute);
    });

    it("should update when setting setRewardsDuration after the period has finished", async function () {
      const totalToStake = "100000000000000000000";
      const totalToDistribute = "5000000000000000000000";

      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance
        .connect(addr1)
        .stake(totalToStake, [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);

      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 4);
      await stakingContractInstance.connect(addr1).getReward();
      await fastForward(DAY * 4);

      // New Rewards period much lower
      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await expect(stakingContractInstance.setRewardsDuration(seventyDays))
        .to.emit(stakingContractInstance, "RewardsDurationUpdated")
        .withArgs(seventyDays);

      const newDuration = await stakingContractInstance.rewardsDuration();
      expect(newDuration).to.equal(seventyDays);

      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 71);
      await stakingContractInstance.connect(addr1).getReward();
    });
  });

  describe("getRewardForDuration()", function () {
    it("should increase rewards token balance", async function () {
      const totalToDistribute = "5000000000000000000000";
      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      const rewardForDuration =
        await stakingContractInstance.getRewardForDuration();

      const duration = await stakingContractInstance.rewardsDuration();
      const rewardRate = await stakingContractInstance.rewardRate();

      expect(rewardForDuration).to.be.gt(0);
      expect(rewardForDuration).to.equal(duration.mul(rewardRate));
    });
  });

  describe("withdraw()", function () {
    it("cannot withdraw if nothing staked", async function () {
      await expect(
        stakingContractInstance.withdraw("100000000000000000000")
      ).to.be.revertedWith("Cannot withdraw more than staked");
    });

    it("should increases lp token balance and decreases staking balance", async function () {
      const totalToStake = "100000000000000000000";

      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance
        .connect(addr1)
        .stake(totalToStake, [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);

      const initialStakingTokenBal = await cexTokenInstance.balanceOf(
        addr1.address
      );
      const initialStakeBal = await stakingContractInstance.balanceOf(
        addr1.address
      );

      await stakingContractInstance.connect(addr1).withdraw(totalToStake);

      const postStakingTokenBal = await cexTokenInstance.balanceOf(
        addr1.address
      );
      const postStakeBal = await stakingContractInstance.balanceOf(
        addr1.address
      );

      expect(postStakeBal.add(totalToStake)).to.equal(initialStakeBal);
      expect(initialStakingTokenBal.add(totalToStake)).to.equal(
        postStakingTokenBal
      );
    });

    it("cannot withdraw 0", async () => {
      await expect(stakingContractInstance.withdraw("0")).to.be.revertedWith(
        "Cannot withdraw 0"
      );
    });
  });

  describe("exit()", function () {
    it("should retrieve all earned and increase rewards bal", async function () {
      const totalToStake = "100000000000000000000";
      const totalToDistribute = "5000000000000000000000";

      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance
        .connect(addr1)
        .stake(totalToStake, [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]);

      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY);

      const initialRewardBal = await cexTokenInstance.balanceOf(addr1.address);
      const initialEarnedBal = await stakingContractInstance.earned(
        addr1.address
      );
      await stakingContractInstance.connect(addr1).exit();
      const postRewardBal = await cexTokenInstance.balanceOf(addr1.address);
      const postEarnedBal = await stakingContractInstance.earned(addr1.address);

      expect(postEarnedBal).to.be.lt(initialEarnedBal);
      expect(postRewardBal).to.be.gt(initialRewardBal);
      expect(postEarnedBal).to.equal(0);
    });
  });

  describe("notifyRewardAmount()", function () {
    it("Reverts if the provided reward is greater than the balance.", async () => {
      const rewardValue = "100000000000000000000";
      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        rewardValue
      );
      await expect(
        stakingContractInstance.notifyRewardAmount("110000000000000000000")
      ).to.be.revertedWith("Provided reward too high");
    });

    it("Reverts if the provided reward is greater than the balance, plus rolled-over balance.", async () => {
      const rewardValue = "100000000000000000000";
      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        rewardValue
      );
      stakingContractInstance.notifyRewardAmount(rewardValue);
      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        rewardValue
      );
      // Now take into account any leftover quantity.
      await expect(
        stakingContractInstance.notifyRewardAmount("110000000000000000000")
      ).to.be.revertedWith("Provided reward too high");
    });
  });

  describe("merkleproof whitelisting", function () {
    let merkleTree: any;
    beforeEach(async function () {
      const whitelistAddresses = [owner.address, addr1.address];

      const leafNodes = whitelistAddresses.map((addr) => keccak256(addr));
      merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
      const merkleRoot = merkleTree.getHexRoot().toString();
      await stakingContractInstance.setMerkleRoot(merkleRoot);
    });

    it("Reverts if proof does not match", async function () {
      const totalToStake = "100000000000000000000";

      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await expect(
        stakingContractInstance
          .connect(addr1)
          .stake(totalToStake, [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          ])
      ).to.be.revertedWith("Incorrect proof");
    });

    it("Reverts if proof of different address is used", async function () {
      const hashedAddress = keccak256(owner.address);
      const proof = merkleTree.getHexProof(hashedAddress);
      const totalToStake = "100000000000000000000";

      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await expect(
        stakingContractInstance.connect(addr1).stake(totalToStake, proof)
      ).to.be.revertedWith("Incorrect proof");
    });

    it("Reverts for not whitelisted if proof of whitelisted address is used", async function () {
      const hashedAddress = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(hashedAddress);
      const totalToStake = "100000000000000000000";

      await cexTokenInstance.transfer(addr2.address, totalToStake);
      await cexTokenInstance
        .connect(addr2)
        .approve(stakingContractInstance.address, totalToStake);
      await expect(
        stakingContractInstance.connect(addr2).stake(totalToStake, proof)
      ).to.be.revertedWith("Incorrect proof");
    });

    it("proof matches", async function () {
      const hashedAddress = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(hashedAddress);

      const totalToStake = "100000000000000000000";
      await cexTokenInstance.transfer(addr1.address, totalToStake);
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake, proof);
    });
  });

  describe("Integration Tests", function () {
    it("stake and claim", async function () {
      // set merkle tree for whitelist
      const whitelistAddresses = [addr1.address];

      const leafNodes = whitelistAddresses.map((addr) => keccak256(addr));
      const merkleTree = new MerkleTree(leafNodes, keccak256, {
        sortPairs: true,
      });
      const merkleRoot = merkleTree.getHexRoot().toString();
      await stakingContractInstance.setMerkleRoot(merkleRoot);
      const hashedAddress = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(hashedAddress);

      // Transfer some LP Tokens to user
      const totalToStake = "500000000000000000000";
      await cexTokenInstance.transfer(addr1.address, totalToStake);

      // Stake LP Tokens
      await cexTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake, proof);

      // Distribute some rewards
      const totalToDistribute = "35000000000000000000000";
      // Transfer Rewards to the RewardsDistribution contract address
      await cexTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      // notify reward
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      // Period finish should be ~7 days from now
      const periodFinish = await stakingContractInstance.periodFinish();
      const curTimestamp = (
        await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
      ).timestamp;
      expect(periodFinish).to.equal(curTimestamp + DAY * 7);

      // Reward duration is 7 days, so we'll
      // Fastforward time by 6 days to prevent expiration
      await fastForward(DAY * 6);

      // Reward rate and reward per token
      const rewardRate = await stakingContractInstance.rewardRate();
      expect(rewardRate).to.be.gt(0);

      const rewardPerToken = await stakingContractInstance.rewardPerToken();
      expect(rewardPerToken).to.be.gt(0);

      // Make sure we earned in proportion to reward per token
      const rewardRewardsEarned = await stakingContractInstance.earned(
        addr1.address
      );
      expect(rewardRewardsEarned).to.equal(
        rewardPerToken.mul(totalToStake).div("1000000000000000000")
      );

      // Make sure after withdrawing, we still have the ~amount of rewardRewards
      // The two values will be a bit different as time has "passed"
      const initialWithdraw = "100000000000000000000";
      const withdrawWithRewards = "30100057870370370178000";
      await stakingContractInstance.connect(addr1).withdraw(initialWithdraw);
      expect(withdrawWithRewards).to.equal(
        await cexTokenInstance.balanceOf(addr1.address)
      );

      const rewardRewardsEarnedPostWithdraw =
        await stakingContractInstance.earned(addr1.address);
      expect(rewardRewardsEarnedPostWithdraw.sub(rewardRewardsEarned)).to.be.lt(
        "100000000000000000"
      );

      // Get rewards
      const initialRewardBal = await cexTokenInstance.balanceOf(addr1.address);
      await stakingContractInstance.connect(addr1).getReward();
      const postRewardRewardBal = await cexTokenInstance.balanceOf(
        addr1.address
      );
      expect(postRewardRewardBal).to.be.gt(initialRewardBal);

      // Exit
      const preExitLPBal = await cexTokenInstance.balanceOf(addr1.address);
      await stakingContractInstance.connect(addr1).exit();
      const postExitLPBal = await cexTokenInstance.balanceOf(addr1.address);
      expect(postExitLPBal).to.be.gt(preExitLPBal);
    });
  });
});
