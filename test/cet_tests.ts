import { expect } from "chai";
import { ethers } from "hardhat";
import { callbackify } from "util";

describe("Crypto Exchange token contract tests", function () {
  let cexTokenInstance: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addr3: any;

  beforeEach(async function () {
    const cexToken = await ethers.getContractFactory("CryptoExchange");
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    cexTokenInstance = await cexToken.deploy(addr2.address);
  });

  describe("Basic functions", function () {
    it("Total supply check", async function () {
      const totalSupply = await cexTokenInstance.totalSupply();

      expect(totalSupply).to.equal("888000000000000000000000000");
    });

    it("Account amount check", async function () {
      expect(await cexTokenInstance.balanceOf(owner.address)).to.equal(
        "888000000000000000000000000"
      );
      expect(await cexTokenInstance.balanceOf(addr1.address)).to.equal("0");
    });

    it("Transfer test with fees", async function () {
      await cexTokenInstance.transfer(addr1.address, "343000000000000000000");

      expect(await cexTokenInstance.balanceOf(owner.address)).to.equal(
        "887999657000000000000000000"
      );
      expect(await cexTokenInstance.balanceOf(addr1.address)).to.equal(
        "342657000000000000000"
      );
      expect(await cexTokenInstance.balanceOf(addr2.address)).to.equal(
        "343000000000000000"
      );
    });

    it("Transfer test with 0 fees", async function () {
      await cexTokenInstance.transfer(addr1.address, "100");

      expect(await cexTokenInstance.balanceOf(owner.address)).to.equal(
        "887999999999999999999999900"
      );
      expect(await cexTokenInstance.balanceOf(addr1.address)).to.equal("100");
      expect(await cexTokenInstance.balanceOf(addr2.address)).to.equal("0");
    });
  });

  describe("Setters", function () {
    it("Try to change fee recipient", async function () {
      await expect(
        cexTokenInstance.connect(addr1).setFeeRecipient(addr1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Change fee recipient", async function () {
      expect(await cexTokenInstance.FeeRecipient.call()).to.equal(
        addr2.address
      );

      await cexTokenInstance.setFeeRecipient(addr1.address);

      expect(await cexTokenInstance.FeeRecipient.call()).to.equal(
        addr1.address
      );
    });

    it("Try to change fee fraction", async function () {
      await expect(
        cexTokenInstance.connect(addr1).setFeeFraction(100)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Change fee fraction", async function () {
      expect(await cexTokenInstance.FeeFraction.call()).to.equal(1000);

      await cexTokenInstance.setFeeFraction(2000);

      expect(await cexTokenInstance.FeeFraction.call()).to.equal(2000);
    });
  });

  describe("Exclusions", function () {
    it("Try to set exclusion", async function () {
      await expect(
        cexTokenInstance.connect(addr1).addFeeExclusion(addr1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Set exclusion", async function () {
      expect(await cexTokenInstance.FeeExclusions(addr3.address)).to.equal(
        false
      );
      await cexTokenInstance.addFeeExclusion(addr3.address);
      expect(await cexTokenInstance.FeeExclusions(addr3.address)).to.equal(
        true
      );
    });

    it("Remove exclusion", async function () {
      expect(await cexTokenInstance.FeeExclusions(addr3.address)).to.equal(
        false
      );
      await cexTokenInstance.addFeeExclusion(addr3.address);
      expect(await cexTokenInstance.FeeExclusions(addr3.address)).to.equal(
        true
      );
      await cexTokenInstance.removeFeeExclusion(addr3.address);
      expect(await cexTokenInstance.FeeExclusions(addr3.address)).to.equal(
        false
      );
    });

    it("Transfer test with excluded to fees", async function () {
      await cexTokenInstance.addFeeExclusion(addr3.address);

      await cexTokenInstance.transfer(addr3.address, "1000000000000000000");

      expect(await cexTokenInstance.balanceOf(owner.address)).to.equal(
        "887999999000000000000000000"
      );
      expect(await cexTokenInstance.balanceOf(addr3.address)).to.equal(
        "1000000000000000000"
      );
      expect(await cexTokenInstance.balanceOf(addr2.address)).to.equal("0");
    });

    it("Transfer test with excluded from fees", async function () {
      await cexTokenInstance.addFeeExclusion(owner.address);

      await cexTokenInstance.transfer(addr3.address, "1000000000000000000");

      expect(await cexTokenInstance.balanceOf(owner.address)).to.equal(
        "887999999000000000000000000"
      );
      expect(await cexTokenInstance.balanceOf(addr3.address)).to.equal(
        "1000000000000000000"
      );
      expect(await cexTokenInstance.balanceOf(addr2.address)).to.equal("0");
    });
  });

  describe("TransferFrom tests", function () {
    it("Try to transfer without allowance", async function () {
      await expect(
        cexTokenInstance
          .connect(addr2)
          .transferFrom(owner.address, addr1.address, "1000000000000000000")
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Transfer without fee for from", async function () {
      await cexTokenInstance.addFeeExclusion(owner.address);

      await cexTokenInstance.approve(addr2.address, "1000000000000000000");
      expect(await cexTokenInstance.balanceOf(addr1.address)).to.equal("0");
      await cexTokenInstance
        .connect(addr2)
        .transferFrom(owner.address, addr1.address, "1000000000000000000");
      expect(await cexTokenInstance.balanceOf(addr1.address)).to.equal(
        "1000000000000000000"
      );
    });

    it("Transfer without fee for to", async function () {
      await cexTokenInstance.addFeeExclusion(addr1.address);

      await cexTokenInstance.approve(addr2.address, "1000000000000000000");
      expect(await cexTokenInstance.balanceOf(addr1.address)).to.equal("0");
      await cexTokenInstance
        .connect(addr2)
        .transferFrom(owner.address, addr1.address, "1000000000000000000");
      expect(await cexTokenInstance.balanceOf(addr1.address)).to.equal(
        "1000000000000000000"
      );
    });

    it("Transfer without fee for spender", async function () {
      await cexTokenInstance.addFeeExclusion(addr2.address);

      await cexTokenInstance.approve(addr2.address, "1000000000000000000");
      expect(await cexTokenInstance.balanceOf(addr1.address)).to.equal("0");
      await cexTokenInstance
        .connect(addr2)
        .transferFrom(owner.address, addr1.address, "1000000000000000000");
      expect(await cexTokenInstance.balanceOf(addr1.address)).to.equal(
        "1000000000000000000"
      );
    });

    it("Transfer with fee ", async function () {
      await cexTokenInstance.approve(addr2.address, "1000000000000000000");
      expect(await cexTokenInstance.balanceOf(addr1.address)).to.equal("0");
      await cexTokenInstance
        .connect(addr2)
        .transferFrom(owner.address, addr1.address, "1000000000000000000");

      expect(await cexTokenInstance.balanceOf(owner.address)).to.equal(
        "887999999000000000000000000"
      );
      expect(await cexTokenInstance.balanceOf(addr1.address)).to.equal(
        "999000000000000000"
      );
      expect(await cexTokenInstance.balanceOf(addr2.address)).to.equal(
        "1000000000000000"
      );
    });
  });

  describe("Burn", function () {
    it("Try to burn without tokens on account with fee", async function () {
      await expect(
        cexTokenInstance.connect(addr2).burn("1000000000000000000")
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Try to burn without tokens on account without fee", async function () {
      await cexTokenInstance.addFeeExclusion(addr2.address);
      await expect(
        cexTokenInstance.connect(addr2).burn("1000000000000000000")
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Burn without fee", async function () {
      await cexTokenInstance.addFeeExclusion(owner.address);
      expect(await cexTokenInstance.balanceOf(owner.address)).to.equal(
        "888000000000000000000000000"
      );
      expect(await cexTokenInstance.totalSupply()).to.equal(
        "888000000000000000000000000"
      );
      await cexTokenInstance.burn("1000000000000000000");
      expect(await cexTokenInstance.balanceOf(owner.address)).to.equal(
        "887999999000000000000000000"
      );
      expect(await cexTokenInstance.totalSupply()).to.equal(
        "887999999000000000000000000"
      );
    });

    it("Burn with fee", async function () {
      expect(await cexTokenInstance.balanceOf(owner.address)).to.equal(
        "888000000000000000000000000"
      );
      expect(await cexTokenInstance.totalSupply()).to.equal(
        "888000000000000000000000000"
      );
      await cexTokenInstance.burn("1000000000000000000");
      expect(await cexTokenInstance.balanceOf(owner.address)).to.equal(
        "887999999000000000000000000"
      );
      expect(await cexTokenInstance.balanceOf(addr2.address)).to.equal(
        "1000000000000000"
      );
      expect(await cexTokenInstance.totalSupply()).to.equal(
        "887999999001000000000000000"
      );
    });
  });
});
