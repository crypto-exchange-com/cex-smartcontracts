import { expect } from "chai";
import { ethers } from "hardhat";

describe("Second chance staking contract tests", function () {
  let tokenInstance: any;
  let extraTokenInstance: any;
  let tokenFeeInstance: any;
  let StakingInstance: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  const DAY = 86400;
  let SetupTimeStamp: any;

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
    const token = await ethers.getContractFactory("CryptoExchange");
    const extraToken = await ethers.getContractFactory("CryptoExchange");
    const tokenFee = await ethers.getContractFactory("CryptoExchange");
    const staking = await ethers.getContractFactory(
        "SecondChanceStakingTokenBank"
    );

    [owner, addr1, addr2] = await ethers.getSigners();

    tokenInstance = await token.deploy(owner.address);
    extraTokenInstance = await extraToken.deploy(owner.address);
    tokenFeeInstance = await tokenFee.deploy(owner.address);

    const currentTimestamp = await GetTimeStamp();
    SetupTimeStamp = currentTimestamp + DAY;
    StakingInstance = await staking.deploy(
        SetupTimeStamp,
        currentTimestamp,
        SetupTimeStamp,
        5,
        10
    );

    await tokenInstance.addFeeExclusion(owner.address);
    await tokenInstance.addFeeExclusion(StakingInstance.address);
    await tokenInstance.transfer(addr1.address, "1000000000000000000000");
    await tokenInstance.transfer(addr2.address, "1000000000000000000000");

    await extraTokenInstance.addFeeExclusion(owner.address);
    await extraTokenInstance.addFeeExclusion(StakingInstance.address);
    await extraTokenInstance.transfer(addr1.address, "1000000000000000000000");
    await extraTokenInstance.transfer(addr2.address, "1000000000000000000000");

    await tokenFeeInstance.addFeeExclusion(owner.address);
    await tokenFeeInstance.transfer(addr1.address, "1000000000000000000000");
  });

  describe("Setters", function () {
    it("Try to set stake end date as non owner", async function () {
      await expect(
          StakingInstance.connect(addr1).setPoolEndDate(1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Try to set base fee as non owner", async function () {
      await expect(
          StakingInstance.connect(addr1).setBaseFee(1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Try to set penalty fee as non owner", async function () {
      await expect(
          StakingInstance.connect(addr1).setPenaltyFee(1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Set stake end date as owner", async function () {
      let stakeDuration = await StakingInstance.PoolEndDate();
      expect(stakeDuration).to.equal(SetupTimeStamp);

      await StakingInstance.setPoolEndDate("1");

      stakeDuration = await StakingInstance.PoolEndDate();
      expect(stakeDuration).to.equal("1");
    });

    it("Set base fee as owner", async function () {
      let baseFee = await StakingInstance.BaseFee();
      expect(baseFee).to.equal("5");

      await StakingInstance.setBaseFee("1");

      baseFee = await StakingInstance.BaseFee();
      expect(baseFee).to.equal("1");
    });

    it("Set penalty fee as owner", async function () {
      let penaltyFee = await StakingInstance.PenaltyFee();
      expect(penaltyFee).to.equal("10");

      await StakingInstance.setPenaltyFee("1");

      penaltyFee = await StakingInstance.PenaltyFee();
      expect(penaltyFee).to.equal("1");
    });
  });

  describe("Staking", function () {
    it("Try to stake allowance not set", async function () {
      await expect(
          StakingInstance.connect(addr1).stake(tokenInstance.address)
      ).to.be.revertedWith("Allowance not set");
    });

    it("Try to stake before window start", async function () {
      await tokenInstance
          .connect(addr1)
          .approve(StakingInstance.address, "1000000000000000000000");
      const currentTimestamp = await GetTimeStamp();
      await StakingInstance.setWindowStart(currentTimestamp + DAY);
      await expect(
          StakingInstance.connect(addr1).stake(tokenInstance.address)
      ).to.be.revertedWith("Cannot stake before start");
    });

    it("Try to stake after window end", async function () {
      await tokenInstance
          .connect(addr1)
          .approve(StakingInstance.address, "1000000000000000000000");
      const currentTimestamp = await GetTimeStamp();
      await StakingInstance.setWindowEnd(currentTimestamp - DAY);
      await expect(
          StakingInstance.connect(addr1).stake(tokenInstance.address)
      ).to.be.revertedWith("Cannot stake after end");
    });

    it("Succesfull stake", async function () {
      await tokenInstance
          .connect(addr1)
          .approve(StakingInstance.address, "1000000000000000000000");

      await StakingInstance.connect(addr1).stake(tokenInstance.address);

      const stakeEntry = await StakingInstance.StakeEntries(1);
      expect(stakeEntry.Staker).to.equal(addr1.address);
      expect(stakeEntry.TokenAddress).to.equal(tokenInstance.address);
      expect(stakeEntry.Amount).to.equal("1000000000000000000000");
      expect(stakeEntry.State).to.equal(0);
      expect(stakeEntry.PeriodFinish).to.equal(SetupTimeStamp);

      const stakeEntryIds = await StakingInstance.stakeEntryIdsFullMapping(
          addr1.address
      );
      expect(stakeEntryIds.length).to.equal(1);
      expect(stakeEntryIds[0]).to.equal("1");
    });

    it("Multiple stakes", async function () {
      await tokenInstance
          .connect(addr1)
          .approve(StakingInstance.address, "1000000000000000000000");
      const tx1 = await StakingInstance.connect(addr1).stake(
          tokenInstance.address
      );

      await extraTokenInstance
          .connect(addr1)
          .approve(StakingInstance.address, "1000000000000000000000");
      const tx2 = await StakingInstance.connect(addr1).stake(
          extraTokenInstance.address
      );

      const stakeEntryIds = await StakingInstance.stakeEntryIdsFullMapping(
          addr1.address
      );
      expect(stakeEntryIds.length).to.equal(2);
      expect(stakeEntryIds[0]).to.equal("1");
      expect(stakeEntryIds[1]).to.equal("2");
    });

    it("Stake token with fee", async function () {
      await tokenFeeInstance
          .connect(addr1)
          .approve(StakingInstance.address, "1000000000000000000000");

      await StakingInstance.connect(addr1).stake(tokenFeeInstance.address);

      const stakeEntry = await StakingInstance.StakeEntries(1);
      expect(stakeEntry.Staker).to.equal(addr1.address);
      expect(stakeEntry.TokenAddress).to.equal(tokenFeeInstance.address);
      expect(stakeEntry.Amount).to.equal("999000000000000000000");
      expect(stakeEntry.State).to.equal(0);
      expect(stakeEntry.PeriodFinish).to.equal(SetupTimeStamp);
    });
  });

  describe("Unstaking", function () {
    it("Try to unstake nonexisting entry", async function () {
      await expect(
          StakingInstance.connect(addr1).unStake(1)
      ).to.be.revertedWith("not allowed to unstake this entry");
    });

    it("Try to unstake entry not belonging to caller", async function () {
      await tokenInstance
          .connect(addr2)
          .approve(StakingInstance.address, "1000000000000000000000");
      await StakingInstance.connect(addr2).stake(tokenInstance.address);

      await expect(
          StakingInstance.connect(addr1).unStake(1)
      ).to.be.revertedWith("not allowed to unstake this entry");
    });

    it("Unstake before end -> penalty fee", async function () {
      await tokenInstance
          .connect(addr1)
          .approve(StakingInstance.address, "1000000000000000000000");
      await StakingInstance.connect(addr1).stake(tokenInstance.address);
      const balanceBefore = await tokenInstance.balanceOf(addr1.address);
      expect(balanceBefore).to.equal(0);
      await StakingInstance.connect(addr1).unStake(1);
      const balanceAfter = await tokenInstance.balanceOf(addr1.address);
      expect(balanceAfter).to.equal("900000000000000000000");
    });

    it("Unstake after end -> base fee", async function () {
      await tokenInstance
          .connect(addr1)
          .approve(StakingInstance.address, "1000000000000000000000");
      await StakingInstance.connect(addr1).stake(tokenInstance.address);
      const balanceBefore = await tokenInstance.balanceOf(addr1.address);
      expect(balanceBefore).to.equal(0);

      await fastForward(DAY);
      const tx = await StakingInstance.connect(addr1).unStake(1);
      const balanceAfter = await tokenInstance.balanceOf(addr1.address);
      expect(balanceAfter).to.equal("950000000000000000000");

      const stakeEntry = await StakingInstance.StakeEntries(1);
      expect(stakeEntry.State).to.equal(1);
      expect(stakeEntry.Amount).to.equal("1000000000000000000000");
    });

    it("Unstake after end -> base fee -> token with fee", async function () {
      await tokenFeeInstance
          .connect(addr1)
          .approve(StakingInstance.address, "1000000000000000000000");
      await StakingInstance.connect(addr1).stake(tokenFeeInstance.address);
      const balanceBefore = await tokenFeeInstance.balanceOf(addr1.address);
      expect(balanceBefore).to.equal(0);

      await fastForward(DAY);
      const tx = await StakingInstance.connect(addr1).unStake(1);
      const balanceAfter = await tokenFeeInstance.balanceOf(addr1.address);
      expect(balanceAfter).to.equal("948100950000000000000");


      const stakeEntry = await StakingInstance.StakeEntries(1);
      expect(stakeEntry.State).to.equal(1);
      expect(stakeEntry.Amount).to.equal("999000000000000000000");
    });

    it("Try to unstake already unstaked entry", async function () {
      await tokenInstance
          .connect(addr1)
          .approve(StakingInstance.address, "1000000000000000000000");

      await StakingInstance.connect(addr1).stake(tokenInstance.address);
      await StakingInstance.connect(addr1).unStake(1);

      await expect(
          StakingInstance.connect(addr1).unStake(1)
      ).to.be.revertedWith("already unstaked");
    });
  });
});
