import { ethers } from "hardhat";
// const hre = require("hardhat");

let owner: any;
const addr1 = "0x91323Bf53Ac27A97ee196C3A43E98091A88A0E30"; // GOERLI BURNER
const addr2 = "0xB2E04d5D5ba3A5850A1C7E90e6f22632Db60A9ee"; // Nick
const addr3 = "0xF3A91f4e749ECf440D9Ce7Ffe14ac349f069e8DC"; // M
const addr4 = "0x169e5dE57ea8dEcE766FC0Aff46357D7b8236D1C"; // Jtestnet
const addr5 = "0x330553cc57e057E41bf24b4F821E78De2fd60C7F"; // Anthony

const shitTokenOneAddress = "0x69798cCA2f64e771e5393C1E3CCFD89b9E05BBB4";
const shitTokenTwoAddress = "0x40155DFa136A8c700d9893Fdc926a350067e701a";
async function main() {
  [owner] = await ethers.getSigners();
  const tokenOne = await ethers.getContractFactory("ShitTokenOne");
  const tokenOneInterface = await tokenOne.attach(shitTokenOneAddress);
  await tokenOneInterface
    .transfer(addr5, ethers.utils.parseUnits("100000", 18))
    .then((tx) => tx.wait(1));
  console.log("Shit 1 Tokens sent");

  const tokenTwo = await ethers.getContractFactory("ShitTokenTwo");
  const tokenTwoInterface = await tokenTwo.attach(shitTokenTwoAddress);
  await tokenTwoInterface
    .transfer(addr5, ethers.utils.parseUnits("100000", 18))
    .then((tx) => tx.wait(1));
  console.log("Shit 2 Tokens sent");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
