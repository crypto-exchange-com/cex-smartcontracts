import { ethers } from "hardhat";
// const hre = require("hardhat");

let owner: any;
const cexTokenAddress = "0xc99550BFf9212933c97172834ab641684E86CD7C";
const stakeContractAddress = "0x9e202FA5af63F9238a78f3A019Ea00A22241FE6a";
const feeDistributorAddress = "0xfB38EB8090e50061DB803C050e4D096961107D69";
const rewardAmount = 10_000_000;

async function main() {
  [owner] = await ethers.getSigners();
  const cexContract = await ethers.getContractFactory("CryptoExchange");
  const cexContractInterface = await cexContract.attach(cexTokenAddress);

  if (rewardAmount > 0) {
    await cexContractInterface.transfer(
      feeDistributorAddress,
      ethers.utils.parseUnits(`${rewardAmount}`, 18),
      { gasLimit: 300000 }
    );
  } else {
    console.log("Reward amount is 0, not sending any rewards");
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
