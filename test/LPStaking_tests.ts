import { expect } from "chai";
import { ethers } from "hardhat";

const fastForward = async function (seconds: any) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
};

describe("Seed investor staking tests", function () {
  let stakingTokenInstance: any;
  let rewardTokenInstance: any;
  let stakingContractInstance: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addr3: any;

  const DAY = 86400;

  beforeEach(async function () {
    const stakingToken = await ethers.getContractFactory("CryptoExchange");
    const rewardToken = await ethers.getContractFactory("CryptoExchange");
    [owner, addr1, addr2] = await ethers.getSigners();
    stakingTokenInstance = await stakingToken.deploy(addr1.address);
    rewardTokenInstance = await rewardToken.deploy(addr1.address);

    const stakingContract = await ethers.getContractFactory("LPStaking");
    stakingContractInstance = await stakingContract.deploy(
      rewardTokenInstance.address,
      stakingTokenInstance.address
    );

    await stakingTokenInstance.addFeeExclusion(stakingContractInstance.address);
    await stakingTokenInstance.addFeeExclusion(owner.address);
    await stakingTokenInstance.addFeeExclusion(addr1.address);
    await stakingTokenInstance.addFeeExclusion(addr2.address);
    await rewardTokenInstance.addFeeExclusion(stakingContractInstance.address);
    await rewardTokenInstance.addFeeExclusion(owner.address);
    await rewardTokenInstance.addFeeExclusion(addr1.address);
    await rewardTokenInstance.addFeeExclusion(addr2.address);
  });

  describe("Constructor & Settings", function () {
    it("should set staking token on constructor", async function () {
      expect(await stakingContractInstance.stakingToken()).to.equal(
        stakingTokenInstance.address
      );
    });

    it("should set rewards token on constructor", async function () {
      expect(await stakingContractInstance.rewardsToken()).to.equal(
        rewardTokenInstance.address
      );
    });

    it("should set owner on constructor", async function () {
      expect(await stakingContractInstance.owner()).to.equal(owner.address);
    });
  });

  describe("Function permissions", () => {
    const rewardValue = "1000000000000000000";

    beforeEach(async () => {
      await rewardTokenInstance.transfer(
        stakingContractInstance.address,
        rewardValue
      );
      expect(
        await rewardTokenInstance.balanceOf(stakingContractInstance.address)
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

  describe("External Rewards Recovery", () => {
    const amount = "5000000000000000000000";
    beforeEach(async () => {
      // Send ERC20 to StakingRewards Contract
      await rewardTokenInstance.transfer(
        stakingContractInstance.address,
        amount
      );
      expect(
        await rewardTokenInstance.balanceOf(stakingContractInstance.address)
      ).to.equal(amount);
    });

    it("only owner can call recoverERC20", async () => {
      await expect(
        stakingContractInstance
          .connect(addr1)
          .recoverERC20(rewardTokenInstance.address, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert if recovering staking token", async () => {
      await expect(
        stakingContractInstance.recoverERC20(
          stakingTokenInstance.address,
          amount
        )
      ).to.be.revertedWith("Cannot withdraw the staking token");
    });

    it("should retrieve external token from StakingRewards and reduce contracts balance", async () => {
      await stakingContractInstance.recoverERC20(
        rewardTokenInstance.address,
        amount
      );
      expect(
        await rewardTokenInstance.balanceOf(stakingContractInstance.address)
      ).to.equal(0);
    });

    it("should retrieve external token from StakingRewards and increase owners balance", async () => {
      const ownerMOARBalanceBefore = await rewardTokenInstance.balanceOf(
        owner.address
      );

      await stakingContractInstance.recoverERC20(
        rewardTokenInstance.address,
        amount
      );

      const ownerMOARBalanceAfter = await rewardTokenInstance.balanceOf(
        owner.address
      );
      expect(ownerMOARBalanceAfter.sub(ownerMOARBalanceBefore)).to.equal(
        amount
      );
    });

    it("should emit Recovered event", async () => {
      await expect(
        stakingContractInstance.recoverERC20(
          rewardTokenInstance.address,
          amount
        )
      )
        .to.emit(stakingContractInstance, "Recovered")
        .withArgs(rewardTokenInstance.address, amount);
    });
  });

  describe("lastTimeRewardApplicable()", () => {
    it("should return 0", async function () {
      expect(await stakingContractInstance.lastTimeRewardApplicable()).to.equal(
        0
      );
    });

    describe("when updated", () => {
      it("should equal current timestamp", async () => {
        await rewardTokenInstance.transfer(
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

  describe("rewardPerToken()", () => {
    it("should return 0", async function () {
      expect(await stakingContractInstance.rewardPerToken()).to.equal(0);
    });

    it("should be > 0", async () => {
      const totalToStake = "100000000000000000000";
      await stakingTokenInstance.transfer(addr1.address, totalToStake);
      await stakingTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake);

      const totalSupply = await stakingContractInstance.totalSupply();
      expect(totalSupply).to.be.gt(0);

      const rewardValue = "5000000000000000000000";
      await rewardTokenInstance.transfer(
        stakingContractInstance.address,
        rewardValue
      );
      await stakingContractInstance.notifyRewardAmount(rewardValue);

      await fastForward(DAY);

      const rewardPerToken = await stakingContractInstance.rewardPerToken();
      expect(rewardPerToken).to.be.gt(0);
    });
  });

  describe("stake()", () => {
    it("staking increases staking balance", async () => {
      const totalToStake = "100000000000000000000";
      await stakingTokenInstance.transfer(addr1.address, totalToStake);
      await stakingTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);

      const initialStakeBal = await stakingContractInstance.balanceOf(
        addr1.address
      );
      const initialLpBal = await stakingTokenInstance.balanceOf(addr1.address);

      await stakingContractInstance.connect(addr1).stake(totalToStake);

      const postStakeBal = await stakingContractInstance.balanceOf(
        addr1.address
      );
      const postLpBal = await stakingTokenInstance.balanceOf(addr1.address);

      expect(postLpBal).to.be.lt(initialLpBal);
      expect(postStakeBal).to.be.gt(initialStakeBal);
    });

    it("cannot stake 0", async () => {
      await expect(stakingContractInstance.stake("0")).to.be.revertedWith(
        "Cannot stake 0"
      );
    });

    it("cannot stake wihtout approval of token", async function () {
      await expect(
        stakingContractInstance.stake("100000000000000000000")
      ).to.be.revertedWith("Transfer of token has not been approved");
    });
  });

  describe("earned()", () => {
    it("should be 0 when not staking", async function () {
      expect(await stakingContractInstance.earned(addr1.address)).to.equal(0);
    });

    it("should be > 0 when staking", async function () {
      const totalToStake = "100000000000000000000";
      await stakingTokenInstance.transfer(addr1.address, totalToStake);
      await stakingTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake);

      const rewardValue = "5000000000000000000000";
      await rewardTokenInstance.transfer(
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

      await rewardTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      const rewardRateInitial = await stakingContractInstance.rewardRate();

      await rewardTokenInstance.transfer(
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

      await stakingTokenInstance.transfer(addr1.address, totalToStake);
      await stakingTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake);

      await rewardTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 7);
      const earnedFirst = await stakingContractInstance.earned(addr1.address);

      await rewardTokenInstance.transfer(
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

      await stakingTokenInstance.transfer(addr1.address, totalToStake);
      await stakingTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake);

      await rewardTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY);

      const initialRewardBal = await rewardTokenInstance.balanceOf(
        addr1.address
      );
      const initialEarnedBal = await stakingContractInstance.earned(
        addr1.address
      );
      await stakingContractInstance.connect(addr1).getReward();
      const postRewardBal = await rewardTokenInstance.balanceOf(addr1.address);
      const postEarnedBal = await stakingContractInstance.earned(addr1.address);

      expect(postEarnedBal).to.be.lt(initialEarnedBal);
      expect(postRewardBal).to.be.gt(initialRewardBal);
    });
  });

  describe("setRewardsDuration()", () => {
    const sevenDays = DAY * 7;
    const seventyDays = DAY * 70;

    it("should increase rewards duration before starting distribution", async () => {
      const defaultDuration = await stakingContractInstance.rewardsDuration();
      expect(defaultDuration).to.equal(sevenDays);

      await stakingContractInstance.setRewardsDuration(seventyDays);
      const newDuration = await stakingContractInstance.rewardsDuration();
      expect(newDuration).to.equal(seventyDays);
    });

    it("should revert when setting setRewardsDuration before the period has finished", async function () {
      const totalToStake = "100000000000000000000";
      const totalToDistribute = "5000000000000000000000";

      await stakingTokenInstance.transfer(addr1.address, totalToStake);
      await stakingTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake);

      await rewardTokenInstance.transfer(
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

      await stakingTokenInstance.transfer(addr1.address, totalToStake);
      await stakingTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake);

      await rewardTokenInstance.transfer(
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

      await stakingTokenInstance.transfer(addr1.address, totalToStake);
      await stakingTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake);

      await rewardTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 4);
      await stakingContractInstance.connect(addr1).getReward();
      await fastForward(DAY * 4);

      // New Rewards period much lower
      await rewardTokenInstance.transfer(
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

  describe("getRewardForDuration()", () => {
    it("should increase rewards token balance", async function () {
      const totalToDistribute = "5000000000000000000000";
      await rewardTokenInstance.transfer(
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

  describe("withdraw()", () => {
    it("cannot withdraw if nothing staked", async () => {
      await expect(
        stakingContractInstance.withdraw("100000000000000000000")
      ).to.be.revertedWith("Cannot withdraw more than staked");
    });

    it("should increases lp token balance and decreases staking balance", async () => {
      const totalToStake = "100000000000000000000";
      await stakingTokenInstance.transfer(addr1.address, totalToStake);
      await stakingTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake);

      const initialStakingTokenBal = await stakingTokenInstance.balanceOf(
        addr1.address
      );
      const initialStakeBal = await stakingContractInstance.balanceOf(
        addr1.address
      );

      await stakingContractInstance.connect(addr1).withdraw(totalToStake);

      const postStakingTokenBal = await stakingTokenInstance.balanceOf(
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

  describe("exit()", () => {
    it("should retrieve all earned and increase rewards bal", async () => {
      const totalToStake = "100000000000000000000";
      const totalToDistribute = "5000000000000000000000";

      await stakingTokenInstance.transfer(addr1.address, totalToStake);
      await stakingTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake);

      await rewardTokenInstance.transfer(
        stakingContractInstance.address,
        totalToDistribute
      );
      await stakingContractInstance.notifyRewardAmount(totalToDistribute);

      await fastForward(DAY);

      const initialRewardBal = await rewardTokenInstance.balanceOf(
        addr1.address
      );
      const initialEarnedBal = await stakingContractInstance.earned(
        addr1.address
      );
      await stakingContractInstance.connect(addr1).exit();
      const postRewardBal = await rewardTokenInstance.balanceOf(addr1.address);
      const postEarnedBal = await stakingContractInstance.earned(addr1.address);

      expect(postEarnedBal).to.be.lt(initialEarnedBal);
      expect(postRewardBal).to.be.gt(initialRewardBal);
      expect(postEarnedBal).to.equal(0);
    });
  });

  describe("notifyRewardAmount()", () => {
    it("Reverts if the provided reward is greater than the balance.", async () => {
      const rewardValue = "100000000000000000000";
      await rewardTokenInstance.transfer(
        stakingContractInstance.address,
        rewardValue
      );
      await expect(
        stakingContractInstance.notifyRewardAmount("110000000000000000000")
      ).to.be.revertedWith("Provided reward too high");
    });

    it("Reverts if the provided reward is greater than the balance, plus rolled-over balance.", async () => {
      const rewardValue = "100000000000000000000";
      await rewardTokenInstance.transfer(
        stakingContractInstance.address,
        rewardValue
      );
      stakingContractInstance.notifyRewardAmount(rewardValue);
      await rewardTokenInstance.transfer(
        stakingContractInstance.address,
        rewardValue
      );
      // Now take into account any leftover quantity.
      await expect(
        stakingContractInstance.notifyRewardAmount("110000000000000000000")
      ).to.be.revertedWith("Provided reward too high");
    });
  });

  describe("Integration Tests", () => {
    it("stake and claim", async () => {
      // Transfer some LP Tokens to user
      const totalToStake = "500000000000000000000";
      await stakingTokenInstance.transfer(addr1.address, totalToStake);

      // Stake LP Tokens
      await stakingTokenInstance
        .connect(addr1)
        .approve(stakingContractInstance.address, totalToStake);
      await stakingContractInstance.connect(addr1).stake(totalToStake);

      // Distribute some rewards
      const totalToDistribute = "35000000000000000000000";
      // Transfer Rewards to the RewardsDistribution contract address
      await rewardTokenInstance.transfer(
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
      await stakingContractInstance.connect(addr1).withdraw(initialWithdraw);
      expect(initialWithdraw).to.equal(
        await stakingTokenInstance.balanceOf(addr1.address)
      );

      const rewardRewardsEarnedPostWithdraw =
        await stakingContractInstance.earned(addr1.address);
      expect(rewardRewardsEarnedPostWithdraw.sub(rewardRewardsEarned)).to.be.lt(
        "100000000000000000"
      );

      // Get rewards
      const initialRewardBal = await rewardTokenInstance.balanceOf(
        addr1.address
      );
      await stakingContractInstance.connect(addr1).getReward();
      const postRewardRewardBal = await rewardTokenInstance.balanceOf(
        addr1.address
      );

      expect(postRewardRewardBal).to.be.gt(initialRewardBal);

      // Exit
      const preExitLPBal = await stakingTokenInstance.balanceOf(addr1.address);
      await stakingContractInstance.connect(addr1).exit();
      const postExitLPBal = await stakingTokenInstance.balanceOf(addr1.address);
      expect(postExitLPBal).to.be.gt(preExitLPBal);
    });
  });
});
