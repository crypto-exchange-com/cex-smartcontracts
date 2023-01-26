// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

let owner: any;
let addr1: any;
let addr2: any;

const DAY = 86400;

const fastForward = async function (seconds: any) {
  await hre.ethers.provider.send("evm_increaseTime", [seconds]);
  await hre.ethers.provider.send("evm_mine", []);
};

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  [owner, addr1, addr2] = await hre.ethers.getSigners();
  const token = await hre.ethers.getContractFactory("CryptoExchange");
  const tokenDeploy = await token.deploy(owner.address);
  await tokenDeploy.deployed();

  console.log("Token deployed to:", tokenDeploy.address);

  const stakeVault = await hre.ethers.getContractFactory(
    "SecondChanceStakingTokenBank"
  );
  const stakeVaultDeploy = await stakeVault.deploy(100, 5, 10);
  await stakeVaultDeploy.deployed();

  console.log("Stake vault deployed to:", stakeVaultDeploy.address);

  await tokenDeploy.AddFeeExclusion(stakeVaultDeploy.address);
  await tokenDeploy.AddFeeExclusion(owner.address);

  await tokenDeploy.transfer(addr1.address, "1000000000000000000000");
  await tokenDeploy.transfer(addr2.address, "3000000000000000000000");

  await tokenDeploy
    .connect(addr1)
    .approve(stakeVaultDeploy.address, "1000000000000000000000");
  await stakeVaultDeploy.connect(addr1).stake(tokenDeploy.address);

  await tokenDeploy
    .connect(addr2)
    .approve(stakeVaultDeploy.address, "3000000000000000000000");
  await stakeVaultDeploy.connect(addr2).stake(tokenDeploy.address);

  await tokenDeploy.balanceOf(addr1.address);
  await tokenDeploy.balanceOf(addr2.address);

  await stakeVaultDeploy.connect(addr1).unStake(1);
  await stakeVaultDeploy.connect(addr2).unStake(2);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
