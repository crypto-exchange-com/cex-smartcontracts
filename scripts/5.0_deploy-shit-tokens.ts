import { ethers } from "hardhat";
// const hre = require("hardhat");

let owner: any;
async function main() {
  [owner] = await ethers.getSigners();
  console.log("Deploying ShitTokenOne...");
  const tokenOne = await ethers.getContractFactory("ShitTokenOne");
  const tokenOneInterface = await tokenOne.deploy();
  await tokenOneInterface.deployed();
  console.log("ShitTokenOne:", tokenOneInterface.address);

  console.log("Deploying ShitTokenTwo...");
  const tokenTwo = await ethers.getContractFactory("ShitTokenTwo");
  const tokenTwoInterface = await tokenTwo.deploy();
  await tokenTwoInterface.deployed();
  console.log("ShitTokenTwo:", tokenTwoInterface.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
