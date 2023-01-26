// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

// owner address = 0x6461891A9f6eE1e9a51a54D3A1738dF00204AFa3
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  console.log("\n");

  console.log("Deploying CryptoExchange Token...");
  const contract = await ethers.getContractFactory("CryptoExchange");
  const contractInterface = await contract.deploy(
    "0xc897B594C02D1d8b770c7Cda7698BFEaaEF77737" // Company test wallet
  );
  await contractInterface.deployed();
  console.log("Crypto Exchange Token:", contractInterface.address);
  console.log("\n");

  console.log("Deploying SecondChanceStakingTokenBank...");
  const stakingContract = await ethers.getContractFactory(
    "SecondChanceStakingTokenBank"
  );
  const stakingContractInstance = await stakingContract.deploy(
    1670578236, // Friday, December 9, 2022 9:30:36 AM = 1670578236
    1670421369, // Wednesday, December 8
    1670578236, // Friday, December 9, 2022 9:30:36 AM = 1670578236
    10,
    20
  );
  await stakingContractInstance.deployed();
  console.log("staking contract address:", stakingContractInstance.address);
  console.log("\n");

  console.log("Deploying RewardDistributor...");
  const rewardContract = await ethers.getContractFactory(
    "SecondChanceRewardDistributor"
  );
  const rewardContractInterface = await rewardContract.deploy(
    contractInterface.address
  );
  await rewardContractInterface.deployed();
  console.log("RewardDistributor:", rewardContractInterface.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
